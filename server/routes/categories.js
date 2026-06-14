/**
 * routes/categories.js — Endpoints para gestión de categorías
 *
 * GET  /api/categories       → Lista todas las categorías ordenadas alfabéticamente
 * POST /api/categories       → Crea una nueva categoría (nombre debe ser único)
 *
 * Las categorías se usan para clasificar los productos del inventario.
 * Al iniciar la app por primera vez, database.js crea 10 categorías por defecto
 * (Cerveza, Vino, Pisco, etc.).
 */
const express = require('express');
const router = express.Router();
const db = require('../database');

// Lista todas las categorías ordenadas A-Z
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
});

// Crea una nueva categoría; falla si el nombre ya existe (restricción UNIQUE en BD)
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cat);
  } catch {
    res.status(400).json({ error: 'La categoría ya existe' });
  }
});

module.exports = router;
