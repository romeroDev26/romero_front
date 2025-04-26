// src/services/users.service.ts
import api from '../config/api';
import { User } from '../types';

export interface CreateUserData {
  email: string;
  full_name: string;
  role_id: number;
  password: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  email?: string;
  full_name?: string;
  role_id?: number;
  is_active?: boolean;
  password?: string;
}

export interface ResetPasswordData {
  id: string;
  password: string;
}

export const usersService = {
  // Obtener todos los usuarios
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  
  // Obtener un usuario por ID
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  // Obtener el usuario actual
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  // Actualizar el usuario actual
  updateCurrentUser: async (userData: UpdateUserData): Promise<User> => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },
  
  // Crear un nuevo usuario
  create: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  // Actualizar un usuario existente
  update: async (id: string, userData: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  // No hay endpoint para eliminar usuarios en backend, por lo que
  // usaremos una actualización para desactivar el usuario
  toggleActiveStatus: async (id: string, isActive: boolean): Promise<User> => {
    return usersService.update(id, { is_active: isActive });
  },
  
  // Función para restablecer la contraseña
  resetPassword: async (data: ResetPasswordData): Promise<void> => {
    await api.post(`/users/${data.id}/reset-password`, {
      password: data.password
    });
  },
  
  // Buscar usuarios con filtros
  search: async (params: {
    q?: string;
    role_id?: number;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<User[]> => {
    const response = await api.get('/users', { params });
    return response.data;
  }
};