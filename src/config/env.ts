// src/config/env.ts

/**
 * Configuración centralizada de variables de entorno
 * 
 * Este archivo proporciona acceso seguro a las variables de entorno
 * y funciones helper para derivar URLs relacionadas (WebSocket, etc.)
 */

/**
 * Obtiene la URL base de la API desde las variables de entorno
 * @throws Error si VITE_API_URL no está definida en producción
 */
export const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    throw new Error(
      'VITE_API_URL no está definida. Por favor, configura esta variable de entorno.'
    );
  }
  
  return apiUrl;
};

/**
 * Convierte una URL HTTP/HTTPS a su equivalente WebSocket (WS/WSS)
 * @param url URL HTTP o HTTPS
 * @returns URL WebSocket equivalente
 */
export const httpToWebSocket = (url: string): string => {
  return url.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
};

/**
 * Obtiene la URL base de WebSocket (derivada de VITE_API_URL)
 * @returns URL base de WebSocket
 */
export const getWebSocketUrl = (): string => {
  const apiUrl = getApiUrl();
  return httpToWebSocket(apiUrl);
};

/**
 * Prefijo de la API usado en todas las rutas
 */
export const API_PREFIX = '/api/v1';

/**
 * URLs completas para diferentes servicios
 */
export const ENV = {
  apiUrl: getApiUrl(),
  wsUrl: getWebSocketUrl(),
  apiPrefix: API_PREFIX,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
