// src/config/api.ts
import axios from 'axios';
import { toast } from 'react-toastify';

// Definir la URL base de la API
const baseURL = import.meta.env.VITE_API_URL || 'https://facturacionromero-production.up.railway.app';

// Crear instancia de axios con configuración personalizada
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    // Si no hay conexión con el servidor
    if (!error.response) {
      toast.error('Error de conexión con el servidor');
      return Promise.reject(error);
    }

    // Si hay respuesta pero es un error
    if (error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
        window.location.href = '/login';
      }
    } else if (error.response.status === 403) {
      toast.error('No tiene permisos para realizar esta acción');
    } else if (error.response.status === 500) {
      toast.error('Error en el servidor. Contacte al administrador.');
    } else if (error.response.data && error.response.data.detail) {
      // Mostrar el mensaje de error que viene del backend
      toast.error(error.response.data.detail);
    }

    return Promise.reject(error);
  }
);

export default api;