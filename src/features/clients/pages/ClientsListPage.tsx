// src/features/clients/pages/ClientsListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { clientsService } from '../../../services/clients.service';
import { Client, DocType } from '../../../types';

// Función helper para obtener el texto del tipo de documento
const getDocTypeDisplay = (type: string): string => {
  switch (type as DocType) {
    case '1': return 'DNI';
    case '4': return 'Carnet de Extranjería';
    case '6': return 'RUC';
    case '7': return 'Pasaporte';
    case '0': return 'Otros';
    default: return 'Desconocido';
  }
};

// Función helper para formatear la dirección completa
const formatAddress = (client: Client): string => {
  const addressParts: string[] = [];
  
  if (client.address_line) {
    addressParts.push(client.address_line);
  }
  
  // Construir la dirección administrativa
  const administrativeParts: string[] = [];
  if (client.district) administrativeParts.push(client.district);
  if (client.province) administrativeParts.push(client.province);
  if (client.department) administrativeParts.push(client.department);
  
  if (administrativeParts.length > 0) {
    addressParts.push(administrativeParts.join(', '));
  }
  
  return addressParts.join(' - ') || '-';
};

// Función helper para obtener el nombre del país
const getCountryName = (countryCode?: string): string => {
  const countries: { [key: string]: string } = {
    'PE': 'Perú',
    'CO': 'Colombia',
    'EC': 'Ecuador',
    'BO': 'Bolivia',
    'BR': 'Brasil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'US': 'Estados Unidos',
    'ES': 'España',
  };
  
  return countryCode ? countries[countryCode] || countryCode : '';
};

export const ClientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estados para filtros y modales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocType, setFilterDocType] = useState<DocType | 'ALL'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  
  // Query para obtener clientes
  const { 
    data: clients, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Mutación para eliminar cliente
  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => clientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente eliminado correctamente');
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
    },
    onError: (error: any) => {
      console.error('Error eliminando cliente:', error);
      if (error.response?.status === 403) {
        toast.error('No tienes permisos para eliminar clientes');
      } else if (error.response?.status === 404) {
        toast.error('Cliente no encontrado');
      } else {
        toast.error(error.response?.data?.detail || 'Error al eliminar cliente');
      }
    }
  });
  
  // Obtener países únicos para el filtro
  const uniqueCountries = clients ? Array.from(new Set(
    clients
      .map(client => client.country_code)
      .filter(Boolean)
  )).sort() : [];
  
  // Filtrar clientes según criterios
  const filteredClients = clients ? clients.filter(client => {
    // Filtro por tipo de documento
    const matchesDocType = filterDocType === 'ALL' || client.doc_type === filterDocType;
    
    // Filtro por estado
    const matchesActive = filterActive === 'ALL' || 
      (filterActive === 'ACTIVE' ? client.is_active : !client.is_active);
    
    // Filtro por país
    const matchesCountry = filterCountry === 'ALL' || client.country_code === filterCountry;
    
    // Filtro por búsqueda
    const matchesSearch = searchTerm === '' || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.doc_number.includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.address_line && client.address_line.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.department && client.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.province && client.province.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.district && client.district.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesDocType && matchesActive && matchesCountry && matchesSearch;
  }) : [];

  // Ajustar la página actual si cambia la cantidad de elementos filtrados
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));

  useEffect(() => {
    // Si los filtros cambian, volver a la primera página
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterDocType, filterActive, filterCountry, clients?.length]);

  useEffect(() => {
    // Asegurar que la página actual no exceda el total de páginas
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedClient) {
      deleteClientMutation.mutate(selectedClient.id);
    }
  };
  
  const handleRefresh = () => {
    refetch();
  };
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <Button onClick={handleRefresh}>
            Reintentar
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar clientes
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>No se pudieron cargar los clientes. Por favor, intente nuevamente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        </div>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
          >
            Actualizar
          </Button>
          <Button
            onClick={() => navigate('/clients/new')}
            className="flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="relative flex flex-col md:flex-row gap-4 items-start">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full min-w-0 rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="Buscar por nombre, documento, email, teléfono o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative flex gap-3 flex-wrap items-center">
          <div className="relative">
            <select
              className="rounded-md border-gray-300 shadow-sm p-2 border bg-white relative z-20 min-w-[200px] text-sm"
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value as DocType | 'ALL')}
            >
              <option value="ALL">Todos los documentos</option>
              <option value="6">RUC</option>
              <option value="1">DNI</option>
              <option value="4">Carnet de Extranjería</option>
              <option value="7">Pasaporte</option>
              <option value="0">Otros</option>
            </select>
          </div>

          <div className="relative">
            <select
              className="rounded-md border-gray-300 shadow-sm p-2 border bg-white relative z-20 min-w-[160px] text-sm"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>

          {uniqueCountries.length > 0 && (
            <div className="relative">
              <select
                className="rounded-md border-gray-300 shadow-sm p-2 border bg-white relative z-20 min-w-[160px] text-sm"
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
              >
                <option value="ALL">Todos los países</option>
                {uniqueCountries.map((countryCode) => (
                  <option key={countryCode} value={countryCode}>
                    {getCountryName(countryCode)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      {/* Estadísticas rápidas */}
      {clients && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{clients.length}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {clients.filter(c => c.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {clients.filter(c => !c.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Inactivos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {clients.filter(c => c.doc_type === '6').length}
              </div>
              <div className="text-sm text-gray-500">Empresas (RUC)</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Doc.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número Doc.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre / Razón Social
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  País
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {getDocTypeDisplay(client.doc_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {client.doc_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">{client.name}</div>
                    {client.ubigeo && (
                      <div className="text-gray-500 text-xs">Ubigeo: {client.ubigeo}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {formatAddress(client)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {client.email && (
                        <div className="text-gray-900">{client.email}</div>
                      )}
                      {client.phone && (
                        <div className="text-gray-500">{client.phone}</div>
                      )}
                      {!client.email && !client.phone && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getCountryName(client.country_code) || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="text-primary hover:text-primary/80 mr-4"
                      title="Editar cliente"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar cliente"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {clients && clients.length > 0 
                      ? 'No se encontraron clientes con los filtros aplicados'
                      : 'No hay clientes registrados'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-between bg-white mt-4 p-4 rounded-lg">
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{filteredClients.length === 0 ? 0 : (filteredClients.length === 0 ? 0 : ( (currentPage - 1) * itemsPerPage + 1 ))}</span>
          {' - '}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredClients.length)}</span>
          {' de '}
          <span className="font-medium">{filteredClients.length}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md text-sm border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            « Primero
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md text-sm border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            ‹ Prev
          </button>

          {/* Números de página simples: mostrar algunas páginas alrededor de la actual */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1 rounded-md text-sm border ${p === currentPage ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md text-sm border ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            Next ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md text-sm border ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            Último »
          </button>
        </div>
      </div>
      
      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        maxWidth="sm"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            ¿Está seguro que desea eliminar el cliente{' '}
            <strong>{selectedClient?.name}</strong>?
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Esta acción desactivará el cliente en el sistema.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleteClientMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};