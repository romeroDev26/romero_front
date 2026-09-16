import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  CreditCard,
  Ship,
  Calendar,
  X,
  Eye,
  User,
  MapPin,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { useReceivables } from '../hooks/useReceivables';
import { authService } from '../../../services/auth.service';
import { usePaymentConfirmation } from '../hooks/usePaymentConfirmation';
import { PaymentConfirmationModal } from '../components/payment/PaymentConfirmationModal';
import { PaidTicketModal } from '../components/payment/PaidTicketModal';
import { ViewTicketModal } from '../components/payment/ViewTicketModal';

const ReceivablesPage: React.FC = () => {
  const [, setCompanyId] = React.useState<number | undefined>();

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
    refresh,
  } = useReceivables();

  const payment = usePaymentConfirmation();

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

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
    if (start && end) {
      setShowDatePicker(false);
    }
  };

  const clearDateFilter = () => {
    setDateRange([null, null]);
    updateFilters({ start_date: null, end_date: null });
  };

  /** Limpia filtros del hook y el rango local del calendario (estaban desincronizados). */
  const handleClearAllFilters = () => {
    clearFilters();
    setDateRange([null, null]);
    setShowDatePicker(false);
  };

  const [viewTicketItem, setViewTicketItem] = useState<{
    pdfUrl: string;
    ticketType: '80mm' | '58mm';
    invoiceItemId: number;
  } | null>(null);

  const getStatusBadge = (status: string) => {
    if (status === 'PAGADO') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Pagada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pendiente
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <header>
        <h1 className="text-xl font-semibold text-dm-text-primary sm:text-2xl">
          Encomiendas por Cobrar
        </h1>
        <p className="mt-0.5 text-sm text-dm-text-muted">
          Panel ejecutivo para el seguimiento y control de cobros de logística.
        </p>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-dm-text-muted sm:text-xs">
              Total
            </span>
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-1.5 sm:p-2">
              <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h2 className="text-xl font-bold tabular-nums text-dm-text-primary sm:text-2xl">
            {total}
          </h2>
        </div>

        <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-dm-text-muted sm:text-xs">
              Pendientes
            </span>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-1.5 sm:p-2">
              <XCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h2 className="text-xl font-bold tabular-nums text-dm-text-primary sm:text-2xl">
            {summary.unpaid_parcels}
          </h2>
        </div>

        <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-dm-text-muted sm:text-xs">
              Pagadas
            </span>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-1.5 sm:p-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h2 className="text-xl font-bold tabular-nums text-dm-text-primary sm:text-2xl">
            {summary.paid_parcels}
          </h2>
        </div>

        <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-dm-text-muted sm:text-xs">
              Monto Total
            </span>
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-1.5 sm:p-2">
              <Ship className="h-4 w-4 text-indigo-600 dark:text-indigo-400 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h2 className="text-xl font-bold tabular-nums text-dm-text-primary sm:text-2xl">
            S/ {parseFloat(summary.total_amount.toString()).toFixed(2)}
          </h2>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3">
          {/* Chips + Fechas */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => updateFilters({ payment_status: null })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all sm:px-3.5 sm:py-1.5 ${
                !filters.payment_status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => updateFilters({ payment_status: 'NO PAGADO' })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all sm:px-3.5 sm:py-1.5 ${
                filters.payment_status === 'NO PAGADO'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => updateFilters({ payment_status: 'PAGADO' })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all sm:px-3.5 sm:py-1.5 ${
                filters.payment_status === 'PAGADO'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
              }`}
            >
              Pagadas
            </button>

            <div className="h-4 w-px bg-dm-bg-secondary sm:h-5" />

            {/* Date picker */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center gap-1.5 rounded-full border border-dm-border-primary bg-dm-bg-primary px-3 py-1 text-xs font-medium text-dm-text-secondary shadow-sm hover:bg-dm-bg-hover transition-colors sm:px-3.5 sm:py-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-dm-text-muted" />
                {dateRange[0] && dateRange[1]
                  ? `${dateRange[0].toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} - ${dateRange[1].toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  : 'Fechas'}
              </button>

              {showDatePicker && (
                <div className="absolute left-0 top-full z-50 mt-2 w-max max-w-[min(100vw-1.5rem,24rem)] rounded-xl border border-dm-border-primary bg-dm-bg-primary p-3 shadow-lg sm:p-4">
                  {/* Mismas clases que en reportes/cotizaciones: evita que Tailwind rompa el grid del calendario */}
                  <div className="custom-datepicker-wrapper">
                    <DatePicker
                      selected={dateRange[0]}
                      onChange={handleDateRangeChange}
                      startDate={dateRange[0]}
                      endDate={dateRange[1]}
                      selectsRange
                      inline
                      monthsShown={1}
                      locale={es}
                      calendarClassName="custom-datepicker text-sm"
                    />
                  </div>
                  <div className="mt-3 flex justify-between border-t border-dm-border-primary pt-3">
                    <button
                      onClick={clearDateFilter}
                      className="text-xs font-medium text-dm-text-muted hover:text-dm-text-secondary"
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

            {/* Limpiar filtros */}
            {(filters.payment_status || filters.start_date || filters.end_date) && (
              <>
                <div className="h-4 w-px bg-dm-bg-secondary sm:h-5" />
                <button
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors sm:px-3 sm:py-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Limpiar filtros</span>
                </button>
              </>
            )}
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dm-text-muted" />
            <input
              type="text"
              placeholder="Buscar por encomienda, remitente o destinatario..."
              value={filters.doc_number || ''}
              onChange={(e) => updateFilters({ doc_number: e.target.value || null })}
              className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-primary pl-10 pr-4 py-2.5 text-sm shadow-sm placeholder:text-dm-text-muted focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </section>

      {/* Table / Cards */}
      <section className="rounded-xl border border-dm-border-primary bg-dm-bg-primary overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-dm-text-muted">Cargando encomiendas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="mb-4 h-12 w-12 text-rose-400" />
            <p className="mb-4 text-sm text-dm-text-secondary">Error al cargar: {error}</p>
            <button
              onClick={refresh}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="mb-4 h-12 w-12 text-dm-text-muted" />
            <p className="text-sm text-dm-text-muted">No se encontraron encomiendas.</p>
          </div>
        ) : (
          <>
            {/* Desktop: Tabla */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dm-border-primary bg-dm-bg-secondary/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Remitente</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Destinatario</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Ruta</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Monto</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-dm-text-muted text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dm-border-secondary">
                  {items.map((item) => (
                    <tr key={item.invoice_item_id} className="hover:bg-dm-bg-hover transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        #{item.invoice_item_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-dm-text-primary">{item.sender_name}</div>
                        <div className="text-xs text-dm-text-muted">{item.sender_document}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-dm-text-primary">{item.recipient_name}</div>
                        <div className="text-xs text-dm-text-muted">{item.recipient_document}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-dm-bg-secondary px-2 py-1 text-[10px] font-bold text-dm-text-secondary">
                          {item.origin_port} → {item.destination_port}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold tabular-nums text-dm-text-primary">
                        S/ {parseFloat(item.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(item.payment_status)}</td>
                      <td className="px-6 py-4 text-sm tabular-nums text-dm-text-muted">
                        {item.issue_date ? item.issue_date.split('-').reverse().join('/') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.payment_status === 'NO PAGADO' ? (
                          <button
                            onClick={() => payment.openModal(item)}
                            disabled={payment.isConfirming}
                            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 transition-colors hover:text-indigo-800 dark:text-indigo-300 disabled:opacity-50"
                          >
                            Gestionar
                          </button>
                        ) : item.pdf_ticket_file_path || item.pdf_ticket58_file_path ? (
                          <button
                            onClick={() =>
                              setViewTicketItem({
                                pdfUrl: item.pdf_ticket_file_path || item.pdf_ticket58_file_path!,
                                ticketType: item.pdf_ticket_file_path ? '80mm' : '58mm',
                                invoiceItemId: item.invoice_item_id,
                              })
                            }
                            className="inline-flex items-center justify-center rounded-lg p-2 text-dm-text-muted transition-colors hover:bg-dm-bg-hover hover:text-dm-text-secondary"
                            title="Ver comprobante"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-sm font-semibold text-dm-text-muted">Pagada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Cards */}
            <div className="divide-y divide-dm-border-secondary lg:hidden">
              {items.map((item) => (
                <div key={item.invoice_item_id} className="space-y-3 p-4">
                  {/* Header: ID + Estado + Acción */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                      #{item.invoice_item_id}
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.payment_status)}
                      {item.payment_status === 'NO PAGADO' ? (
                        <button
                          onClick={() => payment.openModal(item)}
                          disabled={payment.isConfirming}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Gestionar
                        </button>
                      ) : item.pdf_ticket_file_path || item.pdf_ticket58_file_path ? (
                        <button
                          onClick={() =>
                            setViewTicketItem({
                              pdfUrl: item.pdf_ticket_file_path || item.pdf_ticket58_file_path!,
                              ticketType: item.pdf_ticket_file_path ? '80mm' : '58mm',
                              invoiceItemId: item.invoice_item_id,
                            })
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-dm-border-primary bg-dm-bg-primary p-2 text-dm-text-muted transition-colors hover:bg-dm-bg-hover"
                          title="Ver comprobante"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Remitente + Destinatario */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2 rounded-lg bg-dm-bg-secondary p-2.5">
                      <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dm-text-muted" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">Remitente</p>
                        <p className="truncate text-sm font-semibold text-dm-text-primary">{item.sender_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg bg-dm-bg-secondary p-2.5">
                      <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dm-text-muted" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">Destinatario</p>
                        <p className="truncate text-sm font-semibold text-dm-text-primary">{item.recipient_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ruta + Monto */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-dm-text-muted" />
                      <span className="text-xs font-medium text-dm-text-secondary">
                        {item.origin_port} → {item.destination_port}
                      </span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-dm-text-primary">
                      S/ {parseFloat(item.amount).toFixed(2)}
                    </span>
                  </div>

                  {/* Fecha */}
                  <p className="text-xs tabular-nums text-dm-text-muted">
                    {item.issue_date ? item.issue_date.split('-').reverse().join('/') : 'N/A'}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-dm-border-primary bg-dm-bg-secondary px-4 py-3 sm:flex-row sm:px-6 sm:py-4">
              <span className="text-[10px] font-medium uppercase tracking-tight text-dm-text-muted sm:text-xs">
                {Math.min(pagination.current_page * pagination.page_size, total)} de {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="rounded-lg p-1.5 text-sm transition-colors hover:bg-dm-bg-hover disabled:opacity-30 sm:p-2"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors sm:h-8 sm:w-8 ${
                      pagination.current_page === page
                        ? 'bg-indigo-600 text-white'
                        : 'text-dm-text-secondary hover:bg-dm-bg-hover'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && (
                  <>
                    <span className="px-1 text-dm-text-muted sm:px-2">...</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors sm:h-8 sm:w-8 ${
                        pagination.current_page === totalPages
                          ? 'bg-indigo-600 text-white'
                          : 'text-dm-text-secondary hover:bg-dm-bg-hover'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => goToPage(pagination.current_page + 1)}
                  disabled={pagination.current_page === totalPages}
                  className="rounded-lg p-1.5 text-sm transition-colors hover:bg-dm-bg-hover disabled:opacity-30 sm:p-2"
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

      <ViewTicketModal
        isOpen={!!viewTicketItem}
        onClose={() => setViewTicketItem(null)}
        pdfUrl={viewTicketItem?.pdfUrl || null}
        ticketType={viewTicketItem?.ticketType || null}
        invoiceItemId={viewTicketItem?.invoiceItemId || 0}
      />
    </div>
  );
};

export default ReceivablesPage;
