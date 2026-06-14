/**
 * ProductForm.jsx — Formulario modal para crear o editar productos
 *
 * Funciona en dos modos:
 *   - Creación (product = null): muestra campo "Stock inicial" y llama a api.createProduct()
 *   - Edición  (product = {...}): oculta stock inicial (se cambia vía TransactionModal) y llama a api.updateProduct()
 *
 * Campos del formulario:
 *   - Nombre (obligatorio)
 *   - Código de barras (opcional; acepta escáner USB gracias a data-barcode="true")
 *   - Marca, Categoría, Unidad de medida
 *   - Precio costo y precio venta
 *   - Stock inicial (solo en creación)
 *   - Stock mínimo (umbral para generar alertas)
 *   - Ubicación en bodega
 *
 * Validaciones locales antes de enviar:
 *   - Nombre no vacío
 *   - Precios y cantidades deben ser números válidos
 *
 * Props:
 *   product  → objeto producto para edición, o null para creación
 *   onSave   → callback llamado con el producto guardado
 *   onClose  → callback para cerrar el modal
 *   toast    → objeto con métodos success/error para notificaciones
 */
import { useState, useEffect } from 'react';
import { api } from '../api';

const UNITS = ['unidad', 'caja', 'pack', 'litro', 'ml', 'kg', 'g'];

export function ProductForm({ product, onSave, onClose, toast }) {
  const isEdit = !!product; // true si estamos editando, false si creando
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  // Estado del formulario: valores por defecto + sobrescribe con datos del producto si es edición
  const [form, setForm] = useState({
    barcode: '',
    name: '',
    brand: '',
    category_id: '',
    unit: 'unidad',
    cost_price: '',
    sale_price: '',
    stock: '',
    min_stock: '5',
    location: '',
    ...product // sobreescribe con datos actuales del producto en modo edición
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  // Actualiza un campo y limpia su error
  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  // Validación local antes de enviar al servidor
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (form.sale_price !== '' && isNaN(Number(form.sale_price))) e.sale_price = 'Precio inválido';
    if (form.cost_price !== '' && isNaN(Number(form.cost_price))) e.cost_price = 'Precio inválido';
    if (!isEdit && form.stock !== '' && isNaN(Number(form.stock))) e.stock = 'Cantidad inválida';
    if (form.min_stock !== '' && isNaN(Number(form.min_stock))) e.min_stock = 'Cantidad inválida';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        barcode: form.barcode || null,
        name: form.name.trim(),
        brand: form.brand || null,
        category_id: form.category_id || null,
        unit: form.unit,
        cost_price: Number(form.cost_price) || 0,
        sale_price: Number(form.sale_price) || 0,
        min_stock: Number(form.min_stock) || 5,
        location: form.location || null,
        // El stock inicial solo se envía al crear, nunca al editar
        ...(!isEdit && { stock: Number(form.stock) || 0 })
      };

      const saved = isEdit
        ? await api.updateProduct(product.id, payload)
        : await api.createProduct(payload);

      toast.success(isEdit ? 'Producto actualizado' : 'Producto creado correctamente');
      onSave(saved);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Componente auxiliar para campos de texto simples (reduce repetición)
  const F = ({ label, field, type = 'text', required, placeholder, hint, min }) => (
    <div className="form-group">
      <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
      <input
        className="input"
        type={type}
        value={form[field]}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
        min={min}
      />
      {errors[field] && <div className="form-error">{errors[field]}</div>}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );

  return (
    // Clic en el fondo oscuro (overlay) cierra el modal
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Editar producto' : '➕ Nuevo producto'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* Nombre — campo obligatorio */}
              <div className="form-group form-full">
                <label className="form-label required">Nombre del producto</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Cerveza Cristal 350ml" autoFocus />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>

              {/* Código de barras — acepta escáner USB si el foco está aquí */}
              <div className="form-group">
                <label className="form-label">Código de barras</label>
                <input className="input" value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Escanear o ingresar" data-barcode="true" />
                <div className="form-hint">Se detecta automáticamente con el escáner USB</div>
              </div>

              <div className="form-group">
                <label className="form-label">Marca</label>
                <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Ej: CCU, Concha y Toro..." />
              </div>

              {/* Categoría — desplegable con las categorías de la BD */}
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="select" style={{ width: '100%' }} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Unidad de medida — define cómo se contabiliza el stock */}
              <div className="form-group">
                <label className="form-label">Unidad de medida</label>
                <select className="select" style={{ width: '100%' }} value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Precio costo ($)</label>
                <input className="input" type="number" min="0" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} placeholder="0" />
                {errors.cost_price && <div className="form-error">{errors.cost_price}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Precio venta ($)</label>
                <input className="input" type="number" min="0" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} placeholder="0" />
                {errors.sale_price && <div className="form-error">{errors.sale_price}</div>}
              </div>

              {/* Stock inicial — solo visible al crear; en edición se usa TransactionModal */}
              {!isEdit && (
                <div className="form-group">
                  <label className="form-label">Stock inicial</label>
                  <input className="input" type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
                  {errors.stock && <div className="form-error">{errors.stock}</div>}
                </div>
              )}

              {/* Stock mínimo — si el stock baja a este valor o menos, aparece la alerta */}
              <div className="form-group">
                <label className="form-label">Stock mínimo (alerta)</label>
                <input className="input" type="number" min="0" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} placeholder="5" />
                {errors.min_stock && <div className="form-error">{errors.min_stock}</div>}
              </div>

              <div className="form-group form-full">
                <label className="form-label">Ubicación en bodega</label>
                <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ej: Estante A - Fila 2" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spin">⏳</span> : null}
              {isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
