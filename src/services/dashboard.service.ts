// src/services/dashboard.service.ts
import api from '../config/api';
import { DashboardMetricsResponse, DashboardMetricsFilters } from '../types/dashboard';

class DashboardService {
  private readonly basePath = '/admin/reports';

  /**
   * Obtiene todas las métricas del dashboard en una sola llamada
   * El backend realiza TODOS los cálculos
   */
  async getDashboardMetrics(filters: DashboardMetricsFilters = {}): Promise<DashboardMetricsResponse> {
    const params = new URLSearchParams();
    
    if (filters.period) {
      params.append('period', filters.period);
    }

    const response = await api.get<DashboardMetricsResponse>(
      `${this.basePath}/dashboard-metrics?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Obtiene métricas para el día actual
   */
  async getTodayMetrics(): Promise<DashboardMetricsResponse> {
    return this.getDashboardMetrics({ period: 'today' });
  }

  /**
   * Obtiene métricas para la semana actual
   */
  async getWeekMetrics(): Promise<DashboardMetricsResponse> {
    return this.getDashboardMetrics({ period: 'week' });
  }

  /**
   * Obtiene métricas para el mes actual
   */
  async getMonthMetrics(): Promise<DashboardMetricsResponse> {
    return this.getDashboardMetrics({ period: 'month' });
  }

  /**
   * Obtiene métricas para el año actual
   */
  async getYearMetrics(): Promise<DashboardMetricsResponse> {
    return this.getDashboardMetrics({ period: 'year' });
  }
}

export const dashboardService = new DashboardService();
