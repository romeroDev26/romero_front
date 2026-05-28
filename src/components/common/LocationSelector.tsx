// src/components/common/LocationSelector.tsx
import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/sileo-toast';
import { Spinner } from './Spinner';
import { 
  geonamesService, 
  Country, 
  AdministrativeArea, 
  City 
} from '../../services/geonames.service';

interface LocationSelectorProps {
  // Valores actuales
  countryCode?: string;
  department?: string;
  province?: string;
  district?: string;
  
  // Callbacks para cambios
  onCountryChange: (countryCode: string, countryName: string) => void;
  onDepartmentChange: (department: string, departmentGeonameId?: number) => void;
  onProvinceChange: (province: string, provinceGeonameId?: number) => void;
  onDistrictChange: (district: string) => void;
  
  // Props adicionales
  disabled?: boolean;
  errors?: {
    country_code?: string;
    department?: string;
    province?: string;
    district?: string;
  };
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  countryCode,
  department,
  province,
  district,
  onCountryChange,
  onDepartmentChange,
  onProvinceChange,
  onDistrictChange,
  disabled = false,
  errors = {},
}) => {
  // Estados para los datos
  const [countries, setCountries] = useState<Country[]>([]);
  const [departments, setDepartments] = useState<AdministrativeArea[]>([]);
  const [provinces, setProvinces] = useState<AdministrativeArea[]>([]);
  const [districts, setDistricts] = useState<City[]>([]);
  
  // Estados de carga
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  
  // Referencias para los geonameId seleccionados
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  
  // Cargar países al montar el componente
  useEffect(() => {
    loadCountries();
  }, []);
  
  // Cargar departamentos/estados cuando cambia el país
  useEffect(() => {
    if (countryCode) {
      loadDepartments(countryCode);
    } else {
      setDepartments([]);
      setProvinces([]);
      setDistricts([]);
    }
  }, [countryCode]);
  
  // Cargar provincias cuando cambia el departamento
  useEffect(() => {
    if (selectedDepartmentId) {
      loadProvinces(selectedDepartmentId);
    } else {
      setProvinces([]);
      setDistricts([]);
    }
  }, [selectedDepartmentId]);
  
  // Cargar distritos cuando cambia la provincia
  useEffect(() => {
    if (selectedProvinceId) {
      loadDistricts(selectedProvinceId);
    } else {
      setDistricts([]);
    }
  }, [selectedProvinceId]);
  
  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const data = await geonamesService.getCountries();
      setCountries(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar países');
      // Fallback con países básicos
      setCountries([
        { geonameId: 3932488, countryCode: 'PE', countryName: 'Peru', continent: 'SA', capital: 'Lima', languages: 'es', population: 32971854 },
        { geonameId: 3686110, countryCode: 'CO', countryName: 'Colombia', continent: 'SA', capital: 'Bogotá', languages: 'es', population: 50882891 },
        { geonameId: 3658394, countryCode: 'EC', countryName: 'Ecuador', continent: 'SA', capital: 'Quito', languages: 'es', population: 17643054 },
      ]);
    } finally {
      setLoadingCountries(false);
    }
  };
  
  const loadDepartments = async (selectedCountryCode: string) => {
    setLoadingDepartments(true);
    try {
      let data: AdministrativeArea[];
      
      // Optimización especial para Perú
      if (selectedCountryCode === 'PE') {
        data = await geonamesService.getPeruDepartments();
      } else {
        data = await geonamesService.getStatesProvinces(selectedCountryCode);
      }
      
      setDepartments(data);
      
      // Auto-seleccionar si hay un valor previo
      if (department && data.length > 0) {
        const foundDept = data.find(d => 
          d.name.toLowerCase() === department.toLowerCase() ||
          d.asciiName.toLowerCase() === department.toLowerCase()
        );
        if (foundDept) {
          setSelectedDepartmentId(foundDept.geonameId);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar departamentos/estados');
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };
  
  const loadProvinces = async (departmentGeonameId: number) => {
    setLoadingProvinces(true);
    try {
      let data: AdministrativeArea[];
      
      // Para Perú, usar método específico
      if (countryCode === 'PE') {
        data = await geonamesService.getPeruProvinces(departmentGeonameId);
      } else {
        // Para otros países, usar método genérico
        const response = await geonamesService.getCities(departmentGeonameId);
        data = response.filter(item => item.adminCode2) as AdministrativeArea[];
      }
      
      setProvinces(data);
      
      // Auto-seleccionar si hay un valor previo
      if (province && data.length > 0) {
        const foundProv = data.find(p => 
          p.name.toLowerCase() === province.toLowerCase() ||
          p.asciiName.toLowerCase() === province.toLowerCase()
        );
        if (foundProv) {
          setSelectedProvinceId(foundProv.geonameId);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar provincias');
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  };
  
  const loadDistricts = async (provinceGeonameId: number) => {
    setLoadingDistricts(true);
    try {
      let data: City[];
      
      // Para Perú, usar método específico
      if (countryCode === 'PE') {
        data = await geonamesService.getPeruDistricts(provinceGeonameId);
      } else {
        data = await geonamesService.getCities(provinceGeonameId);
      }
      
      setDistricts(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar distritos/ciudades');
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };
  
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCountryCode = e.target.value;
    const selectedCountry = countries.find(c => c.countryCode === selectedCountryCode);
    
    if (selectedCountry) {
      onCountryChange(selectedCountryCode, selectedCountry.countryName);
    }
    
    // Reset otros valores
    setSelectedDepartmentId(null);
    setSelectedProvinceId(null);
    onDepartmentChange('');
    onProvinceChange('');
    onDistrictChange('');
  };
  
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const selectedDept = departments.find(d => d.name === selectedName);
    
    if (selectedDept) {
      setSelectedDepartmentId(selectedDept.geonameId);
      onDepartmentChange(selectedName, selectedDept.geonameId);
    } else {
      setSelectedDepartmentId(null);
      onDepartmentChange('');
    }
    
    // Reset valores dependientes
    setSelectedProvinceId(null);
    onProvinceChange('');
    onDistrictChange('');
  };
  
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const selectedProv = provinces.find(p => p.name === selectedName);
    
    if (selectedProv) {
      setSelectedProvinceId(selectedProv.geonameId);
      onProvinceChange(selectedName, selectedProv.geonameId);
    } else {
      setSelectedProvinceId(null);
      onProvinceChange('');
    }
    
    // Reset valores dependientes
    onDistrictChange('');
  };
  
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    onDistrictChange(selectedName);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* País */}
      <div>
        <label className="block text-sm font-medium text-dm-text-primary mb-1">
          País
        </label>
        <div className="relative">
          <select
            value={countryCode || ''}
            onChange={handleCountryChange}
            disabled={disabled || loadingCountries}
            className={`mt-1 block w-full rounded-md shadow-sm p-2 border bg-dm-bg-primary text-dm-text-primary ${
              errors.country_code ? 'border-red-500' : 'border-dm-border-primary'
            } ${disabled ? 'bg-dm-bg-secondary' : ''}`}
          >
            <option value="">Seleccione un país</option>
            {countries.map((country) => (
              <option key={country.countryCode} value={country.countryCode}>
                {country.countryName}
              </option>
            ))}
          </select>
          {loadingCountries && (
            <div className="absolute right-2 top-3">
              <Spinner size="sm" />
            </div>
          )}
        </div>
        {errors.country_code && (
          <p className="mt-1 text-sm text-red-600">{errors.country_code}</p>
        )}
      </div>
      
      {/* Departamento/Estado */}
      <div>
        <label className="block text-sm font-medium text-dm-text-primary mb-1">
          {countryCode === 'PE' ? 'Departamento' : 'Estado/Región'}
        </label>
        <div className="relative">
          <select
            value={department || ''}
            onChange={handleDepartmentChange}
            disabled={disabled || loadingDepartments || !countryCode}
            className={`mt-1 block w-full rounded-md shadow-sm p-2 border bg-dm-bg-primary text-dm-text-primary ${
              errors.department ? 'border-red-500' : 'border-dm-border-primary'
            } ${disabled || !countryCode ? 'bg-dm-bg-secondary' : ''}`}
          >
            <option value="">
              {!countryCode 
                ? 'Primero seleccione un país' 
                : `Seleccione ${countryCode === 'PE' ? 'departamento' : 'estado/región'}`
              }
            </option>
            {departments.map((dept) => (
              <option key={dept.geonameId} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          {loadingDepartments && (
            <div className="absolute right-2 top-3">
              <Spinner size="sm" />
            </div>
          )}
        </div>
        {errors.department && (
          <p className="mt-1 text-sm text-red-600">{errors.department}</p>
        )}
      </div>
      
      {/* Provincia */}
      <div>
        <label className="block text-sm font-medium text-dm-text-primary mb-1">
          Provincia
        </label>
        <div className="relative">
          <select
            value={province || ''}
            onChange={handleProvinceChange}
            disabled={disabled || loadingProvinces || !selectedDepartmentId}
            className={`mt-1 block w-full rounded-md shadow-sm p-2 border bg-dm-bg-primary text-dm-text-primary ${
              errors.province ? 'border-red-500' : 'border-dm-border-primary'
            } ${disabled || !selectedDepartmentId ? 'bg-dm-bg-secondary' : ''}`}
          >
            <option value="">
              {!selectedDepartmentId 
                ? 'Primero seleccione departamento/estado' 
                : 'Seleccione provincia'
              }
            </option>
            {provinces.map((prov) => (
              <option key={prov.geonameId} value={prov.name}>
                {prov.name}
              </option>
            ))}
          </select>
          {loadingProvinces && (
            <div className="absolute right-2 top-3">
              <Spinner size="sm" />
            </div>
          )}
        </div>
        {errors.province && (
          <p className="mt-1 text-sm text-red-600">{errors.province}</p>
        )}
      </div>
      
      {/* Distrito/Ciudad */}
      <div>
        <label className="block text-sm font-medium text-dm-text-primary mb-1">
          {countryCode === 'PE' ? 'Distrito' : 'Ciudad'}
        </label>
        <div className="relative">
          <select
            value={district || ''}
            onChange={handleDistrictChange}
            disabled={disabled || loadingDistricts || !selectedProvinceId}
            className={`mt-1 block w-full rounded-md shadow-sm p-2 border bg-dm-bg-primary text-dm-text-primary ${
              errors.district ? 'border-red-500' : 'border-dm-border-primary'
            } ${disabled || !selectedProvinceId ? 'bg-dm-bg-secondary' : ''}`}
          >
            <option value="">
              {!selectedProvinceId 
                ? 'Primero seleccione provincia' 
                : `Seleccione ${countryCode === 'PE' ? 'distrito' : 'ciudad'}`
              }
            </option>
            {districts.map((dist) => (
              <option key={dist.geonameId} value={dist.name}>
                {dist.name} 
                {dist.population > 0 && (
                  <span className="text-dm-text-muted"> ({dist.population.toLocaleString()} hab.)</span>
                )}
              </option>
            ))}
          </select>
          {loadingDistricts && (
            <div className="absolute right-2 top-3">
              <Spinner size="sm" />
            </div>
          )}
        </div>
        {errors.district && (
          <p className="mt-1 text-sm text-red-600">{errors.district}</p>
        )}
      </div>
    </div>
  );
};
