import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import { toast } from '@/utils/sileo-toast';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { clientsService } from '../../../services/clients.service';
import { externalQueryService, DniResponse, RucResponse } from '../../../services/external.service';
import { DOCUMENT_TYPES, SunatDocType } from '../../fluvial/types/sunat.types';

// Interfaz local para cliente
export interface LocalClient {
  id: number;
  name: string;
  doc_number: string;
  doc_type: string;
  email?: string;
  phone?: string;
}

interface ClientSelectorProps {
  selectedClient: LocalClient | null;
  onClientSelect: (client: LocalClient | null) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClient,
  onClientSelect
}) => {
  const [docType, setDocType] = useState<string>(SunatDocType.DNI);
  const [docNumber, setDocNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    countryCode: 'PE'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'docType') {
      setDocType(value);
      // Limpiar datos cuando cambie el tipo de documento
      setDocNumber('');
      setClientData({
        name: '',
        email: '',
        phone: '',
        address: '',
        countryCode: value === '1' || value === '6' ? 'PE' : ''
      });
      setShowClientForm(false);
    } else if (name === 'docNumber') {
      setDocNumber(value);
    }
  };

  const handleClientDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!docNumber.trim()) {
      toast.error('Ingrese un número de documento');
      return;
    }

    // Validaciones
    if (docType === '1') { // DNI
      if (!/^\d{8}$/.test(docNumber.trim())) {
        toast.error('El DNI debe tener exactamente 8 dígitos');
        return;
      }
    } else if (docType === '6') { // RUC
      if (!/^(10|20)\d{9}$/.test(docNumber.trim())) {
        toast.error('El RUC debe tener 11 dígitos y empezar con 10 o 20');
        return;
      }
    } else if (docType === '4') { // CE
      if (docNumber.trim().length < 4 || docNumber.trim().length > 12) {
        toast.error('El Carnet de Extranjería debe tener entre 4 y 12 caracteres');
        return;
      }
    }

    setIsSearching(true);
    try {
      // 1. Primero buscar en base de datos interna
      const existingClient = await clientsService.findByDocument(docNumber.trim());
      
      if (existingClient) {
        // Cliente encontrado en BD interna
        onClientSelect({
          id: existingClient.id,
          name: existingClient.name,
          doc_number: existingClient.doc_number,
          doc_type: existingClient.doc_type,
          email: existingClient.email || '',
          phone: existingClient.phone || ''
        });
        toast.success(`Cliente encontrado: ${existingClient.name}`);
        return;
      }

      // 2. Si no existe, buscar en servicios externos
      let externalData = null;
      
      if (docType === '1') { // DNI
        try {
          const dniData: DniResponse = await externalQueryService.queryDni(docNumber.trim());
          externalData = {
            name: dniData.nombreCompleto,
            email: dniData.email || '',
            phone: dniData.phone || '',
            address: '',
            countryCode: 'PE'
          };
        } catch (error) {
          console.error('Error consultando DNI:', error);
        }
      } else if (docType === '6') { // RUC
        try {
          const rucData: RucResponse = await externalQueryService.queryRuc(docNumber.trim());
          externalData = {
            name: rucData.razonSocial,
            email: rucData.email || '',
            phone: rucData.phone || '',
            address: rucData.direccion || '',
            countryCode: 'PE'
          };
        } catch (error) {
          console.error('Error consultando RUC:', error);
        }
      }

      // 3. Configurar formulario con datos encontrados o vacío
      if (externalData) {
        setClientData(externalData);
        toast.success('Datos encontrados en registros públicos');
      } else {
        setClientData({
          name: '',
          email: '',
          phone: '',
          address: '',
          countryCode: docType === '1' || docType === '6' ? 'PE' : ''
        });
        toast.info('Cliente no encontrado. Complete los datos manualmente');
      }
      
      setShowClientForm(true);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al buscar cliente';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmClient = () => {
    if (!clientData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    onClientSelect({
      id: 0, // ID temporal para nuevo cliente
      name: clientData.name.trim(),
      doc_number: docNumber.trim(),
      doc_type: docType,
      email: clientData.email.trim(),
      phone: clientData.phone.trim()
    });
    
    toast.success('Cliente preparado para registro');
  };

  const handleCancelForm = () => {
    setShowClientForm(false);
    setClientData({
      name: '',
      email: '',
      phone: '',
      address: '',
      countryCode: 'PE'
    });
  };

  const isSearchable = docType === '1' || docType === '6' || docType === '4';

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
      
      {/* Formulario de búsqueda */}
      {!selectedClient && !showClientForm && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Datos del Cliente</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc.</label>
              <select
                name="docType"
                value={docType}
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
                  value={docNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-l-md"
                  placeholder="Ingrese el número"
                />
                <Button
                  onClick={handleSearch}
                  disabled={!isSearchable || isSearching || !docNumber.trim()}
                  className="rounded-l-none"
                >
                  {isSearching ? <Spinner size="sm"/> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {isSearchable 
              ? 'El sistema buscará primero en la base de datos interna, luego en registros públicos'
              : 'Complete el número de documento para buscar'
            }
          </div>
        </div>
      )}

      {/* Formulario de datos del cliente - IGUAL QUE SALEFORM */}
      {showClientForm && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Completar Datos del Cliente</h3>
          
          {/* Mostrar info del documento encontrado */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-center gap-2">
              <User className="text-blue-600 w-4 h-4" />
              <span className="text-sm font-medium text-blue-800">
                {DOCUMENT_TYPES.find(d => d.code === docType)?.name}: {docNumber}
              </span>
              <span className="text-xs text-blue-600">
                {clientData.name ? '(Datos encontrados)' : '(Complete manualmente)'}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {docType === '6' ? 'Razón Social *' : 'Nombres Completos *'}
              </label>
              <input
                type="text"
                name="name"
                value={clientData.name}
                onChange={handleClientDataChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={docType === '6' ? 'Razón Social de la empresa' : 'Nombres y apellidos'}
              />
            </div>
            
            {docType === '6' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                <input
                  type="text"
                  name="address"
                  value={clientData.address}
                  onChange={handleClientDataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección fiscal de la empresa"
                />
              </div>
            )}
            
            {/* Selector de país para documentos no peruanos - IGUAL QUE SALEFORM */}
            {docType !== '1' && docType !== '6' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País de Procedencia
                </label>
                <select
                  name="countryCode"
                  value={clientData.countryCode}
                  onChange={handleClientDataChange}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar país de procedencia...</option>
                  <option value="PE">Perú</option>
                  <option value="US">Estados Unidos</option>
                  <option value="BR">Brasil</option>
                  <option value="CO">Colombia</option>
                  <option value="EC">Ecuador</option>
                  <option value="BO">Bolivia</option>
                  <option value="AR">Argentina</option>
                  <option value="CL">Chile</option>
                </select>
                {clientData.countryCode && (
                  <div className="mt-1 text-xs text-gray-500">
                    Código de país: <span className="font-mono font-semibold">{clientData.countryCode}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Mostrar país fijo para documentos peruanos - IGUAL QUE SALEFORM */}
            {(docType === '1' || docType === '6') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded-md">
                  <img 
                    src="https://flagcdn.com/pe.svg" 
                    alt="Bandera de Perú"
                    className="w-5 h-3 object-cover rounded"
                  />
                  <span className="text-gray-900">Peru</span>
                  <span className="text-gray-500 text-sm">(PE)</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={clientData.phone}
                  onChange={handleClientDataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número de teléfono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={clientData.email}
                  onChange={handleClientDataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Correo electrónico"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                onClick={handleConfirmClient}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Confirmar Cliente
              </Button>
              <Button
                type="button"
                onClick={handleCancelForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cliente seleccionado con campos EDITABLES como SaleForm */}
      {selectedClient && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Datos del Cliente</h3>
            <Button
              type="button"
              onClick={() => {
                onClientSelect(null);
                setDocNumber('');
                setShowClientForm(false);
                setClientData({
                  name: '',
                  email: '',
                  phone: '',
                  address: '',
                  countryCode: 'PE'
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              Cambiar Cliente
            </Button>
          </div>

          {/* Información del documento */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
            <div className="flex items-center gap-3">
              <User className="text-gray-600 w-4 h-4" />
              <span className="text-sm font-medium text-gray-800">
                {DOCUMENT_TYPES.find(d => d.code === selectedClient.doc_type)?.name}: {selectedClient.doc_number}
              </span>
              {selectedClient.id === 0 ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Nuevo Cliente
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Cliente Existente
                </span>
              )}
            </div>
          </div>

          {/* Formulario editable igual que SaleForm */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedClient.doc_type === '6' ? 'Razón Social' : 'Nombres Completos'}
              </label>
              <input
                type="text"
                value={selectedClient.name}
                onChange={(e) => {
                  onClientSelect({
                    ...selectedClient,
                    name: e.target.value
                  });
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={selectedClient.doc_type === '6' ? 'Razón Social de la empresa' : 'Nombres y apellidos'}
              />
            </div>

            {/* Mostrar país fijo para documentos peruanos */}
            {(selectedClient.doc_type === '1' || selectedClient.doc_type === '6') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded-md">
                  <img 
                    src="https://flagcdn.com/pe.svg" 
                    alt="Bandera de Perú"
                    className="w-5 h-3 object-cover rounded"
                  />
                  <span className="text-gray-900">Peru</span>
                  <span className="text-gray-500 text-sm">(PE)</span>
                </div>
              </div>
            )}

            {/* Campos de contacto EDITABLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={selectedClient.phone || ''}
                  onChange={(e) => {
                    onClientSelect({
                      ...selectedClient,
                      phone: e.target.value
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número de teléfono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={selectedClient.email || ''}
                  onChange={(e) => {
                    onClientSelect({
                      ...selectedClient,
                      email: e.target.value
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Correo electrónico"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
