// src/types/reports.ts
// Tipos para el endpoint /admin/reports/daily-sales (OPTIMIZADO)
// Adaptado a la estructura real del backend en español

// ========================================
// 1. Report Metadata
// ========================================
export interface ReportMetadata {
  generatedAt: string;       // ISO 8601
  generatedBy: string;       // Email del usuario
  filters: {
    start_date: string;      // "YYYY-MM-DD"
    end_date: string;        // "YYYY-MM-DD"
    user_id: number | null;
    branch_office_id: number | null;
    vessel_id: number | null;
    route_id: number | null;
    payment_method: string | null;
  };
}

// ========================================
// 2. Summary - Resumen Ejecutivo
// ========================================
export interface ReportSummary {
  totalDocumentos: number;
  totalVentas: number;
  subtotalVentas: number;
  totalIGV: number;
  totalDescuentos: number;
}

// ========================================
// 3. Metrics - Métricas Agregadas (Categorías)
// ========================================
export interface PaymentMethodMetric {
  [key: string]: number; // { "EFECTIVO": 1500.00, "TARJETA": 2300.00 }
}

export interface SellerMetric {
  [key: string]: number; // { "Juan Pérez": 5000.00, "María García": 3000.00 }
}

export interface RouteMetric {
  [key: string]: number; // { "IQUITOS - NAUTA": 4500.00 }
}

export interface SunatStatusMetric {
  [key: string]: number; // { "ACCEPTED": 50, "PENDING": 5 }
}

export interface DocumentTypeMetric {
  [key: string]: number; // { "Factura": 30, "Boleta": 20 }
}

export interface DailyBreakdown {
  [key: string]: number; // { "2025-11-01": 2500.00, "2025-11-02": 3000.00 }
}

export interface AdjustmentsMetric {
  totalDescuentos: number;
}

export interface ReportMetrics {
  metodosPago: PaymentMethodMetric;
  vendedores: SellerMetric;
  rutas: RouteMetric;
  estadoSunat: SunatStatusMetric;
  tiposDocumento: DocumentTypeMetric;
  desgloseDiario: DailyBreakdown;
  ajustes: AdjustmentsMetric;
}
// ========================================
// 4. Items - Detalle de Transacciones
// ========================================
export interface SalesItem {
  invoice_id: number;
  document_type: string;
  document_code: string;
  series: string;
  correlative: string;
  full_number: string;
  
  issue_date: string;
  trip_date?: string;
  
  sunat_status: string;
  business_status?: string;
  
  seller_id: string;
  seller_name: string;
  seller_email: string;
  
  branch_office_id: number;
  branch_office_name: string;
  
  client_id: number;
  client_name: string;
  client_document_type: string;
  client_document_number: string;
  
  trip_info?: {
    vessel_name: string;
    route_name: string;
    origin_port: string;
    destination_port: string;
    boarding_time?: string;
    seat_numbers?: string[];
  };
  
  currency: string;
  subtotal: number;
  igv: number;
  discount: number;
  total: number;
  
  payment_method: string;
  payment_operation_code?: string;
  
  service_description: string;
  passenger_count: number;
  cargo_weight?: number;
}

// ========================================
// Response Principal
// ========================================
export interface DailySalesReportResponse {
  meta: ReportMetadata;
  resumenEjecutivo: ReportSummary;
  categorias: ReportMetrics;
  transacciones: SalesItem[];
}

// ========================================
// Filtros para la request
// ========================================
export interface DailySalesFilters {
  start_date: string;
  end_date: string;
  user_id?: number;
  branch_office_id?: number;
  payment_method?: string;
}
