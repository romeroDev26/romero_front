/**
 * Transformador de tickets para ventas de embarcaciones SIN ASIENTOS
 * 
 * Este transformador está especializado para embarcaciones que no manejan 
 * asientos numerados (como lancha colectiva), mostrando "Elección libre" 
 * en lugar de números de asiento específicos.
 * 
 * Detecta automáticamente embarcaciones sin asientos basándose en:
 * - Categoría del servicio "OTROS" 
 * - Respuesta 204 del backend al consultar mapa de asientos
 */

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
  isVesselWithoutSeats,
  formatTripDate,
  formatTripTime,
  formatBoardingTime,
  formatCurrency
} from '../utils/ticketHelpers';

export class NoSeatsSaleTransformer {
  /**
   * Transforma datos del backend a formato de ticket para embarcaciones SIN ASIENTOS
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
        
        // BLOQUE 3: DETALLES DEL VIAJE - ESPECIALIZADO PARA SIN ASIENTOS
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
      console.error('Error transformando datos para embarcación sin asientos:', error);
      throw new Error(`Error en transformación de embarcación sin asientos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Validación de datos requeridos
   */
  private static validateRequiredData(data: BackendInvoiceData) {
    if (!data.company?.business_name) {
      throw new Error('Falta información de la empresa');
    }
    if (!data.client?.name) {
      throw new Error('Falta información del cliente');
    }
    if (!data.items?.length) {
      throw new Error('No hay items en la factura');
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
  // Datos de sucursal para que el template los muestre (address y phone)
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
   * BLOQUE 3: Transforma detalles del viaje - ESPECIALIZADO PARA SIN ASIENTOS
   */
  private static transformTripDetails(data: BackendInvoiceData) {
    // Para embarcaciones sin asientos, mostrar "Elección libre" en lugar del número de asiento
    const seatInfo = isVesselWithoutSeats(data.items) ? 'Elección libre' : extractMainSeatNumber(data.items);
    
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
        { label: 'ASIENTO', value: seatInfo }  // Esta es la personalización principal para sin asientos
      ]
    };
  }

  /**
   * BLOQUE 4: Transforma desglose financiero
   */
  private static transformFinancialBreakdown(data: BackendInvoiceData) {
    // Procesar items
    const items = data.items.map(item => {
      // Tomar descripción enviada por backend o el nombre del producto
      let description = item.item_description || item.product_name || 'Servicio';

      // Eliminar patrones no deseados para embarcaciones sin asientos:
      // - "Tramo: Origen - Destino." (y variantes)
      // - "Elección libre de ubicación" o "Elección libre"
      description = description.replace(/Tramo:\s*[^.]+\.?/gi, '');
      description = description.replace(/Elecci[oó]n\s*libre(\s*de\s*ubicaci[oó]n)?/gi, '');

      // Limpiar espacios y puntuación sobrante
      description = description.replace(/[\-–—]\s*$/g, '');
      description = description.replace(/\s{2,}/g, ' ').trim();

      return {
        description: description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        discount: parseFloat(item.discount || '0'),
        total_line: parseFloat(item.total_line)
      };
    });
    // Calcular totales tomando en cuenta el total_line de cada item (ej: "total_line": "141.60")
    // Si por alguna razón no hubiera items, fallback a los totales enviados por el backend
    const subtotalBackend = parseFloat(data.total_taxable) + parseFloat(data.total_exonerated) + parseFloat(data.total_unaffected);
    const totalDiscounts = parseFloat(data.total_global_discount) || 0;

    // Sumar total_line de los items para obtener el TOTAL A PAGAR preferido
    const totalFromItems = items.reduce((acc, it) => acc + (Number.isFinite(it.total_line) ? it.total_line : 0), 0);
    const totalToShow = totalFromItems > 0 ? totalFromItems : parseFloat(data.total_payable || '0');

    // El resumen mostrará los valores formateados (formatCurrency)
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
   * BLOQUE 6: Transforma pie de página
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
}
