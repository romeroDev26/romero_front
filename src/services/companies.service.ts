// src/services/companies.service.ts
import api from '../config/api';
import { Company, CompanyCreate, CompanyUpdate } from '../types';

// Definimos la interfaz para los filtros del listado
export interface CompanyListFilters {
  skip?: number;
  limit?: number;
  is_active?: boolean;
}

class CompaniesService {
  private readonly basePath = '/companies';

  // GET /companies/ (Listar)
  async getList(filters: CompanyListFilters = {}): Promise<Company[]> {
    const params = new URLSearchParams();
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.limit !== undefined) params.append('limit', String(filters.limit));
    if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
    
    const response = await api.get<Company[]>(`${this.basePath}/`, { params });
    return response.data;
  }

  // GET /companies/{id} (Obtener uno)
  async getById(id: number): Promise<Company> {
    const response = await api.get<Company>(`${this.basePath}/${id}`);
    return response.data;
  }

  // POST /companies/ (Crear)
  async create(data: CompanyCreate): Promise<Company> {
    const response = await api.post<Company>(`${this.basePath}/`, data);
    return response.data;
  }

  // PATCH /companies/{id} (Actualizar)
  async update(id: number, data: CompanyUpdate): Promise<Company> {
    const response = await api.patch<Company>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  // DELETE /companies/{id} (Desactivar - Borrado Lógico)
  async delete(id: number): Promise<Company> {
    const response = await api.delete<Company>(`${this.basePath}/${id}`);
    return response.data;
  }

  // --- MÉTODOS DE SUBIDA DE ARCHIVOS ---
  /**
   * Sube el logo de la empresa junto con los datos actuales de la empresa.
   * @param id ID de la empresa
   * @param file Archivo de logo
   * @param companyData Datos actuales de la empresa (CompanyUpdate o similar)
   */
  /**
   * Sube el logo de la empresa (y opcionalmente datos) usando PATCH y FormData, siguiendo la guía del backend.
   */
  async uploadLogo(
    id: number,
    file: File | undefined,
    companyData: Record<string, unknown>
  ): Promise<{ logo_url: string }> {
    const formData = new FormData();
    // Agregar cada campo individualmente (no como JSON)
    Object.entries(companyData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    if (file) {
      formData.append('logo_file', file);
    }
    // No enviar Content-Type, dejar que el navegador lo ponga
    const response = await api.patch<{ logo_url: string }>(`${this.basePath}/${id}`, formData);
    return response.data;
  }

  async uploadCertificate(id: number, file: File, password?: string): Promise<{ certificate_path: string }> {
    const formData = new FormData();
    formData.append('certificate', file);
    if (password) {
      formData.append('password', password);
    }
    
    const response = await api.post<{ certificate_path: string }>(`${this.basePath}/${id}/certificate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export const companiesService = new CompaniesService();