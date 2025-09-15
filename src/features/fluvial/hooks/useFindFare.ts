// src/features/fluvial/hooks/useFindFare.ts
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
      // No ejecutar la consulta si faltan los puertos
      if (!originPortId || !destinationPortId) {
        return Promise.resolve(null);
      }

      const params = {
        company_id: companyId,
        origin_port_id: originPortId,
        destination_port_id: destinationPortId,
        service_category: serviceCategory,
        on_date: format(new Date(), 'yyyy-MM-dd')
      };

      // Llamamos al método findFare del servicio que ya tienes
      return fareService.findFare(params);
    },
    enabled: !!originPortId && !!destinationPortId, // Habilitar solo cuando tenemos ambos puertos
    staleTime: 1000 * 60 * 15, // Las tarifas no cambian tan a menudo, 15 min de cache está bien
  });
};