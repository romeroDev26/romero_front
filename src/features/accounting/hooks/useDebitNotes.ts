// src/features/accounting/hooks/useDebitNotes.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debitNotesService } from '../services/debitNotes.service';
import { 
  DebitNotesListParams, 
  DebitNoteCreateData,
} from '../types';
import { toast } from '@/utils/sileo-toast';

// Hook para listar notas de débito
export const useDebitNotes = (params: DebitNotesListParams) => {
  return useQuery({
    queryKey: ['debitNotes', params],
    queryFn: () => debitNotesService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para obtener una nota de débito por ID
export const useDebitNote = (id: number | null) => {
  return useQuery({
    queryKey: ['debitNote', id],
    queryFn: () => debitNotesService.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear una nota de débito
export const useCreateDebitNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: DebitNoteCreateData) => debitNotesService.create(data),
    onSuccess: (data) => {
      toast.success(`Nota de Débito ${data.identifier} generada correctamente. Se está enviando a SUNAT.`);
      queryClient.invalidateQueries({ queryKey: ['debitNotes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la nota de débito');
    },
  });
};

// Hook para consultar estado SUNAT
export const useDebitNoteSunatStatus = (id: number | null) => {
  return useQuery({
    queryKey: ['debitNoteSunatStatus', id],
    queryFn: () => debitNotesService.checkSunatStatus(id!),
    enabled: !!id,
    refetchInterval: (data) => {
      // Polling cada 30 segundos si está en estado PENDING o SENT
      if (data?.state.data?.sunat_status === 'PENDING' || data?.state.data?.sunat_status === 'SENT') {
        return 30000;
      }
      return false;
    },
    staleTime: 1000 * 15, // 15 segundos
  });
};

// Hook para refrescar estados pendientes
export const useRefreshDebitNotePendingStatuses = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (limit?: number) => debitNotesService.refreshPendingStatuses(limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debitNotes'] });
      queryClient.invalidateQueries({ queryKey: ['debitNoteSunatStatus'] });
      toast.info('Estados SUNAT actualizados');
    },
    onError: () => {
      toast.error('Error al actualizar estados SUNAT');
    },
  });
};
