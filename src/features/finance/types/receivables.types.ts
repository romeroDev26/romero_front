// src/features/finance/types/receivables.types.ts

export interface ReceivablesFilters {
  branch_office_id?: number | null;
  doc_number?: string | null;
  payment_status?: 'NO PAGADO' | 'PAGADO' | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ReceivablesPagination {
  current_page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ReceivablesQueryParams extends ReceivablesFilters, ReceivablesPagination {}

export interface ReceivablesItem {
  invoice_item_id: number;
  cargo_description: string;
  cargo_weight_kg: string;
  unit_code: string;
  amount: string;
  payment_status: 'NO PAGADO' | 'PAGADO';
  invoice_id: number;
  invoice_series: string;
  invoice_number: number;
  issue_date: string;
  is_credit_sale: boolean;
  sender_name: string;
  sender_document: string;
  recipient_name: string;
  recipient_document: string;
  trip_id: number;
  departure_date: string;
  departure_time: string;
  origin_port: string;
  destination_port: string;
  branch_office_name: string;
  branch_office_id: number;
  // URLs de comprobantes PDF
  pdf_ticket_file_path?: string;
  pdf_ticket58_file_path?: string;
}

export interface ReceivablesSummary {
  total_parcels: number;
  total_amount: number;
  paid_parcels: number;
  unpaid_parcels: number;
}

export interface PaymentConfirmationResponse {
  message: string;
  invoice_item_id: number;
  payment_status: 'PAGADO';
  confirmed_by: string;
  confirmed_at: string;
}

export interface ReceivablesResponse {
  parcels: ReceivablesItem[];
  pagination: ReceivablesPagination;
  summary: ReceivablesSummary;
  filters_applied: ReceivablesFilters;
}

/**
 * Campos que en la respuesta del backend viven en el nivel de la factura y el
 * servicio copia a cada encomienda al aplanar la estructura.
 */
type InvoiceLevelFields =
  | 'invoice_id'
  | 'invoice_series'
  | 'invoice_number'
  | 'issue_date'
  | 'is_credit_sale'
  | 'pdf_ticket_file_path'
  | 'pdf_ticket58_file_path';

/**
 * Forma cruda de /dispatch/manifests/cash-on-delivery: las encomiendas vienen
 * anidadas dentro de cada factura, no en una lista plana. El servicio las
 * aplana y calcula paid_parcels / unpaid_parcels antes de devolver un
 * ReceivablesResponse.
 */
export interface ReceivablesBackendInvoice extends Pick<ReceivablesItem, InvoiceLevelFields> {
  parcels: Array<Omit<ReceivablesItem, InvoiceLevelFields>>;
}

export interface ReceivablesBackendResponse {
  invoices?: ReceivablesBackendInvoice[];
  pagination: ReceivablesPagination;
  /** El backend no manda paid_parcels ni unpaid_parcels: los calcula el front. */
  summary: Omit<ReceivablesSummary, 'paid_parcels' | 'unpaid_parcels'>;
  filters_applied: ReceivablesFilters;
}

export interface ReceivablesState {
  items: ReceivablesItem[];
  loading: boolean;
  error: string | null;
  filters: ReceivablesFilters;
  pagination: ReceivablesPagination;
  total: number;
  totalPages: number;
  summary: ReceivablesSummary;
}
