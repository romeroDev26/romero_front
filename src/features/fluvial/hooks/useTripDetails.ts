// src/features/fluvial/hooks/useTripDetails.ts
import { useQuery } from '@tanstack/react-query';
import { tripsService } from '../../../services/trips.service';

export const useTripDetails = (tripId: number | null) => {
  return useQuery({
    queryKey: ['tripDetails', tripId],
    queryFn: () => {
      // La consulta no se ejecuta si no hay tripId
      if (!tripId) {
        return Promise.resolve(null);
      }
      // Llamamos al método getById que ahora devuelve los detalles completos
      return tripsService.getById(tripId);
    },
    enabled: !!tripId, // Habilitar la consulta solo cuando tripId es válido
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos es razonable para detalles de un viaje en curso
  });
};