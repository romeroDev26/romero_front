// src/hooks/useCancellationRequests.ts

import { useState, useCallback, useMemo } from 'react';
import { cancellationRequestsService } from '../features/accounting/services/cancellationRequests.service';
import {
  CancellationRequestListItem,
  CancellationRequestListParams
} from '../features/accounting/types/cancellationRequests';
import { asApiError, detailToString } from '../utils/errorHandler';

interface UseCancellationRequestsOptions {
  params?: CancellationRequestListParams;
}

export const useCancellationRequests = (options: UseCancellationRequestsOptions = {}) => {
  const { params = {} } = options;

  const [pendingRequests, setPendingRequests] = useState<CancellationRequestListItem[]>([]);
  const [allRequests, setAllRequests] = useState<CancellationRequestListItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Memoizar params para evitar recreaciones innecesarias
  const paramsString = useMemo(() => JSON.stringify(params), [params]);

  // Fetch solicitudes pendientes
  const fetchPendingRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const parsedParams = JSON.parse(paramsString);
      const data = await cancellationRequestsService.getPending(parsedParams);
      setPendingRequests(data);
      setPendingCount(data.length);
    } catch (err) {
      const apiError = asApiError(err);
      const errorMessage = detailToString(apiError.response?.data?.detail) || apiError.message || 'Error al cargar solicitudes pendientes';
      setError(errorMessage);
      console.error('Error fetching pending requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [paramsString]);

  // Fetch todas las solicitudes
  const fetchAllRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const parsedParams = JSON.parse(paramsString);
      const data = await cancellationRequestsService.getAll(parsedParams);
      setAllRequests(data);
    } catch (err) {
      const apiError = asApiError(err);
      const errorMessage = detailToString(apiError.response?.data?.detail) || apiError.message || 'Error al cargar solicitudes';
      setError(errorMessage);
      console.error('Error fetching all requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [paramsString]);

  // Fetch solo el conteo de pendientes
  const fetchPendingCount = useCallback(async () => {
    try {
      const count = await cancellationRequestsService.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  }, []);

  // Refresh manual (ya no hay polling automático)
  const refresh = useCallback(() => {
    fetchPendingRequests();
    fetchAllRequests();
    fetchPendingCount();
  }, []);

  return {
    pendingRequests,
    allRequests,
    pendingCount,
    isLoading,
    error,
    fetchPendingRequests,
    fetchAllRequests,
    fetchPendingCount,
    refresh
  };
};
