// src/features/accounting/services/voidDocuments.service.ts

import apiClient from '../../../config/api';
import type { 
  VoidDocument, 
  VoidDocumentCreateData, 
  VoidDocumentResponse,
  VoidDocumentsListParams,
  SunatStatusResponse 
} from '../types';

export class VoidDocumentsService {
  // Crear comunicación de baja
  static async create(data: VoidDocumentCreateData): Promise<VoidDocumentResponse> {
    const response = await apiClient.post('/sunat/voided/', data);
    return response.data;
  }

  // Listar comunicaciones de baja por empresa
  static async getAll(companyId: number, params?: Omit<VoidDocumentsListParams, 'company_id'>): Promise<VoidDocument[]> {
    const searchParams = new URLSearchParams({
      ...(params?.skip !== undefined && { skip: params.skip.toString() }),
      ...(params?.limit !== undefined && { limit: params.limit.toString() }),
      ...(params?.generation_date && { generation_date: params.generation_date }),
      ...(params?.sunat_status && { sunat_status: params.sunat_status }),
    });

    const response = await apiClient.get(`/sunat/voided/by-company/${companyId}?${searchParams.toString()}`);
    
    // Si la respuesta es paginada, extraer el array de datos
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    
    // Si no es array, devolver array vacío para evitar errores
    console.warn('Void documents response is not an array:', response.data);
    return [];
  }

  // Obtener comunicación de baja por ID
  static async getById(voidId: number): Promise<VoidDocument> {
    const response = await apiClient.get(`/sunat/voided/${voidId}`);
    return response.data;
  }

  // Consultar estado SUNAT de una comunicación específica
  static async checkSunatStatus(voidId: number): Promise<SunatStatusResponse> {
    const response = await apiClient.post(`/sunat/voided/${voidId}/check-status`);
    return response.data;
  }

  // Consultar estado SUNAT usando endpoint genérico
  static async getSunatStatus(voidDocumentId: number): Promise<SunatStatusResponse> {
    const response = await apiClient.get(`/sunat/tickets/documents/voided/${voidDocumentId}/status`);
    return response.data;
  }

  // Refrescar estados pendientes (para polling automático)
  static async refreshPendingStatuses(limit: number = 10): Promise<void> {
    await apiClient.post(`/sunat/documents/voided_document/refresh-pending?limit=${limit}`);
  }
}

export const voidDocumentsService = VoidDocumentsService;
