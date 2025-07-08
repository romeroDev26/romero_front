// src/features/fluvial/hooks/useSeatAssignments.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { assignmentsService, SeatAssignmentCreateData } from '../../../services/assignments.service';

/**
 * Hook (mutación) para crear una nueva asignación de asiento.
 * Se debe llamar después de que la factura y su item hayan sido creados.
 */
export const useCreateSeatAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SeatAssignmentCreateData) => assignmentsService.create(data),
    onSuccess: (newAssignment) => {
      // Opcional: notificar éxito de la asignación (puede ser redundante si ya hay un toast de venta exitosa)
      // toast.success(`Asiento ${newAssignment.seat_number} asignado correctamente.`);

      // Invalidamos el mapa de asientos para que se actualice y muestre el asiento como 'CONFIRMED'
      queryClient.invalidateQueries({ queryKey: ['seatMap', newAssignment.trip_id] });
    },
    onError: (error: any) => {
      // Este error es crítico, porque la factura ya se creó.
      // Se debe notificar al usuario para que contacte a soporte.
      console.error("Error crítico: La factura se creó pero la asignación del asiento falló.", error);
      toast.error(
        '¡Atención! La factura se generó pero hubo un error al asignar el asiento. Por favor, contacte a soporte.'
      );
    },
  });
};