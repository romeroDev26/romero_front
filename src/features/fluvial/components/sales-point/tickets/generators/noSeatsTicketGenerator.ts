// src/features/fluvial/components/sales-point/tickets/generators/noSeatsTicketGenerator.ts

import jsPDF from 'jspdf';
import { BackendInvoiceData } from '../types/backend.types';
import { NoSeatsSaleTransformer } from '../transformers/noSeatsSale.transformer';
import { NoSeatsTicketTemplate } from '../templates/noSeatsTicket.template';
import { isVesselWithoutSeats } from '../utils/ticketHelpers';

/**
 * Generador especializado para tickets de embarcaciones sin asientos
 * Orquesta la transformación y generación de PDFs para embarcaciones con elección libre
 */
export class NoSeatsTicketGenerator {
  
  /**
   * Genera un ticket para embarcación sin asientos
   */
  static async generateNoSeatsTicket(backendData: BackendInvoiceData): Promise<jsPDF> {
    try {
      // 1. Transformar datos del backend al formato del ticket usando el transformador especializado
      const ticketData = NoSeatsSaleTransformer.transform(backendData);
      
      // 2. Generar el PDF usando el template especializado
      const pdf = await NoSeatsTicketTemplate.generatePDF(ticketData);
      
      return pdf;
      
    } catch (error) {
      console.error('Error generando ticket para embarcación sin asientos:', error);
      throw new Error(`Error al generar ticket sin asientos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  /**
   * Genera y descarga un ticket para embarcación sin asientos
   */
  static async downloadNoSeatsTicket(
    backendData: BackendInvoiceData, 
    filename?: string
  ): Promise<void> {
    try {
      const pdf = await this.generateNoSeatsTicket(backendData);
      
      // Generar nombre de archivo si no se proporciona
      const finalFilename = filename || this.generateTicketFilename(backendData);
      
      pdf.save(finalFilename);
      
    } catch (error) {
      console.error('Error descargando ticket sin asientos:', error);
      throw error;
    }
  }
  
  /**
   * Genera un ticket para embarcación sin asientos como blob
   */
  static async generateNoSeatsTicketBlob(backendData: BackendInvoiceData): Promise<Blob> {
    try {
      const pdf = await this.generateNoSeatsTicket(backendData);
      return pdf.output('blob');
      
    } catch (error) {
      console.error('Error generando blob de ticket sin asientos:', error);
      throw error;
    }
  }
  
  /**
   * Genera un ticket para embarcación sin asientos como base64
   */
  static async generateNoSeatsTicketBase64(backendData: BackendInvoiceData): Promise<string> {
    try {
      const pdf = await this.generateNoSeatsTicket(backendData);
      return pdf.output('datauristring');
      
    } catch (error) {
      console.error('Error generando base64 de ticket sin asientos:', error);
      throw error;
    }
  }
  
  /**
   * Genera el nombre del archivo para el ticket sin asientos
   */
  private static generateTicketFilename(backendData: BackendInvoiceData): string {
    const series = backendData.series || 'SIN_SERIE';
    const number = String(backendData.number || '00000').padStart(5, '0');
    const date = new Date().toISOString().split('T')[0];
    
    return `ticket_sin_asientos_${series}_${number}_${date}.pdf`;
  }
  
  /**
   * Valida que los datos del backend son válidos para generar ticket sin asientos
   */
  static validateNoSeatsData(backendData: BackendInvoiceData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validaciones básicas
    if (!backendData) {
      errors.push('No se proporcionaron datos del backend');
      return { isValid: false, errors };
    }
    
    if (!backendData.company?.business_name) {
      errors.push('Falta información de la empresa');
    }
    
    if (!backendData.client?.name) {
      errors.push('Falta información del cliente');
    }
    
    if (!backendData.items?.length) {
      errors.push('No hay items en la factura');
    }
    
    if (!backendData.series) {
      errors.push('Falta serie del documento');
    }
    
    if (!backendData.number) {
      errors.push('Falta número del documento');
    }
    
    // Validación específica para embarcaciones sin asientos
    const hasVesselWithoutSeats = isVesselWithoutSeats(backendData.items);
    
    if (!hasVesselWithoutSeats) {
      errors.push('Los datos no corresponden a una embarcación sin asientos');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
