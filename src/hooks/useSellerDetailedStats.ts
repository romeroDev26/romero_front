// src/hooks/useSellerDetailedStats.ts
import { useQuery } from '@tanstack/react-query';
import { adminReportsService } from '../services/adminReports.service';
import type { SellerDetailedReportResponse } from '../types/sellerDetailedReport';

interface UseSellerDetailedStatsParams {
  userId: string;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

/**
 * Hook simplificado para obtener estadísticas detalladas de vendedor
 * ✅ OPTIMIZADO: Ya no calcula métricas - el backend las retorna pre-calculadas
 */
export const useSellerDetailedStats = ({ 
  userId, 
  startDate, 
  endDate, 
  enabled = true 
}: UseSellerDetailedStatsParams) => {
  const query = useQuery<SellerDetailedReportResponse>({
    queryKey: ['sellerDetailedStats', userId, startDate, endDate],
    queryFn: async () => {
      const response = await adminReportsService.getDailySalesDetailed({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      });
      return response;
    },
    enabled: enabled && !!userId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    ...query,
    // Ahora las métricas vienen directamente del backend
    metrics: query.data?.metrics || null,
    chartsData: query.data?.charts_data || null,
    sellerInfo: query.data?.seller_info || null,
    invoices: query.data?.invoices || [],
  };
};
