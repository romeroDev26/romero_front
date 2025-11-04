// src/types/sellerDetailedReport.ts
// Tipos para el endpoint /admin/reports/daily-sales-detailed (OPTIMIZADO)

// ========================================
// 1. Report Metadata
// ========================================
export interface SellerReportMetadata {
  report_type: "seller_detailed_statistics";
  generated_at: string;        // ISO 8601
  generated_by: string;         // Email del usuario
  period: {
    start_date: string;         // "YYYY-MM-DD"
    end_date: string;           // "YYYY-MM-DD"
    total_days: number;
  };
  filters_applied: {
    user_id: string;            // UUID
  };
}

// ========================================
// 2. Seller Info
// ========================================
export interface SellerInfo {
  seller_id: string;            // UUID
  full_name: string;
  email: string;
  role_name: string;
  branch_office_name: string;
  is_active: boolean;
  hire_date?: string;
}

// ========================================
// 3. Metrics - PRE-CALCULADAS por el backend
// ========================================
export interface PaymentMethodBreakdown {
  payment_method: string;
  display_name: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface DocumentTypeBreakdown {
  document_type: string;
  document_code: string;
  count: number;
  total_amount: number;
  percentage: number;
}

export interface SunatStatusBreakdown {
  status: string;
  display_name: string;
  count: number;
  percentage: number;
}

export interface BranchBreakdown {
  branch_office_id: number;
  branch_office_name: string;
  invoice_count: number;
  total_amount: number;
  percentage: number;
}

export interface SellerMetrics {
  totals: {
    total_invoices: number;
    total_receipts: number;
    total_credit_notes: number;
    total_debit_notes: number;
    total_documents: number;
    total_cancelled_invoices: number;
    total_cancelled_amount: number;
    
    gross_revenue: number;
    credit_notes_amount: number;
    debit_notes_amount: number;
    net_revenue: number;
    
    total_subtotal: number;
    total_igv: number;
    total_discounts: number;
    
    average_ticket: number;
    average_daily_revenue: number;
  };
  
  passengers_cargo: {
    total_passengers: number;
    total_cargo_items: number;
    total_cargo_weight: number;
    passenger_revenue: number;
    cargo_revenue: number;
    passenger_percentage: number;
    cargo_percentage: number;
  };
  
  payment_methods: PaymentMethodBreakdown[];
  document_types: DocumentTypeBreakdown[];
  sunat_status: SunatStatusBreakdown[];
  branches: BranchBreakdown[];
}

// ========================================
// 4. Charts Data - PRE-CALCULADOS
// ========================================
export interface DailySalesChart {
  date: string;              // "YYYY-MM-DD"
  day_name: string;
  invoice_count: number;
  net_amount: number;
  passenger_count: number;
}

export interface TopRoutesChart {
  route_id: number;
  route_name: string;
  origin_port: string;
  destination_port: string;
  
  total_passengers: number;
  total_cargo_items: number;
  total_revenue: number;
  average_ticket_price: number;
  trip_count: number;
  
  vessels_used: string[];
}

export interface TopProductsChart {
  product_id: number;
  product_name: string;
  service_category: string;
  
  quantity_sold: number;
  total_revenue: number;
  average_price: number;
  transaction_count: number;
}

export interface SalesByHourChart {
  hour: number;              // 0-23
  hour_display: string;      // "08:00 - 09:00"
  invoice_count: number;
  total_amount: number;
  percentage: number;
}

export interface SellerChartsData {
  daily_sales: DailySalesChart[];
  top_routes: TopRoutesChart[];
  top_products: TopProductsChart[];
  sales_by_hour?: SalesByHourChart[];
}

// ========================================
// 5. Invoices - Facturas Detalladas
// ========================================
export interface InvoiceItem {
  item_id: number;
  product_id: number;
  product_name: string;
  service_category: string;
  
  quantity: number;           // ⚠️ NÚMERO, no string
  unit_price: number;         // ⚠️ NÚMERO, no string
  discount_amount: number;    // ⚠️ NÚMERO, no string
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  
  trip_info: {
    trip_id: number | null;
    trip_date: string | null;
    vessel_name: string | null;
    route_name: string | null;
    origin_port: string | null;
    destination_port: string | null;
    boarding_port_name: string | null;
    disembarking_port_name: string | null;
    seat_number: string | null;
  } | null;
}

export interface Representative {
  representative_id: number;
  name: string;
  doc_type: string;
  doc_number: string;
  phone: string | null;
  email: string | null;
  
  trip_info: {
    seat_number: string | null;
    vessel_name: string | null;
    trip_date: string | null;
    boarding_stop_name: string | null;
    disembarking_stop_name: string | null;
  } | null;
}

export interface CancellationInfo {
  cancelled_at: string;       // ISO 8601
  cancelled_by: string;       // Email
  cancellation_reason: string;
}

export interface DetailedInvoice {
  invoice_id: number;
  document_type: string;
  document_code: string;
  series: string;
  correlative: string;
  full_number: string;
  
  issue_date: string;         // ISO 8601
  
  sunat_status: string;
  business_status: string;    // "PAGADO", "CANCELLED", "PENDING", "PROCESSED"
  
  cancellation_info: CancellationInfo | null;
  
  client_id: number;
  client_name: string;
  client_doc_type: string;
  client_document_number: string;
  client_phone: string | null;
  client_email: string | null;
  client_nationality: string | null;
  
  branch_office_id: number;
  branch_office_name: string;
  
  currency: string;
  subtotal: number;
  igv: number;
  discount: number;
  total: number;
  
  payment_method: string;
  payment_method_display: string;
  payment_operation_code: string | null;
  
  items_summary: {
    total_items: number;
    total_passengers: number;
    total_cargo_items: number;
    has_trip_info: boolean;
  };
  
  items: InvoiceItem[];
  representatives: Representative[];
}

// ========================================
// 6. Pagination
// ========================================
export interface Pagination {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
}

// ========================================
// Response Principal OPTIMIZADO
// ========================================
export interface SellerDetailedReportResponse {
  report_metadata: SellerReportMetadata;
  seller_info: SellerInfo;
  metrics: SellerMetrics;
  charts_data: SellerChartsData;
  invoices: DetailedInvoice[];
  pagination?: Pagination;
}

// ========================================
// Filtros
// ========================================
export interface SellerDetailedReportFilters {
  start_date: string;
  end_date: string;
  user_id: string;            // UUID
}

// ========================================
// DEPRECATED - Para compatibilidad temporal
// ========================================
export interface SellerDetailedInvoice extends DetailedInvoice {}
