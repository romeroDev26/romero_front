// src/utils/errorHandler.ts
/**
 * Extrae el mensaje de error apropiado de una respuesta de error de la API
 * Maneja específicamente los errores 403 (Forbidden) para mostrar mensajes de permisos
 */
export const getErrorMessage = (error: any, fallbackMessage: string = 'Ha ocurrido un error'): string => {
  // Si no hay respuesta del servidor
  if (!error?.response) {
    return fallbackMessage;
  }

  const { status, data } = error.response;

  // Para errores 403 (Forbidden), mostrar el mensaje específico de permisos del backend
  if (status === 403 && data?.detail) {
    return data.detail;
  }

  // Para errores de validación (normalmente 422), buscar en el array de errores
  if (data?.detail && Array.isArray(data.detail) && data.detail.length > 0) {
    return data.detail[0]?.msg || fallbackMessage;
  }

  // Para otros errores con mensaje en detail (string)
  if (data?.detail && typeof data.detail === 'string') {
    return data.detail;
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
export const isPermissionError = (error: any): boolean => {
  return error?.response?.status === 403;
};