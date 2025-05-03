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

export const usersService = {
  getAll: async (skip: number = 0, limit: number = 100): Promise<User[]> => {
    const response = await api.get('/users/', { params: { skip, limit } });
    return response.data;
  },
  
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  create: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post('/users/', userData);
    return response.data;
  },
  
  update: async (id: string, userData: UpdateUserData): Promise<User> => {
    // Usando correctamente PATCH según el endpoint documentado
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  
  // Este método ahora es redundante - removerlo o usar solo update
  resetPassword: async (id: string, password: string): Promise<User> => {
    // Simplemente usa el método update para cambiar contraseña
    return await usersService.update(id, { password });
  },
  
  toggleActiveStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response = await api.patch(`/users/${id}`, { is_active: isActive });
    return response.data;
  },
  
  search: async (params: {
    q?: string;
    role_id?: number;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<User[]> => {
    const response = await api.get('/users/', { params });
    return response.data;
  }
};