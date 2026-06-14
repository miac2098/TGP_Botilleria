/**
 * useBarcode.js — Hook para detectar lecturas de escáner USB de código de barras
 *
 * Los escáneres USB se comportan como teclados: envían los caracteres del código
 * muy rápido (menos de 50ms entre cada tecla) y terminan con Enter.
 * Este hook distingue ese patrón del tipeo manual normal del usuario.
 *
 * Lógica:
 *   - Escucha keydown globalmente en window
 *   - Acumula caracteres en un buffer mientras el tiempo entre teclas sea < 100ms
 *   - Si llega Enter, dispara onScan(código) inmediatamente
 *   - Si pasan 150ms sin Enter, también dispara onScan (por si el escáner no manda Enter)
 *   - Si el gap supera 100ms, se descarta el buffer (era escritura manual)
 *   - Ignora tecleos en inputs normales; solo los inputs con data-barcode="true" se aceptan
 *
 * Uso:
 *   useBarcode((code) => buscarProducto(code));
 *   useBarcode(handler, false); // deshabilitar temporalmente
 */
import { useEffect, useRef, useCallback } from 'react';

export function useBarcode(onScan, enabled = true) {
  const buffer = useRef('');       // acumula los caracteres del código
  const timer = useRef(null);      // timeout de 150ms para disparar sin Enter
  const lastKeyTime = useRef(0);   // timestamp del último keydown

  // Dispara onScan si el buffer tiene al menos 3 caracteres (evita falsos positivos)
  const flush = useCallback(() => {
    const code = buffer.current.trim();
    if (code.length >= 3) onScan(code);
    buffer.current = '';
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKey = (e) => {
      // Si el foco está en un input normal, ignorar (el usuario está escribiendo)
      // Excepción: inputs marcados con data-barcode="true" (ej: campo de código de barras)
      const tag = e.target.tagName;
      const isBarcodeInput = e.target.dataset.barcode === 'true';
      if ((tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && !isBarcodeInput) return;

      const now = Date.now();
      const timeSinceLast = now - lastKeyTime.current;
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        // Enter = fin del código; disparar inmediatamente
        clearTimeout(timer.current);
        flush();
        return;
      }

      // Si pasaron más de 100ms desde la tecla anterior y hay algo en el buffer,
      // era escritura manual → limpiar y empezar de nuevo
      if (timeSinceLast > 100 && buffer.current.length > 0) {
        buffer.current = '';
      }

      // Agregar caracteres imprimibles al buffer
      if (e.key.length === 1) {
        buffer.current += e.key;
        // Reset del timeout: si no llega Enter en 150ms, disparamos igual
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, 150);
      }
    };

    window.addEventListener('keydown', handleKey);
    // Limpieza al desmontar: remover listener y cancelar timer pendiente
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timer.current);
    };
  }, [enabled, flush]);
}
