// src/features/accounting/daily-summaries/services/dailySummaries.service.ts

import apiClient from '../../../../config/api';
import type { 
  DailySummary, 
  DailySummaryCreateData, 
  DailySummaryResponse,
  DailySummariesListParams,
  SunatStatusResponse 
} from '../../types';

export class DailySummariesService {
  // Crear resumen diario
  static async create(data: DailySummaryCreateData): Promise<DailySummaryResponse> {
    const response = await apiClient.post('/sunat/summaries/', data);
    return response.data;
  }

  // Listar resúmenes diarios por empresa
  static async getAll(companyId: number, params?: Omit<DailySummariesListParams, 'company_id'>): Promise<DailySummary[]> {
    const searchParams = new URLSearchParams({
      ...(params?.skip !== undefined && { skip: params.skip.toString() }),
      ...(params?.limit !== undefined && { limit: params.limit.toString() }),
      ...(params?.summary_date && { summary_date: params.summary_date }),
      ...(params?.sunat_status && { sunat_status: params.sunat_status }),
    });

    const response = await apiClient.get(`/sunat/summaries/by-company/${companyId}?${searchParams.toString()}`);
    
    // Si la respuesta es paginada, extraer el array de datos
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    
    // Si no es array, devolver array vacío para evitar errores
    console.warn('Daily summaries response is not an array:', response.data);
    return [];
  }

  // Obtener resumen diario por ID
  static async getById(summaryId: number): Promise<DailySummary> {
    const response = await apiClient.get(`/sunat/summaries/${summaryId}`);
    return response.data;
  }

  // Consultar estado SUNAT de un resumen diario específico
  static async checkSunatStatus(summaryId: number): Promise<SunatStatusResponse> {
    const response = await apiClient.post(`/sunat/summaries/${summaryId}/check-status`);
    return response.data;
  }

  // Consultar estado SUNAT usando endpoint genérico
  static async getSunatStatus(summaryId: number): Promise<SunatStatusResponse> {
    const response = await apiClient.get(`/sunat/tickets/documents/daily_summary/${summaryId}/status`);
    return response.data;
  }

  // Refrescar estados pendientes (para polling automático)
  static async refreshPendingStatuses(limit: number = 10): Promise<void> {
    await apiClient.post(`/sunat/documents/daily_summary/refresh-pending?limit=${limit}`);
  }
}

export const dailySummariesService = DailySummariesService;
