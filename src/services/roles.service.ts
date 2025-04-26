// src/services/roles.service.ts
import api from '../config/api';
import { Role } from '../types';

export interface CreateRoleData {
  name: string;
  description?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export const rolesService = {
  getAll: async (): Promise<Role[]> => {
    const response = await api.get('/roles');
    return response.data;
  },
  
  getById: async (id: number): Promise<Role> => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },
  
  create: async (roleData: CreateRoleData): Promise<Role> => {
    const response = await api.post('/roles', roleData);
    return response.data;
  },
  
  update: async (id: number, roleData: UpdateRoleData): Promise<Role> => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  }
};