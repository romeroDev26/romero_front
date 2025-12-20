// src/types/exports.ts
// Tipos para el sistema de exportaciones asíncronas de reportes

// ========================================
// 1. Tipos de Exportación
// ========================================
export type ExportCategory = 
  | 'branch_global' 
  | 'accountant_series';

export type ExportFormat = 'excel' | 'pdf';
export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';

// ========================================
// 2. Request de Exportación
// ========================================
export interface ExportFilters {
  branch_id?: number;
  user_id?: string;
  payment_method?: string;
  document_type?: string;
  include_cancelled?: boolean;
  include_vessel_data?: boolean;
  include_payment_breakdown?: boolean;
}

export interface ExcelOptions {
  include_charts?: boolean;
  include_summary?: boolean;
  include_formulas?: boolean;
  language?: 'es' | 'en';
}

export interface ExportMetadata {
  report_title?: string;
}

export interface ExportRequest {
  category: ExportCategory;
  format: ExportFormat;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  filters?: ExportFilters;
  excel_options?: ExcelOptions;
  metadata?: ExportMetadata;
  sync?: boolean; // Si true, descarga directa sin polling
}

// ========================================
// 3. Response de Exportación (Inicial)
// ========================================
export interface ExportRequestResponse {
  success: boolean;
  export_id: string;
  status: ExportStatus;
  estimated_time_seconds?: number;
  message: string;
  check_status_url: string;
  created_at: string; // ISO 8601
}

// ========================================
// 4. Estado de Exportación
// ========================================
export interface ExportStatusResponse {
  export_id: string;
  status: ExportStatus;
  progress_percentage?: number;
  message: string;
  current_step?: string;
  download_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  expires_at?: string; // ISO 8601
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
  error?: ExportError;
}

export interface ExportError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ========================================
// 5. Historial de Exportaciones
// ========================================
export interface ExportHistoryItem {
  export_id: string;
  export_type: string;
  format: ExportFormat;
  status: ExportStatus;
  file_name?: string;
  file_size_bytes?: number;
  download_url?: string;
  expires_at?: string; // ISO 8601
  created_at: string;  // ISO 8601
  filters_applied?: Record<string, any>;
}

export interface ExportHistoryResponse {
  exports: ExportHistoryItem[];
  pagination: {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

// ========================================
// 6. Requests Específicos de Caja
// ========================================
// Eliminadas: CashGeneralRequest y CashDetailedRequest ya no se usan
