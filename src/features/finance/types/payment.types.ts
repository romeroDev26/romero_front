// src/features/finance/types/payment.types.ts

/**
 * Datos para confirmar el pago de una encomienda
 * Soporta hasta 2 metodos de pago (pago dividido)
 */
export interface PaymentConfirmationData {
  invoice_item_id: number;
  payment_method_code: string;        // EFE, TRF, YAP, PLN, DEP, OTR
  payment_operation_code?: string;    // Codigo de operacion (max 20 chars)
  payment_date: string;               // Fecha/hora ISO format
  notes?: string;                     // Observaciones adicionales
  // Campos para pago dividido
  is_split_payment?: boolean;         // Indica si es pago dividido
  payment_amount_1?: number;          // Monto del primer pago
  payment_method_code_2?: string;     // Codigo del segundo metodo de pago
  payment_operation_code_2?: string;  // Codigo de operacion del segundo pago
  payment_amount_2?: number;          // Monto del segundo pago
}

/**
 * Datos del formulario de pago
 * Soporta hasta 2 metodos de pago (pago dividido)
 */
export interface PaymentFormData {
  payment_method_code: string;
  payment_operation_code: string;
  payment_date: string;
  notes: string;
  // Campos para pago dividido
  is_split_payment: boolean;          // Indica si es pago dividido
  payment_amount_1: number;           // Monto del primer pago
  payment_method_code_2: string;      // Codigo del segundo metodo
  payment_operation_code_2: string;   // Codigo de operacion del segundo pago
  payment_amount_2: number;           // Monto del segundo pago
}

/**
 * Respuesta del backend al confirmar un pago
 */
export interface PaymentConfirmationResponse {
  success: boolean;
  message: string;
  data: {
    invoice_item_id: number;
    invoice_id: number;
    payment_confirmed: boolean;
    confirmed_by: string;
    confirmed_at: string;
    payment_method_code: string;
    payment_operation_code: string | null;
    payment_received_by: string;
    payment_amount_1: string;
    payment_method_code_2: string | null;
    payment_operation_code_2: string | null;
    payment_amount_2: string;
    series: string;
    number: number;
    total_payable: string;
    pdf_ticket_file_path: string | null;
    pdf_ticket58_file_path: string | null;
  };
}

/**
 * Datos del ticket de pago (extraído de la respuesta)
 */
export interface PaymentTicketData {
  invoice_item_id: number;
  invoice_id: number;
  series: string;
  number: number;
  total_payable: string;
  payment_method_code: string;
  payment_operation_code: string | null;
  payment_amount_1: string;
  payment_method_code_2: string | null;
  payment_operation_code_2: string | null;
  payment_amount_2: string;
  confirmed_at: string;
  pdf_ticket_file_path: string | null;
  pdf_ticket58_file_path: string | null;
}

/**
 * Datos de pago dividido para ventas (facturas/boletas)
 */
export interface SplitPaymentData {
  is_split_payment: boolean;
  payment_method_code: string;
  payment_operation_code: string;
  payment_amount_1: number;
  payment_method_code_2: string;
  payment_operation_code_2: string;
  payment_amount_2: number;
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
