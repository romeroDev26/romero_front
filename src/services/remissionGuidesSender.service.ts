// src/services/remissionGuidesSender.service.ts

import api from '../config/api';
import { RemissionGuideRemitente, RemissionGuidesByBranchOfficeResponse } from '../types';

// Tipos para el servicio
export interface ListSenderGuidesParams {
  company_id: number;
  sunat_status?: string;
  skip?: number;
  limit?: number;
  page?: number;
  size?: number;
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

class RemissionGuidesSenderService {
  private readonly basePath = '/sunat/remission-guides-sender/';

  // Obtiene todas las guías (transportista y remitente) por sucursal
  async getAllByBranchOffice(branchOfficeId: number): Promise<RemissionGuidesByBranchOfficeResponse> {
    const response = await api.get<RemissionGuidesByBranchOfficeResponse>(`${this.basePath}by-branch-office/${branchOfficeId}`);
    return response.data;
  }

  // Obtiene una lista paginada de guías del remitente
  async list(params: ListSenderGuidesParams): Promise<RemissionGuideRemitente[]> {
    const response = await api.get<RemissionGuideRemitente[]>(this.basePath, { params });
    return response.data;
  }

  // Obtiene una guía del remitente por su ID
  async getById(guideId: number, companyId?: number): Promise<RemissionGuideRemitente> {
    const params = companyId ? { company_id: companyId } : {};
    const response = await api.get<RemissionGuideRemitente>(`${this.basePath}${guideId}`, { params });
    return response.data;
  }

  // Crea una nueva guía del remitente
  async create(data: any): Promise<RemissionGuideRemitente> {
    const response = await api.post<RemissionGuideRemitente>(this.basePath, data);
    return response.data;
  }

  // Actualiza una guía del remitente existente
  async update(guideId: number, data: Partial<any>): Promise<RemissionGuideRemitente> {
    const response = await api.put<RemissionGuideRemitente>(`${this.basePath}${guideId}`, data);
    return response.data;
  }

  // Procesa una guía del remitente para enviarla a SUNAT
  async processSunat(guideId: number, data: ProcessSunatData): Promise<ProcessSunatResponse> {
    const response = await api.post<ProcessSunatResponse>(`${this.basePath}${guideId}/process-sunat`, data);
    return response.data;
  }

  // Consulta el estado del ticket en SUNAT para guía del remitente
  async checkTicketStatus(guideId: number, data: CheckTicketStatusData): Promise<CheckTicketStatusResponse> {
    const response = await api.post<CheckTicketStatusResponse>(`${this.basePath}${guideId}/check-ticket-status`, data);
    return response.data;
  }

  // Procesa el CDR manualmente para guía del remitente
  async processCdr(guideId: number, data: ProcessCdrData): Promise<ProcessCdrResponse> {
    const response = await api.post<ProcessCdrResponse>(`${this.basePath}${guideId}/process-cdr`, data);
    return response.data;
  }

  // Obtiene el estado SUNAT detallado para guía del remitente
  async getSunatStatus(guideId: number, companyId: number): Promise<SunatStatusResponse> {
    const response = await api.get<SunatStatusResponse>(`${this.basePath}${guideId}/sunat-status`, {
      params: { company_id: companyId }
    });
    return response.data;
  }

  // Sube PDF de guía de remisión del remitente al backend
  async uploadRemissionGuidePDF(
    guideId: number, 
    pdfFile: File,
    pdfType: 'standard' | 'a4' | 'ticket' = 'standard'
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('pdf_type', pdfType);
      
      await api.post(`${this.basePath}${guideId}/upload-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
    } catch (error: any) {
      console.error('Error uploading remission guide sender PDF:', error);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.detail || 
        'Error al subir el PDF de la guía de remisión del remitente'
      );
    }
  }
}

export const remissionGuidesSenderService = new RemissionGuidesSenderService();