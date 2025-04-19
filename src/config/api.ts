import axios from 'axios';

// Definir la URL base de la API
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
      console.error('Error de red');
      return Promise.reject(error);
    }

    // Si hay respuesta pero es un error
    if (error.response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;