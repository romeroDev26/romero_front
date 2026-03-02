// src/features/fluvial/hooks/useAvailableTripsCalendar.ts
import { useQuery } from '@tanstack/react-query';
import { tripsService, AvailableTripByPort } from '../../../services/trips.service'; 
import { routeHelpers } from '../../../services/routes.service';
import { format, startOfMonth, endOfMonth, isAfter, startOfDay } from 'date-fns';

interface UseAvailableTripsCalendarParams {
  portId: number | null;
  currentMonth: Date;
}

export const useAvailableTripsCalendar = ({ portId, currentMonth }: UseAvailableTripsCalendarParams) => {
  const companyId = routeHelpers.getCurrentCompanyId();
  
  return useQuery<Record<string, AvailableTripByPort[]>, Error>({
    queryKey: ['availableTripsCalendar', companyId, portId, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!portId) {
        return {};
      }

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const today = startOfDay(new Date());
      
      // Calcular el rango de fechas (desde hoy hasta fin de mes)
      const startDate = isAfter(monthStart, today) ? monthStart : today;
      const endDate = monthEnd;
      
      const onDate = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      // OPTIMIZADO: Una sola petición para todo el mes usando el nuevo endpoint
      try {
        const trips = await tripsService.getTripsByBoardingPort(companyId, portId, onDate, endDateStr);
        
        // Organizar los viajes por fecha
        const tripsByDate: Record<string, AvailableTripByPort[]> = {};
        
        trips.forEach(trip => {
          // Extraer la fecha del campo departure_datetime o estimated_departure_time
          // (ambos vienen como ISO datetime, por ejemplo "2026-03-05T21:50:00")
          const datetimeStr = trip.departure_datetime || trip.estimated_departure_time || trip.boarding_date || trip.departure_date;
          const tripDate = datetimeStr ? datetimeStr.substring(0, 10) : onDate;
          
          if (!tripsByDate[tripDate]) {
            tripsByDate[tripDate] = [];
          }
          tripsByDate[tripDate].push(trip);
        });
        
        return tripsByDate;
      } catch (error) {
        console.error('Error fetching trips for month:', error);
        return {};
      }
    },
    enabled: !!portId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
