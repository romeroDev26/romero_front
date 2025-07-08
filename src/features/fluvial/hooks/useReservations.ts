// src/features/fluvial/hooks/useReservations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { reservationsService, ReservationCreateData, ReservationUpdateData, ReservationSearchParams } from '../../../services/reservations.service';
import { SeatReservation } from '../../../types';

// Hook para buscar reservas
export const useSearchReservations = (filters: Omit<ReservationSearchParams, 'company_id'>) => {
  return useQuery<SeatReservation[], Error>({
    queryKey: ['reservations', filters],
    queryFn: () => {
      // Asumimos que podemos obtener el company_id de alguna forma
      const companyId = 1; // Reemplazar con lógica real de autenticación

      if (!filters.branch_office_id) {
        // No hacemos la búsqueda si no hay una sucursal seleccionada
        return Promise.resolve([]);
      }

      return reservationsService.search({ ...filters, company_id: companyId });
    },
    enabled: !!filters.branch_office_id, // La query solo se ejecuta si hay un branch_office_id
  });
};

// Hook para obtener todas las reservas de un viaje
export const useReservationsByTrip = (tripId: number | null) => {
  return useQuery<SeatReservation[], Error>({
    queryKey: ['reservations', tripId],
    queryFn: () => (tripId ? reservationsService.getByTrip(tripId) : Promise.resolve([])),
    enabled: !!tripId,
  });
};

// Hook para crear una nueva reserva
export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<SeatReservation, Error, ReservationCreateData>({
    mutationFn: (data) => reservationsService.create(data),
    onSuccess: (newReservation) => {
      toast.success(`Asiento ${newReservation.seat_number} reservado.`);
      // Invalidamos el mapa de asientos para que se actualice el estado a 'RESERVED'
      queryClient.invalidateQueries({ queryKey: ['seatMap', newReservation.trip_id] });
      // Invalidamos la lista de reservas del viaje
      queryClient.invalidateQueries({ queryKey: ['reservations', newReservation.trip_id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Error al crear la reserva.");
    },
  });
};

// Hook para actualizar una reserva (confirmar, cancelar)
export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<SeatReservation, Error, { reservationId: number; data: Partial<ReservationUpdateData>; tripId: number }>({
    mutationFn: ({ reservationId, data }) => reservationsService.update(reservationId, data),
    onSuccess: (updatedReservation, variables) => {
      toast.success(`Reserva actualizada a ${updatedReservation.status}.`);
      // Invalidar para actualizar la lista de reservas y el mapa de asientos
      queryClient.invalidateQueries({ queryKey: ['reservations', variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ['seatMap', variables.tripId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Error al actualizar la reserva.");
    },
  });
};
