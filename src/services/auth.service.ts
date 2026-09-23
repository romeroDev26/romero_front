// src/services/auth.service.ts
import api from '../config/api';
import { User } from '../types';
import { cacheService } from './cache.service';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Utilizamos la forma de autenticación de OAuth2 que requiere la API
    const formData = new URLSearchParams();
    formData.append('username', credentials.email); // La API espera 'username' como correo
    formData.append('password', credentials.password);
    
    const response = await api.post<LoginResponse>('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Skip-Auth-Redirect': '1',
        'X-Client-Channel': 'main',
      }
    });
    
    // Guardamos el token en localStorage
    localStorage.setItem('authToken', response.data.access_token);
    
    try {
      // Obtenemos los datos del usuario actual
      const userResponse = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      return {
        ...response.data,
        user: userResponse.data
      };
    } catch {
      // Continuamos con el token aunque no se pueda obtener datos del usuario
      return response.data;
    }
  },
  
  logout: async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // 1. Llamar al backend para destruir la sesión y el token
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    } finally {
      // 2. Borrar datos locales SIEMPRE, incluso si el servidor falla
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Limpieza completa de caché usando el servicio centralizado
      cacheService.clearAll({
        preserveKeys: [] // Por defecto, limpia todo
      });

      // Redirigir de vuelta a la página de login
      window.location.href = '/login';
    }
  },
  
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },
  
  // Obtener el perfil del usuario actual
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};