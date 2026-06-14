/**
 * routes/products.js — Endpoints para gestión de productos e inventario
 *
 * GET  /api/products                → Lista productos (con filtros opcionales: search, category, alerts)
 * GET  /api/products/stats/summary  → Resumen: total, stock bajo, sin stock, valor inventario
 * GET  /api/products/barcode/:code  → Busca un producto por código de barras (usado por el escáner)
 * GET  /api/products/:id            → Devuelve un producto por ID
 * POST /api/products                → Crea un nuevo producto (si tiene stock inicial, registra la entrada)
 * PUT  /api/products/:id            → Actualiza datos del producto (NO cambia el stock — usar transactions)
 * DELETE /api/products/:id          → Soft delete: marca active=0, nunca elimina físicamente
 */
const express = require('express');
const router = express.Router();
const db = require('../database');

// Lista todos los productos activos, con nombre de categoría incluido
// Parámetros opcionales: search (texto libre), category (id), alerts ('1' para solo stock bajo)
router.get('/', (req, res) => {
  const { search, category, alerts } = req.query;
  let query = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = 1
  `;
  const params = [];

  if (search) {
    // Busca en nombre, código de barras o marca (insensible a mayúsculas)
    query += ` AND (p.name LIKE ? OR p.barcode LIKE ? OR p.brand LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (category) {
    query += ` AND p.category_id = ?`;
    params.push(category);
  }
  if (alerts === '1') {
    // Solo productos cuyo stock está en o bajo el mínimo configurado
    query += ` AND p.stock <= p.min_stock`;
  }

  query += ` ORDER BY p.name ASC`;
  const products = db.prepare(query).all(...params);
  res.json(products);
});

// Busca un producto por su código de barras exacto (llamado al escanear)
router.get('/barcode/:code', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.barcode = ? AND p.active = 1
  `).get(req.params.code);

  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

// Devuelve un producto por ID (incluido si está inactivo, para edición)
router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

// Crea un nuevo producto
// Si se indica stock inicial > 0, también registra una transacción de entrada automática
router.post('/', (req, res) => {
  const { barcode, name, category_id, brand, unit, cost_price, sale_price, stock, min_stock, location } = req.body;

  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const result = db.prepare(`
      INSERT INTO products (barcode, name, category_id, brand, unit, cost_price, sale_price, stock, min_stock, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(barcode || null, name, category_id || null, brand || null, unit || 'unidad',
           cost_price || 0, sale_price || 0, stock || 0, min_stock || 5, location || null);

    // Si viene con stock inicial, registrar la entrada para que quede en el historial
    if ((stock || 0) > 0) {
      db.prepare(`
        INSERT INTO transactions (product_id, type, quantity, notes)
        VALUES (?, 'entrada', ?, 'Stock inicial')
      `).run(result.lastInsertRowid, stock || 0);
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El código de barras ya está registrado' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Actualiza los datos descriptivos del producto (nombre, precios, mínimo, etc.)
// El stock NO se modifica aquí — los cambios de stock se hacen vía transactions.js
router.put('/:id', (req, res) => {
  const { barcode, name, category_id, brand, unit, cost_price, sale_price, min_stock, location } = req.body;

  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    db.prepare(`
      UPDATE products SET
        barcode = ?, name = ?, category_id = ?, brand = ?, unit = ?,
        cost_price = ?, sale_price = ?, min_stock = ?, location = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(barcode || null, name, category_id || null, brand || null, unit || 'unidad',
           cost_price || 0, sale_price || 0, min_stock || 5, location || null, req.params.id);

    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    res.json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El código de barras ya está registrado' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Soft delete: pone active=0 para que no aparezca en listas, pero conserva el historial
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Resumen general del inventario para el Dashboard
// Retorna: total de productos, cuántos tienen stock bajo, cuántos en 0, y valor total del inventario
router.get('/stats/summary', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get();
  const lowStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock <= min_stock').get();
  const outOfStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1 AND stock = 0').get();
  const totalValue = db.prepare('SELECT COALESCE(SUM(stock * cost_price), 0) as value FROM products WHERE active = 1').get();

  res.json({
    total: total.count,
    low_stock: lowStock.count,
    out_of_stock: outOfStock.count,
    total_value: totalValue.value
  });
});

module.exports = router;
