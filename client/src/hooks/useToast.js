/**
 * useToast.js — Hook para mostrar notificaciones temporales (toasts)
 *
 * Proporciona un objeto `toast` con tres métodos:
 *   toast.success('Mensaje OK')   → notificación verde
 *   toast.error('Ocurrió error')  → notificación roja
 *   toast.warning('Ojo con esto') → notificación amarilla
 *
 * Cada toast desaparece automáticamente después de 3.5 segundos.
 * Se pueden mostrar varios toasts apilados al mismo tiempo.
 *
 * Uso en componentes:
 *   const { toasts, toast } = useToast();
 *   // Pasar toasts al contenedor visual:
 *   <ToastContainer toasts={toasts} />
 *   // Disparar desde cualquier acción:
 *   toast.success('Producto guardado');
 */
import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  // Agrega un toast y lo elimina automáticamente después de `duration` ms
  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now(); // ID único basado en timestamp
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  // API simplificada para cada tipo de notificación
  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning')
  };

  return { toasts, toast };
}
