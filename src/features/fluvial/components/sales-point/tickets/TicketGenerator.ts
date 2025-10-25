// src/features/fluvial/components/sales-point/tickets/TicketGenerator.ts

import type { BackendInvoiceData, BackendCompanyInvoiceData } from './types/backend.types';
import { NormalTicketTemplate } from './templates/normalTicket.template';
import { NoSeatsTicketTemplate } from './templates/noSeatsTicket.template';
import { CompanyTicketTemplate } from './templates/companyTicket.template';
import { CargoTicketTemplate } from './templates/cargoTicket.template';
import { A4Template } from './templates/a4.template';
import { NormalSaleTransformer } from './transformers/normalSale.transformer';
import { NoSeatsSaleTransformer } from './transformers/noSeatsSale.transformer';
import { CompanySaleTransformer } from './transformers/companySale.transformer';
import { CargoSaleTransformer } from './transformers/cargoSale.transformer';
import { isVesselWithoutSeats, isCargoInvoice } from './utils/ticketHelpers';

export interface BothTicketsResult {
  ticket80mm: Blob;
  ticketA4: Blob;
  ticket80mmDoc: any;
  ticketA4Doc: any;
}

/**
 * Genera un ticket PDF basado en los datos de la factura del backend
 */
export class TicketGenerator {
  
  constructor() {
    // Constructor vacío - cada template maneja su propio documento
  }

  /**
   * Genera el ticket automáticamente detectando el tipo correcto
   */
  public async generateTicket(backendData: BackendInvoiceData): Promise<Blob> {
    try {
      // DETECCIÓN AUTOMÁTICA DEL TIPO DE TICKET:
      
      // 1. Verificar si es encomienda/cargo
      if (isCargoInvoice(backendData)) {
        const ticketData = CargoSaleTransformer.transform(backendData);
        const cargoDoc = await CargoTicketTemplate.generatePDF(ticketData);
        return cargoDoc.output('blob');
      }
      
      // 2. Verificar si es empresa (RUC)
      if (backendData.client?.doc_type === '6') {
        const ticketData = CompanySaleTransformer.transformSummary(backendData as any);
        const companyDoc = await CompanyTicketTemplate.generatePDF(ticketData);
        return companyDoc.output('blob');
      }
      
      // 3. Verificar si es embarcación sin asientos numerados
      if (backendData.items && isVesselWithoutSeats(backendData.items)) {
        const ticketData = NoSeatsSaleTransformer.transform(backendData);
        const noSeatsDoc = await NoSeatsTicketTemplate.generatePDF(ticketData);
        return noSeatsDoc.output('blob');
      }
      
      // 4. Default: ticket normal con asientos
      const ticketData = NormalSaleTransformer.transform(backendData);
      const normalDoc = await NormalTicketTemplate.generatePDF(ticketData);
      return normalDoc.output('blob');
      
    } catch (error) {
      console.error('Error generating ticket:', error);
      throw new Error('Error al generar el ticket');
    }
  }

  /**
   * Genera AMBOS formatos de tickets (80mm térmico + A4) en paralelo
   * Retorna los PDFs en formato Blob y también los documentos jsPDF
   * Actualizado: Acepta BackendInvoiceData o BackendCompanyInvoiceData
   * @param backendData - Datos de la factura del backend
   * @param showRepresentativesInA4 - Flag para mostrar representantes en A4 (solo ventas empresariales)
   */
  public async generateBothTickets(
    backendData: BackendInvoiceData | BackendCompanyInvoiceData,
    showRepresentativesInA4: boolean = true
  ): Promise<BothTicketsResult> {
    try {
      // Normalizar los datos: extraer invoice si viene en formato BackendCompanyInvoiceData
      const invoiceData = 'invoice' in backendData ? backendData.invoice : backendData;
      
      // DETECCION AUTOMATICA DEL TIPO DE VENTA:
      // IMPORTANTE: El orden importa - verificar empresa ANTES de cargo
      // porque las ventas empresariales tambien pueden tener recipient_name
      
      // 1. Verificar si es empresa (RUC) - PRIMERO
      const isCompany = invoiceData.client?.doc_type === '6';
      
      if (isCompany) {
        // Para ventas empresa, pasar los datos completos con representatives
        const companyData = 'invoice' in backendData ? backendData : { invoice: backendData, representatives: [], summary: {} };
        const ticketData = CompanySaleTransformer.transformSummary(companyData as BackendCompanyInvoiceData, showRepresentativesInA4);
        
        const [doc80mm, docA4] = await Promise.all([
          CompanyTicketTemplate.generatePDF(ticketData),
          A4Template.generatePDF(ticketData)
        ]);
        
        return {
          ticket80mm: doc80mm.output('blob'),
          ticketA4: docA4.output('blob'),
          ticket80mmDoc: doc80mm,
          ticketA4Doc: docA4
        };
      }
      
      // 2. Verificar si es encomienda/cargo - SEGUNDO
      const isCargo = isCargoInvoice(invoiceData);
      
      if (isCargo) {
        const ticketData = CargoSaleTransformer.transform(invoiceData);
        
        const [doc80mm, docA4] = await Promise.all([
          CargoTicketTemplate.generatePDF(ticketData),
          A4Template.generatePDF(ticketData)
        ]);
        
        return {
          ticket80mm: doc80mm.output('blob'),
          ticketA4: docA4.output('blob'),
          ticket80mmDoc: doc80mm,
          ticketA4Doc: docA4
        };
      }
      
      // 3. Verificar si es embarcacion sin asientos numerados
      const isNoSeats = invoiceData.items && isVesselWithoutSeats(invoiceData.items);
      
      if (isNoSeats) {
        const ticketData = NoSeatsSaleTransformer.transform(invoiceData);
        
        const [doc80mm, docA4] = await Promise.all([
          NoSeatsTicketTemplate.generatePDF(ticketData),
          A4Template.generatePDF(ticketData)
        ]);
        
        return {
          ticket80mm: doc80mm.output('blob'),
          ticketA4: docA4.output('blob'),
          ticket80mmDoc: doc80mm,
          ticketA4Doc: docA4
        };
      }
      
      // 4. Default: ticket normal con asientos
      const ticketData = NormalSaleTransformer.transform(invoiceData);
      
      const [doc80mm, docA4] = await Promise.all([
        NormalTicketTemplate.generatePDF(ticketData),
        A4Template.generatePDF(ticketData)
      ]);
      
      return {
        ticket80mm: doc80mm.output('blob'),
        ticketA4: docA4.output('blob'),
        ticket80mmDoc: doc80mm,
        ticketA4Doc: docA4
      };
      
    } catch (error) {
      console.error('Error generating both tickets:', error);
      throw new Error('Error al generar ambos formatos de ticket');
    }
  }
}
