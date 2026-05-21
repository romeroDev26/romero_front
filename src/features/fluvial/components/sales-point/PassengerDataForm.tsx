// src/features/fluvial/components/sales-point/PassengerDataForm.tsx
import React from 'react';
import { Search, User } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dbe1ff]">
          <User className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base font-bold tracking-tight text-dm-text-primary">
          Datos del Pasajero
        </h3>
      </div>

      {/* Tipo Doc + Número */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            Tipo Doc.
          </label>
          <select
            name="docType"
            value={passengerData.docType}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-full appearance-none rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 px-3.5 text-sm text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {DOCUMENT_TYPES.map(doc => (
              <option key={doc.code} value={doc.code}>{doc.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            Número de Documento
          </label>
          <div className="flex">
            <input
              type="text"
              name="docNumber"
              value={passengerData.docNumber || ""}
              onChange={handleInputChange}
              disabled={disabled}
              placeholder="Ingrese el número"
              className="w-full rounded-l-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 px-3.5 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <Button
              onClick={handleSearch}
              disabled={!isSearchable || isQueryingDni || isQueryingRuc || disabled}
              className="rounded-l-none rounded-r-lg px-3"
            >
              {isQueryingDni || isQueryingRuc ? <Spinner size="sm"/> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Nombre / Razón Social */}
      <div>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
          {passengerData.docType === SunatDocType.RUC ? 'Razón Social' : 'Nombres Completos'}
        </label>
        <input
          type="text"
          name="name"
          value={passengerData.name || ""}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="Nombres y apellidos o Razón Social"
          className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 px-3.5 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      </div>

      {/* Dirección Fiscal (solo RUC) */}
      {passengerData.docType === SunatDocType.RUC && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            Dirección Fiscal
          </label>
          <input
            type="text"
            name="address"
            value={passengerData.address || ""}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 px-3.5 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        </div>
      )}
      
      {/* Selector de países para documentos extranjeros */}
      {showCountrySelector && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
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
            <div className="mt-1.5 text-[11px] text-dm-text-muted">
              Código de país: <span className="font-mono font-semibold text-dm-text-secondary">{passengerData.countryCode}</span>
            </div>
          )}
        </div>
      )}
      
      {/* País fijo para documentos peruanos */}
      {!showCountrySelector && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            País
          </label>
          <div className="inline-flex items-center gap-2 rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2 px-3">
            <img 
              src="https://flagcdn.com/pe.svg" 
              alt="Bandera de Perú"
              className="h-3 w-5 rounded object-cover"
            />
            <span className="text-sm font-medium text-dm-text-primary">Peru</span>
            <span className="text-xs text-dm-text-muted">(PE)</span>
          </div>
        </div>
      )}

      {/* Teléfono + Email */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            Teléfono
          </label>
          <input
            type="tel"
            name="phone"
            value={passengerData.phone || ""}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="Número de teléfono"
            className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 px-3.5 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-dm-text-muted">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={passengerData.email || ""}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="Correo electrónico"
            className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2.5 px-3.5 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};
