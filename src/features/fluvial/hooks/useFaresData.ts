// src/features/fluvial/hooks/useFaresData.ts
import { useQuery } from '@tanstack/react-query';
import fareService from '../../../services/fareService';
import { Fare, ServiceCategory } from '../../../types';
import { routeHelpers } from '../../../services/routes.service';
import { format } from 'date-fns';

interface UseFareParams {
  originPortId: number | null;
  destinationPortId: number | null;
  serviceCategory: ServiceCategory;
}

export const useFindFare = ({ originPortId, destinationPortId, serviceCategory }: UseFareParams) => {
  const companyId = routeHelpers.getCurrentCompanyId();

  return useQuery<Fare | null, Error>({
    queryKey: ['findFare', companyId, originPortId, destinationPortId, serviceCategory],
    queryFn: () => {
      // La consulta solo se ejecuta si tenemos todos los datos
      if (!originPortId || !destinationPortId) {
        return Promise.resolve(null);
      }
      return fareService.findFare({
        company_id: companyId,
        origin_port_id: originPortId,
        destination_port_id: destinationPortId,
        service_category: serviceCategory,
        on_date: format(new Date(), 'yyyy-MM-dd')
      });
    },
    enabled: !!originPortId && !!destinationPortId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
};