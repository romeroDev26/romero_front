// src/features/fluvial/hooks/useScheduledTemplates.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import {
  scheduledTemplatesService,
  CreateScheduledTemplateData,
  UpdateScheduledTemplateData
} from '../../../services/scheduled-templates.service';
import { ScheduledRouteTemplate } from '../../../types';
import { getErrorMessage } from '../../../utils/errorHandler';

export const useScheduledTemplates = (companyId?: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['scheduled-templates', companyId];

  const {
    data: templates = [],
    isLoading,
    error,
    refetch
  } = useQuery<ScheduledRouteTemplate[]>({
    queryKey,
    queryFn: () => scheduledTemplatesService.getByCompany(companyId!),
    enabled: !!companyId && companyId > 0,
  });

  // Mutation para crear plantilla
  const createMutation = useMutation({
    mutationFn: (data: CreateScheduledTemplateData) =>
      scheduledTemplatesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Plantilla creada exitosamente');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al crear la plantilla');
      toast.error(message);
    }
  });

  // Mutation para actualizar plantilla
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateScheduledTemplateData }) =>
      scheduledTemplatesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Plantilla actualizada exitosamente');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al actualizar la plantilla');
      toast.error(message);
    }
  });

  // Mutation para desactivar plantilla
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => scheduledTemplatesService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Plantilla desactivada exitosamente');
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'Error al desactivar la plantilla');
      toast.error(message);
    }
  });

  return {
    templates,
    isLoading,
    error,
    refetch,
    createTemplate: createMutation.mutate,
    updateTemplate: updateMutation.mutate,
    deactivateTemplate: deactivateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending
  };
};
