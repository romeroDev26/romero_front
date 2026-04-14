// src/features/quotations/pages/QuotationsListPage.tsx
import React, { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  AdjustmentsHorizontalIcon,
  HashtagIcon,
  UserCircleIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
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
  useUpdateQuotationStatus,
  useDeleteQuotation,
} from '../hooks/useQuotations';
import { Quotation, QuotationStatus } from '../types';

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida',
};

const statusColors: Record<QuotationStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-purple-100 text-purple-700',
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
  const [searchOpen, setSearchOpen] = useState(false);

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
    const params: any = {
      skip: (currentPage - 1) * 15,
      limit: 15,
      company_id: 1,
    };

    // Agregar filtros solo si tienen valor
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    return params;
  }, [appliedFilters, currentPage]);

  // Obtener datos con React Query - se actualiza automáticamente cuando cambian los params
  const { data, isLoading, error } = useQuotationsList(queryParams);
  const updateStatusMutation = useUpdateQuotationStatus();
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

  const handleStatusChange = async (quotationId: number, status: QuotationStatus) => {
    updateStatusMutation.mutate({ id: quotationId, data: { status } });
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
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
    <div className="flex flex-col h-screen lg:h-auto bg-gray-50 lg:bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-gray-100">
      {/* Header Sticky para móvil */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold text-gray-900">Cotizaciones</h1>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Filtros avanzados"
          >
            <FunnelIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Barra de búsqueda compacta */}
        <div className="px-4 pb-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.client_search}
              onChange={(e) => handleFilterChange('client_search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por cliente..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Tabs de estado */}
        <div className="overflow-x-auto border-t border-gray-200">
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Serie</label>
            <input
              type="text"
              value={filters.series}
              onChange={(e) => handleFilterChange('series', e.target.value)}
              placeholder="Todas las series"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Rango de Fechas</label>
            <button
              type="button"
              onClick={() => setShowRangePicker(!showRangePicker)}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
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
              className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              onClick={() => {
                handleSearch();
                setShowAdvancedFilters(false);
              }}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              Buscar
            </button>
          </div>
        </div>
      )}

      {/* Picker de fechas dropdown mobile */}
      {showRangePicker && (
        <div className="absolute top-full left-4 right-4 z-50 mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
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
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={handleClearDates}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
            <button
              onClick={handleApplyDates}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
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
            <h1 className="text-2xl font-semibold text-gray-800">Cotizaciones</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {pagination.total} cotizaciones registradas
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            onClick={() => navigate('/sales/quotations/new')}
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Cotización
          </button>
        </div>

        {/* Filtros en una fila */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Serie */}
            <div className="min-w-[120px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Serie</label>
              <input
                type="text"
                value={filters.series}
                onChange={(e) => handleFilterChange('series', e.target.value)}
                placeholder="Todas"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Cliente */}
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Cliente</label>
              <input
                type="text"
                value={filters.client_search}
                onChange={(e) => handleFilterChange('client_search', e.target.value)}
                placeholder="Nombre o RUC..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Estado */}
            <div className="min-w-[140px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Fechas</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRangePicker(!showRangePicker)}
                  className="inline-flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <span className="truncate">{formatRange()}</span>
                  <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 transition-transform ${showRangePicker ? 'rotate-180' : ''}`} />
                </button>
                {showRangePicker && (
                  <div className="absolute left-0 top-full z-50 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
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
                        if (isSelected) return 'bg-indigo-600 text-white rounded-full';
                        if (isInRange) return 'bg-indigo-100 text-indigo-800';
                        return '';
                      }}
                    />
                    <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
                      <button
                        type="button"
                        onClick={handleClearDates}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Limpiar
                      </button>
                      <button
                        onClick={handleApplyDates}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
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
                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
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
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No hay cotizaciones para mostrar</p>
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL: Stack de tarjetas */}
            <div className="lg:hidden space-y-3 px-4 pb-20">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  {/* Encabezado tarjeta: Folio + Estado */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400">ID Cotización</p>
                      <p className="text-sm font-bold text-gray-900">
                        {quotation.series}-{quotation.number.toString().padStart(6, '0')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[quotation.status]}`}>
                      {statusLabels[quotation.status]}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">Cliente</p>
                    <p className="text-sm font-medium text-gray-900">{quotation.client.name}</p>
                    <p className="text-xs text-gray-400">{quotation.client.doc_type}: {quotation.client.doc_number}</p>
                  </div>

                  {/* Fecha y Monto */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Emisión</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(quotation.issue_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Vigencia</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(quotation.valid_until)}</p>
                    </div>
                  </div>

                  {/* Monto Total - Destacado */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-600 mb-1">Monto Total</p>
                    <p className="text-lg font-bold text-gray-900">
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
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Ver
                    </button>
                    {quotation.status !== 'CONVERTED' && (
                      <button
                        onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar
                      </button>
                    )}
                    {quotation.status === 'DRAFT' && (
                      <button
                        onClick={() => handleDelete(quotation.id)}
                        className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID Cotización
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Monto Total
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {quotation.series}-{quotation.number.toString().padStart(6, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{quotation.client.name}</div>
                        <div className="text-xs text-gray-400">
                          {quotation.client.doc_type}: {quotation.client.doc_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(quotation.issue_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
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
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            title="Ver detalle"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {quotation.status !== 'CONVERTED' && (
                            <button
                              onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
                              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                              title="Editar"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                          )}
                          {quotation.status === 'DRAFT' && (
                            <button
                              onClick={() => handleDelete(quotation.id)}
                              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
        <div className="bg-white border-t border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Mostrando {startItem}-{endItem} de {pagination.total} cotizaciones
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-500 px-2">
              Página {pagination.page} de {Math.max(1, pagination.total_pages)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={pagination.page >= pagination.total_pages || isLoading}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
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
