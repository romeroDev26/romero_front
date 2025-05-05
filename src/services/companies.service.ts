// src/services/companies.service.ts
import api from '../config/api';
import { Company, CompanyUpdate } from '../types';

export const companiesService = {
  // Obtener empresa por ID
  getById: async (id: number): Promise<Company> => {
    try {
      const response = await api.get(`/companies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo empresa con ID ${id}:`, error);
      throw error;
    }
  },

  // Actualizar empresa
  update: async (id: number, data: CompanyUpdate): Promise<Company> => {
    try {
      const response = await api.patch(`/companies/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando empresa con ID ${id}:`, error);
      throw error;
    }
  },

  // Subir logo de empresa
  uploadLogo: async (id: number, file: File): Promise<{ logo_url: string }> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await api.post(`/companies/${id}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error subiendo logo:', error);
      throw error;
    }
  },

  // Subir certificado digital
  uploadCertificate: async (id: number, file: File, password: string): Promise<{ certificate_path: string }> => {
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('password', password);
      
      const response = await api.post(`/companies/${id}/certificate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error subiendo certificado:', error);
      throw error;
    }
  }
};