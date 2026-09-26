// src/types/tripSalesReport.ts
// Tipos para el endpoint /admin/reports/trip-sales

export interface TripSalesFilters {
  trip_id: number;
  compare_start_date?: string;
  compare_end_date?: string;
}

export interface TripRoute {
  route_id: number;
  route_name: string;
  origin_port: string;
  destination_port: string;
}

export interface TripVessel {
  vessel_id: number;
  vessel_name: string;
}

export interface TripVesselInfo {
  scheduled: TripVessel;
  actual: TripVessel;
  changed: boolean;
}

export interface TripCapacity {
  total_seats: number;
  confirmed_seats: number;
}

export interface TripInfo {
  trip_id: number;
  trip_name: string;
  departure_datetime: string;
  status: string;
  route: TripRoute;
  vessel: TripVesselInfo;
  capacity: TripCapacity;
}

export interface PaymentBreakdown {
  payment_method: string;
  amount: number;
}

export interface ServiceBreakdownItem {
  count: number;
  revenue: number;
  average_item_amount?: number;
  average_ticket?: number;
}

export interface ServiceBreakdown {
  [serviceType: string]: ServiceBreakdownItem;
}

export interface TripSales {
  sold_seats: number;
  total_revenue: number;
  occupancy_percentage: number;
  average_ticket: number;
  payment_breakdown: PaymentBreakdown[];
  service_breakdown: ServiceBreakdown;
}

export interface ComparativeTrip {
  trip_id: number;
  departure_datetime: string;
  capacity: number;
  sold_seats: number;
  occupancy_percentage: number;
  total_revenue: number;
  average_ticket: number;
}

export interface TripComparatives {
  route_id: number;
  start_date: string;
  end_date: string;
  trips: ComparativeTrip[];
}

export interface TripSalesReportResponse {
  trip: TripInfo;
  sales: TripSales;
  comparatives: TripComparatives;
}

// Tipo para la lista de viajes disponibles
export interface TripOption {
  trip_id: number;
  trip_name: string;
  departure_datetime: string;
  route_name: string;
  vessel_name: string;
  status: string;
}

// ===== Tipos para el endpoint /admin/reports/trips =====

export interface TripsListFilters {
  start_date: string;
  end_date: string;
}

export interface ServiceCategory {
  category: string;
  display_name: string;
  count: number;
  revenue: number;
  average_amount: number;
}

export interface TripListItemSales {
  sold_seats: number;
  total_revenue: number;
  occupancy_percentage: number;
  average_ticket: number;
  service_breakdown?: ServiceBreakdown & {
    categories?: ServiceCategory[];
  };
}

export interface TripListItem {
  trip: TripInfo;
  sales: TripListItemSales;
}

export interface TripsListResponse {
  items: TripListItem[];
  period: {
    start_date: string;
    end_date: string;
  };
  income_summary?: PeriodIncomeSummary;
}

export interface TripsCalendarDaySummary {
  date: string;
  trip_count: number;
  total_revenue: number;
  avg_occupancy: number;
}

export interface PeriodIncomeSummary {
  trip_operations_revenue: number;
  quick_sales_revenue: number;
  total_sales_in_period: number;
  other_sales_revenue: number;
}

export interface TripsCalendarSummaryResponse {
  days: TripsCalendarDaySummary[];
  period: {
    start_date: string;
    end_date: string;
  };
  income_summary?: PeriodIncomeSummary;
}

export interface CollectionSummary {
  total_amount: number;
  collected_amount: number;
  pending_amount: number;
}

export interface VesselServiceBreakdownItem extends ServiceBreakdownItem {
  collected: number;
  pending: number;
  average_ticket?: number;
  average_item_amount?: number;
}

export interface VesselPaymentMethodItem {
  method: string;
  collected: number;
  pending: number;
  total: number;
  count: number;
}

export interface VesselDocumentLineItem {
  item_id: number;
  service_category: string;
  product_name?: string | null;
  quantity: number;
  amount: number;
  collected: number;
  pending: number;
}

export interface VesselAuditDocument {
  invoice_id: number;
  series?: string | null;
  number: number;
  document_type: string;
  document_type_code?: string | null;
  issue_date?: string | null;
  sunat_status?: string | null;
  client_name?: string | null;
  seller_name?: string | null;
  branch_office_name?: string | null;
  trip_id: number;
  payment_method?: string | null;
  payment_method_2?: string | null;
  is_credit: boolean;
  payment_status: 'cobrado' | 'pendiente';
  payment_confirmed_at?: string | null;
  total_amount: number;
  collected_amount: number;
  pending_amount: number;
  items: VesselDocumentLineItem[];
}

export interface VesselTripReportItem {
  trip_id: number;
  trip_name: string;
  departure_datetime?: string | null;
  status?: string | null;
  route: {
    route_id?: number | null;
    route_name?: string | null;
    origin_port?: string | null;
    destination_port?: string | null;
  };
  capacity: {
    total_seats: number;
  };
  operations: {
    passengers_count: number;
    occupancy_percentage: number;
  };
  collection: CollectionSummary;
  payment_methods: VesselPaymentMethodItem[];
  service_breakdown: Record<string, VesselServiceBreakdownItem>;
  documents: VesselAuditDocument[];
}

/** Cabecera liviana devuelta por GET /vessels?summary=true */
export interface VesselReportSummaryItem {
  vessel: {
    vessel_id: number;
    vessel_name: string;
  };
  operations: {
    trip_count: number;
    passengers_count: number;
    avg_occupancy: number;
    average_ticket: number;
  };
  collection: CollectionSummary;
  sales: {
    gross_sales: number;
    credit_notes_amount: number;
    net_revenue: number;
    total_revenue: number;
    collected_revenue: number;
    pending_revenue: number;
  };
  document_count: number;
}

export interface VesselReportItem {
  vessel: {
    vessel_id: number;
    vessel_name: string;
  };
  operations: {
    trip_count: number;
    passengers_count: number;
    avg_occupancy: number;
    average_ticket: number;
  };
  collection: CollectionSummary;
  sales: {
    gross_sales: number;
    credit_notes_amount: number;
    net_revenue: number;
    total_revenue: number;
    collected_revenue: number;
    pending_revenue: number;
    service_breakdown: {
      PASAJES: VesselServiceBreakdownItem;
      ENCOMIENDAS: VesselServiceBreakdownItem;
      CARGA_GENERAL: VesselServiceBreakdownItem;
      EXCESO_EQUIPAJE: VesselServiceBreakdownItem;
    };
  };
  adjustments: {
    credit_notes: { count: number; amount: number };
  };
  payment_methods: VesselPaymentMethodItem[];
  sellers: VesselNamedBreakdownItem[];
  branches: VesselNamedBreakdownItem[];
  document_summary: VesselDocumentSummary;
  trips: VesselTripReportItem[];
  documents: VesselAuditDocument[];
}

export interface VesselNamedBreakdownItem {
  name: string;
  count: number;
  amount: number;
  collected: number;
  pending: number;
}

export interface VesselDocumentSummary {
  boletas: { count: number; amount: number };
  facturas: { count: number; amount: number };
  notas_credito: { count: number; amount: number };
  total_documents: number;
}

export interface VesselsPeriodSummary {
  vessel_count: number;
  trip_count: number;
  passengers_count: number;
  document_count: number;
  gross_sales: number;
  credit_notes_amount: number;
  net_revenue: number;
  collection: CollectionSummary;
}

export interface VesselsListResponse {
  meta?: Record<string, string>;
  summary?: VesselsPeriodSummary;
  items: VesselReportSummaryItem[];
  period: {
    start_date: string;
    end_date: string;
  };
  income_summary?: PeriodIncomeSummary;
}