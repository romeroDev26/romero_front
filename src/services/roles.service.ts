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
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      console.error('Error getting roles:', error);
      // Fallback a datos hardcodeados en caso de que el endpoint no esté disponible
      return [
        { id: 1, name: 'admin', description: 'Administrador del Sistema' },
        { id: 2, name: 'sales', description: 'Personal de Ventas' },
        { id: 3, name: 'warehouse', description: 'Personal de Almacén' }
      ];
    }
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
    const response = await api.patch(`/roles/${id}`, roleData);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  }
};