// src/features/fluvial/hooks/useTrips.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import {
  tripsService,
  CreateTripData,
  UpdateTripData,
  CancelTripData,
  SearchTripsParams
} from '../../../services/trips.service';
import { PreviewVesselChangeRequest, PreviewVesselChangeResponse } from '../../../types';
import { Trip } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';

export const useTrips = (filters: { tripName?: string, status?: string[] }) => {
  const debouncedFilters = useDebounce(filters, 500);

  return useQuery<Trip[], Error>({
    queryKey: ['trips', debouncedFilters],
    queryFn: () => {
      const companyId = 1; // OBTENER DE FORMA DINÁMICA (ej. auth context)

      const searchParams: SearchTripsParams = {
        company_id: companyId,
        status: debouncedFilters.status,
        ...(debouncedFilters.tripName && { trip_name_like: debouncedFilters.tripName })
      };

      return tripsService.search(searchParams);
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useTripMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateTripData) => tripsService.create(data),
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
    createTrip: createMutation.mutateAsync,
    updateTrip: updateMutation.mutateAsync,
    cancelTrip: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending
  };
};

export const useTripDetails = (tripId: number | null) => {
  return useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => tripsService.getById(tripId!),
    enabled: !!tripId
  });
};

export const usePreviewVesselChange = () => {
  return useMutation<PreviewVesselChangeResponse, Error, { tripId: number; data: PreviewVesselChangeRequest }>({
    mutationFn: ({ tripId, data }) => tripsService.previewVesselChange(tripId, data),
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Error al previsualizar el cambio de embarcación';
      toast.error(message);
    }
  });
};
