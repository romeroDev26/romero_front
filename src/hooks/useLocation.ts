// src/hooks/useLocation.ts
import { useState, useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
// ...
import { geonamesService } from '../services/geonames.service';
import type { ClientFormData } from '../features/clients/pages/ClientFormPage';

interface LocationData {
  country_code?: string;
  department?: string;
  province?: string;
  district?: string;
}

interface UseLocationProps {
  // El unico consumidor es el formulario de clientes.
  setValue: UseFormSetValue<ClientFormData>;
  initialData?: LocationData;
}

export const useLocation = ({ setValue, initialData }: UseLocationProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Inicializar datos si se proporcionan
  useEffect(() => {
    if (initialData && !isInitialized) {
      if (initialData.country_code) {
        setValue('country_code', initialData.country_code);
      }
      if (initialData.department) {
        setValue('department', initialData.department);
      }
      if (initialData.province) {
        setValue('province', initialData.province);
      }
      if (initialData.district) {
        setValue('district', initialData.district);
      }
      setIsInitialized(true);
    }
  }, [initialData, setValue, isInitialized]);
  
  const handleLocationChange = {
    onCountryChange: (countryCode: string) => {
      setValue('country_code', countryCode, { shouldValidate: true });
      // Limpiar campos dependientes
      setValue('department', '', { shouldValidate: true });
      setValue('province', '', { shouldValidate: true });
      setValue('district', '', { shouldValidate: true });
    },
    
    onDepartmentChange: (department: string) => {
      setValue('department', department, { shouldValidate: true });
      // Limpiar campos dependientes
      setValue('province', '', { shouldValidate: true });
      setValue('district', '', { shouldValidate: true });
    },
    
    onProvinceChange: (province: string) => {
      setValue('province', province, { shouldValidate: true });
      // Limpiar campos dependientes
      setValue('district', '', { shouldValidate: true });
    },
    
    onDistrictChange: (district: string) => {
      setValue('district', district, { shouldValidate: true });
    },
  };
  
  // Función para obtener la dirección formateada
  const getFormattedAddress = (data: LocationData): string => {
    const parts: string[] = [];
    
    if (data.district) parts.push(data.district);
    if (data.province) parts.push(data.province);
    if (data.department) parts.push(data.department);
    
    return parts.join(', ');
  };
  
  // Función para validar que la ubicación esté completa
  const validateLocation = (data: LocationData): boolean => {
    if (!data.country_code) return false;
    
    // Para Perú, requerir al menos departamento
    if (data.country_code === 'PE') {
      return !!data.department;
    }
    
    // Para otros países, al menos el departamento/estado
    return !!data.department;
  };
  
  // Función para obtener sugerencias de ubicación basadas en texto
  const searchLocation = async (query: string, countryCode?: string) => {
    try {
      if (query.length < 3) return [];
      
      const results = await geonamesService.searchPlaces(query, countryCode, 5);
      return results.map(place => ({
        value: place.geonameId,
        label: `${place.name}, ${place.adminName1}, ${place.countryName}`,
        country: place.countryCode,
        department: place.adminName1,
        province: place.adminName2,
        district: place.name,
      }));
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  };
  
  return {
    handleLocationChange,
    getFormattedAddress,
    validateLocation,
    searchLocation,
    isInitialized,
  };
};