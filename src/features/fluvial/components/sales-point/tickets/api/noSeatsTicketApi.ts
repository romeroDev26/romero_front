// src/features/fluvial/components/sales-point/tickets/api/noSeatsTicketApi.ts

import jsPDF from 'jspdf';
import { BackendInvoiceData } from '../types/backend.types';
import { NoSeatsTicketGenerator } from '../generators/noSeatsTicketGenerator';

/**
 * API de conveniencia para funciones comunes de tickets de embarcaciones sin asientos
 * Simplifica el uso desde los componentes para embarcaciones con elección libre
 */

/**
 * Genera un ticket para embarcación sin asientos
 */
export async function generateNoSeatsTicket(backendData: BackendInvoiceData): Promise<jsPDF> {
  return NoSeatsTicketGenerator.generateNoSeatsTicket(backendData);
}

/**
 * Genera y descarga un ticket para embarcación sin asientos
 */
export async function downloadNoSeatsTicket(
  backendData: BackendInvoiceData, 
  filename?: string
): Promise<void> {
  return NoSeatsTicketGenerator.downloadNoSeatsTicket(backendData, filename);
}

/**
 * Genera un ticket para embarcación sin asientos como blob
 */
export async function generateNoSeatsTicketBlob(backendData: BackendInvoiceData): Promise<Blob> {
  return NoSeatsTicketGenerator.generateNoSeatsTicketBlob(backendData);
}

/**
 * Genera un ticket para embarcación sin asientos como base64
 */
export async function generateNoSeatsTicketBase64(backendData: BackendInvoiceData): Promise<string> {
  return NoSeatsTicketGenerator.generateNoSeatsTicketBase64(backendData);
}

/**
 * Valida que los datos del backend son válidos para generar ticket sin asientos
 */
export function validateNoSeatsData(backendData: BackendInvoiceData): {
  isValid: boolean;
  errors: string[];
} {
  return NoSeatsTicketGenerator.validateNoSeatsData(backendData);
}
