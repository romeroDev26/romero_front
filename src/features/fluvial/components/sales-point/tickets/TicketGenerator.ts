// src/features/fluvial/components/sales-point/tickets/TicketGenerator.ts

import jsPDF from 'jspdf';
import type { BackendInvoiceData } from './types/backend.types';
import { 
  NormalTicketTemplate,
  NoSeatsTicketTemplate,
  CompanyTicketTemplate,
  CargoTicketTemplate,
  A4Template
} from './templates';
import { NormalSaleTransformer } from './transformers/normalSale.transformer';
import { NoSeatsSaleTransformer } from './transformers/noSeatsSale.transformer';
import { CompanySaleTransformer } from './transformers/companySale.transformer';
import { CargoSaleTransformer } from './transformers/cargoSale.transformer';
import { isVesselWithoutSeats, isCargoInvoice } from './utils/ticketHelpers';

export interface GeneratedTickets {
  ticket80mm: Blob;
  ticketA4: Blob;
  ticket80mmDoc: jsPDF;
  ticketA4Doc: jsPDF;
}

/**
 * Genera tickets PDF basados en los datos de la factura del backend
 * Genera tanto el ticket térmico (80mm) como el formato A4
 */
export class TicketGenerator {
  
  constructor() {
    // Constructor vacío - cada template maneja su propio documento
  }

  /**
   * Genera ambos tickets (80mm y A4) automáticamente detectando el tipo correcto
   */
  public async generateBothTickets(backendData: BackendInvoiceData): Promise<GeneratedTickets> {
    try {
      // DETECCIÓN AUTOMÁTICA DEL TIPO DE TICKET:
      
      let ticket80mmDoc: jsPDF;
      let ticketData;
      
      // 1. Verificar si es encomienda/cargo
      if (isCargoInvoice(backendData)) {
        ticketData = CargoSaleTransformer.transform(backendData);
        ticket80mmDoc = await CargoTicketTemplate.generatePDF(ticketData);
      }
      // 2. Verificar si es empresa (RUC)
      else if (backendData.client?.doc_type === '6') {
        ticketData = CompanySaleTransformer.transformSummary(backendData as any);
        ticket80mmDoc = await CompanyTicketTemplate.generatePDF(ticketData);
      }
      // 3. Verificar si es embarcación sin asientos numerados
      else if (backendData.items && isVesselWithoutSeats(backendData.items)) {
        ticketData = NoSeatsSaleTransformer.transform(backendData);
        ticket80mmDoc = await NoSeatsTicketTemplate.generatePDF(ticketData);
      }
      // 4. Default: ticket normal con asientos
      else {
        ticketData = NormalSaleTransformer.transform(backendData);
        ticket80mmDoc = await NormalTicketTemplate.generatePDF(ticketData);
      }
      
      // Generar el A4 (multi-modal, funciona con todos los tipos)
      const ticketA4Doc = await A4Template.generatePDF(ticketData);
      
      return {
        ticket80mm: ticket80mmDoc.output('blob'),
        ticketA4: ticketA4Doc.output('blob'),
        ticket80mmDoc,
        ticketA4Doc
      };
      
    } catch (error) {
      console.error('Error generating tickets:', error);
      throw new Error('Error al generar los tickets');
    }
  }

  /**
   * Genera solo el ticket térmico (80mm) - mantener para compatibilidad
   */
  public async generateTicket(backendData: BackendInvoiceData): Promise<Blob> {
    const { ticket80mm } = await this.generateBothTickets(backendData);
    return ticket80mm;
  }
  
  /**
   * Genera solo el ticket A4
   */
  public async generateA4Ticket(backendData: BackendInvoiceData): Promise<Blob> {
    const { ticketA4 } = await this.generateBothTickets(backendData);
    return ticketA4;
  }
}
