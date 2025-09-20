// src/services/userStatistics.service.ts
import api from '../config/api';

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
  total_revenue: number;
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
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
    return userStatisticsService.getUserStatistics({
      user_id: userId,
      period: 'year',
      date: today
    });
  },

  /**
   * Obtiene estadísticas de múltiples períodos para crear gráficos de tendencias
   */
  getStatisticsTrends: async (
    userId: string,
    period: 'day' | 'month',
    startDate: string,
    endDate: string
  ): Promise<UserStatisticsResponse[]> => {
    try {
      const results: UserStatisticsResponse[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Iterar por cada día/mes según el período
      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        
        try {
          const stats = await userStatisticsService.getUserStatistics({
            user_id: userId,
            period,
            date: dateStr
          });
          results.push(stats);
        } catch (error) {
          // Si no hay datos para un día específico, continuamos sin hacer ruido
          // Este es comportamiento normal cuando no hay ventas en ciertos días
        }

        // Incrementar según el período
        if (period === 'day') {
          current.setDate(current.getDate() + 1);
        } else {
          current.setMonth(current.getMonth() + 1);
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de los últimos 7 días para el usuario
   */
  getLast7DaysStatistics: async (userId: string): Promise<UserStatisticsResponse[]> => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 6 días atrás más hoy = 7 días

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    return userStatisticsService.getStatisticsTrends(userId, 'day', startDate, endDate);
  },

  /**
   * Obtiene estadísticas de los últimos 12 meses para el usuario
   */
  getLast12MonthsStatistics: async (userId: string): Promise<UserStatisticsResponse[]> => {
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 11); // 11 meses atrás más este mes = 12 meses

    const startDate = twelveMonthsAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    return userStatisticsService.getStatisticsTrends(userId, 'month', startDate, endDate);
  }
};