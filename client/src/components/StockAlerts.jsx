/**
 * StockAlerts.jsx — Vista de productos con alertas de stock
 *
 * Muestra todos los productos cuyo stock es igual o menor al stock mínimo configurado.
 * Incluye 3 filtros rápidos:
 *   - Todos     → muestra todos los productos con alerta (sin stock + stock bajo)
 *   - Sin stock → solo los que tienen stock = 0
 *   - Stock bajo → los que tienen stock > 0 pero ≤ min_stock
 *
 * Desde esta vista se puede reponer el stock de un producto directamente
 * abriendo el TransactionModal con tipo "entrada".
 *
 * Cuando se registra una reposición y el producto queda sobre su mínimo,
 * desaparece automáticamente de la lista sin necesidad de recargar la página.
 *
 * Props:
 *   toast → objeto con métodos success/error/warning para notificaciones
 */
import { useState, useEffect } from 'react';
import { api } from '../api';
import { TransactionModal } from './TransactionModal';

const fmt = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export function StockAlerts({ toast }) {
  const [products, setProducts] = useState([]); // productos con alerta (stock <= min_stock)
  const [loading, setLoading] = useState(true);
  const [txProduct, setTxProduct] = useState(null); // producto abierto en TransactionModal
  const [filter, setFilter] = useState('all'); // 'all' | 'zero' | 'low'

  const load = async () => {
    // La API filtra por alerts=1: solo devuelve productos con stock <= min_stock
    const data = await api.getProducts({ alerts: '1' });
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Aplica el filtro local (sin nueva petición al servidor)
  const filtered = products.filter(p => {
    if (filter === 'zero') return p.stock === 0;
    if (filter === 'low') return p.stock > 0 && p.stock <= p.min_stock;
    return true;
  });

  // Después de reponer, actualiza el stock en la lista y elimina los que ya no tienen alerta
  const handleSaveTx = (updatedProduct) => {
    setTxProduct(null);
    setProducts(ps => ps.map(p => p.id === updatedProduct.id
      ? { ...p, stock: updatedProduct.stock }
      : p
    ).filter(p => p.stock <= p.min_stock)); // quita los que ya están sobre el mínimo
  };

  if (loading) return <div className="empty-state"><div className="spin">⏳</div></div>;

  return (
    <div>
      {/* Filtros rápidos con contadores */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        {[
          ['all', `Todos (${products.length})`],
          ['zero', `Sin stock (${products.filter(p => p.stock === 0).length})`],
          ['low', `Stock bajo (${products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length})`]
        ].map(([val, label]) => (
          <button key={val} className={`btn ${filter === val ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">✅</div>
            <h3>¡Sin alertas!</h3>
            <p>Todos los productos tienen stock suficiente.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock actual</th>
                  <th>Stock mínimo</th>
                  <th>Precio venta</th>
                  <th>Ubicación</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.brand && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.brand}</div>}
                    </td>
                    <td>{p.category_name ? <span className="badge badge-gray">{p.category_name}</span> : '—'}</td>
                    <td>
                      {p.stock === 0
                        ? <span className="badge badge-danger">🚨 Sin stock</span>
                        : <span className="badge badge-warning">⚠️ {p.stock} {p.unit}</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.min_stock} {p.unit}</td>
                    <td>{fmt(p.sale_price)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.location || '—'}</td>
                    <td>
                      {/* Botón de reposición: abre TransactionModal directamente */}
                      <button className="btn btn-success btn-sm" onClick={() => setTxProduct(p)}>
                        📥 Reponer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {txProduct && (
        <TransactionModal
          product={txProduct}
          onSave={handleSaveTx}
          onClose={() => setTxProduct(null)}
          toast={toast}
        />
      )}
    </div>
  );
}
