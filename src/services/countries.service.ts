// src/services/countries.service.ts

export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  cca3: string;
  idd: {
    root: string;
    suffixes?: string[];
  };
  flags: {
    svg: string;
    png: string;
  };
}

class CountriesService {
  private cache: Country[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hora

  /**
   * Obtiene la lista de países de la API REST Countries
   */
  async getCountries(): Promise<Country[]> {
    // Si tenemos datos en cache y no han expirado, los devolvemos
    if (this.cache && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const apiUrl = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,idd,flags';
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: Country[] = await response.json();
      
      // Ordenamos los países alfabéticamente
      data.sort((a, b) => a.name.common.localeCompare(b.name.common));
      
      // Guardamos en cache
      this.cache = data;
      this.cacheTimestamp = Date.now();
      
      return data;
    } catch (error) {
      console.error('Error al obtener países:', error);
      throw new Error('No se pudieron cargar los países. Verifique su conexión a internet.');
    }
  }

  /**
   * Busca un país por su código (cca2 o cca3)
   */
  async getCountryByCode(code: string): Promise<Country | null> {
    try {
      const countries = await this.getCountries();
      return countries.find(
        country => 
          country.cca2.toLowerCase() === code.toLowerCase() ||
          country.cca3.toLowerCase() === code.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Error al buscar país por código:', error);
      return null;
    }
  }

  /**
   * Busca países por nombre
   */
  async searchCountriesByName(searchTerm: string): Promise<Country[]> {
    try {
      const countries = await this.getCountries();
      const term = searchTerm.toLowerCase();
      
      return countries.filter(country =>
        country.name.common.toLowerCase().includes(term) ||
        country.name.official.toLowerCase().includes(term) ||
        country.cca2.toLowerCase().includes(term) ||
        country.cca3.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error al buscar países:', error);
      return [];
    }
  }

  /**
   * Obtiene el código telefónico de un país
   */
  getPhoneCode(country: Country): string {
    if (!country.idd.root) return '';
    return `${country.idd.root}${country.idd.suffixes?.[0] || ''}`;
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

  /**
   * Limpia el cache (útil para testing o forzar actualización)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const countriesService = new CountriesService();
export default countriesService;
