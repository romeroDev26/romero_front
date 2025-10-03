// src/types/sellerDetailedReport.ts

export interface SellerDetailedReportFilters {
  start_date: string;
  end_date: string;
  user_id: string; // UUID del vendedor
}

export interface InvoiceItem {
  item_id: number;
  product_id: number;
  product_name: string;
  service_category: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  seat_number: string | null;
  trip_id: number | null;
  trip_date: string | null;
  vessel_name: string | null;
  route_name: string | null;
  origin_port: string | null;
  destination_port: string | null;
  boarding_port_name: string | null;
  disembarking_port_name: string | null;
}

export interface Representative {
  id: number;
  name: string;
  doc_type: string;
  doc_number: string;
  phone: string | null;
  email: string | null;
  seat_number: string | null;
  vessel_name: string | null;
  trip_date: string | null;
  boarding_stop_name: string | null;
  disembarking_stop_name: string | null;
}

export interface SellerDetailedInvoice {
  invoice_id: number;
  document_type: string;
  series: string;
  correlative: string;
  issue_date: string;
  sunat_status: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  branch_office_name: string;
  client_name: string;
  client_doc_type: string;
  client_document_number: string;
  client_nationality: string | null;
  client_phone: string | null;
  client_email: string | null;
  currency: string;
  payment_method: string;
  payment_operation_code: string | null;
  total_subtotal: string;
  total_tax: string;
  total_amount: string;
  items: InvoiceItem[];
  representatives: Representative[];
}

export interface SellerDetailedReportResponse {
  report_type: string;
  generated_at: string;
  generated_by: string;
  filters: Record<string, unknown>;
  items: SellerDetailedInvoice[];
}

// Interfaces para métricas calculadas en el frontend
export interface SellerMetrics {
  total_invoices: number;
  total_revenue: number;
  total_passengers: number;
  total_cargo_items: number;
  average_ticket: number;
  payment_methods_breakdown: Record<string, number>;
  document_types_breakdown: Record<string, number>;
  sunat_status_breakdown: Record<string, number>;
  daily_sales: Array<{ date: string; amount: number; invoices: number }>;
  top_routes: Array<{ route: string; revenue: number; passengers: number }>;
  top_products: Array<{ product: string; quantity: number; revenue: number }>;
}
