// src/services/auth.service.ts
import api from '../config/api';
import { User } from '../types';

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
    try {
      // Utilizamos la forma de autenticación de OAuth2 que requiere la API
      const formData = new URLSearchParams();
      formData.append('username', credentials.email); // La API espera 'username' como correo
      formData.append('password', credentials.password);
      
      const response = await api.post<LoginResponse>('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
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
      } catch (userError) {
        // Continuamos con el token aunque no se pueda obtener datos del usuario
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },
  
  logout: async (): Promise<void> => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
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