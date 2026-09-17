// src/services/reports.service.ts
import api from '../config/api';
import { DailySalesFilters, DailySalesReportResponse } from '../types/reports';
import { TripSalesFilters, TripSalesReportResponse, TripsListFilters, TripsListResponse } from '../types/tripSalesReport';

export const reportsService = {
  getDailySales: async (filters: DailySalesFilters): Promise<DailySalesReportResponse> => {
    const params = new URLSearchParams();

    // Parámetros requeridos
    params.append('start_date', filters.start_date);
    params.append('end_date', filters.end_date);

    // Parámetros opcionales
    if (filters.user_id !== undefined) {
      params.append('user_id', filters.user_id.toString());
    }
    if (filters.branch_office_id !== undefined) {
      params.append('branch_office_id', filters.branch_office_id.toString());
    }
    if (filters.payment_method) {
      params.append('payment_method', filters.payment_method);
    }

    const response = await api.get<DailySalesReportResponse>(`/admin/reports/daily-sales?${params.toString()}`);
    return response.data;
  },

  getDailySalesLast30Days: async (): Promise<DailySalesReportResponse> => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    return reportsService.getDailySales({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });
  },

  getDailySalesCurrentMonth: async (): Promise<DailySalesReportResponse> => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return reportsService.getDailySales({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });
  },

  // Reporte de ventas por viaje
  getTripSales: async (filters: TripSalesFilters): Promise<TripSalesReportResponse> => {
    const params = new URLSearchParams();
    params.append('trip_id', filters.trip_id.toString());

    if (filters.compare_start_date) {
      params.append('compare_start_date', filters.compare_start_date);
    }
    if (filters.compare_end_date) {
      params.append('compare_end_date', filters.compare_end_date);
    }

    const response = await api.get<TripSalesReportResponse>(`/admin/reports/trip-sales?${params.toString()}`);
    return response.data;
  },

  // Lista de viajes con detalles por período
  getTripsList: async (filters: TripsListFilters): Promise<TripsListResponse> => {
    const params = new URLSearchParams();
    params.append('start_date', filters.start_date);
    params.append('end_date', filters.end_date);

    const response = await api.get<TripsListResponse>(`/admin/reports/trips?${params.toString()}`);
    return response.data;
  },
};

// ========================================
// DEPRECATED - Para compatibilidad temporal
// ========================================
export interface DailySalesItem {
  invoice_id: number;
  document_type: string;
  series: string;
  correlative: string;
  issue_date: string;
  sunat_status: string;
  seller_id: number;
  seller_name: string;
  seller_email: string;
  branch_office_name: string;
  client_name: string;
  client_document_number: string;
  client_nationality: string;
  client_phone: string;
  client_email: string;
  trip_date: string;
  boarding_time: string;
  vessel_name: string;
  origin_port: string;
  destination_port: string;
  route_name: string;
  service_description: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  seat_number: string;
  currency: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  payment_method: string;
  payment_operation_code: string;
}

export interface DailySalesSummary {
  total_invoices: number;
  total_amount: string;
  total_discount: string;
  total_tax: string;
  payment_methods_summary: Record<string, string>;
  sellers_summary: Record<string, unknown>;
}

export interface DailySalesReport {
  report_type: string;
  generated_at: string;
  generated_by: string;
  filters: Record<string, unknown>;
  items: DailySalesItem[];
  summary: DailySalesSummary;
}