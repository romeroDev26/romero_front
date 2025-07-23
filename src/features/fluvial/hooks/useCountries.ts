// src/features/fluvial/hooks/useCountries.ts
import { useState, useEffect } from 'react';
import { countriesService, Country } from '../../../services/countries.service';

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        const data = await countriesService.getCountries();
        setCountries(data);
        setError(null);
      } catch (err: any) {
        console.error("Error al cargar los países:", err);
        setError(err.message || 'Error al cargar países');
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(
      country => 
        country.cca2.toLowerCase() === code.toLowerCase() ||
        country.cca3.toLowerCase() === code.toLowerCase()
    );
  };

  const searchCountries = (searchTerm: string): Country[] => {
    if (!searchTerm.trim()) return countries;
    
    const term = searchTerm.toLowerCase();
    return countries.filter(country =>
      country.name.common.toLowerCase().includes(term) ||
      country.cca2.toLowerCase().includes(term) ||
      country.cca3.toLowerCase().includes(term)
    );
  };

  return { 
    countries, 
    loading, 
    error, 
    getCountryByCode, 
    searchCountries 
  };
}

export default useCountries;
