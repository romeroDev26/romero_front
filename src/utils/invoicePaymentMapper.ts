// src/utils/invoicePaymentMapper.ts

import { Invoice } from '../types';
import { SplitPaymentData } from '../components/common/SplitPaymentForm';
import { PaymentMethodUpdate } from '../services/invoices.service';
import { getPaymentMethodName } from './paymentMethods';

/**
 * Convierte los campos planos de pago que devuelve el backend
 * en la estructura que espera SplitPaymentForm para pre-llenar el formulario.
 */
export const invoiceToSplitPaymentData = (invoice: Invoice): SplitPaymentData => {
  const hasSecondPayment = Boolean(
    invoice.payment_method_code_2 &&
    invoice.payment_amount_2 != null &&
    invoice.payment_amount_2 > 0
  );

  return {
    isSplitPayment: hasSecondPayment,
    paymentMethod1: invoice.payment_method_code || 'EFE',
    operationCode1: invoice.payment_operation_code || '',
    amount1: invoice.payment_amount_1 != null ? Number(invoice.payment_amount_1) : Number(invoice.total_payable),
    paymentMethod2: invoice.payment_method_code_2 || 'YAP',
    operationCode2: invoice.payment_operation_code_2 || '',
    amount2: invoice.payment_amount_2 != null ? Number(invoice.payment_amount_2) : 0,
  };
};

/**
 * Convierte los datos del formulario de pago dividido
 * al array que espera el endpoint PATCH /invoices/{id}/payment-methods.
 */
export const splitPaymentDataToPaymentMethods = (data: SplitPaymentData): PaymentMethodUpdate[] => {
  const methods: PaymentMethodUpdate[] = [
    {
      method: data.paymentMethod1,
      amount: data.amount1,
      operation_number: data.operationCode1 || null,
    },
  ];

  if (data.isSplitPayment && data.amount2 > 0) {
    methods.push({
      method: data.paymentMethod2,
      amount: data.amount2,
      operation_number: data.operationCode2 || null,
    });
  }

  return methods;
};

/**
 * Obtiene una descripción legible de los métodos de pago de una factura.
 */
export const getInvoicePaymentSummary = (invoice: Invoice): string => {
  const parts: string[] = [];
  const total = Number(invoice.total_payable);

  if (invoice.payment_method_code_2 && invoice.payment_amount_2 != null && invoice.payment_amount_2 > 0) {
    parts.push(
      `${getPaymentMethodName(invoice.payment_method_code || 'EFE')} S/ ${Number(invoice.payment_amount_1 ?? total - invoice.payment_amount_2).toFixed(2)}`
    );
    parts.push(
      `${getPaymentMethodName(invoice.payment_method_code_2)} S/ ${Number(invoice.payment_amount_2).toFixed(2)}`
    );
  } else {
    parts.push(`${getPaymentMethodName(invoice.payment_method_code || 'EFE')} S/ ${total.toFixed(2)}`);
  }

  return parts.join(' + ');
};
