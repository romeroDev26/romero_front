// src/features/fluvial/hooks/useAvailableTripsCalendar.ts
import { useQuery } from '@tanstack/react-query';
import { tripsService, AvailableTripByPort } from '../../../services/trips.service'; 
import { routeHelpers } from '../../../services/routes.service';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, startOfDay } from 'date-fns';

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
      
      // Obtener todos los días del mes a partir de hoy
      const daysToQuery = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(date => isAfter(date, today) || format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));

      // Hacer una consulta por cada día válido
      const tripsByDate: Record<string, AvailableTripByPort[]> = {};
      
      await Promise.all(
        daysToQuery.map(async (date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          try {
            const trips = await tripsService.getTripsByBoardingPort(companyId, portId, dateKey);
            if (trips.length > 0) {
              tripsByDate[dateKey] = trips;
            }
          } catch (error) {
            console.warn(`Error fetching trips for ${dateKey}:`, error);
          }
        })
      );

      return tripsByDate;
    },
    enabled: !!portId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
