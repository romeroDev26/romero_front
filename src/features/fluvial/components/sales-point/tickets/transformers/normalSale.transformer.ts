// src/features/fluvial/components/sales-point/tickets/transformers/normalSale.transformer.ts

import { BackendInvoiceData } from '../types/backend.types';
import { TicketData } from '../types/ticket.types';
import {
  getDocumentLabel,
  getDocumentTitle,
  formatEmissionDateTime,
  getEmissionPoint,
  formatCompanyPhones,
  extractOriginPort,
  extractDestinationPort,
  extractVehicleName,
  extractMainSeatNumber,
  formatTripDate,
  formatTripTime,
  formatBoardingTime,
  formatCurrency
} from '../utils/ticketHelpers';

/**
 * Transformer para convertir datos del backend a estructura de ticket para ventas normales
 * Actualizado para la nueva estructura propuesta del JSON
 */
export class NormalSaleTransformer {
  
  /**
   * Transforma datos del backend al formato del ticket
   */
  static transform(backendData: BackendInvoiceData): TicketData {
    try {
      // Validar datos básicos
      this.validateRequiredData(backendData);
      
      return {
        // BLOQUE 1: CABECERA
        header: this.transformHeader(backendData),
        
        // BLOQUE 2: INFORMACIÓN DEL PASAJERO
        passenger_info: this.transformPassengerInfo(backendData),
        
        // BLOQUE 3: DETALLES DEL VIAJE
        trip_details: this.transformTripDetails(backendData),
        
        // BLOQUE 4: DESGLOSE FINANCIERO
        financial_breakdown: this.transformFinancialBreakdown(backendData),
        
        // BLOQUE 5: INFORMACIÓN DE PAGO
        payment_info: this.transformPaymentInfo(backendData),
        
        // BLOQUE 6: PIE DE PÁGINA
        footer: this.transformFooter(backendData),
        
        // BLOQUE 7: TOTALES SUNAT
        sunat_totals: this.transformSunatTotals(backendData),
        
        // BLOQUE 8: METADATOS
        metadata: this.transformMetadata(backendData)
      };
      
    } catch (error) {
      console.error('Error transformando datos:', error);
      throw new Error(`Error en transformación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
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
      company_phones: formatCompanyPhones(data.company.phone),
      emission_point: getEmissionPoint(data.branch_office_name, data.branch_office_name || ''),
      branch_office_address: data.branch_office_address || '',
      branch_office_phone: data.branch_office_phone || '',
      document_title: getDocumentTitle(data.document_type_code),
      document_id: `${data.series}-${String(data.number).padStart(5, '0')}`,
      emission_datetime: formatEmissionDateTime(data.issue_date, data.issue_time),
      seller_name: data.seller.full_name
    };
  }
  
  /**
   * BLOQUE 2: Transforma información del pasajero
   */
  private static transformPassengerInfo(data: BackendInvoiceData) {
    return {
      doc_label: getDocumentLabel(data.client.doc_type),
      doc_number: data.client.doc_number,
      name_label: 'PASAJERO',
      full_name: data.client.name
    };
  }
  
  /**
   * BLOQUE 3: Transforma detalles del viaje
   */
  private static transformTripDetails(data: BackendInvoiceData) {
    // Agrupar en dos columnas: columna1 (EMBARCACIÓN, ORIGEN, DESTINO), columna2 (FECHA VIAJE, HORA VIAJE, EMBARQUE)
    return {
      title: 'DATOS DEL VIAJE',
      details: [
        { label: 'EMBARCACIÓN', value: extractVehicleName(data.items) },
        { label: 'ORIGEN', value: extractOriginPort(data.items) },
        { label: 'DESTINO', value: extractDestinationPort(data.items) },
        { label: 'FECHA VIAJE', value: formatTripDate(data.trip_departure_time), col: 2 },
        { label: 'HORA VIAJE', value: formatTripTime(data.trip_departure_time), col: 2 },
        { label: 'EMBARQUE', value: formatBoardingTime(data.boarding_time), col: 2 },
        { label: 'ASIENTO', value: extractMainSeatNumber(data.items) }
      ],
      // Campos nuevos: puerto asociado a la sucursal (puede venir vacío)
      port_name: (data as any).branch_office_port_name || '',
      port_address: (data as any).branch_office_port_address || ''
    };
  }
  
  /**
   * BLOQUE 4: Transforma desglose financiero
   */
  private static transformFinancialBreakdown(data: BackendInvoiceData) {
    // Procesar items
    const items = data.items.map(item => ({
      description: item.product_name,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      discount: parseFloat(item.discount),
      total_line: parseFloat(item.total_line)
    }));
    
    // Calcular totales: preferimos la suma de item.total_line (ej. "total_line": "141.60")
    // Si no hay items o la suma da 0, se hace fallback a data.total_payable
    const subtotalBackend = parseFloat(data.total_taxable) + parseFloat(data.total_exonerated) + parseFloat(data.total_unaffected);
    const totalDiscounts = parseFloat(data.total_global_discount) || 0;

    const totalFromItems = items.reduce((acc, it) => acc + (Number.isFinite(it.total_line) ? it.total_line : 0), 0);
    const totalToShow = totalFromItems > 0 ? totalFromItems : parseFloat(data.total_payable || '0');

    const summary = [
      { label: 'SUBTOTAL', value: formatCurrency(subtotalBackend) },
      { label: 'DESCUENTOS', value: totalDiscounts > 0 ? `- ${formatCurrency(totalDiscounts)}` : formatCurrency(0) },
      { label: 'TOTAL A PAGAR', value: formatCurrency(totalToShow), is_bold: true }
    ];
    
    return {
      title: 'DETALLE DE LA VENTA',
      items,
      summary
    };
  }
  
  /**
   * BLOQUE 5: Transforma información de pago
   */
  private static transformPaymentInfo(data: BackendInvoiceData) {
    return {
      amount_in_words_prefix: 'SON:',
      amount_in_words: data.total_in_words,
      payment_method_label: 'FORMA DE PAGO:',
      payment_method: 'Contado' // Por defecto, el backend podría enviar esto
    };
  }
  
  /**
   * BLOQUE 6: Transforma footer
   */
  private static transformFooter(data: BackendInvoiceData) {
    return {
      qr_code_base64: data.qr_code_data,
      consultation_text: 'Para consultar el comprobante ingrese a',
      consultation_url: 'https://cpe.sunat.gob.pe/consultacpe'
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
      total_global_discount: data.total_global_discount,
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
   * Valida que los datos requeridos estén presentes
   */
  private static validateRequiredData(data: BackendInvoiceData): void {
    const errors: string[] = [];
    
    if (!data.client) {
      errors.push('Datos del cliente requeridos');
    } else {
      if (!data.client.doc_number || !data.client.doc_type) {
        errors.push('Documento del cliente requerido');
      }
      if (!data.client.name) {
        errors.push('Nombre del cliente requerido');
      }
    }
    
    if (!data.company) {
      errors.push('Datos de la empresa requeridos');
    } else {
      if (!data.company.business_name || !data.company.ruc) {
        errors.push('Datos básicos de empresa requeridos');
      }
    }
    
    if (!data.seller) {
      errors.push('Datos del vendedor requeridos');
    }
    
    if (!data.items || data.items.length === 0) {
      errors.push('Items de venta requeridos');
    } else {
      // Validar que al menos un item tenga información de transporte
      const hasMainService = data.items.some(item => item.trip_seat_id);
      if (!hasMainService) {
        errors.push('Debe existir al menos un item con información de transporte');
      }
    }
    
    if (!data.total_payable || parseFloat(data.total_payable) <= 0) {
      errors.push('Total a pagar debe ser mayor a cero');
    }
    
    if (errors.length > 0) {
      throw new Error(`Datos inválidos: ${errors.join(', ')}`);
    }
  }
}
