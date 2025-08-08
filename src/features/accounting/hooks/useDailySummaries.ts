// src/features/accounting/hooks/useDailySummaries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { dailySummariesService } from '../services/dailySummaries.service';
import type { 
  DailySummaryCreateData,
  DailySummariesListParams
} from '../types';

// Hook para listar resúmenes diarios
export const useDailySummaries = (companyId: number, params?: Omit<DailySummariesListParams, 'company_id'>) => {
  return useQuery({
    queryKey: ['dailySummaries', companyId, params],
    queryFn: () => dailySummariesService.getAll(companyId, params),
    enabled: !!companyId,
  });
};

// Hook para obtener un resumen diario específico
export const useDailySummary = (summaryId: number | null) => {
  return useQuery({
    queryKey: ['dailySummary', summaryId],
    queryFn: () => dailySummariesService.getById(summaryId!),
    enabled: !!summaryId,
  });
};

// Hook para crear resumen diario
export const useCreateDailySummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DailySummaryCreateData) => dailySummariesService.create(data),
    onSuccess: (data) => {
      toast.success(
        `Resumen diario ${data.identifier} creado exitosamente. Se está enviando a SUNAT...`,
        { autoClose: 5000 }
      );
      
      // Invalidar la lista de resúmenes para refrescar
      queryClient.invalidateQueries({ queryKey: ['dailySummaries'] });
      
      // Iniciar polling del estado SUNAT
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['dailySummarySunatStatus', data.id] });
      }, 5000); // Esperar 5 segundos antes de la primera consulta
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al crear el resumen diario';
      toast.error(message);
    },
  });
};

// Hook para consultar estado SUNAT con polling
export const useDailySummarySunatStatus = (summaryId: number | null) => {
  return useQuery({
    queryKey: ['dailySummarySunatStatus', summaryId],
    queryFn: () => dailySummariesService.getSunatStatus(summaryId!),
    enabled: !!summaryId,
    refetchInterval: (data) => {
      // Hacer polling cada 30 segundos si el estado es PENDING o SENT
      const status = data?.state?.data?.sunat_status;
      return status === 'PENDING' || status === 'SENT' ? 30000 : false;
    },
    refetchIntervalInBackground: false,
  });
};

// Hook para refrescar estados pendientes
export const useRefreshPendingSummaries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limit?: number) => dailySummariesService.refreshPendingStatuses(limit),
    onSuccess: () => {
      // Invalidar las consultas de resúmenes para mostrar los estados actualizados
      queryClient.invalidateQueries({ queryKey: ['dailySummaries'] });
      queryClient.invalidateQueries({ queryKey: ['dailySummarySunatStatus'] });
      toast.success('Estados de resúmenes actualizados');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar estados';
      toast.error(message);
    },
  });
};
