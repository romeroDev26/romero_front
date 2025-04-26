// src/features/clients/pages/ClientsListPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Client, DocType } from '../../../types';

// Este servicio tendría que ser implementado
// import { clientsService } from '../../../services/clients.service';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocType, setFilterDocType] = useState<DocType | 'ALL'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: clients, isLoading } = useQuery(['clients'], clientsService.getAll);
  
  // Datos simulados para el ejemplo
  const clients: Client[] = [
    { 
      id: 1, 
      doc_type: '6',
      doc_number: '20123456789',
      name: 'Empresa ABC S.A.C.',
      address: 'Av. Comercio 123, Lima',
      ubigeo: '150101',
      email: 'contacto@empresaabc.com',
      phone: '01-1234567',
      is_active: true,
      created_at: '2025-01-01T00:00:00-05:00',
      updated_at: '2025-01-01T00:00:00-05:00'
    },
    { 
      id: 2, 
      doc_type: '1',
      doc_number: '12345678',
      name: 'Juan Pérez García',
      address: 'Jr. Las Flores 456, Iquitos',
      ubigeo: '160101',
      email: 'juan.perez@email.com',
      phone: '965123456',
      is_active: true,
      created_at: '2025-01-02T00:00:00-05:00',
      updated_at: '2025-01-02T00:00:00-05:00'
    },
    { 
      id: 3, 
      doc_type: '6',
      doc_number: '20987654321',
      name: 'Distribuidora XYZ E.I.R.L.',
      address: 'Av. Industrial 789, Tarapoto',
      ubigeo: '220601',
      email: 'ventas@distxyz.com',
      phone: '042-123456',
      is_active: false,
      created_at: '2025-01-03T00:00:00-05:00',
      updated_at: '2025-01-03T00:00:00-05:00'
    },
    { 
      id: 4, 
      doc_type: '4',
      doc_number: 'CE123456',
      name: 'María Rodríguez',
      address: 'Calle Mayor 789, Pucallpa',
      ubigeo: '250101',
      email: 'maria.rodriguez@email.com',
      phone: '961987654',
      is_active: true,
      created_at: '2025-01-04T00:00:00-05:00',
      updated_at: '2025-01-04T00:00:00-05:00'
    }
  ];
  
  const isLoading = false;
  
  // Filtrar clientes según criterios
  let filteredClients = clients;
  
  // Filtrar por tipo de documento
  if (filterDocType !== 'ALL') {
    filteredClients = filteredClients.filter(client => client.doc_type === filterDocType);
  }
  
  // Filtrar por estado
  if (filterActive !== 'ALL') {
    filteredClients = filteredClients.filter(
      client => filterActive === 'ACTIVE' ? client.is_active : !client.is_active
    );
  }
  
  // Filtrar por búsqueda
  if (searchTerm) {
    filteredClients = filteredClients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.doc_number.includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm))
    );
  }
  
  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      // En un proyecto real, llamarías a una API
      // clientsService.delete(id);
      console.log('Eliminando cliente:', id);
    }
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button
          onClick={() => navigate('/clients/new')}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Cliente
        </Button>
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
            placeholder="Buscar por nombre, documento, email o teléfono..."
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
                  {client.address && (
                    <div className="text-gray-500 text-sm">{client.address}</div>
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
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
