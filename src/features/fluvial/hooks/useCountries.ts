// src/features/fluvial/hooks/useCountries.ts
import { Country, COUNTRIES } from '../../../constants/countries';

export function useCountries() {
  const countries = COUNTRIES;
  const loading = false;
  const error = null;

  const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(
      country => country.code.toLowerCase() === code.toLowerCase()
    );
  };

  const searchCountries = (searchTerm: string): Country[] => {
    if (!searchTerm.trim()) return countries;
    
    const term = searchTerm.toLowerCase();
    return countries.filter(country =>
      country.name.toLowerCase().includes(term) ||
      country.code.toLowerCase().includes(term)
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
