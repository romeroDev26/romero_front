// src/features/finance/types/receivables.types.ts

export interface ReceivablesFilters {
  branch_office_id?: number | null;
  payment_status?: 'NO PAGADO' | 'PAGADO' | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ReceivablesPagination {
  page: number;
  page_size: number;
}

export interface ReceivablesQueryParams extends ReceivablesFilters, ReceivablesPagination {}

export interface ReceivablesItem {
  id: number;
  invoice_item_id?: number; // ID del item de factura para confirmación de pago
  trip_id: number;
  branch_office_id: number;
  payment_status: 'NO PAGADO' | 'PAGADO';
  amount: number;
  created_at: string;
  updated_at: string;
  // Información adicional que podría venir del backend
  trip_name?: string;
  branch_office_name?: string;
  sender_name?: string;
  sender_doc_number?: string;
  recipient_name?: string;
  recipient_doc_number?: string;
  description?: string;
}

export interface PaymentConfirmationResponse {
  message: string;
  invoice_item_id: number;
  payment_status: 'PAGADO';
  confirmed_by: string;
  confirmed_at: string;
}

export interface ReceivablesResponse {
  items: ReceivablesItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReceivablesState {
  items: ReceivablesItem[];
  loading: boolean;
  error: string | null;
  filters: ReceivablesFilters;
  pagination: ReceivablesPagination;
  total: number;
  totalPages: number;
}
