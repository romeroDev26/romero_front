import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsService } from '../services/trips.service';
import { SunatDocType } from '../features/fluvial/types/sunat.types';

function isDocReadyForCheck(docType: string | undefined, docNumber: string): boolean {
  const trimmed = docNumber.trim();
  if (!trimmed || !docType || docType === SunatDocType.RUC) {
    return false;
  }
  if (docType === SunatDocType.DNI) {
    return trimmed.length === 8;
  }
  return trimmed.length >= 6;
}

export function useTripPassengerTicketCheck(params: {
  tripId?: number;
  docType?: string;
  docNumber?: string;
  enabled?: boolean;
}) {
  const { tripId, docType, docNumber, enabled = true } = params;
  const [debouncedDocNumber, setDebouncedDocNumber] = useState((docNumber || '').trim());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedDocNumber((docNumber || '').trim());
    }, 500);
    return () => window.clearTimeout(timer);
  }, [docNumber]);

  const shouldCheck = Boolean(
    enabled &&
      tripId &&
      isDocReadyForCheck(docType, debouncedDocNumber)
  );

  const query = useQuery({
    queryKey: ['tripPassengerTicketCheck', tripId, docType, debouncedDocNumber],
    queryFn: () =>
      tripsService.checkPassengerTicket(tripId!, debouncedDocNumber, docType),
    enabled: shouldCheck,
    staleTime: 30_000,
  });

  return {
    loading: shouldCheck && query.isFetching,
    matches: shouldCheck && query.data?.has_existing_ticket ? query.data.matches : [],
  };
}
