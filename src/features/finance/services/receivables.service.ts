// src/features/finance/services/receivables.service.ts

import api from '../../../config/api';
import {
  ReceivablesQueryParams,
  ReceivablesResponse,
  PaymentConfirmationResponse
} from '../types/receivables.types';

export const receivablesService = {
  /**
   * Obtiene la lista de encomiendas contra entrega con filtros y paginación
   */
  async getReceivables(params: ReceivablesQueryParams): Promise<ReceivablesResponse> {
    try {
      const queryParams = new URLSearchParams();

      // Agregar parámetros de filtrado si existen
      if (params.trip_id) queryParams.append('trip_id', params.trip_id.toString());
      if (params.branch_office_id) queryParams.append('branch_office_id', params.branch_office_id.toString());
      if (params.payment_status) queryParams.append('payment_status', params.payment_status);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      // Agregar parámetros de paginación
      queryParams.append('page', params.page.toString());
      queryParams.append('page_size', params.page_size.toString());

      const response = await api.get(`/dispatch/manifests/cash-on-delivery?${queryParams.toString()}`);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching receivables:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener las encomiendas por cobrar');
    }
  },

  /**
   * Marca una encomienda como pagada
   */
  async markAsPaid(invoiceItemId: number): Promise<PaymentConfirmationResponse> {
    try {
      const response = await api.post<PaymentConfirmationResponse>(`/manifests/confirm-payment/${invoiceItemId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error marking receivable as paid:', error);
      throw new Error(error.response?.data?.detail || 'Error al marcar como pagada');
    }
  },

  /**
   * Obtiene estadísticas de encomiendas por cobrar
   */
  async getReceivablesStats(branchOfficeId?: number) {
    try {
      const queryParams = branchOfficeId ? `?branch_office_id=${branchOfficeId}` : '';
      const response = await api.get(`/dispatch/manifests/cash-on-delivery/stats${queryParams}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching receivables stats:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener estadísticas');
    }
  }
};
