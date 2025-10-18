// src/features/fluvial/components/sales-point/tickets/transformers/companySale.transformer.ts

import { BackendInvoiceData, BackendCompanyInvoiceData } from '../types/backend.types';
import { TicketData, TicketRepresentative, TicketCompanySummary } from '../types/ticket.types';
import {
  getDocumentLabel,
  getDocumentTitle,
  formatEmissionDateTime,
  getEmissionPoint,
  formatCompanyPhones,
  extractOriginPort,
  extractDestinationPort,
  extractVehicleName,
  formatTripDate,
  formatTripTime,
  formatBoardingTime,
  formatCurrency,
  buildCleanItemDescription
} from '../utils/ticketHelpers';

/**
 * Transformer para convertir datos del backend a estructura de ticket para ventas empresariales (RUC)
 * Basado en NormalSaleTransformer pero adaptado para mostrar asientos múltiples y representantes
 */
export class CompanySaleTransformer {
  
  /**
   * Transforma datos del backend al formato del ticket resumen empresarial
   */
  static transformSummary(data: BackendCompanyInvoiceData): TicketData & { representatives: TicketRepresentative[]; summary: TicketCompanySummary } {
    try {
      // Validar datos básicos
      this.validateRequiredData(data.invoice);
      
      return {
        // BLOQUE 1: CABECERA
        header: this.transformHeader(data.invoice),
        
        // BLOQUE 2: INFORMACIÓN DE LA EMPRESA (no pasajero individual)
        passenger_info: this.transformCompanyInfo(data.invoice),
        
        // BLOQUE 3: DETALLES DEL VIAJE
        trip_details: this.transformTripDetails(data.invoice),
        
        // BLOQUE 4: DESGLOSE FINANCIERO (con asientos múltiples)
        financial_breakdown: this.transformFinancialBreakdown(data.invoice),
        
        // BLOQUE 5: INFORMACIÓN DE PAGO
        payment_info: this.transformPaymentInfo(data.invoice),
        
        // BLOQUE 6: PIE DE PÁGINA
        footer: this.transformFooter(data.invoice),
        
        // BLOQUE 7: TOTALES SUNAT
        sunat_totals: this.transformSunatTotals(data.invoice),
        
        // BLOQUE 8: METADATOS
        metadata: this.transformMetadata(data.invoice),
        
        // BLOQUE 9: REPRESENTANTES (usar data.representatives)
        representatives: this.transformRepresentatives(data),
        
        // BLOQUE 10: RESUMEN EMPRESARIAL
        summary: this.transformCompanySummary(data.invoice),
        
        // NUEVO: Código de moneda
        currency_code: data.invoice.currency_code || 'PEN'
      };
      
    } catch (error) {
      console.error('Error transformando datos de empresa:', error);
      throw new Error(`Error en transformación empresarial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  /**
   * Validación básica de datos requeridos
   */
  private static validateRequiredData(data: BackendInvoiceData): void {
    if (!data) throw new Error('Datos de factura requeridos');
    if (!data.client) throw new Error('Datos de cliente requeridos');
    if (!data.items || data.items.length === 0) throw new Error('Items de factura requeridos');
    // Nota: Los representatives se validan en el nivel superior (BackendCompanyInvoiceData)
  }

  /**
   * BLOQUE 1: Transforma información del header
   */
  private static transformHeader(data: BackendInvoiceData) {
    return {
      company_logo_url: data.company.logo_url || '',
      company_name: data.company.business_name,
      company_ruc: data.company.ruc,
      company_address: data.company.address,
  // Dirección y teléfono de la sucursal (branch office)
  branch_office_address: data.branch_office_address || '',
  branch_office_phone: data.branch_office_phone || '',
      company_phones: formatCompanyPhones(data.company.phone),
      emission_point: getEmissionPoint(data.branch_office_name, data.branch_office_name || ''),
      document_title: getDocumentTitle(data.document_type_code),
      document_id: `${data.series}-${String(data.number).padStart(5, '0')}`,
      emission_datetime: formatEmissionDateTime(data.issue_date, data.issue_time),
      seller_name: data.seller.full_name
    };
  }

  /**
   * BLOQUE 2: Transforma información de la empresa compradora (para ticket resumen)
   */
  private static transformCompanyInfo(data: BackendInvoiceData) {
    return {
      doc_label: getDocumentLabel(data.client.doc_type),
      doc_number: data.client.doc_number,
      name_label: data.client.doc_type === '6' ? 'RAZÓN SOCIAL' : 'EMPRESA',
  full_name: data.client.name,
  address: data.client.address_line || ''
    };
  }

  /**
   * BLOQUE 3: Transforma detalles del viaje (para ticket resumen)
   */
  private static transformTripDetails(data: BackendInvoiceData) {
    const item = data.items[0];
    
    return {
      title: 'DETALLES DEL VIAJE',
      details: [
        { label: 'ORIGEN', value: item.boarding_port_name || extractOriginPort(data.items) },
        { label: 'DESTINO', value: item.disembarking_port_name || extractDestinationPort(data.items) },
        { label: 'EMBARCACIÓN', value: item.vehicle_name || extractVehicleName(data.items) },
        { label: 'FECHA VIAJE', value: formatTripDate(data.trip_departure_time, (data as any).trip_departure_date || data.issue_date), col: 1 },
        { label: 'HORA VIAJE', value: formatTripTime(data.trip_departure_time), col: 2 },
        { label: 'EMBARQUE', value: formatBoardingTime(data.boarding_time), col: 1 },
        { label: 'RUTA', value: item.route_name || '-', col: 2 }
      ]
  ,
  // Nombre y dirección del puerto de la sucursal (para mostrar en dos columnas)
  port_name: data.branch_office_port_name || '',
  port_address: data.branch_office_port_address || ''
    };
  }

  /**
   * BLOQUE 4: Transforma desglose financiero (para ticket resumen con lista de asientos)
   */
  private static transformFinancialBreakdown(data: BackendInvoiceData) {
    // Procesar TODOS los items, no solo el primero
    const processedItems = data.items.map(item => {
      // Usar función helper que construye descripción limpia sin tramo ni asiento
      // pero conserva información adicional como "Exceso de Equipaje - detalles"
      const description = buildCleanItemDescription(item);
      
      return {
        description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount: parseFloat(item.discount || '0'),
        total_line: parseFloat(item.total_line)
      };
    });
    
    // Calcular total a pagar preferiendo la suma de total_line de los items
    const totalFromItems = processedItems.reduce((acc, it) => acc + (Number.isFinite(it.total_line) ? it.total_line : 0), 0);
    const totalToShow = totalFromItems > 0 ? totalFromItems : parseFloat(data.total_payable || '0');

    return {
      title: 'DETALLE DE LA VENTA',
      items: processedItems,
      summary: [
        { label: 'TOTAL A PAGAR', value: formatCurrency(totalToShow), is_bold: true }
      ]
    };
  }

  /**
   * BLOQUE 5: Transforma información de pago
   */
  private static transformPaymentInfo(data: BackendInvoiceData) {
    return {
      amount_in_words_prefix: 'SON',
      amount_in_words: data.total_in_words,
      payment_method_label: 'FORMA DE PAGO',
      payment_method: 'EFECTIVO'
    };
  }

  /**
   * BLOQUE 6: Transforma footer
   */
  private static transformFooter(data: BackendInvoiceData) {
    return {
      qr_code_base64: data.qr_code_data,
      consultation_text: 'Consulte la validez de este documento en:',
      consultation_url: 'www.sunat.gob.pe'
    };
  }

  /**
   * BLOQUE 7: Transforma totales SUNAT
   */
  private static transformSunatTotals(data: BackendInvoiceData) {
    return {
      total_taxable: data.total_taxable,
      total_exonerated: data.total_exonerated,
      total_unaffected: data.total_unaffected,
      total_free: data.total_free,
      total_global_discount: data.total_global_discount || '0.00',
      total_igv: data.total_igv,
      total_isc: data.total_isc,
      total_other_taxes: data.total_other_taxes
    };
  }

  /**
   * BLOQUE 8: Transforma metadatos
   */
  private static transformMetadata(data: BackendInvoiceData) {
    return {
      invoice_id: data.id,
      company_id: data.company_id,
      client_id: data.client_id
    };
  }

  /**
   * BLOQUE 9: Transforma representantes
   */
  private static transformRepresentatives(data: BackendCompanyInvoiceData): TicketRepresentative[] {
    return (data.representatives || []).map(rep => this.transformRepresentative(rep));
  }

  /**
   * Transforma un representante individual
   */
  private static transformRepresentative(rep: any): TicketRepresentative {
    return {
      id: rep.id,
      passenger_name: rep.passenger_name,
      passenger_doc_type: rep.passenger_doc_type,
      passenger_doc_number: rep.passenger_doc_number,
      seat_number: rep.seat_number,
      boarding_stop_id: rep.boarding_stop_id,
      disembarking_stop_id: rep.disembarking_stop_id,
      special_notes: rep.special_notes
    };
  }

  /**
   * BLOQUE 10: Transforma resumen empresarial
   */
  private static transformCompanySummary(data: BackendInvoiceData): TicketCompanySummary {
    return data.summary || {
      invoice_id: data.id,
      max_allowed: data.representatives?.length || 0,
      current_count: data.representatives?.length || 0,
      remaining: 0,
      can_add_more: false,
      total_capacity: data.representatives?.length || 0,
      used_capacity: data.representatives?.length || 0,
      remaining_capacity: 0,
      is_complete: true
    };
  }
}
