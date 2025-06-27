// src/hooks/usePorts.ts
import { useQuery } from '@tanstack/react-query';
import { portsConfigService } from '../services/ports.cities.service';
import { Port } from '../types';
import { routeHelpers } from '../services/routes.service'; // Usaremos el helper

export const usePortsData = () => {
  const companyId = routeHelpers.getCurrentCompanyId();

  return useQuery<Port[], Error>({
    queryKey: ['ports', companyId],
    queryFn: () => portsConfigService.getAll({ 
      company_id: companyId,
      limit: 200, // Un límite alto para asegurar que obtenemos todos
      is_active: true 
    }),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 15, // Cache de 15 minutos
  });
};