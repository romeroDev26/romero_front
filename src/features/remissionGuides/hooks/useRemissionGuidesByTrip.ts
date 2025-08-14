// src/features/remissionGuides/hooks/useRemissionGuidesByTrip.ts
import { useQuery } from '@tanstack/react-query';
import { remissionGuidesService } from '../../../services/remissionGuides.service';
import { routeHelpers } from '../../../services/routes.service';

interface UseRemissionGuidesByTripParams {
  tripId?: number;
  onDate?: string; // Para obtener guías de una fecha específica
}

export const useRemissionGuidesByTrip = ({ tripId, onDate }: UseRemissionGuidesByTripParams) => {
  const companyId = routeHelpers.getCurrentCompanyId();

  return useQuery({
    queryKey: ['remissionGuides', 'byTrip', companyId, tripId, onDate],
    queryFn: async () => {
      const guides = await remissionGuidesService.list({
        company_id: companyId,
        limit: 100 // Obtener suficientes para el análisis
      });
      
      // Filtrar por trip_id si se proporciona
      if (tripId) {
        return guides.filter(guide => guide.trip_id === tripId);
      }
      
      // Si se proporciona fecha, filtrar por fecha de envío
      if (onDate) {
        return guides.filter(guide => 
          guide.shipment_start_date === onDate || 
          guide.issue_date === onDate
        );
      }
      
      return guides;
    },
    enabled: !!companyId && (!!tripId || !!onDate),
  });
};

export const useRemissionGuidesForDate = (onDate: string) => {
  const companyId = routeHelpers.getCurrentCompanyId();

  return useQuery({
    queryKey: ['remissionGuides', 'byDate', companyId, onDate],
    queryFn: async () => {
      const guides = await remissionGuidesService.list({
        company_id: companyId,
        limit: 100
      });
      
      // Filtrar guías para la fecha específica
      return guides.filter(guide => 
        guide.shipment_start_date === onDate || 
        guide.issue_date === onDate
      );
    },
    enabled: !!companyId && !!onDate,
  });
};
