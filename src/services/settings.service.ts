// src/services/settings.service.ts
import api from '../config/api';

export interface CompanySettings {
  id: number;
  ruc: string;
  business_name: string;
  trade_name?: string;
  address: string;
  ubigeo: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  sunat_username: string;
  beta_mode: boolean;
  created_at?: string;
  updated_at?: string;
}

export const settingsService = {
  getCompany: async (): Promise<CompanySettings> => {
    const response = await api.get('/settings/company');
    return response.data;
  },

  updateCompany: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
    const response = await api.put('/settings/company', data);
    return response.data;
  },

  uploadCompanyLogo: async (file: File): Promise<{ logo_url: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/settings/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadCertificate: async (file: File, password: string): Promise<void> => {
    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('password', password);
    await api.post('/settings/company/certificate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};