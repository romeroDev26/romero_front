// src/features/cargo/components/RecipientForm.tsx
import React, { useState } from 'react';
import { SunatDocType, DOCUMENT_TYPES } from '../../fluvial/types/sunat.types';
import { useSunatData } from '../../fluvial/hooks/useSunatData';
import { ClientSearchAutocomplete } from '../../../components/common/ClientSearchAutocomplete';
import { Client } from '../../../types';
import { Search, CheckCircle } from 'lucide-react';
import { toast } from '@/utils/sileo-toast';


export interface RecipientData {
  isSameAsSender: boolean;
  name: string;
  docType: string;
  docNumber: string;
  phone: string;
}

interface RecipientFormProps {
  recipient: RecipientData;
  setRecipient: React.Dispatch<React.SetStateAction<RecipientData>>;
  remitter: { name: string; docType: string; docNumber: string; phone: string };
  disabled?: boolean;
}

export const RecipientForm: React.FC<RecipientFormProps> = ({ recipient, setRecipient, remitter, disabled = false }) => {
  const [isSearching, setIsSearching] = useState(false);
  const { queryDni, isQueryingDni, queryRuc, isQueryingRuc } = useSunatData();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setRecipient(prev => ({
        ...prev,
        isSameAsSender: checked,
        ...(checked ? {
          name: remitter.name,
          docType: remitter.docType,
          docNumber: remitter.docNumber,
          phone: remitter.phone,
        } : {})
      }));
    } else {
      setRecipient(prev => ({ ...prev, [name]: value }));
    }
  };

  // Lógica para búsqueda automática de datos por DNI/RUC
  const handleClientSelect = (client: Client) => {
    setRecipient(prev => ({
      ...prev,
      name: client.name,
      docType: client.doc_type,
      docNumber: client.doc_number,
      phone: client.phone || prev.phone,
    }));
    toast.success(`Destinatario seleccionado: ${client.name}`);
  };

  const handleSearch = async () => {
    if (!recipient.docNumber.trim()) {
      toast.warning('Ingrese un número de documento para buscar.');
      return;
    }

    setIsSearching(true);
    try {
      if (recipient.docType === SunatDocType.DNI) {
        const data = await queryDni(recipient.docNumber);
        if (data) {
          setRecipient(prev => ({
            ...prev,
            name: data.nombreCompleto,
            ...(data.phone && { phone: data.phone })
          }));
          toast.success('Datos encontrados correctamente.');
        }
      } else if (recipient.docType === SunatDocType.RUC) {
        const data = await queryRuc(recipient.docNumber);
        if (data) {
          setRecipient(prev => ({
            ...prev,
            name: data.razonSocial,
            ...(data.phone && { phone: data.phone })
          }));
          toast.success('Datos encontrados correctamente.');
        }
      } else {
        toast.info('La búsqueda automática solo está disponible para DNI y RUC.');
      }
    } catch (error) {
      console.error("Error en la búsqueda del destinatario:", error);
      // El toast de error ya se muestra desde el hook useSunatData
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-dm-bg-primary rounded-lg shadow-sm border border-dm-border-primary p-4 md:p-6 space-y-6">
      <h3 className="font-semibold text-lg text-dm-text-primary mb-2 flex items-center gap-2">
        <span>Datos del Destinatario</span>
      </h3>
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="isSameAsSender"
          name="isSameAsSender"
          checked={recipient.isSameAsSender}
          onChange={handleInputChange}
          className="h-4 w-4 text-blue-600 dark:text-blue-400 border-dm-border-primary rounded focus:ring-blue-500"
          disabled={disabled}
        />
        <label htmlFor="isSameAsSender" className="ml-2 block text-sm text-dm-text-primary select-none cursor-pointer">
          El destinatario es el mismo que el remitente
        </label>
      </div>
      {!recipient.isSameAsSender && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <ClientSearchAutocomplete
              onSelect={handleClientSelect}
              placeholder="Buscar destinatario por nombre..."
              disabled={disabled}
              label="Búsqueda rápida de destinatario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">Tipo de documento *</label>
            <select
              name="docType"
              value={recipient.docType}
              onChange={handleInputChange}
              className="w-full p-2 border border-dm-border-primary rounded-md bg-dm-bg-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-dm-bg-secondary"
              disabled={disabled}
              title="Tipo de documento del destinatario"
            >
              {DOCUMENT_TYPES.map(doc => (
                <option key={doc.code} value={doc.code}>{doc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">N° Documento *</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="docNumber"
                value={recipient.docNumber}
                onChange={handleInputChange}
                className="flex-1 p-2 border border-dm-border-primary rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-dm-bg-secondary"
                placeholder={recipient.docType === SunatDocType.DNI ? '12345678' : '20123456789'}
                disabled={disabled}
                maxLength={recipient.docType === SunatDocType.DNI ? 8 : 11}
                title="Número de documento del destinatario"
                autoComplete="off"
              />
              {(recipient.docType === SunatDocType.DNI || recipient.docType === SunatDocType.RUC) && (
                <button
                  type="button"
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                  disabled={disabled || !recipient.docNumber || isSearching || isQueryingDni || isQueryingRuc}
                  title="Buscar datos en SUNAT"
                >
                  {(isSearching || isQueryingDni || isQueryingRuc) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm">Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span className="text-sm">Buscar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {recipient.name && !recipient.isSameAsSender && (
              <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Datos encontrados</span>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">Nombre Completo *</label>
            <input
              type="text"
              name="name"
              value={recipient.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-dm-border-primary rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-dm-bg-secondary"
              placeholder="Nombre completo o razón social"
              disabled={disabled}
              maxLength={80}
              title="Nombre completo del destinatario"
              autoComplete="off"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dm-text-secondary mb-1">Teléfono de Contacto</label>
            <input
              type="tel"
              name="phone"
              value={recipient.phone}
              onChange={handleInputChange}
              className="w-full p-2 border border-dm-border-primary rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-dm-bg-secondary"
              placeholder="Número de teléfono (opcional)"
              disabled={disabled}
              maxLength={15}
              title="Teléfono del destinatario"
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </div>
  );
};
