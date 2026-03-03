// src/services/userStatistics.service.ts
import api from '../config/api';
import { getLocalDateString, getDaysAgo, getMonthsAgo } from '../utils/dateUtils';

export interface UserStatisticsFilters {
  user_id: string;
  period: 'day' | 'month' | 'year';
  date: string; // Formato: YYYY-MM-DD
}

export interface UserStatisticsBranchOffice {
  id: number;
  name: string;
}

export interface UserStatisticsBreakdown {
  tickets: {
    count: number;
    revenue: string; // La API devuelve string
  };
  cargo: {
    count: number;
    revenue: string; // La API devuelve string
  };
}

export interface UserStatisticsResponse {
  user_id: string;
  period: 'day' | 'month' | 'year';
  date: string;
  branch_office: UserStatisticsBranchOffice;
  total_sales: number;
  total_revenue: number; // Mantener por compatibilidad (será igual a gross)
  total_revenue_gross?: number; // NUEVO: Ventas brutas (solo facturas/boletas)
  total_revenue_net?: number; // NUEVO: Ventas netas (resta notas crédito, suma notas débito)
  total_credit_notes?: number; // NUEVO: Total de notas de crédito
  total_debit_notes?: number; // NUEVO: Total de notas de débito
  currency: string;
  breakdown: UserStatisticsBreakdown;
}

export const userStatisticsService = {
  /**
   * Obtiene estadísticas de ventas para un usuario específico
   */
  getUserStatistics: async (filters: UserStatisticsFilters): Promise<UserStatisticsResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      params.append('date', filters.date);

      const response = await api.get<UserStatisticsResponse>(
        `/users/${filters.user_id}/sales-stats?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene estadísticas del día actual para un usuario
   */
  getTodayStatistics: async (userId: string): Promise<UserStatisticsResponse> => {
    const today = getLocalDateString();
    return userStatisticsService.getUserStatistics({
      user_id: userId,
      period: 'day',
      date: today
    });
  },

  /**
   * Obtiene estadísticas del mes actual para un usuario
   */
  getCurrentMonthStatistics: async (userId: string): Promise<UserStatisticsResponse> => {
    const today = getLocalDateString();
    return userStatisticsService.getUserStatistics({
      user_id: userId,
      period: 'month',
      date: today
    });
  },

  /**
   * Obtiene estadísticas del año actual para un usuario
   */
  getCurrentYearStatistics: async (userId: string): Promise<UserStatisticsResponse> => {
    const today = getLocalDateString();
    return userStatisticsService.getUserStatistics({
      user_id: userId,
      period: 'year',
      date: today
    });
  },

  /**
   * Obtiene estadísticas de múltiples períodos para crear gráficos de tendencias
   * OPTIMIZADO: Usa el endpoint de rango del backend para evitar N+1 queries
   */
  getStatisticsTrends: async (
    userId: string,
    period: 'day' | 'month',
    startDate: string,
    endDate: string
  ): Promise<UserStatisticsResponse[]> => {
    try {
      // Usar el nuevo endpoint optimizado del backend
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('start_date', startDate);
      params.append('end_date', endDate);

      const response = await api.get<UserStatisticsResponse[]>(
        `/users/${userId}/sales-stats-range?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de los últimos 7 días para el usuario
   */
  getLast7DaysStatistics: async (userId: string): Promise<UserStatisticsResponse[]> => {
    const startDate = getDaysAgo(6); // 6 días atrás más hoy = 7 días
    const endDate = getLocalDateString();

    return userStatisticsService.getStatisticsTrends(userId, 'day', startDate, endDate);
  },

  /**
   * Obtiene estadísticas de los últimos 12 meses para el usuario
   */
  getLast12MonthsStatistics: async (userId: string): Promise<UserStatisticsResponse[]> => {
    const startDate = getMonthsAgo(11); // 11 meses atrás más este mes = 12 meses
    const endDate = getLocalDateString();

    return userStatisticsService.getStatisticsTrends(userId, 'month', startDate, endDate);
  }
};