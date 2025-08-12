// src/components/common/ClientSearch.tsx
import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface Client {
  id: number;
  name: string;
  document_type: 'DNI' | 'RUC';
  document_number: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface ClientSearchProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
  onCreateClient: (documentNumber: string, documentType: 'DNI' | 'RUC') => void;
  loading?: boolean;
  error?: string;
}

export const ClientSearch: React.FC<ClientSearchProps> = ({
  selectedClient,
  onClientSelect,
  onCreateClient,
  loading = false,
  error
}) => {
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentType, setDocumentType] = useState<'DNI' | 'RUC'>('DNI');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateOption, setShowCreateOption] = useState(false);

  // Detectar tipo de documento automáticamente
  useEffect(() => {
    if (documentNumber.length === 8 && /^\d+$/.test(documentNumber)) {
      setDocumentType('DNI');
    } else if (documentNumber.length === 11 && /^\d+$/.test(documentNumber)) {
      setDocumentType('RUC');
    }
  }, [documentNumber]);

  // Simular búsqueda de cliente (aquí irá la llamada real al backend)
  const handleSearch = async () => {
    if (!documentNumber.trim()) return;

    setIsSearching(true);
    setShowCreateOption(false);
    
    try {
      // TODO: Reemplazar con llamada real al servicio de clientes
      // const results = await clientsService.searchByDocument(documentNumber, documentType);
      
      // Simulación temporal
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simular resultados (vacío para mostrar opción de crear)
      const mockResults: Client[] = [];
      setSearchResults(mockResults);
      
      if (mockResults.length === 0) {
        setShowCreateOption(true);
      }
    } catch (err) {
      console.error('Error searching client:', err);
      setShowCreateOption(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateClient = () => {
    onCreateClient(documentNumber, documentType);
    setShowCreateOption(false);
  };

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchResults([]);
    setDocumentNumber('');
    setShowCreateOption(false);
  };

  const handleClearClient = () => {
    onClientSelect(null);
    setDocumentNumber('');
    setSearchResults([]);
    setShowCreateOption(false);
  };

  if (selectedClient) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-medium text-green-800">Cliente Seleccionado</h4>
            <p className="text-sm text-green-700 mt-1">
              <strong>{selectedClient.name}</strong>
            </p>
            <p className="text-xs text-green-600">
              {selectedClient.document_type}: {selectedClient.document_number}
            </p>
            {selectedClient.phone && (
              <p className="text-xs text-green-600">Tel: {selectedClient.phone}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearClient}
            className="text-green-700 border-green-300"
          >
            Cambiar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Cliente *
        </label>
        <div className="flex space-x-2">
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as 'DNI' | 'RUC')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="DNI">DNI</option>
            <option value="RUC">RUC</option>
          </select>
          <Input
            type="text"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder={documentType === 'DNI' ? '12345678' : '20123456789'}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={!documentNumber.trim() || isSearching}
            className="whitespace-nowrap"
          >
            {isSearching ? <Spinner size="sm" /> : 'Buscar'}
          </Button>
        </div>
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-md">
          <div className="p-3 bg-gray-50 border-b">
            <h4 className="text-sm font-medium text-gray-900">Clientes encontrados</h4>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {searchResults.map((client) => (
              <div
                key={client.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleClientSelect(client)}
              >
                <p className="text-sm font-medium text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-500">
                  {client.document_type}: {client.document_number}
                </p>
                {client.phone && (
                  <p className="text-xs text-gray-500">Tel: {client.phone}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opción para crear cliente */}
      {showCreateOption && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-800">Cliente no encontrado</h4>
              <p className="text-sm text-blue-700 mt-1">
                ¿Desea crear un nuevo cliente con {documentType}: {documentNumber}?
              </p>
            </div>
            <Button
              type="button"
              onClick={handleCreateClient}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Spinner size="sm" /> : 'Crear Cliente'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
