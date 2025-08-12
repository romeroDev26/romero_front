// src/features/quotations/types/index.ts

// Estados de cotización según la API
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

// Tipo para crear item de cotización (según API)
export interface QuotationItemCreate {
  product_id: number;
  quantity: number;
  trip_id?: number;
  boarding_trip_stop_id?: number;
  disembarking_trip_stop_id?: number;
  item_description: string;
  unit_code: string; // "NIU", "KGM", etc.
  unit_price: number;
  price_type_code: string; // "01", "02", "03"
  discount: number;
  tax_category_code: string; // "10", "20", etc.
  recipient_name?: string;
  recipient_doc_type?: string;
  recipient_doc_number?: string;
  recipient_phone?: string;
}

// Tipo para crear cotización (según API)
export interface QuotationCreate {
  client_id: number;
  document_type_code: string; // "COT" según la API
  series: string; // "COT1", "COT2", etc.
  issue_date: string; // YYYY-MM-DD
  issue_time: string; // HH:MM:SS.sssZ
  valid_until: string; // YYYY-MM-DD
  operation_type_code: string; // "0101", "0200"
  currency_code: string; // "PEN", "USD"
  exchange_rate: number;
  payment_terms: string;
  payment_method_code: string; // 3 chars según API
  notes: string;
  internal_notes: string;
  items: QuotationItemCreate[];
}

// Item de cotización completo (respuesta del backend según API)
export interface QuotationItem {
  product_id: number;
  quantity: number;
  trip_id?: number;
  boarding_trip_stop_id?: number;
  disembarking_trip_stop_id?: number;
  item_description: string;
  unit_code: string;
  unit_price: number;
  price_type_code: string;
  discount: number;
  tax_category_code: string;
  recipient_name?: string;
  recipient_doc_type?: string;
  recipient_doc_number?: string;
  recipient_phone?: string;
}

// Cliente según estructura de la API
export interface QuotationClient {
  id: number;
  doc_type: string;
  doc_number: string;
  name: string;
  address_line: string;
  ubigeo: string;
  department: string;
  province: string;
  district: string;
  country_code: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Empresa según estructura de la API
export interface QuotationCompany {
  id: number;
  ruc: string;
  business_name: string;
  trade_name: string;
  address: string;
  ubigeo: string;
  phone: string;
  email: string;
  logo_url: string;
  sunat_username: string;
  certificate_path: string;
  beta_mode: boolean;
  detraccion_account: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Vendedor según estructura de la API
export interface QuotationSeller {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role_id: number;
  default_branch_office_id: number;
  current_city_id: number;
  created_at: string;
  updated_at: string;
  role_name: string;
}

// Cotización completa (respuesta del backend según API)
export interface Quotation {
  // Campos básicos
  id: number;
  company_id: number;
  client_id: number;
  number: number;
  document_type_code: string;
  series: string;
  issue_date: string;
  issue_time: string;
  valid_until: string;
  
  // Operación
  operation_type_code: string;
  currency_code: string;
  exchange_rate: string; // API devuelve como string
  payment_terms: string;
  payment_method_code: string;
  
  // Notas
  notes: string;
  internal_notes: string;
  
  // Metadatos del sistema
  ubl_version: string;
  status: QuotationStatus;
  created_by: string;
  
  // Totales calculados (readonly, como string en la API)
  total_taxable: string;
  total_exonerated: string;
  total_unaffected: string;
  total_free: string;
  total_discount: string;
  total_igv: string;
  total_isc: string;
  total_other_taxes: string;
  total_payable: string;
  total_in_words: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relaciones (incluidas en GET detallado)
  items: QuotationItem[];
  client: QuotationClient;
  company: QuotationCompany;
  seller: QuotationSeller;
  branch_office_name: string;
  branch_office_address: string;
  branch_office_phone: string;
  pdf_file_path?: string;
}

// Parámetros para listar cotizaciones (según API)
export interface QuotationsListParams {
  skip?: number;
  limit?: number;
  series?: string;
  number?: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  client_search?: string;
  status?: QuotationStatus;
}

// Actualización de estado de cotización (según API)
export interface QuotationStatusUpdate {
  status: QuotationStatus;
  notes?: string;
}

// Respuesta de resumen de cotizaciones (según API)
export interface QuotationsSummary {
  total_quotations: number;
  draft_quotations: number;
  sent_quotations: number;
  accepted_quotations: number;
  rejected_quotations: number;
  expired_quotations: number;
  converted_quotations: number;
  total_amount: string; // API devuelve como string
  conversion_rate: number;
}

// Datos para convertir cotización a factura (según API)
export interface ConvertToInvoiceData {
  quotation_id: number;
  invoice_series: string;
  invoice_issue_date: string;
  payment_method_code: string;
  notes: string;
}

// Códigos de tipo de operación
export type OperationTypeCode = '0101' | '0200';

// Códigos de método de pago
export type PaymentMethodCode = '001' | '002' | '003' | '004' | '005';

// Códigos de categoría de impuesto
export type TaxCategoryCode = '10' | '20' | '30' | '40';

// Códigos de unidad de medida
export type UnitCode = 'NIU' | 'KGM' | 'MTR' | 'LTR' | 'PAQ';

// Códigos de tipo de precio
export type PriceTypeCode = '01' | '02' | '03';
