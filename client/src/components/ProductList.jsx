/**
 * ProductList.jsx — Vista del inventario completo de productos
 *
 * Funcionalidades principales:
 *   1. Tabla de todos los productos activos con búsqueda en tiempo real y filtro por categoría
 *   2. Área de escáner de código de barras:
 *      - Detecta lecturas del escáner USB mediante el hook useBarcode (typing rápido)
 *      - También permite ingresar el código manualmente en el input
 *      - Al encontrar el producto, muestra sus datos y botones de acción rápida
 *   3. Botón "Nuevo producto" → abre ProductForm en modo creación
 *   4. Botón ✏️ por fila → abre ProductForm en modo edición
 *   5. Botón 📦 por fila → abre TransactionModal para mover stock
 *   6. Botón 🗑️ por fila → soft delete con confirmación
 *
 * La búsqueda tiene debounce de 250ms para no hacer una petición por cada tecla.
 *
 * StockBadge: componente local que muestra el stock con color según estado
 *   - Rojo "Sin stock" si stock = 0
 *   - Amarillo con cantidad si stock <= min_stock
 *   - Verde con cantidad si stock > min_stock
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { ProductForm } from './ProductForm';
import { TransactionModal } from './TransactionModal';
import { useBarcode } from '../hooks/useBarcode';

// Formatea número como moneda CLP
const fmt = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

// Badge de color que indica visualmente el estado del stock
function StockBadge({ stock, min_stock, unit }) {
  if (stock === 0) return <span className="badge badge-danger">Sin stock</span>;
  if (stock <= min_stock) return <span className="badge badge-warning">{stock} {unit}</span>;
  return <span className="badge badge-success">{stock} {unit}</span>;
}

export function ProductList({ toast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');           // texto del buscador
  const [categoryFilter, setCategoryFilter] = useState(''); // categoría seleccionada
  const [showForm, setShowForm] = useState(false);    // controla si ProductForm está abierto
  const [editProduct, setEditProduct] = useState(null); // producto a editar (null = nuevo)
  const [txProduct, setTxProduct] = useState(null);   // producto para movimiento de stock
  const [barcodeInput, setBarcodeInput] = useState(''); // valor del campo de código de barras
  const [barcodeFound, setBarcodeFound] = useState(null); // último producto encontrado por código
  const barcodeRef = useRef();

  // Carga productos según los filtros actuales
  const load = useCallback(async () => {
    const params = {};
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    const data = await api.getProducts(params);
    setProducts(data);
    setLoading(false);
  }, [search, categoryFilter]);

  // Carga categorías una sola vez al montar
  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  // Recarga productos con debounce de 250ms al cambiar búsqueda o categoría
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Callback del escáner: busca el producto por código y muestra resultado
  const handleBarcodeScan = useCallback(async (code) => {
    setBarcodeInput(code);
    try {
      const p = await api.getProductByBarcode(code);
      setBarcodeFound(p);
      toast.success(`Escaneado: ${p.name}`);
    } catch {
      setBarcodeFound(null);
      toast.warning(`Código ${code} no encontrado`);
    }
  }, [toast]);

  // Activa el hook de escáner USB globalmente mientras esta vista esté montada
  useBarcode(handleBarcodeScan, true);

  // También permite buscar presionando Enter en el campo manual
  const handleBarcodeKey = (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput.trim());
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    await api.deleteProduct(id);
    toast.success('Producto eliminado');
    load();
  };

  // Cierra el formulario y recarga la lista
  const handleSaveProduct = () => {
    setShowForm(false);
    setEditProduct(null);
    load();
  };

  // Actualiza el stock en la lista localmente sin recargar todo
  const handleSaveTx = (updatedProduct) => {
    setTxProduct(null);
    setProducts(ps => ps.map(p => p.id === updatedProduct.id ? { ...p, stock: updatedProduct.stock } : p));
  };

  return (
    <div>
      {/* Área del escáner de código de barras */}
      <div className="barcode-area">
        <div className="barcode-title">
          <span>📡</span> Lector de código de barras USB
        </div>
        <div className="barcode-input-row">
          <input
            ref={barcodeRef}
            className="barcode-input"
            placeholder="Escanear código o ingresar manualmente..."
            value={barcodeInput}
            onChange={e => { setBarcodeInput(e.target.value); setBarcodeFound(null); }}
            onKeyDown={handleBarcodeKey}
            data-barcode="true" // indica al hook useBarcode que acepte teclas en este input
          />
          <button
            className="btn btn-primary"
            onClick={() => barcodeInput.trim() && handleBarcodeScan(barcodeInput.trim())}
          >Buscar</button>
        </div>
        <div className="barcode-status">
          <span className="pulse"></span>
          Listo para escanear — el escáner USB funciona en cualquier parte de la pantalla
        </div>
        {/* Panel de resultado cuando se encuentra el producto escaneado */}
        {barcodeFound && (
          <div className="barcode-found">
            <strong>✓ {barcodeFound.name}</strong>
            {barcodeFound.brand && ` · ${barcodeFound.brand}`}
            {' · '}Stock: {barcodeFound.stock} {barcodeFound.unit}
            {' · '}Precio: {fmt(barcodeFound.sale_price)}
            <button
              className="btn btn-sm"
              style={{ marginLeft: 12, background: 'rgba(255,255,255,0.2)', color: '#fff' }}
              onClick={() => setTxProduct(barcodeFound)}
            >Mover stock</button>
            <button
              className="btn btn-sm"
              style={{ marginLeft: 6, background: 'rgba(255,255,255,0.2)', color: '#fff' }}
              onClick={() => { setEditProduct(barcodeFound); setShowForm(true); }}
            >Editar</button>
          </div>
        )}
      </div>

      {/* Barra de búsqueda, filtro por categoría y botón de nuevo producto */}
      <div className="search-bar">
        <div className="input-wrapper">
          <span className="icon">🔍</span>
          <input
            className="input input-icon"
            placeholder="Buscar por nombre, código, marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowForm(true); }}>
          ➕ Nuevo producto
        </button>
      </div>

      {/* Tabla de productos */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state"><div className="spin">⏳</div></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <h3>Sin productos</h3>
              <p>Agrega tu primer producto con el botón "Nuevo producto"</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio costo</th>
                  <th>Precio venta</th>
                  <th>Ubicación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.brand && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.brand}</div>}
                    </td>
                    <td>
                      {p.barcode
                        ? <code style={{ fontSize: 12, background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{p.barcode}</code>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      {p.category_name
                        ? <span className="badge badge-gray">{p.category_name}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <StockBadge stock={p.stock} min_stock={p.min_stock} unit={p.unit} />
                    </td>
                    <td>{fmt(p.cost_price)}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.sale_price)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.location || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Mover stock" onClick={() => setTxProduct(p)}>📦</button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Editar" onClick={() => { setEditProduct(p); setShowForm(true); }}>✏️</button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Eliminar" onClick={() => handleDelete(p.id, p.name)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {products.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modal de formulario para crear o editar producto */}
      {showForm && (
        <ProductForm
          product={editProduct}
          onSave={handleSaveProduct}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          toast={toast}
        />
      )}
      {/* Modal para registrar movimiento de stock de un producto */}
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
