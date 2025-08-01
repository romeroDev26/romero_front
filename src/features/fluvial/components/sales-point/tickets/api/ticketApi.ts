// src/features/fluvial/components/sales-point/tickets/api/ticketApi.ts

import jsPDF from 'jspdf';
import { BackendInvoiceData } from '../types/backend.types';
import { TicketGenerator } from '../generators/ticketGenerator';

/**
 * API de conveniencia para funciones comunes de tickets
 * Simplifica el uso desde los componentes
 */

/**
 * Genera un ticket de venta normal
 */
export async function generateNormalSaleTicket(backendData: BackendInvoiceData): Promise<jsPDF> {
  return TicketGenerator.generateNormalSaleTicket(backendData);
}

/**
 * Genera y descarga un ticket de venta normal
 */
export async function downloadNormalSaleTicket(
  backendData: BackendInvoiceData, 
  filename?: string
): Promise<void> {
  return TicketGenerator.downloadNormalSaleTicket(backendData, filename);
}

/**
 * Genera un ticket de venta normal como blob
 */
export async function generateNormalSaleTicketBlob(backendData: BackendInvoiceData): Promise<Blob> {
  return TicketGenerator.generateNormalSaleTicketBlob(backendData);
}

/**
 * Genera un ticket de venta normal como base64
 */
export async function generateNormalSaleTicketBase64(backendData: BackendInvoiceData): Promise<string> {
  return TicketGenerator.generateNormalSaleTicketBase64(backendData);
}

/**
 * Valida que los datos del backend son válidos para generar ticket
 */
export function validateNormalSaleData(backendData: BackendInvoiceData): {
  isValid: boolean;
  errors: string[];
} {
  return TicketGenerator.validateBackendData(backendData);
}
