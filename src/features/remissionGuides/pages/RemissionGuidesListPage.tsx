// src/features/remissionGuides/pages/RemissionGuidesListPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';

// Este servicio tendría que ser implementado
// import { remissionGuidesService } from '../../../services/remissionGuides.service';

export const RemissionGuidesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: guides, isLoading } = useQuery(['remissionGuides'], remissionGuidesService.getAll);
  
  // Datos simulados para el ejemplo
  const guides = [
    { 
      id: 1, 
      series: 'T001', 
      number: 123, 
      document_type_code: '31',
      issue_date: '2025-04-15',
      shipment_start_date: '2025-04-16',
      sender_name: 'Transportes Romero S.A.C.',
      recipient_name: 'Empresa ABC S.A.C.',
      origin_address: 'Av. Principal 123, Iquitos',
      destination_address: 'Jr. Comercio 456, Tarapoto',
      sunat_status: 'ACCEPTED',
      vehicle_plate: 'ABC-123'
    },
    { 
      id: 2, 
      series: 'T001', 
      number: 124, 
      document_type_code: '31',
      issue_date: '2025-04-17',
      shipment_start_date: '2025-04-18',
      sender_name: 'Transportes Romero S.A.C.',
      recipient_name: 'Distribuidora XYZ E.I.R.L.',
      origin_address: 'Av. Principal 123, Iquitos',
      destination_address: 'Av. Industrial 789, Pucallpa',
      sunat_status: 'PENDING',
      vehicle_plate: 'DEF-456'
    },
    { 
      id: 3, 
      series: 'T001', 
      number: 125, 
      document_type_code: '31',
      issue_date: '2025-04-18',
      shipment_start_date: '2025-04-19',
      sender_name: 'Transportes Romero S.A.C.',
      recipient_name: 'Almacenes del Norte S.A.C.',
      origin_address: 'Av. Principal 123, Iquitos',
      destination_address: 'Calle Mayor 234, Yurimaguas',
      sunat_status: 'SENT',
      vehicle_plate: 'GHI-789'
    }
  ];
  
  const isLoading = false;
  
  // Filtrar guías según término de búsqueda
  const filteredGuides = guides.filter(guide => 
    guide.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${guide.series}-${guide.number}`.includes(searchTerm) ||
    guide.vehicle_plate.includes(searchTerm.toUpperCase())
  );
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'GENERATED':
        return 'bg-blue-100 text-blue-800';
      case 'SIGNED':
        return 'bg-indigo-100 text-indigo-800';
      case 'SENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'OBSERVED':
        return 'bg-orange-100 text-orange-800';
      case 'VOIDED':
        return 'bg-purple-100 text-purple-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'GENERATED': return 'Generado';
      case 'SIGNED': return 'Firmado';
      case 'SENT': return 'Enviado';
      case 'ACCEPTED': return 'Aceptado';
      case 'REJECTED': return 'Rechazado';
      case 'OBSERVED': return 'Observado';
      case 'VOIDED': return 'Anulado';
      case 'ERROR': return 'Error';
      default: return status;
    }
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Guías de Remisión Electrónicas</h1>
        <Button
          onClick={() => navigate('/remission-guides/new')}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Guía de Remisión
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
            placeholder="Buscar por destinatario, placa o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="rounded-md border-gray-300 shadow-sm p-2 border"
            defaultValue=""
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="ACCEPTED">Aceptado</option>
            <option value="REJECTED">Rechazado</option>
            <option value="SENT">Enviado</option>
          </select>
          
          <select
            className="rounded-md border-gray-300 shadow-sm p-2 border"
            defaultValue=""
          >
            <option value="">Último mes</option>
            <option value="7">Última semana</option>
            <option value="30">Último mes</option>
            <option value="90">Últimos 3 meses</option>
          </select>
        </div>
      </div>
      
      {/* Tabla de guías */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Emisión
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Traslado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destinatario
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destino
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Placa
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGuides.map((guide) => (
              <tr
                key={guide.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/remission-guides/${guide.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-primary">
                    {guide.series}-{guide.number.toString().padStart(8, '0')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {guide.issue_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {guide.shipment_start_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {guide.recipient_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {guide.destination_address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {guide.vehicle_plate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(guide.sunat_status)}`}>
                    {getStatusText(guide.sunat_status)}
                  </span>
                </td>
              </tr>
            ))}
            
            {filteredGuides.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron guías de remisión
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
