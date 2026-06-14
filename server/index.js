/**
 * index.js — Punto de entrada del servidor backend (API REST)
 *
 * Levanta un servidor Express en el puerto 3001 (o el que defina la variable PORT).
 * Expone los siguientes endpoints bajo el prefijo /api:
 *   - /api/products      → gestión de productos e inventario
 *   - /api/transactions  → registro de movimientos de stock
 *   - /api/categories    → categorías de productos
 *   - /api/health        → verificación de que el servidor está vivo
 *
 * CORS habilitado para que el frontend (Vite en puerto 5173) pueda conectarse
 * sin restricciones durante desarrollo.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Permite peticiones desde cualquier origen (necesario para Vite en desarrollo)
app.use(cors());
// Parsea el cuerpo de las peticiones como JSON
app.use(express.json());

// Rutas — cada archivo maneja su propio conjunto de endpoints
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories', require('./routes/categories'));

// Health check — el frontend lo usa para saber si el servidor está corriendo
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
