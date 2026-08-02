// src/services/countries.service.ts
import { COUNTRIES, Country } from '../constants/countries';

export type { Country };

class CountriesService {
  /**
   * Obtiene la lista estática de países
   */
  async getCountries(): Promise<Country[]> {
    return COUNTRIES;
  }

  /**
   * Busca un país por su código (code)
   */
  async getCountryByCode(code: string): Promise<Country | null> {
    const country = COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase());
    return country || null;
  }

  /**
   * Busca países por nombre o código
   */
  async searchCountriesByName(searchTerm: string): Promise<Country[]> {
    const term = searchTerm.toLowerCase();
    return COUNTRIES.filter(country =>
      country.name.toLowerCase().includes(term) ||
      country.code.toLowerCase().includes(term)
    );
  }

  /**
   * Obtiene el código telefónico de un país
   */
  getPhoneCode(country: Country): string {
    return country.phoneCode;
  }

  /**
   * Verifica si un código de país es peruano
   */
  isPeruvianDocument(countryCode: string): boolean {
    return countryCode.toLowerCase() === 'pe';
  }

  /**
   * Obtiene datos específicos de Perú
   */
  getPeruData(): { code: string; name: string; flag: string } {
    return {
      code: 'PE',
      name: 'Peru',
      flag: 'https://flagcdn.com/pe.svg'
    };
  }
}

export const countriesService = new CountriesService();
export default countriesService;
