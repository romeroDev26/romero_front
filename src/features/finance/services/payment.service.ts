// src/features/finance/services/payment.service.ts

import api from '../../../config/api';
import {
  PaymentConfirmationData,
  PaymentConfirmationResponse
} from '../types/payment.types';
import { asApiError, detailToString } from '../../../utils/errorHandler';

/**
 * Servicio dedicado a operaciones de pago de encomiendas
 * Soporta pagos divididos (hasta 2 metodos de pago)
 */
export const paymentService = {
  /**
   * Confirma el pago de una encomienda con detalles completos
   * Soporta pagos divididos con hasta 2 metodos de pago
   * 
   * @param data - Datos de confirmacion del pago
   * @returns Respuesta con informacion del pago confirmado
   */
  async confirmPayment(data: PaymentConfirmationData): Promise<PaymentConfirmationResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Agregar metodo de pago principal
      if (data.payment_method_code) {
        queryParams.append('payment_method_code', data.payment_method_code);
      }
      
      // Agregar codigo de operacion del pago principal si existe
      if (data.payment_operation_code) {
        queryParams.append('payment_operation_code', data.payment_operation_code);
      }
      
      // Agregar fecha de pago
      if (data.payment_date) {
        queryParams.append('payment_date', data.payment_date);
      }

      // Agregar datos de pago dividido SOLO si is_split_payment es true
      if (data.is_split_payment) {
        if (data.payment_amount_1 !== undefined && data.payment_amount_1 > 0) {
          queryParams.append('payment_amount_1', data.payment_amount_1.toString());
        }
        
        if (data.payment_method_code_2) {
          queryParams.append('payment_method_code_2', data.payment_method_code_2);
        }
        
        if (data.payment_operation_code_2) {
          queryParams.append('payment_operation_code_2', data.payment_operation_code_2);
        }
        
        if (data.payment_amount_2 !== undefined && data.payment_amount_2 > 0) {
          queryParams.append('payment_amount_2', data.payment_amount_2.toString());
        }
      }
      
      const url = `/dispatch/manifests/confirm-payment/${data.invoice_item_id}`;
      const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
      
      const response = await api.post<PaymentConfirmationResponse>(fullUrl);
      
      return response.data;
    } catch (error) {
      const apiError = asApiError(error);
      throw new Error(
        detailToString(apiError.response?.data?.detail) || 
        apiError.response?.data?.message || 
        'Error al confirmar el pago'
      );
    }
  },

  /**
   * Obtiene el historial de pagos de una encomienda (futuro)
   */
  async getPaymentHistory(_invoiceItemId: number): Promise<any[]> {
    // Implementacion futura
    throw new Error('No implementado aun');
  },

  /**
   * Sube comprobante de pago (futuro)
   */
  async uploadPaymentProof(_invoiceItemId: number, _file: File): Promise<void> {
    // Implementacion futura
    throw new Error('No implementado aun');
  }
};
