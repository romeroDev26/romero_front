// src/features/fluvial/quick-sales/hooks/useRouteHistory.ts

import { useCallback } from 'react';

const ORIGIN_KEY = 'quickSale_origins';
const DESTINATION_KEY = 'quickSale_destinations';

export const useRouteHistory = () => {
  const getStoredCities = useCallback((key: string): string[] => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const addCityToHistory = useCallback((key: string, city: string) => {
    if (!city.trim()) return;
    const cities = getStoredCities(key);
    const normalized = city.trim();
    
    // Evitar duplicados (case insensitive)
    const exists = cities.some(c => c.toLowerCase() === normalized.toLowerCase());
    if (!exists) {
      const updated = [normalized, ...cities].slice(0, 20); // Mantener solo las últimas 20
      localStorage.setItem(key, JSON.stringify(updated));
    }
  }, [getStoredCities]);

  const getSuggestions = useCallback((key: string, input: string): string[] => {
    if (!input.trim()) return [];
    const cities = getStoredCities(key);
    const normalized = input.toLowerCase();
    return cities.filter(city => city.toLowerCase().includes(normalized));
  }, [getStoredCities]);

  const saveRoute = useCallback((origin: string, destination: string) => {
    if (origin.trim() && destination.trim()) {
      addCityToHistory(ORIGIN_KEY, origin.trim());
      addCityToHistory(DESTINATION_KEY, destination.trim());
    }
  }, [addCityToHistory]);

  const getOriginSuggestions = useCallback((input: string) => {
    return getSuggestions(ORIGIN_KEY, input);
  }, [getSuggestions]);

  const getDestinationSuggestions = useCallback((input: string) => {
    return getSuggestions(DESTINATION_KEY, input);
  }, [getSuggestions]);

  return {
    saveRoute,
    getOriginSuggestions,
    getDestinationSuggestions,
  };
};
