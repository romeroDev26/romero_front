import api from '@/config/api';
import { useSystemStatusStore } from '@/stores/systemStatus.store';

const RECOVERY_INTERVAL_MS = 10_000; // 10 segundos entre checks de recuperación
const HEALTH_TIMEOUT_MS = 8_000;

let recoveryTimer: ReturnType<typeof setInterval> | null = null;
let abortController: AbortController | null = null;
let isDiagnosing = false;

interface HealthResponse {
  status?: 'ok' | 'error';
  services?: {
    api?: 'up' | 'down';
    database?: 'up' | 'down';
  };
}

/**
 * Consulta el endpoint /health y actualiza el store según el resultado.
 */
async function checkHealth(): Promise<void> {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  try {
    const response = await api.get<HealthResponse>('/health', {
      headers: {
        'X-Skip-Auth-Redirect': '1',
      },
      signal: abortController.signal,
      timeout: HEALTH_TIMEOUT_MS,
    });

    const data = response.data;
    const dbStatus = data.services?.database;
    const apiStatus = data.services?.api;
    const store = useSystemStatusStore.getState();

    if (dbStatus === 'down') {
      store.setBackendUnreachable('database');
      store.enterCheckMode('down');
    } else if (apiStatus === 'down' || data.status === 'error') {
      store.setBackendUnreachable('api');
      store.enterCheckMode('down');
    } else {
      store.setBackendReachable();
      // Transición breve a 'recovering' antes de volver a idle
      store.enterCheckMode('recovering');
      setTimeout(() => {
        const current = useSystemStatusStore.getState();
        if (current.isReachable === true && current.checkMode === 'recovering') {
          current.enterCheckMode('idle');
        }
      }, 5_000);
    }
  } catch {
    const store = useSystemStatusStore.getState();
    store.setBackendUnreachable('network');
    store.enterCheckMode('down');
  }
}

export const healthService = {
  /**
   * Lanza un diagnóstico único cuando el interceptor detecta un error grave.
   * Si ya hay un diagnóstico en curso o ya sabemos que está caído, ignora la llamada.
   */
  diagnose() {
    if (isDiagnosing) return;

    const store = useSystemStatusStore.getState();
    // Solo diagnosticar si estamos en idle o recovering.
    // Si ya estamos en 'checking' o 'down', no hace falta diagnosticar de nuevo.
    if (store.checkMode !== 'idle' && store.checkMode !== 'recovering') return;

    isDiagnosing = true;
    store.enterCheckMode('checking');

    checkHealth().finally(() => {
      isDiagnosing = false;
    });
  },

  /**
   * Inicia el polling de recuperación (llamar cuando checkMode pasa a 'down').
   */
  startRecoveryPolling() {
    if (recoveryTimer) return; // Ya está corriendo

    checkHealth(); // Inmediato
    recoveryTimer = setInterval(checkHealth, RECOVERY_INTERVAL_MS);
  },

  /**
   * Detiene el polling de recuperación (llamar cuando se recupera).
   */
  stopRecoveryPolling() {
    if (recoveryTimer) {
      clearInterval(recoveryTimer);
      recoveryTimer = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  },
};
