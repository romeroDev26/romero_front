/**
 * Hook personalizado para detección de embarcaciones sin asientos
 * Reemplaza la lógica duplicada en SaleForm.tsx
 */

import { useQuery } from '@tanstack/react-query';
import { VesselDetectionService } from './vesselDetectionService';
import { VesselDetectionResult } from './types';

interface UseVesselDetectionOptions {
  tripId: number | null;
  vesselName?: string;
  enabled?: boolean;
}

export const useVesselDetection = ({ 
  tripId, 
  vesselName, 
  enabled = true 
}: UseVesselDetectionOptions) => {
  
  const query = useQuery<VesselDetectionResult>({
    queryKey: ['vesselDetection', tripId],
    queryFn: async () => {
      if (!tripId) {
        throw new Error('Trip ID is required');
      }
      
      const result = await VesselDetectionService.detectVesselType(tripId, vesselName);
      
      return result;
    },
    enabled: enabled && !!tripId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    retry: 1, // Solo reintentar una vez en caso de error
  });

  return {
    ...query,
    hasSeats: query.data?.hasSeats ?? true, // Por defecto asumir que tiene asientos
    detectionMethod: query.data?.method,
    confidence: query.data?.confidence,
    canSellWithoutSeats: query.data ? !query.data.hasSeats : false,
    showSeatMap: query.data ? query.data.hasSeats : true,
  };
};