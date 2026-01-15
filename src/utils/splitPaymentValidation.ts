// src/utils/splitPaymentValidation.ts

import { SplitPaymentData } from '../components/common/SplitPaymentForm';

/**
 * Resultado de la validacion del pago dividido
 */
export interface SplitPaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Monto minimo que debe tener cada parte del pago dividido
 */
export const MIN_SPLIT_AMOUNT = 1;

/**
 * Valida los datos de un pago dividido
 * 
 * @param data - Datos del pago dividido
 * @param totalAmount - Monto total a pagar
 * @returns Resultado de la validacion con errores y advertencias
 */
export function validateSplitPayment(
  data: SplitPaymentData,
  totalAmount: number
): SplitPaymentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validacion 1: Verificar que existe un precio valido
  if (totalAmount <= 0 || isNaN(totalAmount)) {
    errors.push('No hay un precio valido establecido para este viaje');
    return { isValid: false, errors, warnings };
  }

  // Si no es pago dividido, solo validar el metodo principal
  if (!data.isSplitPayment) {
    // Validar que el metodo de pago este seleccionado
    if (!data.paymentMethod1) {
      errors.push('Debe seleccionar un metodo de pago');
    }
    
    // Validar codigo de operacion si es requerido
    if (requiresOperationCode(data.paymentMethod1) && !data.operationCode1.trim()) {
      warnings.push('Se recomienda ingresar el codigo de operacion');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  // Validaciones para pago dividido

  // Validacion 2: Los montos no deben ser negativos
  if (data.amount1 < 0) {
    errors.push('El monto del pago 1 no puede ser negativo');
  }
  if (data.amount2 < 0) {
    errors.push('El monto del pago 2 no puede ser negativo');
  }

  // Validacion 3: En pago dividido, ambos montos deben ser mayores al minimo
  if (data.amount1 < MIN_SPLIT_AMOUNT) {
    errors.push(`El monto del pago 1 debe ser al menos ${MIN_SPLIT_AMOUNT}`);
  }
  if (data.amount2 < MIN_SPLIT_AMOUNT) {
    errors.push(`El monto del pago 2 debe ser al menos ${MIN_SPLIT_AMOUNT}`);
  }

  // Validacion 4: La suma de los montos no debe superar el total
  const totalPaid = data.amount1 + data.amount2;
  if (totalPaid > totalAmount + 0.01) { // Tolerancia de 1 centavo
    errors.push(`La suma de los montos (${totalPaid.toFixed(2)}) supera el total a pagar (${totalAmount.toFixed(2)})`);
  }

  // Validacion 5: La suma de los montos debe ser igual al total
  if (Math.abs(totalPaid - totalAmount) > 0.01) {
    const diff = totalAmount - totalPaid;
    if (diff > 0) {
      errors.push(`Falta cubrir ${diff.toFixed(2)} del monto total`);
    }
  }

  // Validacion 6: No usar el mismo metodo de pago en ambos
  if (data.paymentMethod1 === data.paymentMethod2) {
    warnings.push('Esta usando el mismo metodo de pago en ambos. Considere usar uno diferente.');
  }

  // Validacion 7: Codigos de operacion para metodos que lo requieren
  if (requiresOperationCode(data.paymentMethod1) && !data.operationCode1.trim()) {
    warnings.push(`Se recomienda ingresar el codigo de operacion para ${getPaymentMethodLabel(data.paymentMethod1)}`);
  }
  if (requiresOperationCode(data.paymentMethod2) && !data.operationCode2.trim() && data.amount2 > 0) {
    warnings.push(`Se recomienda ingresar el codigo de operacion para ${getPaymentMethodLabel(data.paymentMethod2)}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Verifica si un metodo de pago requiere codigo de operacion
 */
export function requiresOperationCode(method: string): boolean {
  return method === 'TRF' || method === 'YAP' || method === 'PLN';
}

/**
 * Obtiene la etiqueta legible de un metodo de pago
 */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    'EFE': 'Efectivo',
    'TRF': 'Transferencia Bancaria',
    'YAP': 'Yape',
    'PLN': 'Plin',
    'DEP': 'Deposito en Cuenta',
    'OTR': 'Otros'
  };
  return labels[method] || method;
}

/**
 * Verifica si el formulario de pago dividido puede habilitarse
 * (solo si hay un precio valido)
 */
export function canEnableSplitPayment(totalAmount: number): boolean {
  return totalAmount > 0 && !isNaN(totalAmount);
}

/**
 * Calcula cuanto falta para completar el pago
 */
export function calculateRemainingAmount(
  data: SplitPaymentData,
  totalAmount: number
): number {
  if (!data.isSplitPayment) {
    return 0;
  }
  return Math.max(0, totalAmount - data.amount1 - data.amount2);
}
