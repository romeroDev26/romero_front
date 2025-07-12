// src/features/accounting/hooks/useCreditNotes.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditNotesService } from '../services/creditNotes.service';
import { CreditNotesListParams, CreditNoteCreateData } from '../types';
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

// Hook para crear una nota de crédito
export const useCreateCreditNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreditNoteCreateData) => creditNotesService.create(data),
    onSuccess: (data) => {
      toast.success(`Nota de Crédito ${data.series}-${data.number} generada correctamente. Se está enviando a SUNAT.`);
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear la nota de crédito');
    },
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