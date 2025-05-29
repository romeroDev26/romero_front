// src/services/clients.service.ts
import api from '../config/api';
import { Client } from '../types';

export interface CreateClientData {
  doc_type: string;
  doc_number: string;
  name: string;
  address_line?: string; 
  department?: string;   
  province?: string;    
  district?: string;    
  country_code?: string;  
  ubigeo?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UpdateClientData {
  doc_type?: string;
  doc_number?: string;
  name?: string;
  address_line?: string;  
  department?: string;    
  province?: string;      
  district?: string;      
  country_code?: string;  
  ubigeo?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

export const clientsService = {
  // Obtener todos los clientes
  getAll: async (): Promise<Client[]> => {
    try {
      const response = await api.get('/clients/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      throw error;
    }
  },
  
  // Obtener cliente por ID
  getById: async (id: number): Promise<Client> => {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo cliente ${id}:`, error);
      throw error;
    }
  },
  
  // Crear nuevo cliente
  create: async (clientData: CreateClientData): Promise<Client> => {
    try {
      const response = await api.post('/clients/', clientData);
      return response.data;
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  },
  
  // Actualizar cliente existente
  update: async (id: number, clientData: UpdateClientData): Promise<Client> => {
    try {
      const response = await api.patch(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando cliente ${id}:`, error);
      throw error;
    }
  },
  
  // Eliminar (desactivar) cliente
  delete: async (id: number): Promise<Client> => {
    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error eliminando cliente ${id}:`, error);
      throw error;
    }
  }
};