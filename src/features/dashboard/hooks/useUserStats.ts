import { useQuery } from '@tanstack/react-query';
import api from '../../../config/api';

// Hook para estadísticas de ventas del usuario
export const useUserSalesStats = (userId?: number) => {
  return useQuery({
    queryKey: ['userDashboardStats', userId],
    queryFn: async () => {
      const response = await api.get(`/api/users/${userId}/dashboard-stats`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // Actualizar cada minuto
    refetchInterval: 1000 * 60 * 5, // Auto-refresh cada 5 minutos
  });
};

// Hook para metas del usuario
export const useUserGoals = (userId?: number) => {
  return useQuery({
    queryKey: ['userGoals', userId],
    queryFn: async () => {
      const response = await api.get(`/api/users/${userId}/sales-goals`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 30, // Cache por 30 minutos (las metas cambian poco)
  });
};