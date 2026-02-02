// src/hooks/useSellerRanking.ts
import { useQuery } from '@tanstack/react-query';
import api from '../config/api';

export interface SellerRankingData {
  vendedor_id: number;
  vendedor_nombre: string;
  posicion_ranking: number;
  porcentaje_relativo: number;
  total_facturas: number;
  total_pasajeros: number;
}

export interface BranchRanking {
  sucursal_id: number;
  sucursal_nombre: string;
  vendedores: SellerRankingData[];
}

export interface SellerRankingResponse {
  meta: {
    generated_at: string;
    period: string;
    company_id: number;
  };
  top_vendedores_por_sucursal: {
    sucursales: BranchRanking[];
  };
}

type RankingPeriod = 'today' | 'week' | 'month' | 'year';

export interface UseSellerRankingOptions {
  period?: RankingPeriod;
  enabled?: boolean;
}

/**
 * Hook para obtener el ranking de vendedores por sucursal
 */
export const useSellerRanking = (options: UseSellerRankingOptions = {}) => {
  const { period = 'today', enabled = true } = options;

  return useQuery({
    queryKey: ['sellerRanking', period],
    queryFn: async () => {
      const response = await api.get<SellerRankingResponse>(
        '/admin/reports/seller-ranking-metrics',
        {
          params: { period }
        }
      );
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};
