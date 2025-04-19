import api from '../config/api';
import { Client } from '../types';

export const clientsService = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  
  create: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post('/clients', client);
    return response.data;
  },
  
  update: async (id: number, client: Partial<Client>) => {
    const response = await api.put(`/clients/${id}`, client);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  }
};
