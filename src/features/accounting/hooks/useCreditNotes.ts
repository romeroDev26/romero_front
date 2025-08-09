// src/features/accounting/hooks/useCreditNotes.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditNotesService } from '../services/creditNotes.service';
import { 
  CreditNotesListParams, 
  CreditNoteCreateData, 
  CreditNoteAnnulData 
} from '../types';
import { toast } from 'react-toastify';

// Hook para listar notas de crédito
export const useCreditNotes = (params: CreditNotesListParams) => {
  return useQuery({
    queryKey: ['creditNotes', params],
    queryFn: () => creditNotesService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para obtener una nota de crédito por ID
export const useCreditNote = (id: number | null) => {
  return useQuery({
    queryKey: ['creditNote', id],
    queryFn: () => creditNotesService.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para crear una nota de crédito (método principal)
export const useCreateCreditNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreditNoteCreateData) => creditNotesService.create(data),
    onSuccess: (data) => {
      // Usar el formato correcto del backend
      const identifier = `${data.series}-${String(data.number).padStart(8, '0')}`;
      toast.success(`Nota de Crédito ${identifier} generada correctamente. Se está enviando a SUNAT.`);
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la nota de crédito');
    },
  });
};

// Hook para crear nota de crédito por anulación
export const useCreateCreditNoteByAnnulment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreditNoteAnnulData) => creditNotesService.createByAnnulment(data),
    onSuccess: (data) => {
      // Usar el formato correcto del backend
      const identifier = `${data.series}-${String(data.number).padStart(8, '0')}`;
      toast.success(`Nota de Crédito ${identifier} por anulación creada correctamente.`);
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la nota de crédito por anulación');
    },
  });
};

// Hook para consultar estado SUNAT
export const useCreditNoteSunatStatus = (id: number | null) => {
  return useQuery({
    queryKey: ['creditNoteSunatStatus', id],
    queryFn: () => creditNotesService.checkSunatStatus(id!),
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

// Hook para obtener facturas que pueden ser anuladas
export const useVoidableInvoices = (companyId: number) => {
  return useQuery({
    queryKey: ['voidableInvoices', companyId],
    queryFn: () => creditNotesService.getVoidableInvoices(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para refrescar estados pendientes
export const useRefreshPendingStatuses = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (limit?: number) => creditNotesService.refreshPendingStatuses(limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['creditNoteSunatStatus'] });
      toast.info('Estados SUNAT actualizados');
    },
    onError: () => {
      toast.error('Error al actualizar estados SUNAT');
    },
  });
};