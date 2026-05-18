/**
 * Adaptador de Sileo con API compatible con react-toastify.
 * Permite migrar todas las llamadas existentes sin modificar cada archivo.
 *
 * NUEVO: Objeto `notify` para toasts enriquecidos con descripción y posición.
 *
 * Estrategia de posiciones recomendada:
 * - top-center: Login, eventos críticos, ventas completadas (llaman atención)
 * - top-right: Validaciones, feedback rutinario, errores menores (no interrumpen)
 */
import { sileo, SileoOptions, SileoPosition } from 'sileo';

// ═══════════════════════════════════════════════════════════
// COMPATIBILIDAD react-toastify (legacy)
// ═══════════════════════════════════════════════════════════

interface ToastifyCompatOptions {
  position?: SileoPosition;
  autoClose?: number | false;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  [key: string]: unknown;
}

function mapOptions(
  message: string | undefined | null,
  options?: ToastifyCompatOptions
): SileoOptions {
  const sileoOpts: SileoOptions = {
    title: message || '',
  };

  if (options?.position) {
    sileoOpts.position = options.position;
  }

  if (options?.autoClose !== undefined) {
    sileoOpts.duration = options.autoClose === false ? null : options.autoClose;
  }

  return sileoOpts;
}

/** API compatible 1:1 con react-toastify. Usar solo en código legacy. */
export const toast = {
  success: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.success(mapOptions(message, options)),

  error: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.error(mapOptions(message, options)),

  info: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.info(mapOptions(message, options)),

  warning: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.warning(mapOptions(message, options)),

  warn: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.warning(mapOptions(message, options)),

  dismiss: (id?: string) => {
    if (id) sileo.dismiss(id);
    else sileo.clear();
  },
};

// Componente dummy para compatibilidad con imports antiguos de ToastContainer
export function ToastContainer() {
  return null;
}

// ═══════════════════════════════════════════════════════════
// API ENRIQUECIDA — Notificaciones con contexto
// ═══════════════════════════════════════════════════════════

interface NotifyOptions {
  description?: string;
  position?: SileoPosition;
  duration?: number | null;
}

function buildNotifyOpts(
  title: string,
  description?: string,
  opts?: NotifyOptions
): SileoOptions {
  return {
    title,
    description,
    position: opts?.position,
    duration: opts?.duration,
  };
}

/**
 * Notificaciones enriquecidas con título + descripción.
 *
 * Ejemplos:
 *   notify.success('Venta completada', 'Boleta B001-123 generada correctamente');
 *   notify.error('Error de conexión', 'Verifique su internet e intente de nuevo.', { position: 'top-center' });
 */
export const notify = {
  success: (title: string, description?: string, opts?: NotifyOptions) =>
    sileo.success(buildNotifyOpts(title, description, opts)),

  error: (title: string, description?: string, opts?: NotifyOptions) =>
    sileo.error(buildNotifyOpts(title, description, opts)),

  info: (title: string, description?: string, opts?: NotifyOptions) =>
    sileo.info(buildNotifyOpts(title, description, opts)),

  warning: (title: string, description?: string, opts?: NotifyOptions) =>
    sileo.warning(buildNotifyOpts(title, description, opts)),

  /** Limpia todos los toasts */
  clear: (position?: SileoPosition) => sileo.clear(position),

  /** Elimina un toast específico por ID */
  dismiss: (id: string) => sileo.dismiss(id),
};

// ═══════════════════════════════════════════════════════════
// HELPERS SEMÁNTICOS POR DOMINIO
// ═══════════════════════════════════════════════════════════

/**
 * Notificaciones de Autenticación.
 * Por defecto: top-center (eventos importantes de sistema).
 */
export const authNotify = {
  success: (title: string, description?: string) =>
    notify.success(title, description, { position: 'top-center', duration: 4000 }),

  error: (title: string, description?: string) =>
    notify.error(title, description, { position: 'top-center', duration: 5000 }),
};

/**
 * Notificaciones de Ventas / Punto de Venta.
 * Por defecto: top-right (feedback rápido sin bloquear la interfaz).
 */
export const saleNotify = {
  success: (title: string, description?: string) =>
    notify.success(title, description, { position: 'top-right', duration: 4000 }),

  error: (title: string, description?: string) =>
    notify.error(title, description, { position: 'top-right', duration: 5000 }),

  warning: (title: string, description?: string) =>
    notify.warning(title, description, { position: 'top-right', duration: 4000 }),
};

/**
 * Notificaciones del Sistema / Críticas.
 * Por defecto: top-center (requieren atención inmediata).
 */
export const systemNotify = {
  error: (title: string, description?: string) =>
    notify.error(title, description, { position: 'top-center', duration: 6000 }),

  info: (title: string, description?: string) =>
    notify.info(title, description, { position: 'top-center', duration: 4000 }),
};
