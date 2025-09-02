// src/features/fluvial/components/sales-point/tickets/transformers/noSeatsCompanySale.transformer.ts

import { BackendInvoiceData, BackendCompanyInvoiceData } from '../types/backend.types';
import { TicketData, TicketRepresentative, TicketCompanySummary } from '../types/ticket.types';
import { isVesselWithoutSeats } from '../utils/ticketHelpers';
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
 * Transformer para convertir datos del backend a estructura de ticket para ventas empresariales SIN ASIENTOS
 * Especializado para embarcaciones que no manejan asientos numerados con ventas de compañía (RUC)
 * Usa detección automática con isVesselWithoutSeats() para personalizar la información mostrada
 */
export class NoSeatsCompanySaleTransformer {
  
  /**
   * Transforma datos del backend al formato del ticket empresarial sin asientos
   */
  static transformSummary(data: BackendCompanyInvoiceData): TicketData & { representatives: TicketRepresentative[]; summary: TicketCompanySummary } {
    try {
      // Validar datos básicos
      this.validateRequiredData(data.invoice);
      
      // VALIDACIÓN ESPECÍFICA: Verificar que es una embarcación sin asientos
      const hasVesselWithoutSeats = isVesselWithoutSeats(data.invoice.items);
      if (!hasVesselWithoutSeats) {
        throw new Error('Los datos no corresponden a una embarcación sin asientos. Use CompanySaleTransformer en su lugar.');
      }
      
      return {
        // BLOQUE 1: CABECERA
        header: this.transformHeader(data.invoice),
        
        // BLOQUE 2: INFORMACIÓN DE LA EMPRESA (no pasajero individual)
        passenger_info: this.transformCompanyInfo(data.invoice),
        
        // BLOQUE 3: DETALLES DEL VIAJE - ESPECIALIZADO PARA SIN ASIENTOS
        trip_details: this.transformTripDetails(data.invoice),
        
        // BLOQUE 4: DESGLOSE FINANCIERO - ESPECIALIZADO PARA SIN ASIENTOS
        financial_breakdown: this.transformFinancialBreakdown(data.invoice),
        
        // BLOQUE 5: INFORMACIÓN DE PAGO
        payment_info: this.transformPaymentInfo(data.invoice),
        
        // BLOQUE 6: PIE DE PÁGINA
        footer: this.transformFooter(data.invoice),
        
        // BLOQUE 7: TOTALES SUNAT
        sunat_totals: this.transformSunatTotals(data.invoice),
        
        // BLOQUE 8: METADATOS
        metadata: this.transformMetadata(data.invoice),
        
        // BLOQUE 9: REPRESENTANTES - ESPECIALIZADO PARA SIN ASIENTOS
        representatives: this.transformRepresentatives(data),
        
        // BLOQUE 10: RESUMEN EMPRESARIAL
        summary: this.transformCompanySummary(data.invoice)
      };
      
    } catch (error) {
      console.error('Error transformando datos de empresa sin asientos:', error);
      throw new Error(`Error en transformación empresarial sin asientos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  /**
   * Validación básica de datos requeridos
   */
  private static validateRequiredData(data: BackendInvoiceData): void {
    if (!data) throw new Error('Datos de factura requeridos');
    if (!data.client) throw new Error('Datos de cliente requeridos');
    if (!data.items || data.items.length === 0) throw new Error('Items de factura requeridos');
    // Validación específica para embarcaciones sin asientos
    if (!isVesselWithoutSeats(data.items)) {
      throw new Error('Los datos no corresponden a una embarcación sin asientos');
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
  // Información de sucursal para mostrar debajo del punto de emisión
  branch_office_address: data.branch_office_address || '',
  branch_office_phone: data.branch_office_phone || '',
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
      full_name: data.client.name
    };
  }

  /**
   * BLOQUE 3: Transforma detalles del viaje - ESPECIALIZADO PARA SIN ASIENTOS
   * Similar a CompanySaleTransformer pero SIN incluir campo ASIENTO
   */
  private static transformTripDetails(data: BackendInvoiceData) {
    const item = data.items[0];
    
    return {
      title: 'DETALLES DEL VIAJE',
  // Añadir nombre y dirección del puerto para que la plantilla pueda renderizarlos como en el ticket normal
  // Preferir valores explícitos de la sucursal si vienen en el payload
  port_name: (data as any).branch_office_port_name || item.boarding_port_name || extractOriginPort(data.items),
  port_address: (data as any).branch_office_port_address || (item as any).boarding_port_address || (data.branch_office_address || ''),
      details: [
        // Orden y etiquetas ajustadas para coincidir con la plantilla 2-columnas
        { label: 'EMBARCACIÓN', value: item.vehicle_name || extractVehicleName(data.items) },
        { label: 'FECHA VIAJE', value: formatTripDate(data.trip_departure_time, data.issue_date) },
        { label: 'PUERTO', value: (data as any).branch_office_port_name || item.boarding_port_name || extractOriginPort(data.items) },
        { label: 'DIRECCIÓN PUERTO', value: (data as any).branch_office_port_address || (item as any).boarding_port_address || (data.branch_office_address || '') },
        { label: 'EMBARQUE', value: formatBoardingTime(data.boarding_time) },
        { label: 'SALIDA', value: formatTripTime(data.trip_departure_time) },
        { label: 'ORIGEN', value: item.boarding_port_name || extractOriginPort(data.items) },
        { label: 'DESTINO', value: item.disembarking_port_name || extractDestinationPort(data.items) }
        // NOTA: NO incluimos campo ASIENTO porque es una embarcación sin asientos
      ]
    };
  }

  /**
   * BLOQUE 4: Transforma desglose financiero - ESPECIALIZADO PARA SIN ASIENTOS
   * Muestra TODOS los servicios (transporte, equipaje extra, etc.) sin mencionar asientos específicos
   */
  private static transformFinancialBreakdown(data: BackendInvoiceData) {
    // CORRECCIÓN: Procesar TODOS los items, no solo el primero
    const items = data.items.map(item => {
      // ESPECIALIZACIÓN: Usar función helper que construye descripción limpia sin tramo ni asiento
      // pero conserva información adicional como "Exceso de Equipaje - detalles"
      let description = buildCleanItemDescription(item);
      
      // MEJORA: Si la descripción está vacía o es muy corta, usar product_name
      if (!description || description.toLowerCase().trim() === 'test' || description.length < 3) {
        description = item.product_name || 'Servicio';
      }
      
      // Para otros servicios (equipaje, etc.) mantener descripción original
      
      return {
        description: description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount: parseFloat(item.discount || '0'),
        total_line: parseFloat(item.total_line)
      };
    });
    
    return {
      title: 'DETALLE DE LA VENTA',
      items: items, // Ahora incluye TODOS los servicios
      // Calcular TOTAL A PAGAR preferentemente desde la suma de item.total_line (por ejemplo "141.60").
      // Si no hay items o la suma es 0, usar el valor enviado por el backend en data.total_payable
      summary: (() => {
        const totalFromItems = items.reduce((acc, it) => acc + (Number.isFinite(it.total_line) ? it.total_line : 0), 0);
        const totalToShow = totalFromItems > 0 ? totalFromItems : parseFloat(data.total_payable || '0');
        return [ { label: 'TOTAL A PAGAR', value: formatCurrency(totalToShow), is_bold: true } ];
      })()
    };
  }

  /**
   * BLOQUE 5: Transforma información de pago
   */
  private static transformPaymentInfo(data: BackendInvoiceData) {
    return {
      amount_in_words_prefix: 'SON',
      amount_in_words: data.total_in_words,
      payment_method_label: 'FORMA DE PAGO:',
      payment_method: 'EFECTIVO'
    };
  }

  /**
   * BLOQUE 6: Transforma footer
   */
  private static transformFooter(data: BackendInvoiceData) {
    // Construir la leyenda legal basada en el tipo de documento
    const docTitle = getDocumentTitle(data.document_type_code) || '';
    const titleLower = docTitle.toLowerCase();
    const docType = titleLower.includes('boleta') ? 'BOLETA' : titleLower.includes('factura') ? 'FACTURA' : (docTitle ? docTitle.toString().toUpperCase() : 'DOCUMENTO');
    const legalLines = [
      'Bienes y servicios Transferidos en la amazonía región selva para ser consumidos en la misma',
      `Representación impresa de la ${docType} DE VENTA ELECTRÓNICA, autorizado mediante la resolución N° 0340050001931 - SUNAT.`
    ];

    return {
      qr_code_base64: data.qr_code_data,
      consultation_text: 'Consulte la validez de este documento en:',
      consultation_url: 'www.sunat.gob.pe',
      legal_lines: legalLines
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
   * BLOQUE 9: Transforma representantes - ESPECIALIZADO PARA SIN ASIENTOS
   * Los representantes no tienen asientos específicos asignados
   */
  private static transformRepresentatives(data: BackendCompanyInvoiceData): TicketRepresentative[] {
    return (data.representatives || []).map(rep => this.transformRepresentative(rep));
  }

  /**
   * Transforma un representante individual - ESPECIALIZADO PARA SIN ASIENTOS
   * El seat_number será "Elección libre" para todos los representantes
   */
  private static transformRepresentative(rep: any): TicketRepresentative {
    return {
      id: rep.id,
      passenger_name: rep.passenger_name,
      passenger_doc_type: rep.passenger_doc_type,
      passenger_doc_number: rep.passenger_doc_number,
      seat_number: 'Elección libre', // ESPECIALIZACIÓN: Mostrar mensaje limpio en lugar de "Sin asientos configurados"
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
