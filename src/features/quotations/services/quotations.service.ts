// src/features/quotations/services/quotations.service.ts
import api from '../../../config/api';
import { 
  Quotation, 
  QuotationCreate, 
  QuotationsListParams,
  QuotationStatusUpdate,
  QuotationsSummary,
  ConvertToInvoiceData
} from '../types';

export const quotationsService = {
  /**
   * Crear una nueva cotización
   * POST /quotations/
   */
  create: async (quotationData: QuotationCreate): Promise<Quotation> => {
    const response = await api.post<Quotation>('/quotations/', quotationData);
    return response.data;
  },

  /**
   * Obtener lista de cotizaciones con filtros
   * GET /quotations/
   */
  getList: async (params: QuotationsListParams = {}): Promise<Quotation[]> => {
    const { 
      skip = 0, 
      limit = 100, 
      series,
      number,
      start_date,
      end_date,
      client_search,
      status 
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('skip', skip.toString());
    queryParams.append('limit', limit.toString());
    
    if (series) queryParams.append('series', series);
    if (number !== undefined) queryParams.append('number', number.toString());
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (client_search) queryParams.append('client_search', client_search);
    if (status) queryParams.append('status', status);

    const response = await api.get<Quotation[]>(`/quotations/?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Obtener cotización por ID
   * GET /quotations/{quotation_id}
   */
  getById: async (quotationId: number): Promise<Quotation> => {
    const response = await api.get<Quotation>(`/quotations/${quotationId}`);
    return response.data;
  },

  /**
   * Actualizar estado de cotización
   * PUT /quotations/{quotation_id}/status
   */
  updateStatus: async (quotationId: number, statusData: QuotationStatusUpdate): Promise<Quotation> => {
    const response = await api.put<Quotation>(`/quotations/${quotationId}/status`, statusData);
    return response.data;
  },

  /**
   * Eliminar cotización (solo si está en estado DRAFT)
   * DELETE /quotations/{quotation_id}
   */
  delete: async (quotationId: number): Promise<void> => {
    await api.delete(`/quotations/${quotationId}`);
  },

  /**
   * Obtener resumen estadístico de cotizaciones
   * GET /quotations/summary/statistics
   */
  getSummary: async (startDate?: string, endDate?: string): Promise<QuotationsSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get<QuotationsSummary>(`/quotations/summary/statistics?${params.toString()}`);
    return response.data;
  },

  /**
   * Marcar cotización como enviada por email
   * POST /quotations/{quotation_id}/send-email
   */
  sendByEmail: async (quotationId: number, emailData: any = {}): Promise<string> => {
    const response = await api.post<string>(`/quotations/${quotationId}/send-email`, emailData);
    return response.data;
  },

  /**
   * Convertir cotización a factura
   * POST /quotations/{quotation_id}/convert-to-invoice
   */
  convertToInvoice: async (quotationId: number, invoiceData: ConvertToInvoiceData): Promise<string> => {
    const response = await api.post<string>(`/quotations/${quotationId}/convert-to-invoice`, invoiceData);
    return response.data;
  }
};
