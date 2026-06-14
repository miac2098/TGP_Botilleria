/**
 * api.js — Cliente HTTP para comunicarse con el backend (Express en puerto 3001)
 *
 * Todas las llamadas pasan por la función `request()` que:
 *   - Agrega el prefijo /api a cada ruta
 *   - Serializa el cuerpo como JSON
 *   - Lanza un Error con el mensaje del servidor si la respuesta no es 2xx
 *
 * Vite redirige automáticamente /api → http://localhost:3001 gracias al proxy
 * configurado en vite.config.js, así el frontend no necesita conocer el puerto del backend.
 *
 * Uso desde cualquier componente:
 *   import { api } from '../api';
 *   const productos = await api.getProducts({ search: 'cerveza' });
 */
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  // ── Productos ──────────────────────────────────────────────────────────────
  // Lista productos; acepta { search, category, alerts } como filtros
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? '?' + qs : ''}`);
  },
  // Trae un producto por ID
  getProduct: (id) => request(`/products/${id}`),
  // Trae un producto por código de barras (llamado cuando el escáner detecta un código)
  getProductByBarcode: (code) => request(`/products/barcode/${encodeURIComponent(code)}`),
  // Resumen estadístico para el Dashboard (total, alertas, valor)
  getProductStats: () => request('/products/stats/summary'),
  // Crea un producto nuevo
  createProduct: (data) => request('/products', { method: 'POST', body: data }),
  // Actualiza datos descriptivos del producto (no modifica el stock)
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  // Soft-delete: el producto queda inactivo pero no se borra de la BD
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // ── Transacciones (movimientos de stock) ───────────────────────────────────
  // Lista movimientos; acepta { product_id, type, limit } como filtros
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? '?' + qs : ''}`);
  },
  // Registra un movimiento (entrada/salida/ajuste/venta) y actualiza el stock
  createTransaction: (data) => request('/transactions', { method: 'POST', body: data }),

  // ── Categorías ─────────────────────────────────────────────────────────────
  // Lista todas las categorías disponibles para el selector de productos
  getCategories: () => request('/categories'),
  // Crea una categoría nueva (nombre debe ser único)
  createCategory: (name) => request('/categories', { method: 'POST', body: { name } })
};
