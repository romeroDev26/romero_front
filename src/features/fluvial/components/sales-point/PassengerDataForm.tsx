// src/features/fluvial/components/sales-point/PassengerDataForm.tsx
import React from 'react';
import { Search } from 'lucide-react';
import { useSunatData } from '../../hooks/useSunatData';
import { DOCUMENT_TYPES, SunatDocType } from '../../types/sunat.types';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';

// Tipamos las props que recibirá este componente
interface PassengerData {
  docType: string;
  docNumber: string;
  name: string;
  address: string; // Añadimos dirección para RUC
  phone: string;
  email: string;
}

interface PassengerDataFormProps {
  passengerData: PassengerData;
  setPassengerData: React.Dispatch<React.SetStateAction<PassengerData>>;
}

export const PassengerDataForm: React.FC<PassengerDataFormProps> = ({ passengerData, setPassengerData }) => {
  const { queryDni, isQueryingDni, queryRuc, isQueryingRuc } = useSunatData();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPassengerData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!passengerData.docNumber) return;

    try {
      if (passengerData.docType === SunatDocType.DNI) {
        const data = await queryDni(passengerData.docNumber);
        if (data) {
          setPassengerData(prev => ({ ...prev, name: data.nombreCompleto }));
        }
      } else if (passengerData.docType === SunatDocType.RUC) {
        const data = await queryRuc(passengerData.docNumber);
        if (data) {
          setPassengerData(prev => ({
            ...prev,
            name: data.razonSocial,
            address: data.direccion,
          }));
        }
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      // El toast de error ya se muestra desde el hook
    }
  };

  const isSearchable = passengerData.docType === SunatDocType.DNI || passengerData.docType === SunatDocType.RUC;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-gray-800">Datos del Pasajero / Cliente</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc.</label>
          <select
            name="docType"
            value={passengerData.docType}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            {DOCUMENT_TYPES.map(doc => (
              <option key={doc.code} value={doc.code}>{doc.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
          <div className="flex">
            <input
              type="text"
              name="docNumber"
              value={passengerData.docNumber}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-l-md"
              placeholder="Ingrese el número"
            />
            <Button
              onClick={handleSearch}
              disabled={!isSearchable || isQueryingDni || isQueryingRuc}
              className="rounded-l-none"
            >
              {isQueryingDni || isQueryingRuc ? <Spinner size="sm"/> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {passengerData.docType === SunatDocType.RUC ? 'Razón Social' : 'Nombres Completos'}
        </label>
        <input
          type="text"
          name="name"
          value={passengerData.name}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Nombres y apellidos o Razón Social"
        />
      </div>
      {passengerData.docType === SunatDocType.RUC && (
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
          <input
            type="text"
            name="address"
            value={passengerData.address}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={passengerData.phone}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Número de teléfono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={passengerData.email}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Correo electrónico"
          />
        </div>
      </div>
    </div>
  );
};