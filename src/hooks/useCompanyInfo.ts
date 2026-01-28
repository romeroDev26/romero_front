// src/hooks/useCompanyInfo.ts
import { useQuery } from '@tanstack/react-query';
import { companiesService } from '../services/companies.service';

export const useCompanyInfo = () => {
  return useQuery({
    queryKey: ['company-info'],
    queryFn: async () => {
      try {
        return await companiesService.getById(1);
      } catch (error: any) {
        // Si es error 403 (sin permisos), retornar datos mínimos en lugar de fallar
        if (error?.response?.status === 403) {
          console.debug('Usuario sin permisos para ver información completa de la compañía');
          // Retornar objeto con datos mínimos o vacíos
          return {
            id: 1,
            business_name: '',
            trade_name: '',
            ruc: '',
            address_line: '',
            phone: '',
            email: '',
            legal_representative: '',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos para evitar llamadas excesivas
    retry: false, // No reintentar en caso de error 403
  });
};