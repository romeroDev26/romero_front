// src/features/accounting/hooks/useSunatSummaries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sunatBatchesService } from '../services/sunatBatches.service';
import { SummaryCreateData } from '../types';
import { toast } from 'react-toastify';

// Hook para listar resúmenes
export const useSunatSummaries = (companyId: number) => {
  return useQuery({
    queryKey: ['sunatSummaries', companyId],
    queryFn: () => sunatBatchesService.getSummaries(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para obtener un resumen por ID
export const useSunatSummary = (id: number | null) => {
  return useQuery({
    queryKey: ['sunatSummary', id],
    queryFn: () => sunatBatchesService.getSummaryById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear un resumen diario
export const useCreateSunatSummary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SummaryCreateData) => sunatBatchesService.createSummary(data),
    onSuccess: (data) => {
      toast.success(`Resumen Diario ${data.batch_number} creado y enviado a SUNAT. Consulte el estado en unos minutos.`);
      queryClient.invalidateQueries({ queryKey: ['sunatSummaries'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Error al crear el resumen diario';
      toast.error(errorMessage);
    },
  });
};

// Hook para consultar estado de un resumen
export const useCheckSummaryStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => sunatBatchesService.checkSummaryStatus(id),
    onSuccess: (data) => {
      const statusMessages = {
        'ACCEPTED': 'Resumen aceptado por SUNAT',
        'REJECTED': 'Resumen rechazado por SUNAT',
        'PENDING': 'Resumen pendiente de procesamiento',
        'SENT': 'Resumen enviado a SUNAT'
      };
      
      const message = statusMessages[data.sunat_status] || `Estado: ${data.sunat_status}`;
      toast.info(message);
      
      // Actualizar la lista de resúmenes
      queryClient.invalidateQueries({ queryKey: ['sunatSummaries'] });
      queryClient.invalidateQueries({ queryKey: ['sunatSummary', data.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al consultar el estado del resumen');
    },
  });
};
