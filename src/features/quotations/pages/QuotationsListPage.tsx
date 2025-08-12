// src/features/quotations/pages/QuotationsListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Spinner } from '../../../components/common/Spinner';
import { Input } from '../../../components/common/Input';
import { useQuotations } from '../hooks/useQuotations';
import { Quotation, QuotationStatus } from '../types';

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida'
};

const statusColors: Record<QuotationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  CONVERTED: 'bg-purple-100 text-purple-800'
};

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { quotations, loading, error, fetchQuotations, updateQuotationStatus, deleteQuotation } = useQuotations();
  
  const [filters, setFilters] = useState({
    series: '',
    client_search: '',
    status: '' as QuotationStatus | '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = () => {
    const params = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as any);
    
    fetchQuotations(params);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (quotationId: number, status: QuotationStatus) => {
    const success = await updateQuotationStatus(quotationId, { status });
    if (success) {
      handleSearch();
    }
  };

  const handleDelete = async (quotationId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cotización?')) {
      const success = await deleteQuotation(quotationId);
      if (success) {
        handleSearch();
      }
    }
  };

  const columns: Column<Quotation>[] = [
    {
      key: 'number',
      header: 'Número',
      accessor: (quotation: Quotation) => `${quotation.series}-${quotation.number.toString().padStart(6, '0')}`
    },
    {
      key: 'issue_date',
      header: 'Fecha',
      accessor: (quotation: Quotation) => new Date(quotation.issue_date).toLocaleDateString('es-ES')
    },
    {
      key: 'valid_until',
      header: 'Valid. Hasta',
      accessor: (quotation: Quotation) => new Date(quotation.valid_until).toLocaleDateString('es-ES')
    },
    {
      key: 'client',
      header: 'Cliente',
      accessor: (quotation: Quotation) => (
        <div>
          <div className="font-medium">{quotation.client.name}</div>
          <div className="text-sm text-gray-500">{quotation.client.doc_number}</div>
        </div>
      )
    },
    {
      key: 'total_payable',
      header: 'Total',
      accessor: (quotation: Quotation) => (
        <div className="text-right">
          <span className="font-medium">
            {quotation.currency_code} {parseFloat(quotation.total_payable).toFixed(2)}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      accessor: (quotation: Quotation) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[quotation.status]}`}>
          {statusLabels[quotation.status]}
        </span>
      )
    }
  ];

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        </div>
        <Button onClick={() => navigate('/sales/quotations/new')}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Cotización
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            label="Serie"
            value={filters.series}
            onChange={(e) => handleFilterChange('series', e.target.value)}
            placeholder="Ej: COT"
          />
          <Input
            label="Cliente"
            value={filters.client_search}
            onChange={(e) => handleFilterChange('client_search', e.target.value)}
            placeholder="Nombre o documento"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Fecha Inicio"
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
          />
        </div>
        <div className="mt-4 flex space-x-2">
          <Button onClick={handleSearch} disabled={loading}>
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                series: '',
                client_search: '',
                status: '',
                start_date: '',
                end_date: ''
              });
              fetchQuotations();
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Tabla de cotizaciones */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Spinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={quotations}
            keyExtractor={(quotation) => quotation.id.toString()}
            emptyMessage="No hay cotizaciones para mostrar"
            customActions={(quotation) => (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/sales/quotations/${quotation.id}`)}
                >
                  Ver
                </Button>
                {quotation.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
                  >
                    Editar
                  </Button>
                )}
                {quotation.status !== 'CONVERTED' && (
                  <select
                    value={quotation.status}
                    onChange={(e) => handleStatusChange(quotation.id, e.target.value as QuotationStatus)}
                    className="text-xs border rounded px-2 py-1"
                  >
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
                {quotation.status === 'DRAFT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(quotation.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
};
