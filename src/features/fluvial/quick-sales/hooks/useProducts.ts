// src/features/fluvial/quick-sales/hooks/useProducts.ts

import { useQuery } from '@tanstack/react-query';
import { productsServicesService } from '../../../../services/products-services.service';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products-services', { is_active: true }],
    queryFn: () => productsServicesService.getActive({ limit: 200 }),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
