// src/features/accounting/hooks/useSunatVoids.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import { sunatBatchesService } from '../services/sunatBatches.service';
import { invoicesService } from '../../../services/invoices.service';
import { VoidCreateData, VoidableInvoice, VoidDocument } from '../types';

// NUEVO HOOK: Para obtener las facturas que se pueden dar de baja
export const useVoidableInvoices = (companyId: number | null) => {
  return useQuery<VoidableInvoice[], Error>({
    queryKey: ['voidableInvoices', companyId],
    queryFn: () => {
      if (!companyId) return Promise.resolve([]);
      // Llamamos al método que está en el servicio de facturas
      return invoicesService.getVoidableInvoices(companyId); 
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para listar comunicaciones de baja
export const useSunatVoids = (companyId: number) => {
  return useQuery<VoidDocument[], Error>({
    queryKey: ['sunatVoids', companyId],
    queryFn: () => sunatBatchesService.getVoids(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para obtener una comunicación de baja por ID
export const useSunatVoid = (id: number | null) => {
  return useQuery<VoidDocument, Error>({
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
    onSuccess: (data: VoidDocument) => {
      toast.success(`Lote de Baja ${data.identifier} creado y enviado a SUNAT. Consulte el estado en unos minutos.`);
      queryClient.invalidateQueries({ queryKey: ['sunatVoids'] });
      // Invalidar también las facturas anulables para actualizar la lista
      queryClient.invalidateQueries({ queryKey: ['voidableInvoices'] });
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
    onSuccess: (data: VoidDocument) => {
      const statusMessages: Record<string, string> = {
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