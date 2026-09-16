// src/features/quotations/hooks/useQuotations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import { quotationsService } from '../services/quotations.service';
import { 
  Quotation, 
  QuotationsListParams, 
  QuotationCreate,
  QuotationStatusUpdate,
  ConvertToInvoiceData
} from '../types';
import { getErrorMessage } from '../../../utils/errorHandler';

// Tipos para las respuestas
interface QuotationsListResponse {
  data: Quotation[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const QUOTATIONS_QUERY_KEY = 'quotations';

// Hook para obtener lista de cotizaciones con paginacion y filtros
export const useQuotationsList = (params: QuotationsListParams = {}) => {
  return useQuery<QuotationsListResponse, Error>({
    queryKey: [QUOTATIONS_QUERY_KEY, 'list', params],
    queryFn: () => quotationsService.getList(params),
    staleTime: 1000 * 60 * 2, // Cache por 2 minutos
  });
};

// Hook para crear cotizacion
export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Quotation, Error, QuotationCreate>({
    mutationFn: (data: QuotationCreate) => quotationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTATIONS_QUERY_KEY] });
      toast.success('Cotización creada exitosamente');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al crear cotización');
      toast.error(message);
    },
  });
};

// Hook para actualizar estado de cotizacion
export const useUpdateQuotationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Quotation, Error, { id: number; data: QuotationStatusUpdate }>({
    mutationFn: ({ id, data }) => quotationsService.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTATIONS_QUERY_KEY] });
      toast.success('Estado actualizado exitosamente');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al actualizar estado');
      toast.error(message);
    },
  });
};

// Hook para eliminar cotizacion
export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, number>({
    mutationFn: (id: number) => quotationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTATIONS_QUERY_KEY] });
      toast.success('Cotización eliminada exitosamente');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al eliminar cotización');
      toast.error(message);
    },
  });
};

// Hook para enviar cotizacion por email
export const useSendQuotationByEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation<string, Error, { id: number; emailData?: any }>({
    mutationFn: ({ id, emailData }) => quotationsService.sendByEmail(id, emailData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTATIONS_QUERY_KEY] });
      toast.success('Cotización enviada por email exitosamente');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al enviar por email');
      toast.error(message);
    },
  });
};

// Hook para convertir cotizacion a factura
export const useConvertQuotationToInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation<string, Error, { id: number; data: ConvertToInvoiceData }>({
    mutationFn: ({ id, data }) => quotationsService.convertToInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTATIONS_QUERY_KEY] });
      toast.success('Cotización convertida a factura exitosamente');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al convertir a factura');
      toast.error(message);
    },
  });
};
