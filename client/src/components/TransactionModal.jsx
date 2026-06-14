/**
 * TransactionModal.jsx — Modal para registrar un movimiento de stock
 *
 * Permite seleccionar el tipo de movimiento y la cantidad para un producto específico.
 * Muestra en tiempo real el stock resultante antes de confirmar.
 *
 * Tipos de movimiento disponibles:
 *   - Entrada       : llegó mercadería al local (suma al stock)
 *   - Salida        : salida sin venta, ej: devolución o pérdida (resta del stock)
 *   - Venta         : producto vendido (resta del stock)
 *   - Ajuste        : corrección manual; el campo pide el NUEVO stock total, no la diferencia
 *
 * Vista previa del resultado:
 *   - Verde si el nuevo stock quedará sobre el mínimo
 *   - Amarillo si quedará en o bajo el mínimo
 *   - Rojo si sería negativo (el servidor rechazará la operación)
 *
 * Props:
 *   product  → producto al que se aplica el movimiento (con stock actual y min_stock)
 *   onSave   → callback con el producto actualizado tras guardar
 *   onClose  → callback para cerrar el modal
 *   toast    → objeto con métodos success/error para notificaciones
 */
import { useState } from 'react';
import { api } from '../api';

// Configuración visual de cada tipo de movimiento
const TYPE_LABELS = {
  entrada: { label: 'Entrada de stock', icon: '📥', color: 'var(--success)' },
  salida: { label: 'Salida de stock', icon: '📤', color: 'var(--warning)' },
  venta: { label: 'Venta', icon: '🛒', color: '#7c3aed' },
  ajuste: { label: 'Ajuste de inventario', icon: '⚖️', color: 'var(--primary)' }
};

export function TransactionModal({ product, onSave, onClose, toast }) {
  const [type, setType] = useState('entrada');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }
    setLoading(true);
    try {
      const result = await api.createTransaction({
        product_id: product.id,
        type,
        quantity: Number(quantity),
        unit_price: unitPrice ? Number(unitPrice) : null,
        notes: notes || null
      });
      toast.success('Movimiento registrado correctamente');
      // Devuelve el producto con el stock actualizado para que el padre lo refleje
      onSave(result.product);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const info = TYPE_LABELS[type];
  const qty = Number(quantity) || 0;
  // Calcula el stock resultante según el tipo seleccionado
  const newStock = type === 'ajuste' ? qty
    : type === 'entrada' ? product.stock + qty
    : product.stock - qty;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>📦 Movimiento de stock</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Información del producto seleccionado */}
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                {product.brand && `${product.brand} · `}Stock actual: <strong>{product.stock} {product.unit}</strong>
              </div>
            </div>

            {/* Selector visual del tipo de movimiento (4 botones en grilla 2x2) */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label required">Tipo de movimiento</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(TYPE_LABELS).map(([key, val]) => (
                  <button key={key} type="button"
                    onClick={() => setType(key)}
                    style={{
                      padding: '10px 14px',
                      border: `2px solid ${type === key ? val.color : 'var(--border)'}`,
                      borderRadius: 8,
                      background: type === key ? `${val.color}15` : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: type === key ? 600 : 400,
                      fontSize: 13,
                      transition: 'all 0.15s'
                    }}>
                    {val.icon} {val.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                {/* En modo ajuste, el campo pide el stock total final, no la diferencia */}
                <label className="form-label required">
                  {type === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
                </label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Precio unitario ($)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Notas</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motivo, proveedor, etc." />
            </div>

            {/* Vista previa del stock resultante en tiempo real */}
            {quantity && !isNaN(qty) && qty > 0 && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: newStock < 0 ? 'var(--danger-light)' : 'var(--success-light)',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Stock resultante:</span>
                <span style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: newStock < 0 ? 'var(--danger)' : newStock <= product.min_stock ? 'var(--warning)' : 'var(--success)'
                }}>
                  {newStock} {product.unit}
                  {newStock < 0 && ' ⚠️ Insuficiente'}
                  {newStock >= 0 && newStock <= product.min_stock && ' ⚠️ Stock bajo'}
                </span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !quantity}>
              {loading ? <span className="spin">⏳</span> : info.icon}
              Registrar movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
