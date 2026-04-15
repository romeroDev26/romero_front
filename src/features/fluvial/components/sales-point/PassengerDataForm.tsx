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
  const isRuc = passengerData.docType === SunatDocType.RUC;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#211922] sm:text-lg">
          Datos del Pasajero / Cliente
        </h3>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isRuc ? "bg-blue-100 text-blue-700" : "bg-[#f3f4f6] text-gray-700"
          }`}
        >
          {isRuc ? "Venta Empresarial (RUC)" : "Venta Individual"}
        </span>
      </div>

      <div className="rounded-xl border border-[#e5e5e0] bg-[#f6f6f3] p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#62625b]">
              Tipo de documento
            </label>
            <select
              name="docType"
              value={passengerData.docType}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-[#d6d6d1] bg-white px-3 py-2 text-sm text-[#211922] focus:border-[#435ee5] focus:outline-none focus:ring-2 focus:ring-[#435ee5]/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              disabled={disabled}
            >
              {DOCUMENT_TYPES.map(doc => (
                <option key={doc.code} value={doc.code}>{doc.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#62625b]">
              Número de documento
            </label>
            <div className="flex">
              <input
                type="text"
                name="docNumber"
                value={passengerData.docNumber || ""}
                onChange={handleInputChange}
                className="w-full rounded-l-lg border border-[#d6d6d1] bg-white px-3 py-2 text-sm text-[#211922] focus:border-[#435ee5] focus:outline-none focus:ring-2 focus:ring-[#435ee5]/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="Ingrese el número"
                disabled={disabled}
              />
              <Button
                onClick={handleSearch}
                disabled={!isSearchable || isQueryingDni || isQueryingRuc || disabled}
                className="rounded-l-none rounded-r-lg bg-[#211922] px-3 hover:bg-[#33332e] disabled:bg-gray-400"
              >
                {isQueryingDni || isQueryingRuc ? <Spinner size="sm"/> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className={isRuc ? "md:col-span-2" : ""}>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#62625b]">
              {isRuc ? "Razón social" : "Nombres completos"}
            </label>
            <input
              type="text"
              name="name"
              value={passengerData.name || ""}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-[#d6d6d1] bg-white px-3 py-2 text-sm text-[#211922] focus:border-[#435ee5] focus:outline-none focus:ring-2 focus:ring-[#435ee5]/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              placeholder={isRuc ? "Razón social de la empresa" : "Nombres y apellidos"}
              disabled={disabled}
            />
          </div>

          {isRuc && (
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#62625b]">
                Dirección fiscal
              </label>
              <input
                type="text"
                name="address"
                value={passengerData.address || ""}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#d6d6d1] bg-white px-3 py-2 text-sm text-[#211922] focus:border-[#435ee5] focus:outline-none focus:ring-2 focus:ring-[#435ee5]/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                disabled={disabled}
              />
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#62625b]">
              País
            </label>
            {showCountrySelector ? (
              <>
                <CountrySelector
                  value={passengerData.countryCode || ""}
                  onChange={handleCountryChange}
                  disabled={disabled}
                  placeholder="Seleccionar país..."
                  className="w-full"
                />
                {passengerData.countryCode && passengerData.countryName && (
                  <div className="mt-1 text-[11px] text-gray-500">
                    Código: <span className="font-mono font-semibold">{passengerData.countryCode}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-[#d6d6d1] bg-white px-3 py-2">
                <img
                  src="https://flagcdn.com/pe.svg"
                  alt="Bandera de Perú"
                  className="h-3 w-5 rounded object-cover"
                />
                <span className="text-sm text-[#211922]">Peru</span>
                <span className="text-xs text-[#62625b]">(PE)</span>
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#62625b]">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={passengerData.phone || ""}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-[#d6d6d1] bg-white px-3 py-2 text-sm text-[#211922] focus:border-[#435ee5] focus:outline-none focus:ring-2 focus:ring-[#435ee5]/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              placeholder="Número de teléfono"
              disabled={disabled}
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#62625b]">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={passengerData.email || ""}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-[#d6d6d1] bg-white px-3 py-2 text-sm text-[#211922] focus:border-[#435ee5] focus:outline-none focus:ring-2 focus:ring-[#435ee5]/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              placeholder="Correo electrónico"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};