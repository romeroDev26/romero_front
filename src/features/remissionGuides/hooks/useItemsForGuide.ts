// src/features/remissionGuides/hooks/useItemsForGuide.ts

import { useQuery } from '@tanstack/react-query';
import { invoicesService, ItemForGuide } from '../../../services/invoices.service';

export const useItemsForGuide = (tripId: number | null) => {
  return useQuery<ItemForGuide[], Error>({
    queryKey: ['itemsForGuide', tripId],
    queryFn: () => {
      if (!tripId) {
        // Si no hay tripId, no hacemos la llamada y devolvemos un array vacío.
        return Promise.resolve([]);
      }
      return invoicesService.getItemsForGuide(tripId);
    },
    // La query solo se activa si tripId tiene un valor.
    enabled: !!tripId, 
  });
};