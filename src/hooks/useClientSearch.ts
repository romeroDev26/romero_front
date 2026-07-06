// src/hooks/useClientSearch.ts
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/clients.service';
import { Client } from '../types';
import { useDebounce } from './useDebounce';

interface UseClientSearchOptions {
  limit?: number;
  minChars?: number;
  debounceMs?: number;
}

/**
 * Hook para buscar clientes por nombre con debounce.
 * Usa el endpoint de búsqueda difusa (fuzzy search / trigramas).
 */
export function useClientSearch(options: UseClientSearchOptions = {}) {
  const { limit = 10, minChars = 2, debounceMs = 400 } = options;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  const isEnabled = debouncedSearchTerm.trim().length >= minChars;

  const {
    data: results = [],
    isLoading,
    error,
  } = useQuery<Client[]>({
    queryKey: ['clients', 'search', debouncedSearchTerm.trim(), limit],
    queryFn: () => clientsService.searchByName(debouncedSearchTerm.trim(), limit),
    enabled: isEnabled,
    staleTime: 30_000,
  });

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    results,
    isLoading,
    error,
    isEnabled,
  };
}

export default useClientSearch;
