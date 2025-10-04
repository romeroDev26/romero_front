// src/features/accounting/types/index.ts

// Tipos para Notas de Crédito - Actualizados según documentación backend
export interface CreditNoteItemCreateData {
  product_id: number; // Según documentación del backend
  quantity: number;
  unit_code: string; // Requerido según backend - ej: "NIU"
  unit_price: number;
  price_with_tax: number; // Nuevo campo requerido según backend
  price_type_code: string; // Requerido - ej: "01"
  tax_category_code: string; // Requerido - ej: "10"
  description: string;
}

export interface CreditNoteCreateData {
  company_id: number;
  client_id: number;
  series: string; // Según backend se llama 'series', no 'credit_note_series'
  currency_code: string; // Requerido según backend - ej: "PEN"
  issue_date?: string; // Opcional - formato "YYYY-MM-DD"
  issue_time?: string; // Opcional - formato "HH:MM:SS"
  affected_document_type_code: string; // "01" o "03"
  affected_document_series_number: string; // Campo completo "F001-00000456"
  credit_note_type_code: string; // Código del catálogo 09
  reason: string;
  items: CreditNoteItemCreateData[];
}

// Tipo para anulación directa (endpoint alternativo)
export interface CreditNoteAnnulData {
  invoice_id: number;
  credit_note_series: string;
  reason: string;
}

// Tipos para Notas de Débito - Actualizados según API backend
export interface DebitNoteItemCreateData {
  product_id: number; // Según API backend
  quantity: number;
  unit_code: string; // Requerido - ej: "NIU"
  unit_price: number;
  price_with_tax: number; // Nuevo campo requerido
  price_type_code: string; // Requerido - ej: "01"
  tax_category_code: string; // Requerido - ej: "10"
}

export interface DebitNoteCreateData {
  company_id: number;
  client_id: number;
  document_type_code: string; // Siempre "08" para notas de débito
  series: string; // Según backend se llama 'series', no 'debit_note_series'
  issue_date: string; // Requerido - formato "YYYY-MM-DD"
  issue_time: string; // Requerido - formato "HH:MM:SS"
  currency_code: string; // Requerido - ej: "PEN"
  affected_document_type_code: string; // "01" o "03"
  affected_document_series_number: string; // Campo completo "F001-00000456"
  debit_note_type_code: string; // Código del catálogo 10
  reason: string;
  items: DebitNoteItemCreateData[];
}

// Respuesta del backend al crear nota de débito
export interface DebitNoteResponse {
  id: number;
  identifier: string;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  total_amount: number;
  created_at: string;
}

// Parámetros para listar notas de débito
export interface DebitNotesListParams {
  company_id: number;
  skip?: number;
  limit?: number;
  sunat_status?: string;
  issue_date?: string;
  series?: string;
}

export interface CreditNotesListParams {
  company_id: number;
  skip?: number;
  limit?: number;
  sunat_status?: string;
  issue_date?: string;
  series?: string;
}

// Respuesta del backend al crear nota de crédito (según documentación)
export interface CreditNoteResponse {
  id: number;
  company_id: number;
  client_id: number;
  document_type_code: string; // "07" para notas de crédito
  series: string;
  number: number;
  issue_date: string;
  issue_time: string;
  currency_code: string;
  affected_document_type_code: string;
  affected_document_series_number: string;
  credit_note_type_code: string;
  reason: string;
  total_payable: number;
  total_in_words: string | null;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  sunat_response_description: string | null;
  qr_code_data: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  items: {
    id: number;
    product_id: number;
    quantity: number;
    unit_code: string;
    unit_price: number;
    price_with_tax: number;
    price_type_code: string;
    tax_category_code: string;
    igv_percentage: number;
    igv_amount: number;
    subtotal: number;
    total_line: number;
    description: string;
  }[];
}

// Tipo para consultar estado SUNAT
export interface SunatStatusResponse {
  id: number;
  document_type: string;
  identifier: string;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ERROR';
  sunat_ticket?: string;
  sunat_response_description?: string;
  xml_file_path?: string;
  cdr_file_path?: string;
  pdf_file_path?: string;
}

// Tipos para Resúmenes Diarios - Actualizados según backend
export interface DailySummaryCreateData {
  company_id: number;
  summary_date: string;
  currency_code?: string;
}

export interface DailySummary {
  id: number;
  company_id: number;
  identifier: string;
  summary_date: string;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ERROR';
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  total_sales_amount: number;
  total_documents: number;
  xml_file_path?: string;
  cdr_file_path?: string;
  pdf_file_path?: string;
  created_at: string;
  updated_at: string;
}

// Respuesta al crear resumen diario
export interface DailySummaryResponse {
  id: number;
  identifier: string;
  summary_date: string;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  total_sales_amount: number;
  total_documents: number;
  created_at: string;
}

// Parámetros para listar resúmenes diarios
export interface DailySummariesListParams {
  company_id: number;
  skip?: number;
  limit?: number;
  summary_date?: string;
  sunat_status?: string;
}

// Tipos para Comunicaciones de Baja (Anulaciones) - Actualizados según backend
export interface VoidDocumentItem {
  document_type_code: string; // '01' (Factura) o '03' (Boleta)
  series: string;
  number: number;
  reason: string;
}

export interface VoidDocumentCreateData {
  company_id: number;
  generation_date?: string; // Opcional, si no se envía usa fecha actual
  items: VoidDocumentItem[];
}

export interface VoidDocument {
  id: number;
  company_id: number;
  identifier: string;
  generation_date: string;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ERROR';
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  total_items: number;
  items: VoidDocumentItem[];
  xml_file_path?: string;
  cdr_file_path?: string;
  pdf_file_path?: string;
  created_at: string;
  updated_at: string;
}

// Respuesta al crear comunicación de baja
export interface VoidDocumentResponse {
  id: number;
  identifier: string;
  generation_date: string;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  total_items: number;
  created_at: string;
}

// Parámetros para listar comunicaciones de baja
export interface VoidDocumentsListParams {
  company_id: number;
  skip?: number;
  limit?: number;
  generation_date?: string;
  sunat_status?: string;
}

// Tipos para Facturas Anulables
export interface VoidableInvoice {
  id: number;
  document_type_code: string;
  series: string;
  number: number;
  client_id: number;
  client_name: string;
  total_payable: string;
  issue_date: string;
  currency_code: string;
}

// Estados de SUNAT
export type SunatStatus = 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';

// Tipos de Documento
export type DocumentTypeCode = '01' | '03'; // 01: Factura, 03: Boleta

// Tipos de Nota de Crédito
export type CreditNoteTypeCode = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | '13';

// Códigos de Unidad de Medida
export type UnitCode = 'NIU' | 'KGM' | 'PAQ' | 'XBX' | 'TNE' | 'MTR' | 'MTQ' | 'LTR' | 'ZZ';

// Códigos de Categoría de Impuesto
export type TaxCategoryCode = '10' | '20' | '30' | '40' | 'EXO' | 'INA' | 'GRA' | 'EXP';

// Códigos de Tipo de Precio
export type PriceTypeCode = '01' | '02' | '03'; 