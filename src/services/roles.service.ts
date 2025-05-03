// src/services/roles.service.ts
import api from '../config/api';
import { Role } from '../types';

export interface CreateRoleData {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export const rolesService = {
  // Obtener todos los roles (con filtro opcional)
  getAll: async (isActive?: boolean): Promise<Role[]> => {
    try {
      const params = isActive !== undefined ? { is_active: isActive } : {};
      const response = await api.get('/roles/', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo roles:', error);
      throw error;
    }
  },
  
  // Obtener un rol por ID
  getById: async (id: number): Promise<Role> => {
    try {
      const response = await api.get(`/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo rol con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Crear un nuevo rol
  create: async (roleData: CreateRoleData): Promise<Role> => {
    try {
      const response = await api.post('/roles/', roleData);
      return response.data;
    } catch (error) {
      console.error('Error creando rol:', error);
      throw error;
    }
  },
  
  // Actualizar un rol existente
  update: async (id: number, roleData: UpdateRoleData): Promise<Role> => {
    try {
      const response = await api.patch(`/roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando rol con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Desactivar un rol (borrado lógico)
  delete: async (id: number): Promise<Role> => {
    try {
      const response = await api.delete(`/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error desactivando rol con ID ${id}:`, error);
      throw error;
    }
  }
};