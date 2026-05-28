import { useEffect } from 'react';
import { useSystemStatusStore } from '@/stores/systemStatus.store';
import { healthService } from '@/services/health.service';

/**
 * Hook que controla el ciclo de vida del monitoreo de estado del backend.
 *
 * - NO hace polling constante.
 * - Solo activa polling de recuperación cuando el store indica que el sistema
 *   está caído (generalmente disparado por el interceptor de Axios).
 * - Detiene el polling cuando el sistema vuelve a la normalidad.
 */
export const useServiceStatus = (enabled = true): void => {
  useEffect(() => {
    if (!enabled) return;

    // Suscribirse a cambios de checkMode para iniciar/detener recovery polling
    const unsubscribe = useSystemStatusStore.subscribe((state, prevState) => {
      if (state.checkMode === 'down' && prevState?.checkMode !== 'down') {
        healthService.startRecoveryPolling();
      }
      if (state.checkMode !== 'down' && prevState?.checkMode === 'down') {
        healthService.stopRecoveryPolling();
      }
    });

    // Si al montar ya estamos en caída, iniciar polling inmediatamente
    if (useSystemStatusStore.getState().checkMode === 'down') {
      healthService.startRecoveryPolling();
    }

    return () => {
      unsubscribe();
      healthService.stopRecoveryPolling();
    };
  }, [enabled]);
};
