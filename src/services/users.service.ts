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
}

export interface ResetPasswordData {
  id: string;
  password: string;
  confirm_password: string;
}

export const usersService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  create: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  update: async (id: string, userData: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  
  resetPassword: async (data: ResetPasswordData): Promise<void> => {
    await api.post(`/users/${data.id}/reset-password`, {
      password: data.password,
      confirm_password: data.confirm_password
    });
  },
  
  toggleActiveStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response = await api.patch(`/users/${id}/status`, { is_active: isActive });
    return response.data;
  },
  
  search: async (params: {
    q?: string;
    role_id?: number;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: User[]; total: number }> => {
    const response = await api.get('/users/search', { params });
    return response.data;
  }
};