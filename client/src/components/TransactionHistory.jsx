/**
 * TransactionHistory.jsx — Vista del historial completo de movimientos de stock
 *
 * Muestra una tabla con todos los movimientos registrados en el sistema,
 * con las siguientes columnas:
 *   # | Fecha | Producto (+ código de barras) | Tipo | Cantidad | Precio unit. | Total | Notas
 *
 * Filtros disponibles:
 *   - Por tipo de movimiento: todos / entrada / salida / venta / ajuste
 *   - Por cantidad de registros a mostrar: últimos 50, 100, 250 o 500
 *
 * Se recarga automáticamente al cambiar cualquier filtro.
 *
 * Convenciones de prefijo en la columna cantidad:
 *   + entrada   (suma de stock)
 *   - salida    (resta de stock)
 *   - venta     (resta de stock)
 *   = ajuste    (reemplaza el stock)
 *
 * Props:
 *   toast → objeto con métodos success/error para notificaciones (no usado actualmente,
 *           se pasa por consistencia con otras vistas)
 */
import { useState, useEffect } from 'react';
import { api } from '../api';

// Configuración visual de cada tipo de movimiento para la tabla
const TYPE_CONFIG = {
  entrada: { label: 'Entrada', class: 'type-entrada', prefix: '+' },
  salida: { label: 'Salida', class: 'type-salida', prefix: '-' },
  venta: { label: 'Venta', class: 'type-venta', prefix: '-' },
  ajuste: { label: 'Ajuste', class: 'type-ajuste', prefix: '=' }
};

// Formatea como moneda CLP
const fmt = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
// Formatea fecha con día, mes, año, hora y minutos
const fmtDate = (d) => new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function TransactionHistory({ toast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');  // '' = todos los tipos
  const [limit, setLimit] = useState(50);            // cantidad de registros a traer

  // Recarga el historial cada vez que cambia el filtro o el límite
  useEffect(() => {
    const params = { limit };
    if (typeFilter) params.type = typeFilter;
    api.getTransactions(params)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [typeFilter, limit]);

  return (
    <div>
      {/* Controles de filtrado */}
      <div className="search-bar">
        <select className="select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
          <option value="venta">Venta</option>
          <option value="ajuste">Ajuste</option>
        </select>
        <select className="select" value={limit} onChange={e => setLimit(Number(e.target.value))}>
          <option value={50}>Últimos 50</option>
          <option value={100}>Últimos 100</option>
          <option value={250}>Últimos 250</option>
          <option value={500}>Últimos 500</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state"><div className="spin">⏳</div></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>Sin movimientos</h3>
              <p>Los movimientos de stock aparecerán aquí.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Precio unit.</th>
                  <th>Total</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const cfg = TYPE_CONFIG[t.type] || { label: t.type, class: 'type-ajuste', prefix: '' };
                  return (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{t.id}</td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{t.product_name}</div>
                        {/* Muestra el código de barras si el producto lo tiene registrado */}
                        {t.barcode && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.barcode}</div>}
                      </td>
                      <td><span className={`badge ${cfg.class}`}>{cfg.label}</span></td>
                      <td style={{ fontWeight: 600 }}>
                        {cfg.prefix}{t.quantity} {t.unit}
                      </td>
                      <td>{t.unit_price ? fmt(t.unit_price) : '—'}</td>
                      {/* Total = precio unitario × cantidad (solo si se registró precio) */}
                      <td>{t.unit_price ? fmt(t.unit_price * t.quantity) : '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
