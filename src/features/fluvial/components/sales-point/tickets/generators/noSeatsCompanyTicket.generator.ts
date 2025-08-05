// src/features/fluvial/components/sales-point/tickets/generators/noSeatsCompanyTicket.generator.ts

import { NoSeatsCompanyTicketTemplate } from '../templates/noSeatsCompanyTicket.template';
import { NoSeatsCompanySaleTransformer } from '../transformers/noSeatsCompanySale.transformer';
import { BackendCompanyInvoiceData } from '../types/backend.types';
import { isVesselWithoutSeats } from '../utils/ticketHelpers';

/**
 * Generador de tickets empresariales para embarcaciones SIN ASIENTOS
 * 
 * ESPECIALIZACIÓN:
 * - Para ventas empresariales (RUC) en embarcaciones que no manejan asientos numerados
 * - Transforma datos del backend usando NoSeatsCompanySaleTransformer
 * - Genera PDF usando NoSeatsCompanyTicketTemplate
 * - Detecta automáticamente si la embarcación maneja asientos
 * - Muestra "ASIENTOS: Elección libre" en lugar de asientos específicos
 * 
 * DIFERENCIAS CON CompanyTicketGenerator:
 * - Usa templates y transformers especializados para "sin asientos"
 * - No muestra detalles específicos de asientos numerados
 * - Mantiene toda la funcionalidad empresarial (RUC, representantes múltiples)
 * - Validación automática de tipo de embarcación
 */
export class NoSeatsCompanyTicketGenerator {
  
  /**
   * Genera un ticket empresarial para embarcación sin asientos
   * @param data - Datos de la factura empresarial del backend
   * @returns Promise<jsPDF> - Documento PDF generado
   */
  static async generate(data: BackendCompanyInvoiceData): Promise<any> {
    try {
      // VALIDACIÓN 1: Verificar que tenemos datos válidos
      this.validateInputData(data);
      
      // VALIDACIÓN 2: Verificar que es una embarcación sin asientos
      this.validateVesselType(data);
      
      // PASO 1: Transformar datos del backend al formato del ticket
      const ticketData = NoSeatsCompanySaleTransformer.transformSummary(data);
      
      // PASO 2: Generar el PDF usando el template especializado
      const pdfDoc = await NoSeatsCompanyTicketTemplate.generatePDF(ticketData);
      
      return pdfDoc;
      
    } catch (error) {
      throw new Error(`Error generando ticket empresarial sin asientos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  /**
   * Genera múltiples tickets individuales para los representantes
   * Cada representante obtiene su ticket individual con "Elección libre"
   */
  static async generateIndividualTickets(data: BackendCompanyInvoiceData): Promise<any[]> {
    try {
      this.validateInputData(data);
      this.validateVesselType(data);
      
      if (!data.representatives || data.representatives.length === 0) {
        throw new Error('No hay representantes para generar tickets individuales');
      }
      
      const tickets: any[] = [];
      
      // Generar un ticket individual para cada representante
      for (let i = 0; i < data.representatives.length; i++) {
        const representative = data.representatives[i];
        
        try {
          // Crear datos del ticket individual basado en el representante
          const individualData = this.createIndividualTicketData(data, representative);
          
          // Transformar usando el transformer de empresas sin asientos
          const ticketData = NoSeatsCompanySaleTransformer.transformSummary(individualData);
          
          // Generar PDF individual
          const pdfDoc = await NoSeatsCompanyTicketTemplate.generatePDF(ticketData);
          
          tickets.push(pdfDoc);
          
        } catch (error) {
          throw error;
        }
      }
      
      return tickets;
      
    } catch (error) {
      throw new Error(`Error generando tickets individuales sin asientos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  /**
   * Crea datos de ticket individual para un representante específico
   * Adaptado para embarcaciones sin asientos
   */
  private static createIndividualTicketData(
    companyData: BackendCompanyInvoiceData, 
    representative: any
  ): BackendCompanyInvoiceData {
    return {
      ...companyData,
      // Ajustar el cliente al representante específico
      invoice: {
        ...companyData.invoice,
        client: {
          ...companyData.invoice.client,
          name: representative.passenger_name,
          doc_type: representative.passenger_doc_type,
          doc_number: representative.passenger_doc_number
        },
        // Ajustar cantidad y precio para un solo pasajero
        items: companyData.invoice.items.map(item => ({
          ...item,
          quantity: '1',
          total_line: item.unit_price,
          // ESPECIALIZACIÓN: Sin asientos específicos, descripción genérica
          item_description: `${item.item_description || item.product_name} - Pasajero individual - Elección libre`
        })),
        // Ajustar totales para un solo pasajero
        total_payable: companyData.invoice.items[0]?.unit_price || '0.00',
        total_taxable: companyData.invoice.items[0]?.unit_price || '0.00'
      },
      // Solo incluir este representante
      representatives: [representative]
    };
  }
  
  /**
   * Valida que los datos de entrada sean correctos
   */
  private static validateInputData(data: BackendCompanyInvoiceData): void {
    if (!data) {
      throw new Error('Datos de factura empresarial requeridos');
    }
    
    if (!data.invoice) {
      throw new Error('Datos de factura requeridos');
    }
    
    if (!data.invoice.client) {
      throw new Error('Datos de cliente requeridos');
    }
    
    if (!data.invoice.items || data.invoice.items.length === 0) {
      throw new Error('Items de factura requeridos');
    }
    
    if (!data.representatives || data.representatives.length === 0) {
      throw new Error('Representantes empresariales requeridos');
    }
  }
  
  /**
   * Valida que sea una embarcación sin asientos
   */
  private static validateVesselType(data: BackendCompanyInvoiceData): void {
    const hasVesselWithoutSeats = isVesselWithoutSeats(data.invoice.items);
    
    if (!hasVesselWithoutSeats) {
      throw new Error(
        'Esta embarcación maneja asientos numerados. Use CompanyTicketGenerator en su lugar.'
      );
    }
  }
  
  /**
   * Obtiene información sobre el tipo de embarcación
   */
  static getVesselInfo(data: BackendCompanyInvoiceData): { hasSeats: boolean; vesselType: string } {
    const hasSeats = !isVesselWithoutSeats(data.invoice.items);
    const vesselType = hasSeats ? 'CON ASIENTOS NUMERADOS' : 'SIN ASIENTOS (ELECCIÓN LIBRE)';
    
    return {
      hasSeats,
      vesselType
    };
  }
  
  /**
   * Verifica si este generador es apropiado para los datos dados
   */
  static canHandle(data: BackendCompanyInvoiceData): boolean {
    try {
      this.validateInputData(data);
      return isVesselWithoutSeats(data.invoice.items);
    } catch (error) {
      return false;
    }
  }
}
