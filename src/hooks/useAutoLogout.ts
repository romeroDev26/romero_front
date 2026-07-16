// src/hooks/useAutoLogout.ts
import { useEffect, useRef, useCallback } from 'react';
import { authService } from '../services/auth.service';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos por defecto
const THROTTLE_MS = 1000; // Solo registrar actividad cada 1 segundo (Optimización de Rendimiento)

export function useAutoLogout() {
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    // Throttle: Si ha pasado menos de 1 segundo desde la última vez que reseteamos, lo ignoramos.
    // Esto salva un rendimiento increíble en eventos como 'mousemove' o 'scroll'.
    if (now - lastActivityRef.current < THROTTLE_MS && inactivityTimerRef.current !== null) {
      return;
    }
    
    lastActivityRef.current = now;

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      sessionStorage.setItem('logoutReason', 'inactivity');
      authService.logout();
    }, INACTIVITY_LIMIT_MS);
  }, []);

  useEffect(() => {
    // Solo inicia el tracking si el usuario está autenticado
    if (!authService.isAuthenticated()) return;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    // Iniciar el temporizador inmediatamente
    resetInactivityTimer();

    // Adjuntar los event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Limpieza cuando el componente se desmonta
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [resetInactivityTimer]);
}
