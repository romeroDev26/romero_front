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

// Roles por defecto para usar en caso de error
const DEFAULT_ROLES: Role[] = [
  { id: 1, name: 'admin', description: 'Administrador del Sistema' },
  { id: 2, name: 'sales', description: 'Personal de Ventas' },
  { id: 3, name: 'warehouse', description: 'Personal de Almacén' }
];

// Límite de reintentos para prevenir bucles infinitos
const MAX_RETRIES = 2;

export const rolesService = {
  getAll: async (retryCount = 0): Promise<Role[]> => {
    try {
      const response = await api.get('/roles');
      // Verificar que la respuesta sea un array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      console.warn('La respuesta de roles no es un array:', response.data);
      return DEFAULT_ROLES;
    } catch (error: any) {
      console.error('Error obteniendo roles:', error);
      
      // Si es un error 404 y tenemos intentos disponibles, intentar con una ruta alternativa
      if (error.response?.status === 404 && retryCount < MAX_RETRIES) {
        try {
          // Intentar una ruta alternativa
          console.log(`Reintentando con ruta alternativa, intento ${retryCount + 1}`);
          const altResponse = await api.get('/api/roles');
          if (Array.isArray(altResponse.data)) {
            return altResponse.data;
          }
          return DEFAULT_ROLES;
        } catch (altError) {
          console.error('Error con ruta alternativa:', altError);
          return DEFAULT_ROLES;
        }
      }
      
      // Retornar roles por defecto como fallback seguro
      return DEFAULT_ROLES;
    }
  },
  
  getById: async (id: number): Promise<Role> => {
    try {
      const response = await api.get(`/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener rol con ID ${id}:`, error);
      // Buscar en roles por defecto
      const defaultRole = DEFAULT_ROLES.find(role => role.id === id);
      if (defaultRole) {
        return defaultRole;
      }
      // Si no se encuentra, lanzar error
      throw error;
    }
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