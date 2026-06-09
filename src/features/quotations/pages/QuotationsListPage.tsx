// src/features/quotations/pages/QuotationsListPage.tsx
import React, { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import {
  useQuotationsList,
  useDeleteQuotation,
} from '../hooks/useQuotations';
import { QuotationStatus, QuotationsListParams } from '../types';

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida',
};

const statusColors: Record<QuotationStatus, string> = {
  DRAFT: 'bg-dm-bg-secondary text-dm-text-secondary',
  SENT: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  ACCEPTED: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
  REJECTED: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  EXPIRED: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
  CONVERTED: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    series: '',
    client_search: '',
    status: '' as QuotationStatus | '',
    start_date: '',
    end_date: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Estado para el rango de fechas
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showRangePicker, setShowRangePicker] = useState(false);

  const handleDateSelect = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    // Actualizar filtros siempre (incluso con solo fecha inicio)
    if (start) {
      setFilters(prev => ({
        ...prev,
        start_date: start.toISOString().split('T')[0],
        end_date: end ? end.toISOString().split('T')[0] : '',
      }));
    }

    // Cerrar cuando ambas fechas están seleccionadas
    if (start && end) {
      setShowRangePicker(false);
    }
  };

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
    setFilters(prev => ({ ...prev, start_date: '', end_date: '' }));
    setShowRangePicker(false);
  };

  const handleApplyDates = () => {
    setShowRangePicker(false);
  };

  const formatRange = () => {
    const fmt = (d: Date) => d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    if (startDate && endDate) return `${fmt(startDate)} - ${fmt(endDate)}`;
    if (startDate) return fmt(startDate);
    return 'Selecciona un rango de fechas';
  };

  // Construir params para el query - useMemo evita recrear el objeto en cada render
  const queryParams = useMemo(() => {
    const params: QuotationsListParams = {
      skip: (currentPage - 1) * 15,
      limit: 15,
    };

    if (appliedFilters.series) params.series = appliedFilters.series;
    if (appliedFilters.client_search) params.client_search = appliedFilters.client_search;
    if (appliedFilters.status) params.status = appliedFilters.status as QuotationStatus;
    if (appliedFilters.start_date) params.start_date = appliedFilters.start_date;
    if (appliedFilters.end_date) params.end_date = appliedFilters.end_date;

    return params;
  }, [appliedFilters, currentPage]);

  // Obtener datos con React Query - se actualiza automáticamente cuando cambian los params
  const { data, isLoading, error } = useQuotationsList(queryParams);
  const deleteMutation = useDeleteQuotation();

  const quotations = data?.data || [];
  const pagination = {
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 15,
    total_pages: data?.total_pages || 0,
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const empty = {
      series: '',
      client_search: '',
      status: '' as QuotationStatus | '',
      start_date: '',
      end_date: '',
    };
    setFilters(empty);
    setAppliedFilters(empty);
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (quotationId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cotización?')) {
      deleteMutation.mutate(quotationId, {
        onSuccess: () => {
          const shouldGoToPreviousPage = currentPage > 1 && quotations.length === 1;
          if (shouldGoToPreviousPage) {
            setCurrentPage(currentPage - 1);
          }
        },
      });
    }
  };

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-4 text-red-800 dark:text-red-300">
          Error: {error.message}
        </div>
      </div>
    );
  }

  // Tabs de estado para filtrado rápido
  const statusTabs: Array<{ label: string; value: QuotationStatus | '' }> = [
    { label: 'Todas', value: '' },
    { label: 'Borradores', value: 'DRAFT' },
    { label: 'Enviadas', value: 'SENT' },
    { label: 'Aceptadas', value: 'ACCEPTED' },
    { label: 'Rechazadas', value: 'REJECTED' },
    { label: 'Expiradas', value: 'EXPIRED' },
  ];

  return (
    <div className="flex flex-col h-screen lg:h-auto bg-dm-bg-secondary lg:bg-dm-bg-primary lg:rounded-xl lg:shadow-sm lg:border lg:border-dm-border-secondary">
      {/* Header Sticky para móvil */}
      <header className="sticky top-0 z-20 bg-dm-bg-primary border-b border-dm-border-primary shadow-sm lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold text-dm-text-primary">Cotizaciones</h1>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="p-2 rounded-lg hover:bg-dm-bg-hover transition-colors"
            title="Filtros avanzados"
          >
            <FunnelIcon className="h-5 w-5 text-dm-text-secondary" />
          </button>
        </div>

        {/* Barra de búsqueda compacta */}
        <div className="px-4 pb-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted" />
            <input
              type="text"
              value={filters.client_search}
              onChange={(e) => handleFilterChange('client_search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por cliente..."
              className="w-full pl-9 pr-4 py-2.5 bg-dm-bg-secondary border-none rounded-xl text-sm text-dm-text-primary focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Tabs de estado */}
        <div className="overflow-x-auto border-t border-dm-border-primary">
          <div className="flex px-4 gap-2 py-2" style={{ scrollbarWidth: 'none' }}>
            {statusTabs.map(tab => (
              <button
                key={tab.value || 'all'}
                onClick={() => {
                  handleFilterChange('status', tab.value);
                  setAppliedFilters(prev => ({ ...prev, status: tab.value }));
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filters.status === tab.value
                    ? 'bg-primary text-white'
                    : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filtros avanzados modal móvil */}
      {showAdvancedFilters && (
        <div className="lg:hidden bg-dm-bg-primary border-b border-dm-border-primary p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-dm-text-muted mb-1.5">Serie</label>
            <input
              type="text"
              value={filters.series}
              onChange={(e) => handleFilterChange('series', e.target.value)}
              placeholder="Todas las series"
              className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-dm-text-muted mb-1.5">Rango de Fechas</label>
            <button
              type="button"
              onClick={() => setShowRangePicker(!showRangePicker)}
              className="w-full flex items-center justify-between px-3 py-2 border border-dm-border-primary rounded-lg text-sm text-dm-text-secondary hover:bg-dm-bg-hover"
            >
              <span>{formatRange()}</span>
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${showRangePicker ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                handleClearFilters();
                setShowAdvancedFilters(false);
              }}
              className="flex-1 px-3 py-2 text-sm text-dm-text-secondary border border-dm-border-primary rounded-lg hover:bg-dm-bg-hover"
            >
              Limpiar
            </button>
            <button
              onClick={() => {
                handleSearch();
                setShowAdvancedFilters(false);
              }}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
            >
              Buscar
            </button>
          </div>
        </div>
      )}

      {/* Picker de fechas dropdown mobile */}
      {showRangePicker && (
        <div className="absolute top-full left-4 right-4 z-50 mt-2 rounded-xl border border-dm-border-primary bg-dm-bg-primary p-4 shadow-2xl">
          <DatePicker
            selected={startDate}
            onChange={handleDateSelect}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            inline
            monthsShown={1}
            locale={es}
            maxDate={new Date()}
            calendarClassName="custom-datepicker"
          />
          <div className="mt-3 flex justify-between border-t border-dm-border-primary pt-3">
            <button
              type="button"
              onClick={handleClearDates}
              className="text-xs font-medium text-dm-text-muted hover:text-dm-text-secondary"
            >
              Limpiar
            </button>
            <button
              onClick={handleApplyDates}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header compacto */}
      <div className="hidden lg:flex flex-col gap-4 mb-6">
        {/* Título + Acciones */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dm-text-primary">Cotizaciones</h1>
            <p className="mt-0.5 text-sm text-dm-text-muted">
              {pagination.total} cotizaciones registradas
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
            onClick={() => navigate('/sales/quotations/new')}
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Cotización
          </button>
        </div>

        {/* Filtros en una fila */}
        <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Serie */}
            <div className="min-w-[120px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-dm-text-muted">Serie</label>
              <input
                type="text"
                value={filters.series}
                onChange={(e) => handleFilterChange('series', e.target.value)}
                placeholder="Todas"
                className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2 text-sm shadow-sm placeholder:text-dm-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Cliente */}
            <div className="min-w-[140px] max-w-[200px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-dm-text-muted">Cliente</label>
              <input
                type="text"
                value={filters.client_search}
                onChange={(e) => handleFilterChange('client_search', e.target.value)}
                placeholder="Nombre o RUC..."
                className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2 text-sm shadow-sm placeholder:text-dm-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Estado */}
            <div className="min-w-[140px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-dm-text-muted">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todos</option>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fechas */}
            <div className="min-w-[160px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-dm-text-muted">Fechas</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRangePicker(!showRangePicker)}
                  className="inline-flex w-full items-center justify-between rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2 text-sm font-medium text-dm-text-secondary shadow-sm hover:bg-dm-bg-hover"
                >
                  <span className="truncate">{formatRange()}</span>
                  <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 transition-transform ${showRangePicker ? 'rotate-180' : ''}`} />
                </button>
                {showRangePicker && (
                  <div className="absolute left-0 top-full z-50 mt-2 rounded-xl border border-dm-border-primary bg-dm-bg-primary p-3 shadow-lg">
                    <DatePicker
                      selected={startDate}
                      onChange={handleDateSelect}
                      startDate={startDate}
                      endDate={endDate}
                      selectsRange
                      inline
                      monthsShown={1}
                      locale={es}
                      maxDate={new Date()}
                      calendarClassName="custom-datepicker"
                      dayClassName={(date) => {
                        const isSelected =
                          (startDate && date.toDateString() === startDate.toDateString()) ||
                          (endDate && date.toDateString() === endDate.toDateString());
                        const isInRange = startDate && endDate && date > startDate && date < endDate;
                        if (isSelected) return 'bg-primary text-white rounded-full';
                        if (isInRange) return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300';
                        return '';
                      }}
                    />
                    <div className="mt-3 flex justify-between border-t border-dm-border-primary pt-3">
                      <button
                        type="button"
                        onClick={handleClearDates}
                        className="text-xs font-medium text-dm-text-muted hover:text-dm-text-secondary"
                      >
                        Limpiar
                      </button>
                      <button
                        onClick={handleApplyDates}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            {(() => {
              const hasActiveFilters =
                filters.series ||
                filters.client_search ||
                filters.status ||
                filters.start_date ||
                filters.end_date;
              return (
                <div className="ml-auto flex items-center gap-2 self-end">
                  <button
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
                      hasActiveFilters
                        ? 'border-red-300 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                        : 'border-dm-border-primary bg-dm-bg-secondary text-dm-text-muted cursor-not-allowed'
                    }`}
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                  >
                    Buscar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>


      {/* Contenido Principal - Listaade tarjetas móvil, tabla desktop */}
      <div className="flex-1 overflow-y-auto lg:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-48 lg:h-64">
            <Spinner />
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12 lg:py-16">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-dm-text-muted mb-3" />
            <p className="text-sm text-dm-text-muted">No hay cotizaciones para mostrar</p>
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL: Stack de tarjetas */}
            <div className="lg:hidden space-y-3 px-4 pb-20">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="bg-dm-bg-primary rounded-xl border border-dm-border-primary p-4 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  {/* Encabezado tarjeta: Folio + Estado */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-dm-text-muted">ID Cotización</p>
                      <p className="text-sm font-bold text-dm-text-primary">
                        {quotation.series}-{quotation.number.toString().padStart(6, '0')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[quotation.status]}`}>
                      {statusLabels[quotation.status]}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="mb-3 pb-3 border-b border-dm-border-secondary">
                    <p className="text-xs text-dm-text-muted mb-0.5">Cliente</p>
                    <p className="text-sm font-medium text-dm-text-primary">{quotation.client.name}</p>
                    <p className="text-xs text-dm-text-muted">{quotation.client.doc_type}: {quotation.client.doc_number}</p>
                  </div>

                  {/* Fecha y Monto */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-dm-text-muted mb-0.5">Emisión</p>
                      <p className="text-sm font-medium text-dm-text-primary">{formatDate(quotation.issue_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dm-text-muted mb-0.5">Vigencia</p>
                      <p className="text-sm font-medium text-dm-text-primary">{formatDate(quotation.valid_until)}</p>
                    </div>
                  </div>

                  {/* Monto Total - Destacado */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 mb-4">
                    <p className="text-xs text-dm-text-secondary mb-1">Monto Total</p>
                    <p className="text-lg font-bold text-dm-text-primary">
                      {quotation.currency_code === 'PEN' ? 'S/' : quotation.currency_code}{' '}
                      {parseFloat(quotation.total_payable).toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/sales/quotations/${quotation.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:bg-blue-900/40 rounded-lg text-sm font-medium transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Ver
                    </button>
                    {quotation.status !== 'CONVERTED' && (
                      <button
                        onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar
                      </button>
                    )}
                    {quotation.status === 'DRAFT' && (
                      <button
                        onClick={() => handleDelete(quotation.id)}
                        className="p-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* VISTA DESKTOP: Tabla */}
            <div className="hidden lg:block rounded-xl border border-dm-border-secondary overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-dm-bg-secondary border-b border-dm-border-secondary">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dm-text-muted uppercase tracking-wider">
                      ID Cotización
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dm-text-muted uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dm-text-muted uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dm-text-muted uppercase tracking-wider">
                      Monto Total
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-dm-text-muted uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-dm-text-muted uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dm-border-secondary">
                  {quotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-dm-bg-hover/60 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-dm-text-primary">
                        {quotation.series}-{quotation.number.toString().padStart(6, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-dm-text-primary">{quotation.client.name}</div>
                        <div className="text-xs text-dm-text-muted">
                          {quotation.client.doc_type}: {quotation.client.doc_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-dm-text-secondary">
                        {formatDate(quotation.issue_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-dm-text-primary">
                        {quotation.currency_code === 'PEN' ? 'S/' : quotation.currency_code}{' '}
                        {parseFloat(quotation.total_payable).toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quotation.status]}`}
                        >
                          {statusLabels[quotation.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/sales/quotations/${quotation.id}`)}
                            className="rounded-md p-1.5 text-dm-text-muted transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Ver detalle"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {quotation.status !== 'CONVERTED' && (
                            <button
                              onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
                              className="rounded-md p-1.5 text-dm-text-muted transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400"
                              title="Editar"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                          )}
                          {quotation.status === 'DRAFT' && (
                            <button
                              onClick={() => handleDelete(quotation.id)}
                              className="rounded-md p-1.5 text-dm-text-muted transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Footer Paginación */}
      {!isLoading && pagination.total > 0 && (
        <div className="bg-dm-bg-primary border-t border-dm-border-primary px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="text-dm-text-secondary text-xs sm:text-sm">
            Mostrando {startItem}-{endItem} de {pagination.total} cotizaciones
          </span>
          <div className="flex items-center gap-1">
            {/* Primera página */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-dm-border-primary text-dm-text-muted hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Primera página"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              <ChevronLeftIcon className="h-3.5 w-3.5 -ml-2" />
            </button>

            {/* Anterior */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-dm-border-primary text-dm-text-muted hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {/* Números de página */}
            {(() => {
              const current = pagination.page;
              const total = Math.max(1, pagination.total_pages);
              const pages: (number | string)[] = [];

              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else if (current <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(total);
              } else if (current >= total - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = total - 4; i <= total; i++) pages.push(i);
              } else {
                pages.push(1);
                pages.push('...');
                pages.push(current - 1);
                pages.push(current);
                pages.push(current + 1);
                pages.push('...');
                pages.push(total);
              }

              return pages.map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-dm-text-muted text-xs">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    disabled={isLoading}
                    className={`min-w-[2rem] h-8 px-2 rounded-lg text-xs font-medium transition-colors ${
                      current === page
                        ? 'bg-primary text-white'
                        : 'border border-dm-border-primary text-dm-text-secondary hover:bg-dm-bg-hover'
                    } disabled:opacity-40`}
                  >
                    {page}
                  </button>
                )
              );
            })()}

            {/* Siguiente */}
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={pagination.page >= pagination.total_pages || isLoading}
              className="p-1.5 rounded-lg border border-dm-border-primary text-dm-text-muted hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Página siguiente"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>

            {/* Última página */}
            <button
              onClick={() => setCurrentPage(pagination.total_pages)}
              disabled={pagination.page >= pagination.total_pages || isLoading}
              className="p-1.5 rounded-lg border border-dm-border-primary text-dm-text-muted hover:bg-dm-bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Última página"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
              <ChevronRightIcon className="h-3.5 w-3.5 -ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* FAB - Botón Nueva Cotización para móvil */}
      <button
        onClick={() => navigate('/sales/quotations/new')}
        className="lg:hidden fixed bottom-20 right-4 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary/80 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        title="Nueva Cotización"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
};
