// src/features/fluvial/components/sales-point/tickets/types/ticket.types.ts

/**
 * Tipos que corresponden al JSON propuesto para la generación de tickets
 * Estructura optimizada y limpia para renderizar tickets según el nuevo diseño
 */

export interface TicketData {
  header: TicketHeader;
  passenger_info: TicketPassengerInfo;
  trip_details: TicketTripDetails;
  financial_breakdown: TicketFinancialBreakdown;
  payment_info: TicketPaymentInfo;
  footer: TicketFooter;
  sunat_totals: TicketSunatTotals;
  metadata: TicketMetadata;
}

// BLOQUE 1: CABECERA - Información general del documento y la empresa
export interface TicketHeader {
  company_logo_url: string;
  company_name: string;
  company_ruc: string;
  company_address: string;
  company_phones: string[];
  emission_point: string;
  document_title: string;
  document_id: string;
  emission_datetime: string;
  seller_name: string;
}

// BLOQUE 2: INFORMACIÓN DEL PASAJERO - Datos específicos del cliente
export interface TicketPassengerInfo {
  doc_label: string;
  doc_number: string;
  name_label: string;
  full_name: string;
}

// BLOQUE 3: DETALLES LOGÍSTICOS DEL VIAJE - Extraído del ítem principal
export interface TicketTripDetails {
  title: string;
  details: TicketTripDetail[];
}

export interface TicketTripDetail {
  label: string;
  value: string;
}

// BLOQUE 4: DESGLOSE FINANCIERO - Transparencia total para el cliente
export interface TicketFinancialBreakdown {
  title: string;
  items: TicketFinancialItem[];
  summary: TicketSummaryItem[];
}

export interface TicketFinancialItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_line: number;
}

export interface TicketSummaryItem {
  label: string;
  value: string;
  is_bold?: boolean;
}

// BLOQUE 5: INFORMACIÓN DE PAGO
export interface TicketPaymentInfo {
  amount_in_words_prefix: string;
  amount_in_words: string;
  payment_method_label: string;
  payment_method: string;
}

// BLOQUE 6: PIE DE PÁGINA
export interface TicketFooter {
  qr_code_base64: string;
  consultation_text: string;
  consultation_url: string;
}

// BLOQUE 7: TOTALES PARA SUNAT (La "verdad contable" para uso interno)
export interface TicketSunatTotals {
  total_taxable: string;
  total_exonerated: string;
  total_unaffected: string;
  total_free: string;
  total_global_discount: string;
  total_igv: string;
  total_isc: string;
  total_other_taxes: string;
}

// BLOQUE 8: METADATOS - IDs y datos de sistema no visibles
export interface TicketMetadata {
  invoice_id: number;
  company_id: number;
  client_id: number;
}

// Tipos auxiliares para validaciones
export interface TicketValidationResult {
  isValid: boolean;
  errors: string[];
}
