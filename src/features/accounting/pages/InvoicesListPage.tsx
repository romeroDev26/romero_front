// src/features/accounting/pages/InvoicesListPage.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { 
  MagnifyingGlassIcon, 
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Input } from '../../../components/common/Input';
import { useDebounce } from '../../../hooks/useDebounce';
import { SunatStatusBadge } from '../components/SunatStatusBadge';
import { invoicesService, InvoiceFilters } from '../../../services/invoices.service';
import { Invoice } from '../../../types';

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados para los filtros
  const [clientSearch, setClientSearch] = useState('');
  const [sunatStatusFilter, setSunatStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState('');
  const [series, setSeries] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(20);
  
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const debouncedSeries = useDebounce(series, 300);
  const debouncedDocumentNumber = useDebounce(documentNumber, 300);

  // TODO: Obtener company_id del contexto de autenticación
  const companyId = 1;

  // Construir filtros para la API
  const filters: InvoiceFilters = useMemo(() => {
    const baseFilters: InvoiceFilters = {
      company_id: companyId,
      skip: currentPage * itemsPerPage,
      limit: itemsPerPage,
    };

    if (debouncedClientSearch) baseFilters.client_search = debouncedClientSearch;
    if (sunatStatusFilter) baseFilters.sunat_status = sunatStatusFilter as any;
    if (startDate) baseFilters.start_date = startDate;
    if (endDate) baseFilters.end_date = endDate;
    if (period) baseFilters.period = period as any;
    if (debouncedSeries) baseFilters.series = debouncedSeries;
    if (debouncedDocumentNumber) baseFilters.number = parseInt(debouncedDocumentNumber) || undefined;

    return baseFilters;
  }, [companyId, currentPage, itemsPerPage, debouncedClientSearch, sunatStatusFilter, startDate, endDate, period, debouncedSeries, debouncedDocumentNumber]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoicesService.getInvoices(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Limpiar filtros mutuamente excluyentes y resetear paginación
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setCurrentPage(0); // Resetear a la primera página
    if (value) {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setCurrentPage(0); // Resetear a la primera página
    if (value) {
      setPeriod('');
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setCurrentPage(0); // Resetear a la primera página
    if (value) {
      setPeriod('');
    }
  };

  // Funciones para manejar cambios en filtros que deben resetear la paginación
  const handleClientSearchChange = (value: string) => {
    setClientSearch(value);
    setCurrentPage(0);
  };

  const handleSunatStatusChange = (value: string) => {
    setSunatStatusFilter(value);
    setCurrentPage(0);
  };

  const handleSeriesChange = (value: string) => {
    setSeries(value);
    setCurrentPage(0);
  };

  const handleDocumentNumberChange = (value: string) => {
    setDocumentNumber(value);
    setCurrentPage(0);
  };

  // Función para navegar entre páginas
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Componente de paginación simple
  const PaginationControls = () => {
    const hasResults = invoices.length > 0;
    const hasNextPage = invoices.length === itemsPerPage; // Si recibimos el límite completo, probablemente hay más páginas
    const hasPrevPage = currentPage > 0;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Página {currentPage + 1} • Mostrando {invoices.length} registros
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevPage}
            className="flex items-center"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="flex items-center"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  const getDocumentTypeLabel = (code: string) => {
    const types: Record<string, string> = {
      '01': 'Factura',
      '03': 'Boleta',
      '07': 'Nota de Crédito',
      '08': 'Nota de Débito'
    };
    return types[code] || code;
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'document',
      header: 'Documento',
      accessor: (invoice: Invoice) => (
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
      accessor: (invoice: Invoice) => (
        <div>
          <div className="font-medium text-gray-900">
            {invoice.client?.name || 'Cliente no disponible'}
          </div>
          <div className="text-sm text-gray-500">
            {invoice.client?.doc_number}
          </div>
        </div>
      ),
    },
    {
      key: 'issue_date',
      header: 'Fecha',
      accessor: (invoice: Invoice) => (
        <div className="text-sm text-gray-900">
          {format(parseISO(invoice.issue_date), 'dd/MM/yyyy')}
        </div>
      ),
    },
    {
      key: 'sunat_status',
      header: 'Estado SUNAT',
      accessor: (invoice: Invoice) => (
        <SunatStatusBadge status={invoice.sunat_status} />
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      accessor: (invoice: Invoice) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Cliente
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="DNI, RUC o nombre..."
                value={clientSearch}
                onChange={(e) => handleClientSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serie
            </label>
            <Input
              type="text"
              placeholder="Ej: F001, B001..."
              value={series}
              onChange={(e) => handleSeriesChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número
            </label>
            <Input
              type="number"
              placeholder="Número correlativo"
              value={documentNumber}
              onChange={(e) => handleDocumentNumberChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado SUNAT
            </label>
            <select
              value={sunatStatusFilter}
              onChange={(e) => handleSunatStatusChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="GENERATED">Generado</option>
              <option value="SIGNED">Firmado</option>
              <option value="SENT">Enviado</option>
              <option value="ACCEPTED">Aceptado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="OBSERVED">Observado</option>
              <option value="VOIDED">Anulado</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período Predefinido
            </label>
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Seleccionar período</option>
              <option value="LAST_WEEK">Última semana</option>
              <option value="LAST_MONTH">Último mes</option>
              <option value="LAST_3_MONTHS">Últimos 3 meses</option>
              <option value="LAST_YEAR">Último año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border">
        <DataTable
          columns={columns}
          data={invoices}
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
            clientSearch || series || documentNumber || sunatStatusFilter || startDate || endDate || period
              ? 'No se encontraron facturas con los filtros aplicados'
              : 'No se encontraron facturas'
          }
        />
        
        {/* Controles de paginación */}
        {!isLoading && invoices.length > 0 && <PaginationControls />}
      </div>
    </div>
  );
}; 