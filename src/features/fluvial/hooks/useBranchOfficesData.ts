// src/features/fluvial/hooks/useBranchOfficesData.ts
import { useQuery } from '@tanstack/react-query';
import { branchOfficesService } from '../../../services/branchOffices.service';
import { BranchOffice } from '../../../types';
import { routeHelpers } from '../../../services/routes.service';

export const useBranchOfficesData = () => {
  // Obtenemos el company_id desde el helper que ya tienes
  const companyId = routeHelpers.getCurrentCompanyId();

  return useQuery<BranchOffice[], Error>({
    // La queryKey debe ser única para esta consulta
    queryKey: ['branchOffices', companyId],
    // La función que llama al servicio
    queryFn: () => branchOfficesService.getAllByCompany(companyId),
    // La consulta solo se habilita si tenemos un companyId válido
    enabled: !!companyId,
    // Podemos cachear estos datos por un buen tiempo ya que no cambian a menudo
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
};