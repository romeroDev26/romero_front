// src/features/fluvial/components/sales-point/tickets/TicketGenerator.ts

import type { BackendInvoiceData } from './types/backend.types';
import { NormalTicketTemplate } from './templates/normalTicket.template';
import { NoSeatsTicketTemplate } from './templates/noSeatsTicket.template';
import { CompanyTicketTemplate } from './templates/companyTicket.template';
import { CargoTicketTemplate } from './templates/cargoTicket.template';
import { NormalSaleTransformer } from './transformers/normalSale.transformer';
import { NoSeatsSaleTransformer } from './transformers/noSeatsSale.transformer';
import { CompanySaleTransformer } from './transformers/companySale.transformer';
import { CargoSaleTransformer } from './transformers/cargoSale.transformer';
import { isVesselWithoutSeats, isCargoInvoice } from './utils/ticketHelpers';

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
}
