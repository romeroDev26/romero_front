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

      // Agregar parámetros de filtrado según la documentación del log.md
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
      // Si el endpoint no existe, intentar con alternativas comunes
      if (error.response?.status === 404) {
        try {
          const altResponse = await api.post<PaymentConfirmationResponse>(`/dispatch/manifests/confirm-payment/${invoiceItemId}`);
          return altResponse.data;
        } catch (altError: any) {
          // Continuar con el error original
        }
      }

      throw new Error(error.response?.data?.detail || 'Error al marcar como pagada');
    }
  },

  /**
   * Obtiene estadísticas de encomiendas por cobrar
   */
  async getReceivablesStats() {
    try {
      const response = await api.get(`/dispatch/manifests/cash-on-delivery/stats`);
      return response.data;
    } catch (error: any) {
      // Retornar datos por defecto en caso de error
      return {
        total_receivables: 0,
        total_amount: 0,
        pending_count: 0,
        paid_count: 0
      };
    }
  }
};
