// src/features/fluvial/components/sales-point/tickets/types/backend.types.ts

/**
 * Tipos que corresponden a la estructura que nos llega del backend
 * Actualizado con datos reales del JSON de venta normal
 */

export interface BackendInvoiceData {
  // Datos principales del documento
  id: number;
  client_id: number;
  company_id: number;
  document_type_code: string;
  series: string;
  number: number;
  issue_date: string;
  issue_time: string;
  operation_type_code: string;
  currency_code: string;
  
  // Campos adicionales del documento
  ubl_version: string;
  created_by: string;
  exchange_rate: string | null;
  payment_terms_description: string | null;
  payment_detail_message: string | null;
  due_date: string | null;
  payment_installments: string | null;
  detraccion_code: string | null;
  detraccion_percentage: string | null;
  related_documents: string | null;
  notes: string | null;
  
  // Totales financieros
  total_taxable: string;
  total_exonerated: string;
  total_unaffected: string;
  total_free: string;
  total_global_discount: string;
  total_igv: string;
  total_isc: string;
  total_other_taxes: string;
  total_payable: string;
  total_in_words: string;
  detraccion_amount: string | null;
  
  // Estado SUNAT
  sunat_status: string;
  sunat_ticket: string | null;
  sunat_response_code: string | null;
  sunat_response_description: string | null;
  sunat_observations: string | null;
  
  // Archivos generados
  xml_file_path: string | null;
  signed_xml_file_path: string | null;
  zip_file_path: string | null;
  cdr_file_path: string | null;
  pdf_file_path: string | null;
  pdf_a4_file_path: string | null;
  pdf_ticket_file_path: string | null;
  
  // Items del documento
  items: BackendInvoiceItem[];
  
  // Entidades relacionadas
  client: BackendClient;
  company: BackendCompany;
  seller: BackendSeller;
  
  // Datos específicos de transporte fluvial
  boarding_time: string;
  trip_departure_time: string;
  
  // Datos de sucursal
  branch_office_name: string | null;
  branch_office_address: string | null;
  branch_office_phone: string | null;
  branch_office_port_name?: string | null; // nuevo: nombre del puerto de la sucursal
  branch_office_port_address?: string | null; // nuevo: dirección del puerto de la sucursal

  // QR Code data
  qr_code_data: string;
  
  // Metadatos
  created_at: string;
  updated_at: string;
  
  // Solo para ventas con RUC/empresa
  representatives?: any[]; // Lista de representantes (pasajeros)
  summary?: any; // Resumen de la venta de empresa
}

/**
 * Tipo específico para datos de venta empresarial
 * Esta es la estructura que realmente devuelve el backend para ventas con RUC
 */
export interface BackendCompanyInvoiceData {
  invoice: BackendInvoiceData; // La factura principal
  representatives: any[]; // Lista de representantes
  summary: any; // Resumen de la venta
}

export interface BackendInvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  item_order: number;
  
  // Datos del producto/servicio
  product_internal_code: string;
  product_name: string;
  item_description: string;
  
  // Cantidades y precios
  quantity: string;
  unit_code: string;
  unit_price: string;
  price_type_code: string;
  discount: string;
  price_with_tax: string;
  subtotal: string;
  total_line: string;
  
  // Impuestos
  tax_category_code: string;
  igv_percentage: string;
  igv_amount: string;
  isc_amount: string | null;
  other_tax_amount: string | null;
  
  // Datos específicos de transporte fluvial ¡NUEVOS!
  trip_id: number;
  trip_seat_id: number | null;
  boarding_trip_stop_id: number;
  disembarking_trip_stop_id: number;
  seat_number: string | null;
  route_name: string;
  vehicle_name: string;
  boarding_port_name: string; // ¡NUEVO!
  disembarking_port_name: string; // ¡NUEVO!
  
  // Datos del destinatario (si aplica)
  recipient_name: string | null;
  recipient_doc_type: string | null;
  recipient_doc_number: string | null;
  recipient_phone: string | null;
}

export interface BackendClient {
  id: number;
  doc_type: string;
  doc_number: string;
  name: string;
  address_line: string;
  ubigeo: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  country_code: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendCompany {
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

export interface BackendSeller {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role_id: number;
  role_name: string;
  default_branch_office_id: number | null;
  current_city_id: number | null;
  created_at: string;
  updated_at: string;
}
