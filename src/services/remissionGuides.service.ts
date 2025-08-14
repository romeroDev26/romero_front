// src/services/remissionGuides.service.ts

import api from '../config/api';
import { RemissionGuideTransportista } from '../types';

// Tipos para el servicio
export interface ListGuidesParams {
  company_id: number;
  sunat_status?: string;
  skip?: number;
  limit?: number;
  page?: number;
  size?: number;
}

export interface RemissionGuideCreateData {
  company_id: number;
  branch_office_id: number;
  document_series_id: number;
  issue_date: string;
  transfer_reason_code: string;
  transfer_reason_description: string;
  transfer_start_date: string;
  gross_total_weight: number;
  number_of_packages: number;
  transport_mode_code: string;
  sender: {
    document_type_code: string;
    document_number: string;
    business_name: string;
  };
  receiver: {
    document_type_code: string;
    document_number: string;
    business_name: string;
  };
  origin_address: {
    ubigeo_code: string;
    address: string;
  };
  destination_address: {
    ubigeo_code: string;
    address: string;
  };
  items: {
    description: string;
    quantity: number;
    unit_code: string;
    unit_weight: number;
  }[];
}

export interface ProcessSunatData {
  company_id: number;
}

export interface CheckTicketStatusData {
  company_id: number;
  ticket: string;
}

export interface ProcessCdrData {
  company_id: number;
}

export interface SunatStatusResponse {
  guide_id: number;
  sunat_status: string;
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_reception_date?: string;
  cdr_file_path?: string;
  has_cdr: boolean;
  zip_hash?: string;
  sunat_observations?: string;
  status_description: string;
  xml_file_path?: string;
  zip_file_path?: string;
}

export interface ProcessSunatResponse {
  success: boolean;
  message: string;
  guide_id: number;
  sunat_status: string;
  sunat_ticket?: string;
  xml_file_path?: string;
  zip_file_path?: string;
}

export interface CheckTicketStatusResponse {
  success: boolean;
  message: string;
  guide_id: number;
  ticket: string;
  current_status: string;
}

export interface ProcessCdrResponse {
  success: boolean;
  message: string;
  guide_id: number;
  cdr_processed: boolean;
}

class RemissionGuidesService {
  private readonly basePath = '/sunat/remission-guides/';

  // Obtiene una lista paginada de guías
  async list(params: ListGuidesParams): Promise<RemissionGuideTransportista[]> {
    const response = await api.get<RemissionGuideTransportista[]>(this.basePath, { params });
    return response.data;
  }

  // Obtiene una guía por su ID
  async getById(guideId: number, companyId?: number): Promise<RemissionGuideTransportista> {
    const params = companyId ? { company_id: companyId } : {};
    const response = await api.get<RemissionGuideTransportista>(`${this.basePath}${guideId}`, { params });
    return response.data;
  }

  // Crea una nueva guía
  async create(data: RemissionGuideCreateData): Promise<RemissionGuideTransportista> {
    const response = await api.post<RemissionGuideTransportista>(this.basePath, data);
    return response.data;
  }

  // Actualiza una guía existente
  async update(guideId: number, data: Partial<RemissionGuideCreateData>): Promise<RemissionGuideTransportista> {
    const response = await api.put<RemissionGuideTransportista>(`${this.basePath}${guideId}`, data);
    return response.data;
  }

  // Procesa una guía para enviarla a SUNAT
  async processSunat(guideId: number, data: ProcessSunatData): Promise<ProcessSunatResponse> {
    const response = await api.post<ProcessSunatResponse>(`${this.basePath}${guideId}/process-sunat`, data);
    return response.data;
  }

  // Consulta el estado del ticket en SUNAT
  async checkTicketStatus(guideId: number, data: CheckTicketStatusData): Promise<CheckTicketStatusResponse> {
    const response = await api.post<CheckTicketStatusResponse>(`${this.basePath}${guideId}/check-ticket-status`, data);
    return response.data;
  }

  // Procesa el CDR manualmente
  async processCdr(guideId: number, data: ProcessCdrData): Promise<ProcessCdrResponse> {
    const response = await api.post<ProcessCdrResponse>(`${this.basePath}${guideId}/process-cdr`, data);
    return response.data;
  }

  // Obtiene el estado SUNAT detallado
  async getSunatStatus(guideId: number, companyId: number): Promise<SunatStatusResponse> {
    const response = await api.get<SunatStatusResponse>(`${this.basePath}${guideId}/sunat-status`, {
      params: { company_id: companyId }
    });
    return response.data;
  }
}

export const remissionGuidesService = new RemissionGuidesService();