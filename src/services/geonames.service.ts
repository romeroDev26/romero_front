// src/services/geonames.service.ts
import axios from 'axios';

const GEONAMES_USERNAME = 'zeltux';
const GEONAMES_BASE_URL = 'http://api.geonames.org';

// Interfaces para los datos de GeoNames
export interface Country {
  geonameId: number;
  countryCode: string;
  countryName: string;
  continent: string;
  capital: string;
  languages: string;
  population: number;
}

export interface AdministrativeArea {
  geonameId: number;
  name: string;
  asciiName: string;
  countryCode: string;
  countryName: string;
  adminCode1?: string;
  adminName1?: string;
  population: number;
  lat: string;
  lng: string;
}

export interface City {
  geonameId: number;
  name: string;
  asciiName: string;
  countryCode: string;
  countryName: string;
  adminCode1?: string;
  adminName1?: string;
  adminCode2?: string;
  adminName2?: string;
  population: number;
  lat: string;
  lng: string;
}

// Crear instancia de axios para GeoNames (sin interceptores de auth)
const geonamesApi = axios.create({
  baseURL: GEONAMES_BASE_URL,
  timeout: 10000,
});

export const geonamesService = {
  // Obtener todos los países
  getCountries: async (): Promise<Country[]> => {
    try {
      const response = await geonamesApi.get('/countryInfoJSON', {
        params: {
          username: GEONAMES_USERNAME,
        },
      });
      
      // Ordenar países por nombre
      return response.data.geonames.sort((a: Country, b: Country) => 
        a.countryName.localeCompare(b.countryName)
      );
    } catch (error) {
      console.error('Error obteniendo países:', error);
      throw new Error('No se pudieron cargar los países. Verifique su conexión a internet.');
    }
  },

  // Obtener estados/provincias de un país
  getStatesProvinces: async (countryCode: string): Promise<AdministrativeArea[]> => {
    try {
      // Primero necesitamos obtener el geonameId del país
      const countries = await geonamesService.getCountries();
      const country = countries.find(c => c.countryCode === countryCode);
      
      if (!country) {
        throw new Error('País no encontrado');
      }

      const response = await geonamesApi.get('/childrenJSON', {
        params: {
          geonameId: country.geonameId,
          username: GEONAMES_USERNAME,
        },
      });
      
      // Filtrar solo áreas administrativas (estados/provincias)
      const administrativeAreas = response.data.geonames.filter((item: any) => 
        item.fcode === 'ADM1' || item.fcode === 'ADMD'
      );
      
      // Ordenar por nombre
      return administrativeAreas.sort((a: AdministrativeArea, b: AdministrativeArea) => 
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error('Error obteniendo estados/provincias:', error);
      throw new Error('No se pudieron cargar las provincias/estados.');
    }
  },

  // Obtener ciudades de una provincia/estado
  getCities: async (stateGeonameId: number): Promise<City[]> => {
    try {
      const response = await geonamesApi.get('/childrenJSON', {
        params: {
          geonameId: stateGeonameId,
          username: GEONAMES_USERNAME,
          maxRows: 100, // Limitar resultados
        },
      });
      
      // Filtrar ciudades y lugares poblados
      const cities = response.data.geonames.filter((item: any) => 
        item.fcode === 'PPL' || 
        item.fcode === 'PPLA' || 
        item.fcode === 'PPLA2' || 
        item.fcode === 'PPLC' ||
        item.fcode === 'ADM2'
      );
      
      // Ordenar por población (descendente) y luego por nombre
      return cities.sort((a: City, b: City) => {
        if (b.population !== a.population) {
          return b.population - a.population;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error obteniendo ciudades:', error);
      throw new Error('No se pudieron cargar las ciudades.');
    }
  },

  // Buscar lugares por texto (útil para autocompletado)
  searchPlaces: async (query: string, countryCode?: string, maxRows: number = 10): Promise<City[]> => {
    try {
      const params: any = {
        q: query,
        username: GEONAMES_USERNAME,
        maxRows,
        type: 'json',
        featureClass: 'P', // Solo lugares poblados
      };

      if (countryCode) {
        params.country = countryCode;
      }

      const response = await geonamesApi.get('/searchJSON', { params });
      
      return response.data.geonames || [];
    } catch (error) {
      console.error('Error buscando lugares:', error);
      throw new Error('Error en la búsqueda de lugares.');
    }
  },

  // Obtener información detallada de un lugar por geonameId
  getPlaceDetails: async (geonameId: number): Promise<any> => {
    try {
      const response = await geonamesApi.get('/getJSON', {
        params: {
          geonameId,
          username: GEONAMES_USERNAME,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles del lugar:', error);
      throw new Error('No se pudieron obtener los detalles del lugar.');
    }
  },

  // Método específico para Perú (optimizado)
  getPeruDepartments: async (): Promise<AdministrativeArea[]> => {
    try {
      // ID de Perú en GeoNames: 3932488
      const response = await geonamesApi.get('/childrenJSON', {
        params: {
          geonameId: 3932488,
          username: GEONAMES_USERNAME,
        },
      });
      
      const departments = response.data.geonames.filter((item: any) => 
        item.fcode === 'ADM1'
      );
      
      return departments.sort((a: AdministrativeArea, b: AdministrativeArea) => 
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error('Error obteniendo departamentos de Perú:', error);
      throw new Error('No se pudieron cargar los departamentos de Perú.');
    }
  },

  // Obtener provincias de un departamento peruano
  getPeruProvinces: async (departmentGeonameId: number): Promise<AdministrativeArea[]> => {
    try {
      const response = await geonamesApi.get('/childrenJSON', {
        params: {
          geonameId: departmentGeonameId,
          username: GEONAMES_USERNAME,
        },
      });
      
      const provinces = response.data.geonames.filter((item: any) => 
        item.fcode === 'ADM2'
      );
      
      return provinces.sort((a: AdministrativeArea, b: AdministrativeArea) => 
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error('Error obteniendo provincias:', error);
      throw new Error('No se pudieron cargar las provincias.');
    }
  },

  // Obtener distritos de una provincia peruana
  getPeruDistricts: async (provinceGeonameId: number): Promise<City[]> => {
    try {
      const response = await geonamesApi.get('/childrenJSON', {
        params: {
          geonameId: provinceGeonameId,
          username: GEONAMES_USERNAME,
          maxRows: 200,
        },
      });
      
      const districts = response.data.geonames.filter((item: any) => 
        item.fcode === 'ADM3' || item.fcode === 'PPL' || item.fcode === 'PPLA'
      );
      
      return districts.sort((a: City, b: City) => 
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error('Error obteniendo distritos:', error);
      throw new Error('No se pudieron cargar los distritos.');
    }
  }
};