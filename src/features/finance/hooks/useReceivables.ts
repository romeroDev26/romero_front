// src/features/finance/hooks/useReceivables.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { receivablesService } from '../services/receivables.service';
import {
  ReceivablesFilters,
  ReceivablesPagination,
  ReceivablesState
} from '../types/receivables.types';

const initialFilters: ReceivablesFilters = {
  trip_id: null,
  branch_office_id: null,
  payment_status: null,
  start_date: null,
  end_date: null,
};

const initialPagination: ReceivablesPagination = {
  page: 1,
  page_size: 50,
};

export const useReceivables = () => {
  const [filters, setFilters] = useState<ReceivablesFilters>(initialFilters);
  const [pagination, setPagination] = useState<ReceivablesPagination>(initialPagination);

  // Query para obtener la lista de encomiendas
  const {
    data: receivablesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['receivables', filters, pagination],
    queryFn: () => receivablesService.getReceivables({ ...filters, ...pagination }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para estadísticas
  const { data: statsData } = useQuery({
    queryKey: ['receivables-stats', filters.branch_office_id],
    queryFn: () => receivablesService.getReceivablesStats(filters.branch_office_id || undefined),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para marcar como pagada
  const queryClient = useQueryClient();
  const markAsPaidMutation = useMutation({
    mutationFn: (receivableId: number) => receivablesService.markAsPaid(receivableId),
    onSuccess: (data) => {
      // Mostrar mensaje de éxito
      toast.success(data.message || 'Pago confirmado exitosamente');
      
      // Invalidar queries para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al confirmar el pago');
    },
  });

  // Estado computado
  const state: ReceivablesState = {
    items: receivablesData?.items || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    filters,
    pagination,
    total: receivablesData?.total || 0,
    totalPages: receivablesData?.total_pages || 0,
  };

  // Funciones para actualizar filtros
  const updateFilters = useCallback((newFilters: Partial<ReceivablesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Resetear a página 1 cuando cambian filtros
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Funciones para paginación
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const changePageSize = useCallback((page_size: number) => {
    setPagination(prev => ({ ...prev, page_size, page: 1 }));
  }, []);

  // Función para marcar como pagada
  const markAsPaid = useCallback(async (receivableId: number) => {
    try {
      await markAsPaidMutation.mutateAsync(receivableId);
      return true;
    } catch (error) {
      // El error ya se maneja en el mutation con toast
      return false;
    }
  }, [markAsPaidMutation]);

  // Función para refrescar datos
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // Estado
    ...state,
    stats: statsData,

    // Acciones
    updateFilters,
    clearFilters,
    goToPage,
    changePageSize,
    markAsPaid,
    refresh,

    // Estados de carga
    isMarkingPaid: markAsPaidMutation.isPending,
  };
};
