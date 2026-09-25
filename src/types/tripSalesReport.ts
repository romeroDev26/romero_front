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
}

export interface TripsCalendarDaySummary {
  date: string;
  trip_count: number;
  total_revenue: number;
  avg_occupancy: number;
}

export interface TripsCalendarSummaryResponse {
  days: TripsCalendarDaySummary[];
  period: {
    start_date: string;
    end_date: string;
  };
}