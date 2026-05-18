/**
 * Adaptador de Sileo con API compatible con react-toastify.
 * Permite migrar todas las llamadas existentes sin modificar cada archivo.
 */
import { sileo, SileoOptions, SileoPosition } from 'sileo';

// Opciones comunes de react-toastify que mapeamos a Sileo
interface ToastifyCompatOptions {
  position?: SileoPosition;
  autoClose?: number | false;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  // Aceptamos cualquier otra prop para no romper código existente
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

export const toast = {
  success: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.success(mapOptions(message, options)),

  error: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.error(mapOptions(message, options)),

  info: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.info(mapOptions(message, options)),

  warning: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.warning(mapOptions(message, options)),

  // react-toastify usa 'warn' como alias de 'warning'
  warn: (message: string | undefined | null, options?: ToastifyCompatOptions) =>
    sileo.warning(mapOptions(message, options)),

  // Compatibilidad con dismiss/clear (no se usan actualmente, pero por si acaso)
  dismiss: (id?: string) => {
    if (id) sileo.dismiss(id);
    else sileo.clear();
  },
};

// Componente dummy para compatibilidad con imports antiguos de ToastContainer
export function ToastContainer() {
  return null;
}
