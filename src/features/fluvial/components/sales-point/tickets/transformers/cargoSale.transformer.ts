// src/features/fluvial/components/sales-point/tickets/transformers/cargoSale.transformer.ts

import { BackendInvoiceData, BackendInvoiceItem } from '../types/backend.types';
import { TicketData } from '../types/ticket.types';

/**
 * Transformer para convertir datos del backend a estructura de ticket para ENCOMIENDAS/CARGO
 * Especializado para tickets de servicios de envío de encomiendas y carga
 */
export class CargoSaleTransformer {
  
  /**
   * Transforma los datos de factura de encomienda del backend al formato de ticket
   */
  static transform(backendData: BackendInvoiceData): TicketData {
    this.validateRequiredData(backendData);
    
    return {
      header: this.transformHeader(backendData),
      passenger_info: this.transformSenderInfo(backendData),
      trip_details: this.transformShipmentDetails(backendData),
      financial_breakdown: this.transformFinancialBreakdown(backendData),
      payment_info: this.transformPaymentInfo(backendData),
      footer: this.transformFooter(backendData),
      sunat_totals: this.transformSunatTotals(backendData),
      metadata: this.transformMetadata(backendData)
    };
  }

  /**
   * BLOQUE 1: Transforma datos del header de la empresa
   */
  private static transformHeader(data: BackendInvoiceData) {
    const documentTypeMap: { [key: string]: string } = {
      '01': 'FACTURA ELECTRÓNICA',
      '03': 'BOLETA DE VENTA ELECTRÓNICA',
      '07': 'NOTA DE CRÉDITO ELECTRÓNICA',
      '08': 'NOTA DE DÉBITO ELECTRÓNICA'
    };

    return {
      company_logo_url: data.company?.logo_url || '',
      company_name: data.company?.business_name || 'Nombre de Empresa',
      company_ruc: data.company?.ruc || 'RUC no disponible',
      company_address: data.company?.address || 'Dirección no disponible',
      company_phones: data.company?.phone ? [data.company.phone] : [],
      emission_point: data.branch_office_name || 'Punto de Venta',
      branch_office_address: data.branch_office_address || '',
      branch_office_phone: data.branch_office_phone || '',
      document_title: documentTypeMap[data.document_type_code] || 'COMPROBANTE ELECTRÓNICO',
      document_id: `${data.series}-${String(data.number).padStart(8, '0')}`,
      emission_datetime: `${data.issue_date} ${data.issue_time}`,
      seller_name: data.seller?.full_name || 'Vendedor'
    };
  }

  /**
   * BLOQUE 2: Transforma información del remitente (cliente)
   */
  private static transformSenderInfo(data: BackendInvoiceData) {
    const docTypeMap: { [key: string]: string } = {
      '1': 'DNI',
      '6': 'RUC',
      '4': 'CE',
      '7': 'PASAPORTE',
      '0': 'DOC. TRIB. NO. DOM.'
    };

    return {
      doc_label: docTypeMap[data.client?.doc_type || '1'] || 'DOC',
      doc_number: data.client?.doc_number || 'No disponible',
      name_label: 'REMITENTE',
      full_name: data.client?.name || 'Cliente no identificado'
    };
  }

  /**
   * BLOQUE 3: Transforma detalles del envío/shipment
   */
  private static transformShipmentDetails(data: BackendInvoiceData) {
    const details = [];

    // Obtener información del primer item (asumiendo que todos los items tienen la misma ruta)
    const firstItem = data.items?.[0];
    
    if (firstItem) {
      details.push(
        { label: 'Embarcación', value: firstItem.vehicle_name || 'No especificada' },
        { label: 'Origen', value: firstItem.boarding_port_name || 'No especificado' },
        { label: 'Destino', value: firstItem.disembarking_port_name || 'No especificado' }
      );

      // Agregar información del destinatario si está disponible
      if (firstItem.recipient_name) {
        details.push(
          { label: 'Destinatario', value: firstItem.recipient_name },
          { label: 'Doc. Destinatario', value: `${firstItem.recipient_doc_type === '1' ? 'DNI' : 'DOC'}: ${firstItem.recipient_doc_number}` }
        );
        
        if (firstItem.recipient_phone) {
          details.push({ label: 'Tel. Destinatario', value: firstItem.recipient_phone });
        }
      }
    }

    // No agregar ruta ni horarios específicos para tickets de encomienda aquí

    return {
      title: 'DETALLES DEL ENVÍO',
      details: details
    };
  }

  /**
   * BLOQUE 4: Transforma el desglose financiero específico para encomiendas
   */
  private static transformFinancialBreakdown(data: BackendInvoiceData) {
    const items = data.items?.map(item => ({
      description: this.buildCargoItemDescription(item),
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      discount: parseFloat(item.discount || '0'),
      total_line: parseFloat(item.total_line)
    })) || [];

    // Crear resumen con totales
    const summary = [
      { label: 'SUBTOTAL', value: data.total_exonerated || data.total_taxable || '0.00' },
    ];

    if (parseFloat(data.total_igv) > 0) {
      summary.push({ label: 'IGV (18%)', value: data.total_igv });
    }

    if (parseFloat(data.total_global_discount || '0') > 0) {
      summary.push({ label: 'DESCUENTO', value: data.total_global_discount || '0.00' });
    }

    summary.push({ 
      label: 'TOTAL A PAGAR', 
      value: `S/ ${data.total_payable}`
    });

    return {
      title: 'DETALLE DE ENCOMIENDAS',
      items: items,
      summary: summary
    };
  }

  /**
   * Construye la descripción detallada del item de encomienda
   */
  private static buildCargoItemDescription(item: BackendInvoiceItem): string {
    let description = item.item_description || 'Servicio de Envío';
    
    // Agregar unidad SUNAT si está disponible
    const unitMap: { [key: string]: string } = {
      'PAQ': 'paquete(s)',
      'XBX': 'caja(s)',
      'KGM': 'kg',
      'TNE': 'tonelada(s)',
      'MTR': 'metro(s)',
      'LTR': 'litro(s)',
      'NIU': 'unidad(es)', // Para encomiendas físicas
      'ZZ': 'servicio(s)'   // Para servicios
    };

    const unitLabel = unitMap[item.unit_code] || item.unit_code;
    if (unitLabel) {
      description += ` (${unitLabel})`;
    }

    // NO agregar información del destinatario en la descripción
    // Ya se muestra en la sección dedicada del destinatario

    return description;
  }

  /**
   * BLOQUE 5: Transforma información de pago
   */
  private static transformPaymentInfo(data: BackendInvoiceData) {
    return {
      amount_in_words_prefix: 'SON:',
      amount_in_words: data.total_in_words || 'MONTO EN PALABRAS NO DISPONIBLE',
      payment_method_label: 'FORMA DE PAGO:',
      payment_method: data.payment_terms_description || 'CONTADO',
      payment_detail_message: data.payment_detail_message || undefined
    };
  }

  /**
   * BLOQUE 6: Transforma datos del footer
   */
  private static transformFooter(data: BackendInvoiceData) {
    return {
      qr_code_base64: data.qr_code_data || '',
      consultation_text: 'Consulte su comprobante en:',
      consultation_url: 'sunat.gob.pe'
    };
  }

  /**
   * BLOQUE 7: Transforma totales SUNAT (mantiene formato original)
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
   * Valida que los datos requeridos estén presentes
   */
  private static validateRequiredData(data: BackendInvoiceData): void {
    const errors: string[] = [];

    if (!data.id) errors.push('ID de factura requerido');
    if (!data.series) errors.push('Serie de documento requerida');
    if (!data.number) errors.push('Número de documento requerido');
    if (!data.total_payable) errors.push('Total a pagar requerido');
    if (!data.client) errors.push('Información del cliente requerida');
    if (!data.company) errors.push('Información de la empresa requerida');
    if (!data.items || data.items.length === 0) errors.push('Items de encomienda requeridos');

    if (errors.length > 0) {
      throw new Error(`Datos de encomienda inválidos: ${errors.join(', ')}`);
    }

    // Validar que sea una factura de encomiendas
    const hasCargoItems = data.items.some(item => 
      item.item_description?.toLowerCase().includes('encomienda') || 
      item.recipient_name !== null
    );

    if (!hasCargoItems) {
      throw new Error('Los datos no corresponden a una factura de encomiendas');
    }
  }
}
