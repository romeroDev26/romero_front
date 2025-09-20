// src/hooks/useUserStatistics.ts
import { useQuery } from '@tanstack/react-query';
import { userStatisticsService } from '../services/userStatistics.service';
import { authService } from '../services/auth.service';

export interface UseUserStatisticsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook para obtener estadísticas del usuario actual para hoy
 */
export const useTodayStatistics = (options: UseUserStatisticsOptions = {}) => {
  const currentUser = authService.getCurrentUser();
  
  return useQuery({
    queryKey: ['userStatistics', 'today', currentUser?.id],
    queryFn: () => {
      if (!currentUser?.id) {
        throw new Error('Usuario no encontrado');
      }
      return userStatisticsService.getTodayStatistics(currentUser.id);
    },
    enabled: !!currentUser?.id && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? 30000, // Refetch cada 30 segundos
    staleTime: 30000, // Los datos se consideran frescos por 30 segundos
  });
};

/**
 * Hook para obtener estadísticas del usuario actual para el mes actual
 */
export const useCurrentMonthStatistics = (options: UseUserStatisticsOptions = {}) => {
  const currentUser = authService.getCurrentUser();
  
  return useQuery({
    queryKey: ['userStatistics', 'currentMonth', currentUser?.id],
    queryFn: () => {
      if (!currentUser?.id) {
        throw new Error('Usuario no encontrado');
      }
      return userStatisticsService.getCurrentMonthStatistics(currentUser.id);
    },
    enabled: !!currentUser?.id && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? 60000, // Refetch cada minuto
    staleTime: 60000, // Los datos se consideran frescos por 1 minuto
  });
};

/**
 * Hook para obtener estadísticas del usuario actual para el año actual
 */
export const useCurrentYearStatistics = (options: UseUserStatisticsOptions = {}) => {
  const currentUser = authService.getCurrentUser();
  
  return useQuery({
    queryKey: ['userStatistics', 'currentYear', currentUser?.id],
    queryFn: () => {
      if (!currentUser?.id) {
        throw new Error('Usuario no encontrado');
      }
      return userStatisticsService.getCurrentYearStatistics(currentUser.id);
    },
    enabled: !!currentUser?.id && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? 300000, // Refetch cada 5 minutos
    staleTime: 300000, // Los datos se consideran frescos por 5 minutos
  });
};

/**
 * Hook para obtener tendencias de ventas de los últimos 7 días
 */
export const useLast7DaysStatistics = (options: UseUserStatisticsOptions = {}) => {
  const currentUser = authService.getCurrentUser();
  
  return useQuery({
    queryKey: ['userStatistics', 'last7Days', currentUser?.id],
    queryFn: () => {
      if (!currentUser?.id) {
        throw new Error('Usuario no encontrado');
      }
      return userStatisticsService.getLast7DaysStatistics(currentUser.id);
    },
    enabled: !!currentUser?.id && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? 300000, // Refetch cada 5 minutos
    staleTime: 300000, // Los datos se consideran frescos por 5 minutos
  });
};

/**
 * Hook para obtener tendencias de ventas de los últimos 12 meses
 */
export const useLast12MonthsStatistics = (options: UseUserStatisticsOptions = {}) => {
  const currentUser = authService.getCurrentUser();
  
  return useQuery({
    queryKey: ['userStatistics', 'last12Months', currentUser?.id],
    queryFn: () => {
      if (!currentUser?.id) {
        throw new Error('Usuario no encontrado');
      }
      return userStatisticsService.getLast12MonthsStatistics(currentUser.id);
    },
    enabled: !!currentUser?.id && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? 600000, // Refetch cada 10 minutos
    staleTime: 600000, // Los datos se consideran frescos por 10 minutos
  });
};

/**
 * Hook personalizable para obtener estadísticas de un período específico
 */
export const useCustomPeriodStatistics = (
  period: 'day' | 'month' | 'year',
  date: string,
  options: UseUserStatisticsOptions = {}
) => {
  const currentUser = authService.getCurrentUser();
  
  return useQuery({
    queryKey: ['userStatistics', period, date, currentUser?.id],
    queryFn: () => {
      if (!currentUser?.id) {
        throw new Error('Usuario no encontrado');
      }
      return userStatisticsService.getUserStatistics({
        user_id: currentUser.id,
        period,
        date
      });
    },
    enabled: !!currentUser?.id && !!date && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
    staleTime: options.refetchInterval || 60000,
  });
};

/**
 * Hook combinado que devuelve todas las estadísticas principales
 */
export const useAllUserStatistics = (options: UseUserStatisticsOptions = {}) => {
  const todayStats = useTodayStatistics(options);
  const monthStats = useCurrentMonthStatistics(options);
  const yearStats = useCurrentYearStatistics(options);
  const last7DaysStats = useLast7DaysStatistics(options);

  return {
    today: todayStats,
    currentMonth: monthStats,
    currentYear: yearStats,
    last7Days: last7DaysStats,
    isLoading: todayStats.isLoading || monthStats.isLoading || yearStats.isLoading,
    hasError: todayStats.error || monthStats.error || yearStats.error,
    errors: {
      today: todayStats.error,
      month: monthStats.error,
      year: yearStats.error,
      trends: last7DaysStats.error,
    }
  };
};