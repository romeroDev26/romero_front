// src/features/finance/types/payment.types.ts

/**
 * Datos para confirmar el pago de una encomienda
 */
export interface PaymentConfirmationData {
  invoice_item_id: number;
  payment_method_code: string;        // EFE, TRF, YAP, PLN, DEP, OTR
  payment_operation_code?: string;    // Código de operación (max 20 chars)
  payment_date: string;               // Fecha/hora ISO format
  notes?: string;                     // Observaciones adicionales
}

/**
 * Datos del formulario de pago
 */
export interface PaymentFormData {
  payment_method_code: string;
  payment_operation_code: string;
  payment_date: string;
  notes: string;
}

/**
 * Respuesta del backend al confirmar un pago
 */
export interface PaymentConfirmationResponse {
  message: string;
  invoice_item_id: number;
  payment_status: 'PAGADO';
  confirmed_by: string;
  confirmed_at: string;
  payment_method?: string;
  payment_operation_code?: string;
}

/**
 * Opciones de método de pago (consistente con el resto del proyecto)
 */
export interface PaymentMethodOption {
  value: string;
  label: string;
}

/**
 * Opciones estándar de métodos de pago
 */
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: 'EFE', label: 'Efectivo' },
  { value: 'TRF', label: 'Transferencia Bancaria' },
  { value: 'YAP', label: 'Yape' },
  { value: 'PLN', label: 'Plin' },
  { value: 'DEP', label: 'Depósito en Cuenta' },
  { value: 'OTR', label: 'Otros' },
];
