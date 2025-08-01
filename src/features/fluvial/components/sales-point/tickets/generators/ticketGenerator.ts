// src/features/fluvial/components/sales-point/tickets/generators/ticketGenerator.ts

import jsPDF from 'jspdf';
import { BackendInvoiceData } from '../types/backend.types';
import { NormalSaleTransformer } from '../transformers/normalSale.transformer';
import { NormalTicketTemplate } from '../templates/normalTicket.template';

/**
 * Generador principal de tickets
 * Orquesta la transformación y generación de PDFs
 */
export class TicketGenerator {
  
  /**
   * Genera un ticket de venta normal
   */
  static async generateNormalSaleTicket(backendData: BackendInvoiceData): Promise<jsPDF> {
    try {
      // 1. Transformar datos del backend al formato del ticket
      const ticketData = NormalSaleTransformer.transform(backendData);
      
      // 2. Generar el PDF usando el template
      const pdf = await NormalTicketTemplate.generatePDF(ticketData);
      
      return pdf;
      
    } catch (error) {
      console.error('Error generando ticket de venta normal:', error);
      throw new Error(`Error al generar ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  /**
   * Genera y descarga un ticket de venta normal
   */
  static async downloadNormalSaleTicket(
    backendData: BackendInvoiceData, 
    filename?: string
  ): Promise<void> {
    try {
      const pdf = await this.generateNormalSaleTicket(backendData);
      
      // Generar nombre de archivo si no se proporciona
      const finalFilename = filename || this.generateTicketFilename(backendData);
      
      pdf.save(finalFilename);
      
    } catch (error) {
      console.error('Error descargando ticket:', error);
      throw error;
    }
  }
  
  /**
   * Genera un ticket de venta normal como blob
   */
  static async generateNormalSaleTicketBlob(backendData: BackendInvoiceData): Promise<Blob> {
    try {
      const pdf = await this.generateNormalSaleTicket(backendData);
      return pdf.output('blob');
      
    } catch (error) {
      console.error('Error generando ticket blob:', error);
      throw error;
    }
  }
  
  /**
   * Genera un ticket de venta normal como base64
   */
  static async generateNormalSaleTicketBase64(backendData: BackendInvoiceData): Promise<string> {
    try {
      const pdf = await this.generateNormalSaleTicket(backendData);
      return pdf.output('datauristring');
      
    } catch (error) {
      console.error('Error generando ticket base64:', error);
      throw error;
    }
  }
  
  /**
   * Genera nombre de archivo para el ticket
   */
  private static generateTicketFilename(backendData: BackendInvoiceData): string {
    const documentNumber = `${backendData.series}-${backendData.number}` || 'SN';
    const date = new Date();
    const timestamp = date.toISOString().slice(0, 10); // YYYY-MM-DD
    
    return `ticket_${documentNumber}_${timestamp}.pdf`;
  }
  
  /**
   * Valida que los datos del backend son válidos para generar ticket
   */
  static validateBackendData(backendData: BackendInvoiceData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validaciones básicas
    if (!backendData.client) {
      errors.push('Datos del cliente requeridos');
    }
    
    if (!backendData.company) {
      errors.push('Datos de la empresa requeridos');
    }
    
    if (!backendData.items || backendData.items.length === 0) {
      errors.push('Items de venta requeridos');
    }
    
    if (!backendData.seller) {
      errors.push('Datos del vendedor requeridos');
    }
    
    // Validaciones específicas del cliente
    if (backendData.client) {
      if (!backendData.client.doc_number || !backendData.client.doc_type) {
        errors.push('Documento del cliente requerido');
      }
      
      if (!backendData.client.name) {
        errors.push('Nombre del cliente requerido');
      }
    }
    
    // Validaciones de items
    if (backendData.items && backendData.items.length > 0) {
      backendData.items.forEach((item, index) => {
        if (!item.product_name) {
          errors.push(`Descripción requerida en item ${index + 1}`);
        }
        
        if (parseFloat(item.quantity) <= 0) {
          errors.push(`Cantidad inválida en item ${index + 1}`);
        }
        
        if (parseFloat(item.unit_price) < 0) {
          errors.push(`Precio unitario inválido en item ${index + 1}`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
