// src/features/fluvial/hooks/useSeatMap.ts
import { useQuery } from '@tanstack/react-query';
import { tripsService } from '../../../services/trips.service';

export const useSeatMap = (tripId: number | null) => {
  return useQuery({
    queryKey: ['seatMap', tripId],
    queryFn: () => {
      if (!tripId) return null;
      return tripsService.getSeatMap(tripId);
    },
    enabled: !!tripId,
    staleTime: 1000 * 60, // 1 minuto de cache, ya que la disponibilidad puede cambiar rápidamente
  });
};