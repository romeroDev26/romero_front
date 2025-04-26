// src/services/auth.service.ts
import api from '../config/api';
import { User } from '../types';

interface LoginCredentials {
  username: string; 
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    // Usamos FormData para enviar las credenciales como espera el endpoint
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    // Convertimos FormData a URLSearchParams para envío correcto
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    
    const response = await api.post<TokenResponse>('/login/access-token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Guardamos el token en localStorage
    if (response.data.access_token) {
      localStorage.setItem('authToken', response.data.access_token);
    }
    
    return response.data;
  },
  
  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Redirigir a la página de login
    window.location.href = '/login';
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    // Guardamos el usuario en localStorage para uso offline
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  }
};