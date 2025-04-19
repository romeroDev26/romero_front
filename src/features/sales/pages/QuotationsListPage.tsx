// src/features/sales/pages/QuotationsListPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';

// Este servicio tendría que ser implementado
// import { quotationsService } from '../../../services/quotations.service';

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: quotations, isLoading } = useQuery(['quotations'], quotationsService.getAll);
  
  // Datos simulados para el ejemplo
  const quotations = [
    { 
      id: 1, 
      series: 'COT', 
      number: 1001, 
      client: { id: 1, name: 'Empresa ABC S.A.C.', doc_number: '20123456789' },
      issue_date: '2025-04-15',
      expiry_date: '2025-04-30',
      total_amount: 1250.50,
      currency_code: 'PEN',
      status: 'DRAFT'
    },
    { 
      id: 2, 
      series: 'COT', 
      number: 1002, 
      client: { id: 2, name: 'Distribuidora XYZ E.I.R.L.', doc_number: '20987654321' },
      issue_date: '2025-04-17',
      expiry_date: '2025-05-02',
      total_amount: 3456.20,
      currency_code: 'PEN',
      status: 'SENT'
    },
    { 
      id: 3, 
      series: 'COT', 
      number: 1003, 
      client: { id: 3, name: 'Juan Pérez', doc_number: '12345678' },
      issue_date: '2025-04-18',
      expiry_date: '2025-04-25',
      total_amount: 750.00,
      currency_code: 'PEN',
      status: 'APPROVED'
    },
    { 
      id: 4, 
      series: 'COT', 
      number: 1004, 
      client: { id: 1, name: 'Empresa ABC S.A.C.', doc_number: '20123456789' },
      issue_date: '2025-04-19',
      expiry_date: '2025-05-04',
      total_amount: 2100.80,
      currency_code: 'PEN',
      status: 'REJECTED'
    }
  ];
  
  const isLoading = false;
  
  // Filtrar cotizaciones según término de búsqueda
  const filteredQuotations = quotations.filter(quotation => 
    quotation.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.client.doc_number.includes(searchTerm) ||
    `${quotation.series}-${quotation.number}`.includes(searchTerm)
  );
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'SENT': return 'Enviada';
      case 'APPROVED': return 'Aprobada';
      case 'REJECTED': return 'Rechazada';
      default: return status;
    }
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <Button
          onClick={() => navigate('/sales/quotations/new')}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Cotización
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
            placeholder="Buscar por cliente, documento o número..."
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
            <option value="DRAFT">Borrador</option>
            <option value="SENT">Enviada</option>
            <option value="APPROVED">Aprobada</option>
            <option value="REJECTED">Rechazada</option>
          </select>
          
          <select
            className="rounded-md border-gray-300 shadow-sm p-2 border"
            defaultValue=""
          >
            <option value="">Último mes</option>
            <option value="7">Última semana</option>
            <option value="30">Último mes</option>
            <option value="90">Últimos 3 meses</option>
            <option value="365">Último año</option>
          </select>
        </div>
      </div>
      
      {/* Tabla de cotizaciones */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Emisión
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimiento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQuotations.map((quotation) => (
              <tr
                key={quotation.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/sales/quotations/${quotation.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-primary">
                    {quotation.series}-{quotation.number.toString().padStart(4, '0')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-900">{quotation.client.name}</div>
                  <div className="text-gray-500 text-sm">{quotation.client.doc_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {quotation.issue_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {quotation.expiry_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {quotation.currency_code === 'PEN' ? 'S/ ' : '$ '}
                  {quotation.total_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(quotation.status)}`}>
                    {getStatusText(quotation.status)}
                  </span>
                </td>
              </tr>
            ))}
            
            {filteredQuotations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron cotizaciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
