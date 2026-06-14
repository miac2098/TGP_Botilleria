/**
 * App.jsx — Componente raíz de la aplicación (layout principal)
 *
 * Estructura visual:
 *   - Sidebar izquierdo con logo, navegación y estado de conexión al servidor
 *   - Área principal (topbar + contenido de página)
 *   - ToastContainer flotante para notificaciones
 *
 * Páginas disponibles (controladas por el estado `page`):
 *   - dashboard    → resumen general con estadísticas y alertas recientes
 *   - products     → inventario completo con búsqueda, filtros y escáner
 *   - alerts       → productos con stock bajo o sin stock
 *   - transactions → historial de todos los movimientos de stock
 *
 * Al montar, verifica la conexión con /api/health y carga el contador de alertas.
 * El contador de alertas se refresca cada vez que el usuario cambia de página.
 */
import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { StockAlerts } from './components/StockAlerts';
import { TransactionHistory } from './components/TransactionHistory';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { api } from './api';

// Configuración de las páginas: id, etiqueta, ícono, sección del menú y si tiene badge de alertas
const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'PRINCIPAL' },
  { id: 'products', label: 'Inventario', icon: '📦', section: 'GESTIÓN' },
  { id: 'alerts', label: 'Alertas de stock', icon: '🔔', section: 'GESTIÓN', badge: true },
  { id: 'transactions', label: 'Movimientos', icon: '📋', section: 'GESTIÓN' },
];

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  products: 'Inventario de productos',
  alerts: 'Alertas de stock',
  transactions: 'Historial de movimientos'
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [alertCount, setAlertCount] = useState(0); // número de productos con stock bajo
  const [connected, setConnected] = useState(null); // null=cargando, true=OK, false=error
  const { toasts, toast } = useToast();

  useEffect(() => {
    // Verifica si el servidor Express está corriendo
    fetch('/api/health')
      .then(() => setConnected(true))
      .catch(() => setConnected(false));

    // Carga el contador inicial de alertas para el badge del sidebar
    api.getProductStats().then(s => setAlertCount(s.low_stock)).catch(() => {});
  }, []);

  // Refresca el contador de alertas al navegar (por si cambió el stock)
  useEffect(() => {
    api.getProductStats().then(s => setAlertCount(s.low_stock)).catch(() => {});
  }, [page]);

  // Extrae las secciones únicas del menú para renderizar separadores
  const sections = [...new Set(PAGES.map(p => p.section))];

  // Renderiza el componente correspondiente a la página activa
  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} alertCount={alertCount} />;
      case 'products': return <ProductList toast={toast} />;
      case 'alerts': return <StockAlerts toast={toast} />;
      case 'transactions': return <TransactionHistory toast={toast} />;
      default: return null;
    }
  };

  return (
    <div className="layout">
      {/* Sidebar de navegación */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🍺 TGP Botillería</h1>
          <p>Sistema de inventario</p>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {PAGES.filter(p => p.section === section).map(p => (
                <div
                  key={p.id}
                  className={`nav-item ${page === p.id ? 'active' : ''}`}
                  onClick={() => setPage(p.id)}
                >
                  <span className="icon">{p.icon}</span>
                  {p.label}
                  {/* Badge numérico en el ítem de Alertas cuando hay productos bajo stock */}
                  {p.badge && alertCount > 0 && (
                    <span className="nav-badge">{alertCount}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Indicador de conexión al servidor (punto verde/rojo en la parte inferior del sidebar) */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected === null ? '#94a3b8' : connected ? '#10b981' : '#ef4444',
              display: 'inline-block'
            }}></span>
            <span style={{ color: '#718096' }}>
              {connected === null ? 'Conectando...' : connected ? 'Servidor activo' : 'Sin conexión'}
            </span>
          </div>
        </div>
      </aside>

      {/* Área de contenido principal */}
      <div className="main">
        {/* Barra superior con título de página, fecha y acceso rápido a alertas */}
        <header className="topbar">
          <h2>{PAGE_TITLES[page]}</h2>
          <div className="topbar-right">
            {alertCount > 0 && (
              <button
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => setPage('alerts')}
              >
                🔔 {alertCount} alerta{alertCount !== 1 ? 's' : ''}
              </button>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>

        <main className="page">
          {/* Muestra error de conexión si el servidor no responde */}
          {connected === false ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
              <h3 style={{ marginBottom: 8 }}>Sin conexión al servidor</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Asegúrate de que el servidor esté corriendo en <code>http://localhost:3001</code>
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => fetch('/api/health').then(() => setConnected(true)).catch(() => {})}
              >Reintentar</button>
            </div>
          ) : renderPage()}
        </main>
      </div>

      {/* Notificaciones flotantes (toasts) */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
