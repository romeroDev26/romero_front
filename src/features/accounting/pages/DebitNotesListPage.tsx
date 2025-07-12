// src/features/accounting/pages/DebitNotesListPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Input } from '../../../components/common/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import { SunatStatusBadge } from '../components/SunatStatusBadge';

interface DebitNote {
  id: number;
  series: string;
  number: number;
  document_type_code: string;
  issue_date: string;
  total_amount: number;
  currency_code: string;
  sunat_status: string;
  client: {
    name: string;
    doc_number: string;
  };
  affected_invoice?: {
    series: string;
    number: number;
  };
}

export const DebitNotesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // TODO: Obtener company_id del contexto de autenticación
  const companyId = 1;

  // TODO: Implementar servicio de notas de débito
  const { data: debitNotes = [], isLoading } = useQuery({
    queryKey: ['debitNotes', companyId],
    queryFn: () => Promise.resolve([] as DebitNote[]), // Placeholder hasta implementar el servicio
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const filteredDebitNotes = useMemo(() => {
    let filtered = debitNotes;

    // Filtro por búsqueda
    if (debouncedSearchTerm) {
      filtered = filtered.filter(note =>
        note.client.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        `${note.series}-${note.number}`.includes(debouncedSearchTerm) ||
        note.client.doc_number.includes(debouncedSearchTerm)
      );
    }

    // Filtro por estado
    if (statusFilter) {
      filtered = filtered.filter(note => note.sunat_status === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter) {
      const now = new Date();
      const days = parseInt(dateFilter);
      const filterDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(note => new Date(note.issue_date) >= filterDate);
    }

    return filtered;
  }, [debitNotes, debouncedSearchTerm, statusFilter, dateFilter]);

  const columns: Column<DebitNote>[] = [
    {
      key: 'document',
      header: 'Documento',
      accessor: (note: DebitNote) => (
        <div>
          <div className="font-medium text-gray-900">Nota de Débito</div>
          <div className="text-sm text-gray-500">
            {note.series}-{String(note.number).padStart(8, '0')}
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      accessor: (note: DebitNote) => (
        <div>
          <div className="font-medium text-gray-900">{note.client.name}</div>
          <div className="text-sm text-gray-500">{note.client.doc_number}</div>
        </div>
      ),
    },
    {
      key: 'affected_invoice',
      header: 'Factura Afectada',
      accessor: (note: DebitNote) => (
        <div className="text-sm text-gray-900">
          {note.affected_invoice 
            ? `${note.affected_invoice.series}-${note.affected_invoice.number}`
            : 'N/A'
          }
        </div>
      ),
    },
    {
      key: 'issue_date',
      header: 'Fecha',
      accessor: (note: DebitNote) => (
        <div className="text-sm text-gray-900">
          {format(new Date(note.issue_date), 'dd/MM/yyyy')}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      accessor: (note: DebitNote) => (
        <div className="text-right">
          <div className="font-medium text-gray-900">
            {note.currency_code === 'PEN' ? 'S/ ' : '$ '}
            {note.total_amount.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (note: DebitNote) => <SunatStatusBadge status={note.sunat_status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notas de Débito</h1>
          <p className="text-gray-600">Gestión de notas de débito electrónicas</p>
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
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="ACCEPTED">Aceptado</option>
              <option value="REJECTED">Rechazado</option>
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
          data={filteredDebitNotes}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          customActions={(note) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/accounting/debit-notes/${note.id}`)}
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Ver
            </Button>
          )}
          emptyMessage={
            searchTerm || statusFilter || dateFilter
              ? 'No se encontraron notas de débito con los filtros aplicados'
              : 'No se encontraron notas de débito'
          }
        />
      </div>
    </div>
  );
}; 