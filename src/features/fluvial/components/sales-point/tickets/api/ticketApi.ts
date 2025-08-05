// src/features/fluvial/components/sales-point/tickets/api/ticketApi.ts

import jsPDF from 'jspdf';
import { BackendInvoiceData } from '../types/backend.types';
import { TicketGenerator } from '../generators/ticketGenerator';

/**
 * API de conveniencia para funciones comunes de tickets
 * Simplifica el uso desde los componentes con detección automática del tipo de embarcación
 */

/**
 * Genera un ticket con detección automática del tipo de embarcación
 */
export async function generateTicket(backendData: BackendInvoiceData): Promise<jsPDF> {
  return TicketGenerator.generateTicket(backendData);
}

/**
 * Genera y descarga un ticket con detección automática
 */
export async function downloadTicket(
  backendData: BackendInvoiceData, 
  filename?: string
): Promise<void> {
  return TicketGenerator.downloadTicket(backendData, filename);
}

/**
 * Genera un ticket con detección automática como blob
 */
export async function generateTicketBlob(backendData: BackendInvoiceData): Promise<Blob> {
  return TicketGenerator.generateTicketBlob(backendData);
}

/**
 * Genera un ticket de venta normal (mantenido para compatibilidad)
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
