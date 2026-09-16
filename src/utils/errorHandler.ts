// src/utils/errorHandler.ts

/**
 * Forma de un error de la API tal como lo entrega axios.
 *
 * Reemplaza el `any` que se usaba en los bloques catch de toda la capa de
 * servicios. Todos los campos son opcionales a proposito: un fallo de red no
 * trae `response`, y el backend devuelve `detail` como string, como objeto o
 * como array de errores de validacion segun el caso.
 */
/**
 * El campo `detail` llega en tres formas segun el endpoint: un string plano,
 * un objeto con `message` (y `retry_after_seconds` en los 429), o un array de
 * errores de validacion, tipico de un 422 de FastAPI.
 */
export type ApiErrorDetail =
  | string
  | { message?: string; retry_after_seconds?: number | string }
  | Array<{ msg?: string }>

export interface ApiError {
  /** Mensaje del propio Error de JS, cuando no hubo respuesta HTTP. */
  message?: string
  /** Presente si la peticion salio pero no hubo respuesta (error de red). */
  request?: unknown
  response?: {
    status?: number
    data?: {
      detail?: ApiErrorDetail
      message?: string
      /** Errores no asociados a un campo concreto (estilo Django). */
      non_field_errors?: string[]
    }
  }
}

/**
 * Presenta un error desconocido como ApiError para poder leer sus campos con
 * optional chaining. No valida la estructura: los accesos siguen siendo
 * opcionales, pero el tipo deja de ser `any` y TypeScript puede avisar cuando
 * se usa un campo donde no corresponde.
 */
export const asApiError = (error: unknown): ApiError =>
  typeof error === 'object' && error !== null ? (error as ApiError) : {}

/**
 * Convierte el campo `detail` del backend en un string legible.
 *
 * El backend lo devuelve de tres formas distintas: un string plano, un objeto
 * {message}, o un array de errores de validacion [{msg}] (tipico en 422).
 * Antes se devolvia `detail` sin mirar su forma, asi que un 403 o un 409 con
 * detail no-string terminaba mostrandose como "[object Object]" en el toast.
 */
export const detailToString = (detail: ApiErrorDetail | undefined): string | null => {
  if (!detail) return null;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail[0]?.msg ?? null;
  return detail.message ?? null;
};

/**
 * Extrae el mensaje de error apropiado de una respuesta de error de la API
 * Maneja específicamente los errores 403 (Forbidden) para mostrar mensajes de permisos
 */
export const getErrorMessage = (error: unknown, fallbackMessage: string = 'Ha ocurrido un error'): string => {
  const apiError = asApiError(error);

  // Si no hay respuesta del servidor
  if (!apiError.response) {
    return fallbackMessage;
  }

  const { status, data } = apiError.response;
  const detail = detailToString(data?.detail);

  // Para 403 (Forbidden) y 409 (Conflict), el backend manda un mensaje
  // especifico de permisos o de concurrencia que conviene mostrar tal cual.
  if ((status === 403 || status === 409) && detail) {
    return detail;
  }

  // Errores de validacion (422) y cualquier otro detail utilizable
  if (detail) {
    return detail;
  }

  // Para otros campos de mensaje
  if (data?.message) {
    return data.message;
  }

  // Usar el mensaje fallback
  return fallbackMessage;
};

/**
 * Determina si un error es de tipo permiso (403 Forbidden)
 */
export const isPermissionError = (error: unknown): boolean => {
  return asApiError(error).response?.status === 403;
};