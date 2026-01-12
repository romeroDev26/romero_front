// src/features/finance/services/receivables.service.ts

import api from '../../../config/api';
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

      // Agregar parámetros de filtrado
      // Si se envía branch_office_id explícitamente, se incluirá; no usar la sucursal por defecto del usuario
      if (params.branch_office_id) queryParams.append('branch_office_id', params.branch_office_id.toString());
      // Buscar por documento (DNI o RUC) del remitente o destinatario
      if (params.doc_number) queryParams.append('doc_number', params.doc_number);
      if (params.payment_status) queryParams.append('payment_status', params.payment_status);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      // Agregar parámetros de paginación
      queryParams.append('page', params.current_page.toString());
      queryParams.append('page_size', params.page_size.toString());

      const response = await api.get(`/dispatch/manifests/cash-on-delivery?${queryParams.toString()}`);

      // Transformar la respuesta del backend: extraer parcels de cada invoice y agregar info de PDF e invoice
      const backendData = response.data;
      const allParcels = backendData.invoices?.flatMap((invoice: any) => 
        invoice.parcels.map((parcel: any) => ({
          ...parcel,
          // Agregar campos desde el nivel de invoice
          invoice_id: invoice.invoice_id,
          invoice_series: invoice.invoice_series,
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          is_credit_sale: invoice.is_credit_sale,
          // Agregar URLs de PDFs desde el nivel de invoice
          pdf_ticket_file_path: invoice.pdf_ticket_file_path,
          pdf_ticket58_file_path: invoice.pdf_ticket58_file_path,
        }))
      ) || [];

      // Calcular paid_parcels y unpaid_parcels desde los parcels transformados
      const paid_parcels = allParcels.filter((p: any) => p.payment_status === 'PAGADO').length;
      const unpaid_parcels = allParcels.filter((p: any) => p.payment_status === 'NO PAGADO').length;

      return {
        parcels: allParcels,
        pagination: backendData.pagination,
        summary: {
          ...backendData.summary,
          paid_parcels,
          unpaid_parcels
        },
        filters_applied: backendData.filters_applied
      };
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
