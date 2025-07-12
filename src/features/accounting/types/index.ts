// src/features/accounting/types/index.ts

// Tipos para Notas de Crédito
export interface CreditNoteItemCreateData {
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_category_code: string;
  unit_code: string;
  price_type_code: string;
  item_description: string;
}

export interface CreditNoteCreateData {
  company_id: number;
  client_id: number;
  series: string;
  affected_document_type_code: string;
  affected_document_series_number: string;
  credit_note_type_code: string;
  reason: string;
  items: CreditNoteItemCreateData[];
}

export interface CreditNotesListParams {
  company_id: number;
  skip?: number;
  limit?: number;
  sunat_status?: string;
  issue_date?: string;
  series?: string;
}

// Tipos para Resúmenes Diarios
export interface SummaryCreateData {
  company_id: number;
  issue_date: string;
}

export interface Summary {
  id: number;
  company_id: number;
  batch_number: string;
  issue_date: string;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  created_at: string;
  updated_at: string;
}

// Tipos para Comunicaciones de Baja
export interface VoidItem {
  document_type_code: string;
  series: string;
  number: number;
  reason: string;
}

export interface VoidCreateData {
  company_id: number;
  generation_date?: string;
  items: VoidItem[];
}

export interface Void {
  id: number;
  company_id: number;
  batch_number: string;
  generation_date: string;
  sunat_status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  items: VoidItem[];
  created_at: string;
  updated_at: string;
}

// Tipos para Facturas Anulables
export interface VoidableInvoice {
  id: number;
  document_type_code: string;
  series: string;
  number: number;
  client_name: string;
  total_amount: number;
  issue_date: string;
}

// Estados de SUNAT
export type SunatStatus = 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED';

// Tipos de Documento
export type DocumentTypeCode = '01' | '03'; // 01: Factura, 03: Boleta

// Tipos de Nota de Crédito
export type CreditNoteTypeCode = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | '13';

// Códigos de Unidad de Medida
export type UnitCode = 'KGM' | 'TNE' | 'NIU' | 'PAC' | 'MTR' | 'LTR' | 'MTQ';

// Códigos de Categoría de Impuesto
export type TaxCategoryCode = '10' | '20' | '30' | '40' | 'EXO' | 'INA' | 'GRA' | 'EXP';

// Códigos de Tipo de Precio
export type PriceTypeCode = '01' | '02' | '03'; 