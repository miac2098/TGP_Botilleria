/**
 * Dashboard.jsx — Vista principal con resumen del inventario
 *
 * Muestra 4 tarjetas de estadísticas:
 *   - Total de productos activos
 *   - Productos con stock bajo (en o bajo el mínimo)
 *   - Productos sin stock (stock = 0)
 *   - Valor total del inventario (suma de stock × precio costo)
 *
 * También muestra:
 *   - Lista de hasta 6 productos con alertas de stock bajo
 *   - Tabla de los últimos 8 movimientos de stock
 *
 * Al hacer clic en "Ver todas" o "Ver todos", navega a la página correspondiente
 * usando la función `onNavigate` recibida desde App.jsx.
 */
import { useState, useEffect } from 'react';
import { api } from '../api';

export function Dashboard({ onNavigate, alertCount }) {
  const [stats, setStats] = useState(null);   // estadísticas del inventario
  const [alerts, setAlerts] = useState([]);   // productos con stock bajo
  const [recent, setRecent] = useState([]);   // últimos movimientos
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carga en paralelo: estadísticas, alertas y movimientos recientes
    Promise.all([
      api.getProductStats(),
      api.getProducts({ alerts: '1' }),
      api.getTransactions({ limit: 8 })
    ]).then(([s, a, r]) => {
      setStats(s);
      setAlerts(a);
      setRecent(r);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div className="spin">⏳</div></div>;

  // Formatea números como moneda CLP (ej: $1.200.000)
  const fmt = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
  // Formatea fechas como DD/MM HH:MM
  const fmtDate = (d) => new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const typeLabel = { entrada: 'Entrada', salida: 'Salida', venta: 'Venta', ajuste: 'Ajuste' };

  return (
    <div>
      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📦</div>
          <div>
            <div className="stat-label">Total productos</div>
            <div className="stat-value">{stats?.total ?? 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⚠️</div>
          <div>
            <div className="stat-label">Stock bajo</div>
            <div className={`stat-value ${stats?.low_stock > 0 ? 'orange' : ''}`}>{stats?.low_stock ?? 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🚨</div>
          <div>
            <div className="stat-label">Sin stock</div>
            <div className={`stat-value ${stats?.out_of_stock > 0 ? 'red' : ''}`}>{stats?.out_of_stock ?? 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div>
            <div className="stat-label">Valor inventario</div>
            <div className="stat-value" style={{ fontSize: 16 }}>{fmt(stats?.total_value ?? 0)}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Panel de alertas de stock bajo (muestra máximo 6) */}
        <div className="card">
          <div className="card-header">
            <h3>🔔 Alertas de stock bajo</h3>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('alerts')}>Ver todas</button>
          </div>
          <div className="card-body" style={{ padding: '0 20px' }}>
            {alerts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                ✅ Sin alertas de stock
              </div>
            ) : (
              alerts.slice(0, 6).map(p => (
                <div key={p.id} className="alert-item">
                  <div>
                    <div className="alert-product-name">{p.name}</div>
                    <div className="alert-product-meta">{p.brand} · {p.category_name}</div>
                  </div>
                  <div className="alert-stock">
                    <span className={p.stock === 0 ? 'badge badge-danger' : 'badge badge-warning'}>
                      {p.stock === 0 ? 'Sin stock' : `${p.stock} ${p.unit}`}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Mín: {p.min_stock}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tabla de movimientos recientes */}
        <div className="card">
          <div className="card-header">
            <h3>📋 Movimientos recientes</h3>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('transactions')}>Ver todos</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recent.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin movimientos</div>
            ) : (
              <table>
                <tbody>
                  {recent.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{t.product_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(t.created_at)}</div>
                      </td>
                      <td><span className={`badge type-${t.type}`}>{typeLabel[t.type]}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {/* Prefijo: + para entrada, = para ajuste, - para el resto */}
                        {t.type === 'entrada' ? '+' : t.type === 'ajuste' ? '=' : '-'}{t.quantity} {t.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
