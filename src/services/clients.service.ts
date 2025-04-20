// src/services/clients.service.ts
import api from '../config/api';
import { Client } from '../types';

export const clientsService = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get('/clients');
    return response.data;
  },
  
  getById: async (id: number): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  
  create: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
    const response = await api.post('/clients', client);
    return response.data;
  },
  
  update: async (id: number, client: Partial<Client>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, client);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
  
  // Método adicional para búsqueda avanzada
  search: async (params: {
    q?: string;
    doc_type?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Client[]; total: number }> => {
    const response = await api.get('/clients/search', { params });
    return response.data;
  }
};
