import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  CreditCard,
  Ship,
  Calendar,
  X,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useReceivables } from '../hooks/useReceivables';
import { authService } from '../../../services/auth.service';
import { usePaymentConfirmation } from '../hooks/usePaymentConfirmation';
import { PaymentConfirmationModal } from '../components/payment/PaymentConfirmationModal';
import { PaidTicketModal } from '../components/payment/PaidTicketModal';

const ReceivablesPage: React.FC = () => {
  const [companyId, setCompanyId] = React.useState<number | undefined>();
  
  // Obtener companyId del usuario actual
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCompanyId(user.company_id);
    }
  }, []);

  const {
    items,
    loading,
    error,
    filters,
    pagination,
    total,
    totalPages,
    summary,
    updateFilters,
    clearFilters,
    goToPage,
    changePageSize,
    refresh,
  } = useReceivables();

  // Hook para gestionar confirmación de pagos
  const payment = usePaymentConfirmation();

  // Estado para el DatePicker de rango
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Cerrar el DatePicker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
    const [start, end] = dates;
    if (start) {
      updateFilters({ start_date: start.toISOString().split('T')[0] });
    }
    if (end) {
      updateFilters({ end_date: end.toISOString().split('T')[0] });
    }
    // Si ambas fechas están seleccionadas, cerrar el picker
    if (start && end) {
      setShowDatePicker(false);
    }
  };

  const clearDateFilter = () => {
    setDateRange([null, null]);
    updateFilters({ start_date: null, end_date: null });
  };

  const clearStatusFilter = () => {
    updateFilters({ payment_status: null });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAGADO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Pagada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Pendiente
      </span>
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Encomiendas por Cobrar</h1>
          <p className="mt-1 text-sm text-gray-500">Panel ejecutivo para el seguimiento y control de cobros de logística.</p>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Encomiendas</span>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tabular-nums text-gray-900">{total}</h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pendientes</span>
            <div className="p-2 bg-amber-50 rounded-lg">
              <XCircle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tabular-nums text-gray-900">{summary.unpaid_parcels}</h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pagadas</span>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tabular-nums text-gray-900">{summary.paid_parcels}</h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monto Total</span>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Ship className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tabular-nums text-gray-900">
            S/ {parseFloat(summary.total_amount.toString()).toFixed(2)}
          </h2>
        </div>
      </section>

      {/* Search and Filter - Barra compacta */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* Fila 1: Chips de estado + Date picker button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chips de estado */}
            <button
              onClick={() => updateFilters({ payment_status: null })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                !filters.payment_status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => updateFilters({ payment_status: 'NO PAGADO' })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filters.payment_status === 'NO PAGADO'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => updateFilters({ payment_status: 'PAGADO' })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filters.payment_status === 'PAGADO'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pagadas
            </button>

            <div className="h-5 w-px bg-gray-200" />

            {/* Botón de rango de fechas */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {dateRange[0] && dateRange[1]
                  ? `${dateRange[0].toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} - ${dateRange[1].toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  : 'Fechas'}
              </button>

              {/* Calendario desplegable */}
              {showDatePicker && (
                <div className="absolute right-0 top-full z-50 mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                  <DatePicker
                    selected={dateRange[0]}
                    onChange={handleDateRangeChange}
                    startDate={dateRange[0]}
                    endDate={dateRange[1]}
                    selectsRange
                    inline
                    locale={es}
                    calendarClassName="!text-sm"
                    dayClassName={(date) => {
                      const isSelected =
                        (dateRange[0] && date.toDateString() === dateRange[0].toDateString()) ||
                        (dateRange[1] && date.toDateString() === dateRange[1].toDateString());
                      const isInRange =
                        dateRange[0] && dateRange[1] && date > dateRange[0] && date < dateRange[1];
                      if (isSelected) return 'bg-indigo-600 text-white rounded-full';
                      if (isInRange) return 'bg-indigo-100 text-indigo-800';
                      return '';
                    }}
                  />
                  <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
                    <button
                      onClick={clearDateFilter}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Indicadores de filtros activos */}
            {(filters.payment_status || filters.start_date || filters.end_date) && (
              <>
                <div className="h-5 w-px bg-gray-200" />
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpiar filtros
                </button>
              </>
            )}
          </div>

          {/* Fila 2: Buscador */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por encomienda, remitente o destinatario..."
              value={filters.doc_number || ''}
              onChange={(e) => updateFilters({ doc_number: e.target.value || null })}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Cargando encomiendas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="mb-4 h-12 w-12 text-rose-400" />
            <p className="mb-4 text-sm text-gray-600">Error al cargar las encomiendas: {error}</p>
            <button
              onClick={refresh}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">No se encontraron encomiendas con los filtros aplicados.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">ID Encomienda</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Remitente</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Destinatario</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Viaje / Ruta</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Monto</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.invoice_item_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">#{item.invoice_item_id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.sender_name}</div>
                        <div className="text-xs text-gray-400">{item.sender_document}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.recipient_name}</div>
                        <div className="text-xs text-gray-400">{item.recipient_document}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                          {item.origin_port} → {item.destination_port}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold tabular-nums text-gray-900">
                        S/ {parseFloat(item.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.payment_status)}
                      </td>
                      <td className="px-6 py-4 text-sm tabular-nums text-gray-500">
                        {item.issue_date ? item.issue_date.split('-').reverse().join('/') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.payment_status === 'NO PAGADO' ? (
                          <button
                            onClick={() => payment.openModal(item)}
                            disabled={payment.isConfirming}
                            className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800 disabled:opacity-50"
                          >
                            Gestionar
                          </button>
                        ) : (
                          <span className="text-sm font-semibold text-gray-400">Pagada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row">
              <span className="text-xs font-medium uppercase tracking-tight text-gray-500">
                Mostrando {(pagination.current_page - 1) * pagination.page_size + 1} a{' '}
                {Math.min(pagination.current_page * pagination.page_size, total)} de {total} resultados
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="rounded-lg p-2 text-sm transition-colors hover:bg-gray-200 disabled:opacity-30"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                      pagination.current_page === page
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                        pagination.current_page === totalPages
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => goToPage(pagination.current_page + 1)}
                  disabled={pagination.current_page === totalPages}
                  className="rounded-lg p-2 text-sm transition-colors hover:bg-gray-200 disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Modals */}
      <PaymentConfirmationModal
        isOpen={payment.isModalOpen}
        onClose={payment.closeModal}
        receivableItem={payment.selectedItem}
        onConfirm={payment.confirmPayment}
        isLoading={payment.isConfirming}
      />

      <PaidTicketModal
        isOpen={payment.isTicketModalOpen}
        onClose={payment.closeTicketModal}
        paymentData={payment.paymentTicketData}
      />
    </div>
  );
};

export default ReceivablesPage;
