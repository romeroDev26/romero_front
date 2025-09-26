//src/hooks/useDocumentSeries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { documentSeriesService, DocumentSeriesCreateData, DocumentSeriesUpdateData } from '../services/documentSeries.service';
import { getErrorMessage } from '../utils/errorHandler';

const QUERY_KEY = 'documentSeries';

export const useDocumentSeries = (companyId: number | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEY, companyId],
    queryFn: () => documentSeriesService.getAllByCompany(companyId!),
    enabled: !!companyId, // La query solo se ejecutará si companyId tiene un valor
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreateDocumentSeries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentSeriesCreateData) => documentSeriesService.create(data),
    onSuccess: (newSeries) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Serie "${newSeries.series_code}" creada exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al crear la serie. Verifique que la combinación no exista.');
      toast.error(message);
    },
  });
};

export const useUpdateDocumentSeries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DocumentSeriesUpdateData }) => documentSeriesService.update(id, data),
    onSuccess: (updatedSeries) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Serie "${updatedSeries.series_code}" actualizada exitosamente.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al actualizar la serie.');
      toast.error(message);
    },
  });
};

export const useDeactivateDocumentSeries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentSeriesService.deactivate(id),
    onSuccess: (deactivatedSeries) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.warning(`Serie "${deactivatedSeries.series_code}" ha sido desactivada.`);
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al desactivar la serie.');
      toast.error(message);
    },
  });
};