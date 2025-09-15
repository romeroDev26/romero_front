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
  branch_office_id: null,
  payment_status: null,
  start_date: null,
  end_date: null,
};

const initialPagination: ReceivablesPagination = {
  current_page: 1,
  page_size: 50,
  total_count: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false
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

  // Mutation para marcar como pagada
  const queryClient = useQueryClient();
  const markAsPaidMutation = useMutation({
    mutationFn: (receivableId: number) => receivablesService.markAsPaid(receivableId),
    onSuccess: (data) => {
      // Mostrar mensaje de éxito
      toast.success(data.message || 'Pago confirmado exitosamente');
      
      // Invalidar queries para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al confirmar el pago');
    },
  });

  // Estado computado
  const state: ReceivablesState = {
    items: receivablesData?.parcels || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    filters,
    pagination: receivablesData?.pagination || initialPagination,
    total: receivablesData?.pagination?.total_count || 0,
    totalPages: receivablesData?.pagination?.total_pages || 0,
    summary: receivablesData?.summary || {
      total_parcels: 0,
      total_amount: 0,
      paid_parcels: 0,
      unpaid_parcels: 0
    },
  };

  // Funciones para actualizar filtros
  const updateFilters = useCallback((newFilters: Partial<ReceivablesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, current_page: 1 })); // Resetear a página 1 cuando cambian filtros
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  }, []);

  // Funciones para paginación
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  }, []);

  const changePageSize = useCallback((page_size: number) => {
    setPagination(prev => ({ ...prev, page_size, current_page: 1 }));
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
