// src/config/api.ts
import axios from 'axios';
import { getApiUrl, API_PREFIX } from './env';

// Definir la URL base de la API
const baseURL = getApiUrl();
const apiPrefix = API_PREFIX;

// Crear instancia de axios con configuración personalizada
const api = axios.create({
  baseURL: `${baseURL}${apiPrefix}`
  // No headers globales aquí, para que FormData funcione correctamente
});

// Interceptor de solicitudes para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si no hay conexión con el servidor o es un error CORS
    if (!error.response) {
      // Detectar si es un error CORS específicamente
      if (error.message?.includes('CORS') || 
          error.message?.includes('Access-Control-Allow-Origin')) {
        console.debug('Error CORS detectado - usando método alternativo');
      } else {
        console.error('Error de red');
      }
      return Promise.reject(error);
    }

    // Si hay respuesta pero es un error
    // Permitir que llamadas que incluyan la cabecera 'X-Skip-Auth-Redirect'
    // puedan manejar 401 por su cuenta (ej. peticiones de diagnóstico o polling)
    const skipRedirect = error.config?.headers && (error.config.headers['X-Skip-Auth-Redirect'] || error.config.headers['x-skip-auth-redirect']);
    if (error.response.status === 401) {
      if (skipRedirect) {
        // Dejar que el caller maneje el 401
        return Promise.reject(error);
      }
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;