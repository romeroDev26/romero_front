// Tipos para authentication
export interface User {
  id: string;
  email: string;
  full_name: string;
  role_id: number;
  role?: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

// Tipos para clientes
export interface Client {
  id: number;
  doc_type: string;
  doc_number: string;
  name: string;
  address?: string;
  ubigeo?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para productos/servicios
export interface ProductService {
  id: number;
  internal_code?: string;
  name: string;
  description?: string;
  item_type: 'PRODUCT' | 'SERVICE';
  unit_code: string;
  purchase_price?: number;
  sale_price: number;
  currency_code: string;
  tax_category_code: string;
  unspcs_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para proveedores
export interface Supplier {
  id: number;
  doc_type: string;
  doc_number: string;
  name: string;
  address?: string;
  ubigeo?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para facturas
export interface Invoice {
  id: number;
  company_id: number;
  client_id: number;
  client?: Client;
  sales_order_id?: number;
  document_type_code: string;
  series: string;
  number: number;
  issue_date: string;
  issue_time?: string;
  due_date?: string;
  operation_type_code: string;
  currency_code: string;
  exchange_rate?: number;
  total_taxable: number;
  total_exonerated: number;
  total_unaffected: number;
  total_free: number;
  total_discount: number;
  total_igv: number;
  total_isc: number;
  total_other_taxes: number;
  total_payable: number;
  total_in_words?: string;
  sunat_status: string;
  sunat_ticket?: string;
  sunat_response_code?: string;
  sunat_response_description?: string;
  sunat_observations?: string;
  xml_file_path?: string;
  signed_xml_file_path?: string;
  zip_file_path?: string;
  cdr_file_path?: string;
  related_gre_series_number?: string;
  payment_terms?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_order: number;
  product_id: number;
  product?: ProductService;
  quantity: number;
  unit_code: string;
  unit_price: number;
  price_with_tax?: number;
  discount: number;
  tax_category_code: string;
  igv_percentage: number;
  igv_amount: number;
  isc_percentage?: number;
  isc_amount?: number;
  other_tax_percentage?: number;
  other_tax_amount?: number;
  subtotal: number;
  total_line: number;
}

// Tipo para documento de identidad
export type DocType = '1' | '4' | '6' | '7' | '0';

// Interface actualizada para Cliente según la BD
export interface Client {
  id: number;
  doc_type: string;
  doc_number: string;
  name: string;
  address?: string;
  ubigeo?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface actualizada para Proveedor según la BD
export interface Supplier {
  id: number;
  doc_type: string;
  doc_number: string;
  name: string;
  address?: string;
  ubigeo?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para inventario
export interface Warehouse {
  id: number;
  name: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryStock {
  id: number;
  product_id: number;
  product?: ProductService; // Relación con producto
  warehouse_id: number;
  warehouse?: Warehouse; // Relación con almacén
  quantity: number;
  last_updated_at: string;
}

export type InventoryMovementType = 
  | 'PURCHASE_ENTRY'
  | 'SALE_EXIT'
  | 'INITIAL_STOCK'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export interface InventoryMovement {
  id: number;
  product_id: number;
  product?: ProductService;
  warehouse_id: number;
  warehouse?: Warehouse;
  movement_date: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost?: number;
  balance_quantity?: number;
  balance_cost?: number;
  reference_doc_type?: string;
  reference_doc_id?: number;
  notes?: string;
  created_at: string;
}

// Tipo para ajuste de inventario
export interface InventoryAdjustment {
  product_id: number;
  warehouse_id: number;
  quantity: number; // Cantidad del ajuste (positiva o negativa)
  reason: string;
  notes?: string;
}
