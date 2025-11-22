// src/features/finance/services/receivables.service.ts

import api from '../../../config/api';
import { authService } from '../../../services/auth.service';
import {
  ReceivablesQueryParams,
  ReceivablesResponse,
} from '../types/receivables.types';

export const receivablesService = {
  /**
   * Obtiene la lista de encomiendas contra entrega con filtros y paginación
   */
  async getReceivables(params: ReceivablesQueryParams): Promise<ReceivablesResponse> {
    try {
      const queryParams = new URLSearchParams();

      // Obtener la sucursal del usuario actual si no se especifica
      const user = authService.getCurrentUser();
      const branchOfficeId = params.branch_office_id || user?.default_branch_office_id;

      // Agregar parámetros de filtrado
      if (branchOfficeId) queryParams.append('branch_office_id', branchOfficeId.toString());
      if (params.payment_status) queryParams.append('payment_status', params.payment_status);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      // Agregar parámetros de paginación
      queryParams.append('page', params.current_page.toString());
      queryParams.append('page_size', params.page_size.toString());

      const response = await api.get(`/dispatch/manifests/cash-on-delivery?${queryParams.toString()}`);

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al obtener las encomiendas por cobrar');
    }
  },

  /**
   * @deprecated Usar paymentService.confirmPayment() en su lugar
   * Marca una encomienda como pagada (sin detalles adicionales)
   */
  async markAsPaid(invoiceItemId: number): Promise<any> {
    try {
      const response = await api.post(`/dispatch/manifests/confirm-payment/${invoiceItemId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al marcar como pagada');
    }
  }
};
