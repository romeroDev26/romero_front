// src/hooks/useCompanyInfo.ts
import { useQuery } from '@tanstack/react-query';
import { companiesService } from '../services/companies.service';

export const useCompanyInfo = () => {
  return useQuery({
    queryKey: ['company-info'],
    queryFn: () => companiesService.getById(1),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos para evitar llamadas excesivas
  });
};