// src/features/accounting/hooks/useVoidDocuments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import { voidDocumentsService } from '../services/voidDocuments.service';
import type { 
  VoidDocumentCreateData,
  VoidDocumentsListParams
} from '../types';
import { getErrorMessage } from '../../../utils/errorHandler';

// Hook para listar comunicaciones de baja
export const useVoidDocuments = (companyId: number, params?: Omit<VoidDocumentsListParams, 'company_id'>) => {
  return useQuery({
    queryKey: ['voidDocuments', companyId, params],
    queryFn: () => voidDocumentsService.getAll(companyId, params),
    enabled: !!companyId,
  });
};

// Hook para obtener una comunicación de baja específica
export const useVoidDocument = (voidId: number | null) => {
  return useQuery({
    queryKey: ['voidDocument', voidId],
    queryFn: () => voidDocumentsService.getById(voidId!),
    enabled: !!voidId,
  });
};

// Hook para crear comunicación de baja
export const useCreateVoidDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VoidDocumentCreateData) => voidDocumentsService.create(data),
    onSuccess: (data) => {
      toast.success(
        `Comunicación de baja ${data.identifier} creada exitosamente. Se está enviando a SUNAT...`,
        { autoClose: 5000 }
      );
      
      // Invalidar la lista de anulaciones para refrescar
      queryClient.invalidateQueries({ queryKey: ['voidDocuments'] });
      
      // Iniciar polling del estado SUNAT
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['voidDocumentSunatStatus', data.id] });
      }, 5000); // Esperar 5 segundos antes de la primera consulta
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al crear la comunicación de baja');
      toast.error(message);
    },
  });
};

// Hook para consultar estado SUNAT con polling
export const useVoidDocumentSunatStatus = (voidId: number | null) => {
  return useQuery({
    queryKey: ['voidDocumentSunatStatus', voidId],
    queryFn: () => voidDocumentsService.getSunatStatus(voidId!),
    enabled: !!voidId,
    refetchInterval: (data) => {
      // Hacer polling cada 30 segundos si el estado es PENDING o SENT
      const status = data?.state?.data?.sunat_status;
      return status === 'PENDING' || status === 'SENT' ? 30000 : false;
    },
    refetchIntervalInBackground: false,
  });
};

// Hook para refrescar estados pendientes
export const useRefreshPendingVoids = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limit?: number) => voidDocumentsService.refreshPendingStatuses(limit),
    onSuccess: () => {
      // Invalidar las consultas de anulaciones para mostrar los estados actualizados
      queryClient.invalidateQueries({ queryKey: ['voidDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['voidDocumentSunatStatus'] });
      toast.success('Estados de anulaciones actualizados');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al actualizar estados');
      toast.error(message);
    },
  });
};
