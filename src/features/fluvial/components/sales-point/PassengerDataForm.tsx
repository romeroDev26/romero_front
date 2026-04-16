// src/features/fluvial/components/sales-point/PassengerDataForm.tsx
import React from 'react';
import { Search } from 'lucide-react';
import { useSunatData } from '../../hooks/useSunatData';
import { DOCUMENT_TYPES, SunatDocType } from '../../types/sunat.types';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import CountrySelector from './CountrySelector';

// Tipamos las props que recibirá este componente
interface PassengerData {
  docType: string;
  docNumber: string;
  name: string;
  address: string; // Añadimos dirección para RUC
  phone: string;
  email: string;
  countryCode?: string; // Código del país (PE, US, etc.)
  countryName?: string; // Nombre del país para mostrar
}

interface PassengerDataFormProps {
  passengerData: PassengerData;
  setPassengerData: React.Dispatch<React.SetStateAction<PassengerData>>;
  disabled?: boolean;
}

export const PassengerDataForm: React.FC<PassengerDataFormProps> = ({ passengerData, setPassengerData, disabled = false }) => {
  const { queryDni, isQueryingDni, queryRuc, isQueryingRuc } = useSunatData();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo de documento, establecer el país por defecto
    if (name === 'docType') {
      const isPeruvianDoc = value === SunatDocType.DNI || value === SunatDocType.RUC;
      setPassengerData(prev => ({ 
        ...prev, 
        [name]: value,
        countryCode: isPeruvianDoc ? "PE" : "",
        countryName: isPeruvianDoc ? "Peru" : "",
      }));
    } else {
      setPassengerData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryChange = (countryCode: string, countryName: string) => {
    setPassengerData(prev => ({
      ...prev,
      countryCode,
      countryName
    }));
  };

  const handleSearch = async () => {
    if (!passengerData.docNumber) return;

    try {
      if (passengerData.docType === SunatDocType.DNI) {
        const data = await queryDni(passengerData.docNumber);
        if (data) {
          setPassengerData(prev => ({ 
            ...prev, 
            name: data.nombreCompleto,
            // Solo actualizar email y phone si están disponibles en la respuesta
            ...(data.email && { email: data.email }),
            ...(data.phone && { phone: data.phone }),
          }));
        }
      } else if (passengerData.docType === SunatDocType.RUC) {
        const data = await queryRuc(passengerData.docNumber);
        if (data) {
          setPassengerData(prev => ({
            ...prev,
            name: data.razonSocial,
            address: data.direccion,
            // Solo actualizar email y phone si están disponibles en la respuesta
            ...(data.email && { email: data.email }),
            ...(data.phone && { phone: data.phone }),
          }));
        }
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      // El toast de error ya se muestra desde el hook
    }
  };

  const isSearchable = passengerData.docType === SunatDocType.DNI || passengerData.docType === SunatDocType.RUC;
  
  // Determinar si se debe mostrar el selector de países (para documentos no peruanos)
  const showCountrySelector = passengerData.docType !== SunatDocType.DNI && passengerData.docType !== SunatDocType.RUC;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Datos del Pasajero / Cliente</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Tipo Doc.</label>
          <select
            name="docType"
            value={passengerData.docType}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 bg-white p-2 disabled:cursor-not-allowed disabled:bg-gray-100"
            disabled={disabled}
          >
            {DOCUMENT_TYPES.map(doc => (
              <option key={doc.code} value={doc.code}>{doc.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Número de Documento</label>
          <div className="flex">
            <input
              type="text"
              name="docNumber"
              value={passengerData.docNumber || ""}
              onChange={handleInputChange}
              className="w-full rounded-l-md border border-gray-300 p-2 disabled:bg-gray-100"
              placeholder="Ingrese el número"
              disabled={disabled}
            />
            <Button
              onClick={handleSearch}
              disabled={!isSearchable || isQueryingDni || isQueryingRuc || disabled}
              className="rounded-l-none"
            >
              {isQueryingDni || isQueryingRuc ? <Spinner size="sm"/> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {passengerData.docType === SunatDocType.RUC ? 'Razón Social' : 'Nombres Completos'}
        </label>
        <input
          type="text"
          name="name"
          value={passengerData.name || ""}
          onChange={handleInputChange}
          className="w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100"
          placeholder="Nombres y apellidos o Razón Social"
          disabled={disabled}
        />
      </div>
      {passengerData.docType === SunatDocType.RUC && (
         <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Dirección Fiscal</label>
          <input
            type="text"
            name="address"
            value={passengerData.address || ""}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100"
            disabled={disabled}
          />
        </div>
      )}
      
      {/* Selector de países para documentos extranjeros */}
      {showCountrySelector && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            País de Procedencia
          </label>
          <CountrySelector
            value={passengerData.countryCode || ""}
            onChange={handleCountryChange}
            disabled={disabled}
            placeholder="Seleccionar país de procedencia..."
            className="w-full"
          />
          {passengerData.countryCode && passengerData.countryName && (
            <div className="mt-1 text-xs text-gray-500">
              Código de país: <span className="font-mono font-semibold">{passengerData.countryCode}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Mostrar país fijo para documentos peruanos */}
      {!showCountrySelector && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            País
          </label>
          <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 p-2">
            <img 
              src="https://flagcdn.com/pe.svg" 
              alt="Bandera de Perú"
              className="h-3 w-5 rounded object-cover"
            />
            <span className="text-gray-900">Peru</span>
            <span className="text-sm text-gray-500">(PE)</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={passengerData.phone || ""}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100"
            placeholder="Número de teléfono"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={passengerData.email || ""}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100"
            placeholder="Correo electrónico"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
