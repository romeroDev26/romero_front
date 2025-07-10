// src/services/remissionGuides.service.ts

import api from '../config/api';
import { RemissionGuideTransportista } from '../types';

// Parámetros que aceptará la función de búsqueda/listado
interface ListGuidesParams {
  company_id: number;
  // Podríamos añadir más filtros aquí en el futuro si la API los soporta
  // por ejemplo: status, start_date, end_date, etc.
  skip?: number;
  limit?: number;
}

class RemissionGuidesService {
  private readonly basePath = '/sunat/remission-guides/';

  // Obtiene una lista paginada de guías
  async list(params: ListGuidesParams): Promise<RemissionGuideTransportista[]> {
    const response = await api.get<RemissionGuideTransportista[]>(this.basePath, { params });
    return response.data;
  }

  // Obtiene una guía por su ID
  async getById(guideId: number): Promise<RemissionGuideTransportista> {
    const response = await api.get<RemissionGuideTransportista>(`${this.basePath}${guideId}`);
    return response.data;
  }

  // Crea una nueva guía (el tipo del payload ya lo tenemos en RemissionGuideFormPage)
  // async create(data: any): Promise<RemissionGuideTransportista> { ... }
}

export const remissionGuidesService = new RemissionGuidesService();