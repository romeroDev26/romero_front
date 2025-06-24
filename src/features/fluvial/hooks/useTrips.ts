import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  tripsService,
  CreateTripData,
  UpdateTripData,
  CancelTripData
} from '../../../services/trips.service';
import { Trip } from '../../../types';

// Este hook ahora se enfoca solo en las mutaciones (acciones de escritura)
// y en obtener detalles de un solo viaje.
export const useTripMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateTripData) => tripsService.create(data),
    // Al tener éxito, invalidamos la caché general de 'tripsView'
    // para que cualquier vista activa se refresque.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripsView'] });
      toast.success('Viaje creado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al crear el viaje';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTripData }) =>
      tripsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripsView'] });
      // También invalidamos el detalle específico si se está viendo
      queryClient.invalidateQueries({ queryKey: ['trip'] });
      toast.success('Viaje actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al actualizar el viaje';
      toast.error(message);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelTripData }) =>
      tripsService.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripsView'] });
      toast.success('Viaje cancelado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al cancelar el viaje';
      toast.error(message);
    }
  });

  return {
    createTrip: createMutation.mutateAsync, // Usamos mutateAsync para poder usar onSuccess en el componente
    updateTrip: updateMutation.mutateAsync,
    cancelTrip: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending
  };
};

// El hook de detalles se mantiene igual, es muy útil.
export const useTripDetails = (tripId: number | null) => {
  return useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => tripsService.getById(tripId!),
    enabled: !!tripId
  });
};