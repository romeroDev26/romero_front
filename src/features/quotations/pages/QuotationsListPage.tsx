// src/features/quotations/pages/QuotationsListPage.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ArrowDownTrayIcon,
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
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-yellow-100 text-yellow-700',
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

  // Estado para el rango de fechas
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const rangePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rangePickerRef.current && !rangePickerRef.current.contains(e.target as Node)) {
        setShowRangePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    setFilters(prev => ({
      ...prev,
      start_date: start ? start.toISOString().split('T')[0] : '',
      end_date: end ? end.toISOString().split('T')[0] : '',
    }));
    if (start && end) setShowRangePicker(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lista de Cotizaciones</h1>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {}}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Exportar
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            onClick={() => navigate('/sales/quotations/new')}
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Cotización
          </button>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Filtros Avanzados</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Serie */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
              <HashtagIcon className="h-3.5 w-3.5" />
              Serie
            </label>
            <input
              type="text"
              value={filters.series}
              onChange={(e) => handleFilterChange('series', e.target.value)}
              placeholder="Todas las series"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
              <UserCircleIcon className="h-3.5 w-3.5" />
              Cliente
            </label>
            <input
              type="text"
              value={filters.client_search}
              onChange={(e) => handleFilterChange('client_search', e.target.value)}
              placeholder="Nombre o RUC..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
              <DocumentTextIcon className="h-3.5 w-3.5" />
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition-colors"
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rango de Fechas — picker inline estilo reportes */}
        <div className="relative" ref={rangePickerRef}>
          <label className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
            <CalendarDaysIcon className="h-3.5 w-3.5" />
            Rango de Fechas
          </label>
          <button
            type="button"
            onClick={() => setShowRangePicker(!showRangePicker)}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <CalendarDaysIcon className="w-5 h-5 mr-2 text-indigo-600 shrink-0" />
            <span>{formatRange()}</span>
            <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${showRangePicker ? 'rotate-180' : ''}`} />
          </button>
          {showRangePicker && (
            <div className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 overflow-x-auto">
              <div className="custom-datepicker-wrapper">
                <DatePicker
                  selected={startDate}
                  onChange={handleDateSelect}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  inline
                  monthsShown={2}
                  locale={es}
                  maxDate={new Date()}
                  calendarClassName="custom-datepicker"
                  dayClassName={(date) => {
                    const isSelected =
                      (startDate && date.toDateString() === startDate.toDateString()) ||
                      (endDate && date.toDateString() === endDate.toDateString());
                    const isInRange =
                      startDate && endDate && date > startDate && date < endDate;
                    if (isSelected) return 'bg-indigo-600 text-white rounded-full';
                    if (isInRange) return 'bg-indigo-100 text-indigo-800';
                    return '';
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setStartDate(null); setEndDate(null); setFilters(prev => ({ ...prev, start_date: '', end_date: '' })); setShowRangePicker(false); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Limpiar
                </button>
                <span className="text-sm text-gray-500">
                  {startDate && endDate ? (
                    <span className="text-indigo-600 font-medium">
                      {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} días seleccionados
                    </span>
                  ) : 'Selecciona un rango'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar Filtros
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Buscar Resultados
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Spinner />
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">
            No hay cotizaciones para mostrar
          </div>
        ) : (
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
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Ver detalle"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {quotation.status !== 'CONVERTED' && (
                        <button
                          onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      )}
                      {quotation.status === 'DRAFT' && (
                        <button
                          onClick={() => handleDelete(quotation.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
        )}

        {/* Footer paginación */}
        {!isLoading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
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
      </div>
    </div>
  );
};
