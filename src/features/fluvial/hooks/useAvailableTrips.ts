// src/features/fluvial/hooks/useAvailableTrips.ts
import { useQuery } from '@tanstack/react-query';
import { tripsService, AvailableTripByPort } from '../../../services/trips.service'; 
import { routeHelpers } from '../../../services/routes.service';

interface UseAvailableTripsParams {
  portId: number | null;
  onDate: string; // Formato YYYY-MM-DD
}

export const useAvailableTrips = ({ portId, onDate }: UseAvailableTripsParams) => {
  const companyId = routeHelpers.getCurrentCompanyId();

  return useQuery<AvailableTripByPort[], Error>({
    queryKey: ['availableTrips', companyId, portId, onDate],
    queryFn: () => {
      // La consulta solo se ejecuta si portId no es nulo
      if (!portId) {
        return Promise.resolve([]);
      }
      return tripsService.getTripsByBoardingPort(companyId, portId, onDate);
    },
    enabled: !!portId && !!onDate, // Habilitar solo si tenemos los parámetros necesarios
  });
};