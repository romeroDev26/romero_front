// src/features/fluvial/hooks/useSeatTypesData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import {
  seatTypesService,
  SeatTypeCreateData,
  SeatTypeUpdateData
} from '../../../services/seat-types.service';
import { SeatType } from '../../../types';

// ========================================
// HOOKS PARA TIPOS DE ASIENTO
// ========================================

export const useSeatTypes = (isActive = true) => {
  return useQuery({
    queryKey: ['seatTypes', { isActive }],
    queryFn: () => seatTypesService.getAll({ is_active: isActive }),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// **AÑADIR ESTA LÍNEA** para que coincida con el código que ya escribimos.
// Simplemente estamos creando un alias para mantener la consistencia.
export const useSeatTypesData = useSeatTypes;

export const useSeatType = (seatTypeId: number | null) => {
  return useQuery({
    queryKey: ['seatType', seatTypeId],
    queryFn: () => seatTypeId ? seatTypesService.getById(seatTypeId) : null,
    enabled: !!seatTypeId,
  });
};

export const useCreateSeatType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SeatTypeCreateData) => seatTypesService.create(data),
    onSuccess: (newSeatType) => {
      // Actualizar la cache con el nuevo tipo de asiento
      queryClient.setQueryData<SeatType[]>(['seatTypes', { isActive: true }], (old) => {
        if (!old) return [newSeatType];
        return [...old, newSeatType].sort((a, b) => a.display_order - b.display_order);
      });

      toast.success(`Tipo de asiento ${newSeatType.name} creado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al crear el tipo de asiento';
      toast.error(message);
    },
  });
};

export const useUpdateSeatType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SeatTypeUpdateData }) =>
      seatTypesService.update(id, data),
    onSuccess: (updatedSeatType) => {
      // Actualizar la cache
      queryClient.setQueryData<SeatType[]>(['seatTypes', { isActive: true }], (old) => {
        if (!old) return [];
        return old
          .map(seatType => seatType.id === updatedSeatType.id ? updatedSeatType : seatType)
          .sort((a, b) => a.display_order - b.display_order);
      });

      // Invalidar query específica
      queryClient.invalidateQueries({ queryKey: ['seatType', updatedSeatType.id] });

      toast.success(`Tipo de asiento ${updatedSeatType.name} actualizado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar el tipo de asiento';
      toast.error(message);
    },
  });
};

export const useDeleteSeatType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => seatTypesService.delete(id),
    onSuccess: (deletedSeatType) => {
      // Actualizar la cache removiendo el tipo de asiento
      queryClient.setQueryData<SeatType[]>(['seatTypes', { isActive: true }], (old) => {
        if (!old) return [];
        return old.filter(seatType => seatType.id !== deletedSeatType.id);
      });

      toast.success(`Tipo de asiento ${deletedSeatType.name} desactivado exitosamente`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al desactivar el tipo de asiento';
      toast.error(message);
    },
  });
};

// Hook para manejar el cambio de orden
export const useUpdateSeatTypeOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ seatTypes }: { seatTypes: { id: number; display_order: number }[] }) => {
      // Actualizar el orden de cada tipo de asiento
      const promises = seatTypes.map(({ id, display_order }) =>
        seatTypesService.update(id, { display_order })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidar la query para recargar los datos
      queryClient.invalidateQueries({ queryKey: ['seatTypes'] });
      toast.success('Orden actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar el orden';
      toast.error(message);
    },
  });
};
