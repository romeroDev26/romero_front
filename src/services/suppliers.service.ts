// src/services/suppliers.service.ts
import api from '../config/api';
import { Supplier } from '../types';

export const suppliersService = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers');
    return response.data;
  },
  
  getById: async (id: number): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },
  
  create: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> => {
    const response = await api.post('/suppliers', supplier);
    return response.data;
  },
  
  update: async (id: number, supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, supplier);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
  
  // Método adicional para búsqueda avanzada
  search: async (params: {
    q?: string;
    doc_type?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Supplier[]; total: number }> => {
    const response = await api.get('/suppliers/search', { params });
    return response.data;
  }
};
