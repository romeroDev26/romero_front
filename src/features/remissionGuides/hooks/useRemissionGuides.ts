// src/features/remissionGuides/hooks/useRemissionGuides.ts

import { useQuery } from '@tanstack/react-query';
import { remissionGuidesService } from '../../../services/remissionGuides.service';

interface UseRemissionGuidesParams {
  company_id: number | null;
  // Aquí podríamos añadir filtros como searchTerm, status, etc.
}

export const useRemissionGuides = (params: UseRemissionGuidesParams) => {
  return useQuery({
    queryKey: ['remissionGuides', params],
    queryFn: () => {
      if (!params.company_id) {
        return Promise.resolve([]);
      }
      return remissionGuidesService.list({ company_id: params.company_id });
    },
    enabled: !!params.company_id, // Solo se ejecuta si hay un company_id
  });
};