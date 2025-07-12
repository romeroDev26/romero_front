// src/features/accounting/hooks/useSunatVoids.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sunatBatchesService } from '../services/sunatBatches.service';
import { VoidCreateData } from '../types';
import { toast } from 'react-toastify';

// Hook para listar comunicaciones de baja
export const useSunatVoids = (companyId: number) => {
  return useQuery({
    queryKey: ['sunatVoids', companyId],
    queryFn: () => sunatBatchesService.getVoids(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para obtener una comunicación de baja por ID
export const useSunatVoid = (id: number | null) => {
  return useQuery({
    queryKey: ['sunatVoid', id],
    queryFn: () => sunatBatchesService.getVoidById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear una comunicación de baja
export const useCreateSunatVoid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: VoidCreateData) => sunatBatchesService.createVoid(data),
    onSuccess: (data) => {
      toast.success(`Lote de Baja ${data.batch_number} creado y enviado a SUNAT. Consulte el estado en unos minutos.`);
      queryClient.invalidateQueries({ queryKey: ['sunatVoids'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la comunicación de baja');
    },
  });
};

// Hook para consultar estado de una comunicación de baja
export const useCheckVoidStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => sunatBatchesService.checkVoidStatus(id),
    onSuccess: (data) => {
      const statusMessages = {
        'ACCEPTED': 'Comunicación de baja aceptada por SUNAT',
        'REJECTED': 'Comunicación de baja rechazada por SUNAT',
        'PENDING': 'Comunicación de baja pendiente de procesamiento',
        'SENT': 'Comunicación de baja enviada a SUNAT'
      };
      
      const message = statusMessages[data.sunat_status] || `Estado: ${data.sunat_status}`;
      toast.info(message);
      
      // Actualizar la lista de comunicaciones de baja
      queryClient.invalidateQueries({ queryKey: ['sunatVoids'] });
      queryClient.invalidateQueries({ queryKey: ['sunatVoid', data.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al consultar el estado de la comunicación de baja');
    },
  });
};
