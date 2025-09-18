// src/services/adminReports.service.ts

import api from '../config/api';

// Interfaces para los diferentes tipos de reportes
export interface ReportFilters {
  start_date: string;
  end_date: string;
  user_id?: number;
  branch_office_id?: number;
  payment_method?: string;
  route_id?: number;
  vessel_id?: number;
  group_by?: 'user' | 'branch_office' | 'payment_method';
  limit?: number;
  format?: 'json' | 'excel' | 'csv';
}

export interface ReportSummary {
  [key: string]: any;
}

export interface ReportItem {
  [key: string]: any;
}

export interface ReportResponse {
  report_type: string;
  period: {
    start_date: string;
    end_date: string;
  };
  filters_applied?: Record<string, any>;
  summary: ReportSummary;
  items: ReportItem[];
}

// Tipos de reportes disponibles
export type ReportType =
  | 'daily_sales_by_user'
  | 'sales_summary'
  | 'route_revenue'
  | 'vessel_occupancy'
  | 'payment_methods'
  | 'sales_performance'
  | 'popular_routes';

class AdminReportsService {
  private readonly basePath = '/admin/reports/';

  // Método genérico para obtener cualquier tipo de reporte
  async getReport(reportType: ReportType, filters: ReportFilters): Promise<ReportResponse> {
    // Limpiar filtros undefined y convertir a string
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
    );

    const params = new URLSearchParams({
      report_type: reportType,
      ...cleanFilters
    });

    const response = await api.get<ReportResponse>(this.basePath, { params });
    return response.data;
  }

  // Métodos específicos para cada tipo de reporte
  async getDailySalesByUser(filters: ReportFilters): Promise<ReportResponse> {
    return this.getReport('daily_sales_by_user', filters);
  }

  async getSalesSummary(filters: ReportFilters): Promise<ReportResponse> {
    return this.getReport('sales_summary', filters);
  }

  async getRouteRevenue(filters: ReportFilters): Promise<ReportResponse> {
    return this.getReport('route_revenue', filters);
  }

  async getVesselOccupancy(filters: ReportFilters): Promise<ReportResponse> {
    return this.getReport('vessel_occupancy', filters);
  }

  async getPaymentMethods(filters: ReportFilters): Promise<ReportResponse> {
    return this.getReport('payment_methods', filters);
  }

  async getSalesPerformance(filters: ReportFilters): Promise<ReportResponse> {
    return this.getReport('sales_performance', filters);
  }

  async getPopularRoutes(filters: ReportFilters): Promise<ReportResponse> {
    return this.getReport('popular_routes', filters);
  }

  // Método para exportar reportes
  async exportReport(reportType: ReportType, filters: ReportFilters, format: 'excel' | 'csv' = 'excel'): Promise<Blob> {
    // Limpiar filtros undefined y convertir a string
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    );

    const params = new URLSearchParams({
      report_type: reportType,
      format,
      ...cleanFilters
    });

    const response = await api.get(this.basePath, {
      params,
      responseType: 'blob'
    });

    return response.data;
  }
}

export const adminReportsService = new AdminReportsService();