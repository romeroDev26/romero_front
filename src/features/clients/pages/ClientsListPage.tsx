// src/features/clients/pages/ClientsListPage.tsx
import React, { useState } from 'react';
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

export const ClientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estados para filtros y modales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocType, setFilterDocType] = useState<DocType | 'ALL'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
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
  
  // Filtrar clientes según criterios
  const filteredClients = clients ? clients.filter(client => {
    // Filtro por tipo de documento
    const matchesDocType = filterDocType === 'ALL' || client.doc_type === filterDocType;
    
    // Filtro por estado
    const matchesActive = filterActive === 'ALL' || 
      (filterActive === 'ACTIVE' ? client.is_active : !client.is_active);
    
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
    
    return matchesDocType && matchesActive && matchesSearch;
  }) : [];
  
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="Buscar por nombre, documento, email, teléfono o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="rounded-md border-gray-300 shadow-sm p-2 border"
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
          
          <select
            className="rounded-md border-gray-300 shadow-sm p-2 border"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>
      </div>
      
      {/* Tabla de clientes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
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
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {getDocTypeDisplay(client.doc_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.doc_number}
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900">{client.name}</div>
                  {(client.address_line || client.department || client.province || client.district) && (
                    <div className="text-gray-500 text-sm">
                      {[
                        client.address_line,
                        client.district,
                        client.province,
                        client.department
                      ].filter(Boolean).join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.phone || '-'}
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
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
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