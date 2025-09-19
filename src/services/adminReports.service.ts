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
  [key: string]: unknown;
}

export interface ReportItem {
  [key: string]: unknown;
}

export interface ReportResponse {
  report_type: string;
  period: {
    start_date: string;
    end_date: string;
  };
  filters_applied?: Record<string, unknown>;
  summary: ReportSummary;
  items: ReportItem[];
}

// Interfaces para reporte de ventas por sucursal
export interface SalesByBranchFilters {
  start_date: string;
  end_date: string;
  branch_office_ids?: string;
  include_vessel_data?: boolean;
  period_grouping?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  include_seller_details?: boolean;
}

export interface SellerData {
  seller_id: number;
  seller_name: string;
  seller_email: string;
  total_invoices: number;
  total_amount: string;
  total_discount: string;
  total_tax: string;
  average_ticket: string;
  total_passengers: number;
  ranking_position: number;
  percentage_of_branch_sales: string;
}

export interface BranchSalesItem {
  branch_office_id: number;
  branch_office_name: string;
  branch_office_address: string;
  branch_office_phone: string;
  total_invoices: number;
  total_amount: string;
  total_discount: string;
  total_tax: string;
  average_ticket: string;
  total_passengers: number;
  sellers: SellerData[];
  top_seller_name: string;
  top_seller_amount: string;
}

export interface SalesByBranchSummary {
  total_branches: number;
  total_invoices: number;
  total_amount: string;
  total_discount: string;
  total_tax: string;
  average_per_branch: string;
  top_branch_name: string;
  top_branch_amount: string;
}

export interface SalesByBranchResponse {
  report_type: string;
  generated_at: string;
  generated_by: string;
  filters: {
    start_date: string;
    end_date: string;
    branch_office_ids: number[];
    include_vessel_data: boolean;
    period_grouping: string;
    include_seller_details: boolean;
  };
  items: BranchSalesItem[];
  summary: SalesByBranchSummary;
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

  // Método específico para reporte de ventas por sucursal
  async getSalesByBranch(filters: SalesByBranchFilters): Promise<SalesByBranchResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<SalesByBranchResponse>(`${this.basePath}sales-by-branch`, { params });
    return response.data;
  }

  // Método para exportar reportes
  async exportReport(reportType: ReportType, filters: ReportFilters, format: 'excel' | 'csv' = 'excel'): Promise<Blob> {
    // Limpiar filtros undefined y convertir a string
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
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