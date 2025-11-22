// src/features/finance/services/payment.service.ts

import api from '../../../config/api';
import {
  PaymentConfirmationData,
  PaymentConfirmationResponse
} from '../types/payment.types';

/**
 * Servicio dedicado a operaciones de pago de encomiendas
 */
export const paymentService = {
  /**
   * Confirma el pago de una encomienda con detalles completos
   * 
   * @param data - Datos de confirmación del pago
   * @returns Respuesta con información del pago confirmado
   */
  async confirmPayment(data: PaymentConfirmationData): Promise<PaymentConfirmationResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar método de pago
      if (data.payment_method_code) {
        queryParams.append('payment_method_code', data.payment_method_code);
      }
      
      // Agregar código de operación si existe
      if (data.payment_operation_code) {
        queryParams.append('payment_operation_code', data.payment_operation_code);
      }
      
      // Agregar fecha de pago
      if (data.payment_date) {
        queryParams.append('payment_date', data.payment_date);
      }
      
      const url = `/dispatch/manifests/confirm-payment/${data.invoice_item_id}`;
      const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
      
      const response = await api.post<PaymentConfirmationResponse>(fullUrl);
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Error al confirmar el pago'
      );
    }
  },

  /**
   * Obtiene el historial de pagos de una encomienda (futuro)
   */
  async getPaymentHistory(_invoiceItemId: number): Promise<any[]> {
    // Implementación futura
    throw new Error('No implementado aún');
  },

  /**
   * Sube comprobante de pago (futuro)
   */
  async uploadPaymentProof(_invoiceItemId: number, _file: File): Promise<void> {
    // Implementación futura
    throw new Error('No implementado aún');
  }
};
