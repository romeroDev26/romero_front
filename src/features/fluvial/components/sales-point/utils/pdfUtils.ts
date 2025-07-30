// src/features/fluvial/components/sales-point/utils/pdfUtils.ts

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una cantidad de dinero en soles peruanos
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatea el número de documento (serie-número)
 */
export const formatDocumentNumber = (series: string, number: number): string => {
  return `${series}-${String(number).padStart(8, '0')}`;
};

/**
 * Obtiene el nombre del tipo de documento
 */
export const getDocumentTypeName = (code: string): string => {
  const documentTypes: Record<string, string> = {
    '01': 'Factura Electrónica',
    '03': 'Boleta de Venta Electrónica',
    '07': 'Nota de Crédito Electrónica',
    '08': 'Nota de Débito Electrónica',
    '1': 'DNI',
    '6': 'RUC',
    '4': 'Carnet de Extranjería',
    '7': 'Pasaporte',
    '0': 'Otros'
  };
  
  return documentTypes[code] || `Documento ${code}`;
};

/**
 * Formatea una fecha en formato legible
 */
export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    return dateString;
  }
};

/**
 * Formatea una hora en formato legible
 */
export const formatTime = (timeString: string): string => {
  try {
    // Si viene en formato HH:mm:ss, lo parseamos
    if (timeString.includes(':')) {
      return format(parseISO(`2000-01-01T${timeString}`), 'HH:mm');
    }
    return timeString;
  } catch (error) {
    return timeString;
  }
};

/**
 * Trunca texto si es muy largo
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Convierte texto a mayúsculas y elimina caracteres especiales
 */
export const sanitizeText = (text: string): string => {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^A-Z0-9\s\-\.]/g, ' ') // Solo letras, números, espacios, guiones y puntos
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .trim();
};

/**
 * Calcula la altura necesaria para un texto multilínea
 */
export const calculateTextHeight = (
  text: string, 
  maxWidth: number, 
  fontSize: number, 
  lineHeight: number = 1.2
): number => {
  // Estimación aproximada basada en caracteres por línea
  const avgCharWidth = fontSize * 0.6; // Aproximación
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  const lines = Math.ceil(text.length / charsPerLine);
  
  return lines * fontSize * lineHeight;
};

/**
 * Divide texto en líneas que caben en el ancho especificado
 */
export const splitTextToLines = (
  text: string, 
  maxWidth: number, 
  fontSize: number
): string[] => {
  const avgCharWidth = fontSize * 0.6; // Aproximación
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  
  if (text.length <= charsPerLine) {
    return [text];
  }
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= charsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

/**
 * Valida que un número sea válido
 */
export const safeParseFloat = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Genera un código QR simple (placeholder para futuro)
 */
export const generateQRCode = (data: string): string => {
  // Por ahora retornamos un placeholder
  // En el futuro se puede integrar con una librería de QR
  return `QR:${data}`;
};

/**
 * Calcula totales de la factura
 */
export const calculateTotals = (invoice: any) => {
  const subtotal = safeParseFloat(invoice.total_taxable) + safeParseFloat(invoice.total_exonerated);
  const igv = safeParseFloat(invoice.total_igv);
  const descuento = safeParseFloat(invoice.total_global_discount);
  const total = safeParseFloat(invoice.total_payable);
  
  return {
    subtotal,
    igv,
    descuento,
    total,
    subtotalFormatted: formatCurrency(subtotal),
    igvFormatted: formatCurrency(igv),
    descuentoFormatted: formatCurrency(descuento),
    totalFormatted: formatCurrency(total)
  };
};
