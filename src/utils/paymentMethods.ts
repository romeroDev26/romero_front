// src/utils/paymentMethods.ts

/**
 * Mapeo de códigos de métodos de pago a sus nombres completos
 */
export const PAYMENT_METHOD_NAMES: Record<string, string> = {
  'EFE': 'Efectivo',
  'TRF': 'Transferencia Bancaria',
  'YAP': 'Yape',
  'PLN': 'Plin',
  'DEP': 'Depósito en Cuenta',
  'OTR': 'Otros',
  'CARD': 'Tarjeta',
  'SIN_ESPECIFICAR': 'Sin Especificar',
  'AJUSTE': 'Ajuste',
};

/**
 * Colores asignados a cada método de pago para gráficos y visualizaciones
 */
export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  'EFE': '#22c55e', // Verde para efectivo
  'TRF': '#3b82f6', // Azul para transferencia
  'YAP': '#8b5cf6', // Morado para Yape
  'PLN': '#f59e0b', // Amarillo para Plin
  'DEP': '#06b6d4', // Cyan para depósito
  'OTR': '#64748b', // Gris para otros
  'CARD': '#ef4444', // Rojo para tarjeta
  'SIN_ESPECIFICAR': '#6b7280', // Gris para sin especificar
  'AJUSTE': '#f97316', // Naranja para ajustes
};

/**
 * Obtiene el nombre completo de un método de pago a partir de su código
 * @param method - Código del método de pago (ej: 'EFE', 'TRF', etc.)
 * @returns Nombre completo del método de pago
 */
export const getPaymentMethodName = (method: string): string => {
  return PAYMENT_METHOD_NAMES[method] || method;
};

/**
 * Obtiene el color asignado a un método de pago
 * @param method - Código del método de pago
 * @returns Color hexadecimal del método de pago
 */
export const getPaymentMethodColor = (method: string): string => {
  return PAYMENT_METHOD_COLORS[method] || '#64748b';
};
