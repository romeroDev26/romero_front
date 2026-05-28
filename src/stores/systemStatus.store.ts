import { create } from 'zustand';
import { systemNotify } from '@/utils/sileo-toast';

export type FailedService = 'api' | 'database' | 'network' | null;
export type CheckMode = 'idle' | 'checking' | 'down' | 'recovering';

interface SystemStatusState {
  /** null = aún no se ha verificado / desconocido */
  isReachable: boolean | null;
  /** Qué servicio específico falló */
  failedService: FailedService;
  /** Estado del ciclo de diagnóstico/recuperación */
  checkMode: CheckMode;
  /** Evitar spam de toasts: ya se mostró el toast para el incidente actual */
  toastShown: boolean;
  /** Timestamp del último chequeo */
  lastCheckedAt: Date | null;

  setBackendUnreachable: (service: FailedService) => void;
  setBackendReachable: () => void;
  enterCheckMode: (mode: CheckMode) => void;
  resetToastFlag: () => void;
}

export const useSystemStatusStore = create<SystemStatusState>((set) => ({
  isReachable: null,
  failedService: null,
  checkMode: 'idle',
  toastShown: false,
  lastCheckedAt: null,

  setBackendUnreachable: (service) =>
    set((state) => {
      if (state.isReachable === false && state.failedService === service) {
        return { lastCheckedAt: new Date() };
      }
      return {
        isReachable: false,
        failedService: service,
        lastCheckedAt: new Date(),
      };
    }),

  setBackendReachable: () =>
    set(() => ({
      isReachable: true,
      failedService: null,
      lastCheckedAt: new Date(),
    })),

  enterCheckMode: (mode) =>
    set((state) => {
      // Si ya estamos en el modo deseado, no generar re-render innecesario
      if (state.checkMode === mode) return {};
      return { checkMode: mode };
    }),

  resetToastFlag: () => set(() => ({ toastShown: false })),
}));

// ═══════════════════════════════════════════════════════════
// Listener global fuera de React para disparar toasts una
// sola vez por incidente.
// ═══════════════════════════════════════════════════════════

let lastNotifiedState: 'ok' | 'down' | null = null;

useSystemStatusStore.subscribe((state, prevState) => {
  // Solo actuar cuando isReachable cambia realmente
  if (state.isReachable === prevState?.isReachable && state.toastShown === prevState?.toastShown) {
    return;
  }

  const current =
    state.isReachable === false ? 'down' : state.isReachable === true ? 'ok' : null;

  if (current === 'down' && lastNotifiedState !== 'down' && !state.toastShown) {
    const messages: Record<string, { title: string; description: string }> = {
      database: {
        title: 'Base de datos no disponible',
        description:
          'El sistema está temporalmente inoperante debido a un problema con la base de datos. Estamos trabajando para restablecer el servicio.',
      },
      api: {
        title: 'Servicios no disponibles',
        description:
          'El servidor principal no responde. Es posible que ciertas funciones no operen correctamente hasta que se restablezca la conexión.',
      },
      network: {
        title: 'Error de conexión',
        description:
          'No se detecta conexión con los servicios del sistema. Verifique su red o intente nuevamente en unos momentos.',
      },
    };

    const key = state.failedService || 'api';
    const msg = messages[key] || messages.api;

    systemNotify.error(msg.title, msg.description);
    useSystemStatusStore.setState({ toastShown: true });
  }

  if (current === 'ok' && lastNotifiedState === 'down') {
    useSystemStatusStore.setState({ toastShown: false });
  }

  lastNotifiedState = current;
});
