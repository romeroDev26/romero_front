//src/services/documentSeries.service.ts
import api from '../config/api';
import { DocumentSeries } from '../types';

// ========================================
// INTERFACES PARA CREACIÓN Y ACTUALIZACIÓN
// ========================================

export interface DocumentSeriesCreateData {
  company_id: number;
  branch_office_id: number;
  document_type_code: string;
  series_code: string;
  current_number: number;
  is_electronic: boolean;
}

// Constante para el código de tipo de documento de cotizaciones
export const QUOTATION_DOCUMENT_TYPE_CODE = 'COT'; // Cambiado de '09' a 'COT' según la API
export const QUOTATION_SERIES_CODE = 'COT';

export interface DocumentSeriesUpdateData {
  branch_office_id?: number;
  current_number?: number;
  is_active?: boolean;
}

export interface DocumentSeriesListParams {
  skip?: number;
  limit?: number;
}
 
// ========================================
// SERVICIO DE SERIES DE DOCUMENTOS
// ========================================

export const documentSeriesService = {
  /**
   * Obtiene todas las series para una compañía específica.
   */
  getAllByCompany: async (companyId: number, params: DocumentSeriesListParams = {}): Promise<DocumentSeries[]> => {
    const { skip = 0, limit = 100 } = params;
    const response = await api.get<DocumentSeries[]>(`/document-series/by-company/${companyId}`, {
      params: { skip, limit }
    });
    return response.data;
  },

  /**
   * Obtiene una serie por su ID.
   */
  getById: async (seriesId: number): Promise<DocumentSeries> => {
    const response = await api.get<DocumentSeries>(`/document-series/${seriesId}`);
    return response.data;
  },

  /**
   * Crea una nueva serie de documento.
   */
  create: async (seriesData: DocumentSeriesCreateData): Promise<DocumentSeries> => {
    const response = await api.post<DocumentSeries>('/document-series/', seriesData);
    return response.data;
  },

  /**
   * Actualiza una serie de documento existente.
   */
  update: async (seriesId: number, seriesData: DocumentSeriesUpdateData): Promise<DocumentSeries> => {
    const response = await api.patch<DocumentSeries>(`/document-series/${seriesId}`, seriesData);
    return response.data;
  },

  /**
   * Desactiva (borrado lógico) una serie de documento.
   */
  deactivate: async (seriesId: number): Promise<DocumentSeries> => {
    const response = await api.delete<DocumentSeries>(`/document-series/${seriesId}`);
    return response.data;
  },

  /**
   * Obtiene todas las series de cotizaciones (COT) para una compañía específica.
   */
  getQuotationSeries: async (companyId: number): Promise<DocumentSeries[]> => {
    const response = await api.get<DocumentSeries[]>(`/document-series/by-company/${companyId}`, {
      params: { 
        skip: 0, 
        limit: 100,
        document_type_code: QUOTATION_DOCUMENT_TYPE_CODE 
      }
    });
    return response.data;
  },

  /**
   * Crea una nueva serie de cotización para una sucursal.
   */
  createQuotationSeries: async (companyId: number, branchOfficeId: number): Promise<DocumentSeries> => {
    const seriesData: DocumentSeriesCreateData = {
      company_id: companyId,
      branch_office_id: branchOfficeId,
      document_type_code: QUOTATION_DOCUMENT_TYPE_CODE,
      series_code: QUOTATION_SERIES_CODE,
      current_number: 1,
      is_electronic: false // Las cotizaciones generalmente no son documentos electrónicos SUNAT
    };
    
    return documentSeriesService.create(seriesData);
  }
};