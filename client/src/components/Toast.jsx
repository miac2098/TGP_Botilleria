/**
 * Toast.jsx — Componente visual para las notificaciones temporales
 *
 * Renderiza todos los toasts activos en una columna superpuesta en la esquina
 * inferior derecha de la pantalla (posición definida en CSS con .toast-container).
 *
 * No maneja su propio estado: recibe la lista de toasts desde el hook useToast()
 * a través de la prop `toasts`. El hook se encarga de agregar y eliminar toasts.
 *
 * Tipos soportados: 'success' (verde), 'error' (rojo), 'warning' (amarillo)
 *
 * Uso:
 *   const { toasts, toast } = useToast();
 *   <ToastContainer toasts={toasts} />
 */
export function ToastContainer({ toasts }) {
  // Icono según el tipo de notificación
  const icons = { success: '✓', error: '✕', warning: '⚠' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
