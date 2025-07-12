// src/features/accounting/pages/InvoicesListPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  CalendarIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Input } from '../../../components/common/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import { SunatStatusBadge } from '../components/SunatStatusBadge';
import { invoicesService } from '../../../services/invoices.service';
import { VoidableInvoice } from '../types';

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // TODO: Obtener company_id del contexto de autenticación
  const companyId = 1;

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', companyId],
    queryFn: () => invoicesService.getVoidableInvoices(companyId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Filtro por búsqueda
    if (debouncedSearchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.client_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        `${invoice.series}-${invoice.number}`.includes(debouncedSearchTerm)
      );
    }

    // Filtro por tipo de documento
    if (documentTypeFilter) {
      filtered = filtered.filter(invoice => invoice.document_type_code === documentTypeFilter);
    }

    // Filtro por fecha
    if (dateFilter) {
      const now = new Date();
      const days = parseInt(dateFilter);
      const filterDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(invoice => new Date(invoice.issue_date) >= filterDate);
    }

    return filtered;
  }, [invoices, debouncedSearchTerm, documentTypeFilter, dateFilter]);

  const getDocumentTypeLabel = (code: string) => {
    const types: Record<string, string> = {
      '01': 'Factura',
      '03': 'Boleta',
      '07': 'Nota de Crédito',
      '08': 'Nota de Débito'
    };
    return types[code] || code;
  };

  const columns: Column<VoidableInvoice>[] = [
    {
      key: 'document',
      header: 'Documento',
      accessor: (invoice: VoidableInvoice) => (
        <div>
          <div className="font-medium text-gray-900">
            {getDocumentTypeLabel(invoice.document_type_code)}
          </div>
          <div className="text-sm text-gray-500">
            {invoice.series}-{String(invoice.number).padStart(8, '0')}
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      accessor: (invoice: VoidableInvoice) => (
        <div>
          <div className="font-medium text-gray-900">{invoice.client_name}</div>
        </div>
      ),
    },
    {
      key: 'issue_date',
      header: 'Fecha',
      accessor: (invoice: VoidableInvoice) => (
        <div className="text-sm text-gray-900">
          {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      accessor: (invoice: VoidableInvoice) => (
        <div className="text-right">
          <div className="font-medium text-gray-900">
            S/ {invoice.total_payable}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-600">Gestión de comprobantes electrónicos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cliente, documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Todos</option>
              <option value="01">Factura</option>
              <option value="03">Boleta</option>
              <option value="07">Nota de Crédito</option>
              <option value="08">Nota de Débito</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Todos</option>
              <option value="7">Última semana</option>
              <option value="30">Último mes</option>
              <option value="90">Últimos 3 meses</option>
              <option value="365">Último año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border">
        <DataTable
          columns={columns}
          data={filteredInvoices}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          customActions={(invoice) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Ver
            </Button>
          )}
          emptyMessage={
            searchTerm || documentTypeFilter || dateFilter
              ? 'No se encontraron facturas con los filtros aplicados'
              : 'No se encontraron facturas'
          }
        />
      </div>
    </div>
  );
}; 