/**
 * routes/transactions.js — Endpoints para movimientos de stock
 *
 * GET  /api/transactions       → Lista movimientos (filtros: product_id, type, limit)
 * POST /api/transactions       → Registra un movimiento y actualiza el stock del producto
 *
 * Tipos de movimiento:
 *   - entrada : llegó mercadería (suma al stock)
 *   - salida  : salida sin venta (resta del stock)
 *   - venta   : producto vendido (resta del stock)
 *   - ajuste  : corrección manual (reemplaza el stock con el valor exacto indicado)
 *
 * La operación de registro + actualización de stock se ejecuta en una transacción
 * atómica (BEGIN/COMMIT) para garantizar consistencia.
 */
const express = require('express');
const router = express.Router();
const db = require('../database');

// Lista el historial de movimientos con nombre del producto incluido
// Parámetros opcionales: product_id, type, limit (default 100)
router.get('/', (req, res) => {
  const { product_id, type, limit = 100 } = req.query;
  let query = `
    SELECT t.*, p.name as product_name, p.barcode, p.unit
    FROM transactions t
    JOIN products p ON t.product_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (product_id) { query += ` AND t.product_id = ?`; params.push(product_id); }
  if (type)       { query += ` AND t.type = ?`;       params.push(type); }

  query += ` ORDER BY t.created_at DESC LIMIT ?`;
  params.push(parseInt(limit));

  res.json(db.prepare(query).all(...params));
});

// Registra un nuevo movimiento de stock
// Valida que el producto exista, que el tipo sea válido y que haya stock suficiente para salidas/ventas
router.post('/', (req, res) => {
  const { product_id, type, quantity, unit_price, notes } = req.body;

  if (!product_id || !type || !quantity)
    return res.status(400).json({ error: 'product_id, type y quantity son requeridos' });
  if (!['entrada', 'salida', 'ajuste', 'venta'].includes(type))
    return res.status(400).json({ error: 'Tipo inválido' });

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  const qty = parseInt(quantity);
  let newStock;
  if (type === 'ajuste') {
    // El ajuste reemplaza el stock con el valor exacto ingresado
    newStock = qty;
  } else if (type === 'entrada') {
    newStock = product.stock + qty;
  } else {
    // salida o venta: descuenta del stock
    newStock = product.stock - qty;
    if (newStock < 0)
      return res.status(400).json({ error: `Stock insuficiente. Stock actual: ${product.stock}` });
  }

  try {
    // BEGIN/COMMIT garantiza que el registro y la actualización de stock sean atómicos
    db.exec('BEGIN');
    const result = db.prepare(
      'INSERT INTO transactions (product_id, type, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(product_id, type, qty, unit_price ?? null, notes ?? null);

    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStock, product_id);
    db.exec('COMMIT');

    // Retorna el movimiento recién creado junto con el producto actualizado
    const tx = db.prepare(`
      SELECT t.*, p.name as product_name, p.unit
      FROM transactions t JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    res.status(201).json({ transaction: tx, product: updatedProduct });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
