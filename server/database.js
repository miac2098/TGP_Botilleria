/**
 * database.js — Conexión y configuración de la base de datos SQLite
 *
 * Usa el módulo nativo "node:sqlite" incluido en Node.js v22+.
 * No requiere instalar ningún paquete externo (reemplaza better-sqlite3).
 *
 * Al importar este archivo desde cualquier ruta, se obtiene la instancia
 * compartida `db` lista para hacer consultas sincrónicas.
 *
 * Tablas creadas:
 *   - categories   → categorías para clasificar productos (Cerveza, Vino, etc.)
 *   - products     → catálogo de productos con stock, precios y stock mínimo
 *   - transactions → historial de movimientos de stock (entrada/salida/ajuste/venta)
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Ruta al archivo .db (se crea automáticamente si no existe)
const DB_PATH = path.join(__dirname, 'botilleria.db');
const db = new DatabaseSync(DB_PATH);

// WAL mejora el rendimiento en escrituras concurrentes
db.exec('PRAGMA journal_mode = WAL');
// Activa restricciones de clave foránea (desactivadas por defecto en SQLite)
db.exec('PRAGMA foreign_keys = ON');

// Crea las tablas si aún no existen (primera ejecución)
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,           -- nombre único de la categoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,                 -- código de barras (opcional, único si existe)
    name TEXT NOT NULL,                  -- nombre del producto
    category_id INTEGER REFERENCES categories(id),
    brand TEXT,                          -- marca (ej: CCU, Concha y Toro)
    unit TEXT NOT NULL DEFAULT 'unidad', -- unidad de medida (unidad, caja, litro…)
    cost_price REAL NOT NULL DEFAULT 0,  -- precio de costo
    sale_price REAL NOT NULL DEFAULT 0,  -- precio de venta
    stock INTEGER NOT NULL DEFAULT 0,    -- cantidad disponible actual
    min_stock INTEGER NOT NULL DEFAULT 5,-- umbral mínimo; bajo este nivel se genera alerta
    location TEXT,                       -- ubicación en bodega (ej: "Estante A - Fila 2")
    active INTEGER NOT NULL DEFAULT 1,   -- 0 = eliminado (soft delete, nunca se borra físicamente)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    type TEXT NOT NULL CHECK(type IN ('entrada', 'salida', 'ajuste', 'venta')),
    -- entrada: llegó mercadería | salida: salió sin venta | ajuste: corrección manual | venta: vendido
    quantity INTEGER NOT NULL,           -- unidades del movimiento
    unit_price REAL,                     -- precio unitario en ese momento (opcional)
    notes TEXT,                          -- motivo, proveedor, observaciones
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Carga categorías por defecto solo la primera vez (tabla vacía)
const existing = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (existing.count === 0) {
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  ['Cerveza', 'Vino', 'Pisco', 'Ron', 'Vodka', 'Whisky', 'Bebida', 'Agua', 'Snack', 'Otro']
    .forEach(name => insertCat.run(name));
}

// Exporta la instancia para que las rutas la importen directamente
module.exports = db;
