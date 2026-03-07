import React, { useEffect } from 'react';
import {
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  CreditCardIcon,
  TruckIcon,
} from 'lucide-react';
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
    <div className="max-w-[1200px] mx-auto px-4 py-10 lg:px-8">

      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Encomiendas por Cobrar</h1>
            <p className="text-slate-500 mt-1 text-sm font-normal">Panel ejecutivo para el seguimiento y control de cobros de logística.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Encomiendas</span>
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCardIcon className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{total}</h2>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pendientes</span>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <XCircleIcon className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{summary.unpaid_parcels}</h2>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pagadas</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{summary.paid_parcels}</h2>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monto Total</span>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TruckIcon className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            S/ {parseFloat(summary.total_amount.toString()).toFixed(2)}
          </h2>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative w-full lg:flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por encomienda, remitente o destinatario..."
              value={filters.doc_number || ''}
              onChange={(e) => updateFilters({ doc_number: e.target.value || null })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 placeholder:text-slate-400 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={filters.payment_status || ''}
              onChange={(e) => updateFilters({ payment_status: (e.target.value as 'NO PAGADO' | 'PAGADO') || null })}
              className="px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[140px] outline-none"
            >
              <option value="">Estado: Todos</option>
              <option value="NO PAGADO">Pendientes</option>
              <option value="PAGADO">Pagadas</option>
            </select>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => updateFilters({ start_date: e.target.value || null })}
              className="px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[140px] outline-none"
            />
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => updateFilters({ end_date: e.target.value || null })}
              className="px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[140px] outline-none"
            />
            <button
              onClick={clearFilters}
              title="Limpiar filtros"
              className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Cargando encomiendas...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <XCircleIcon className="w-12 h-12 mx-auto mb-4 text-rose-400" />
            <p className="text-slate-600 mb-4">Error al cargar las encomiendas: {error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No se encontraron encomiendas con los filtros aplicados.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID Encomienda</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Remitente</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Destinatario</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Viaje / Ruta</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Monto</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Fecha</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.invoice_item_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-primary">#{item.invoice_item_id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{item.sender_name}</div>
                        <div className="text-xs text-slate-400">{item.sender_document}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{item.recipient_name}</div>
                        <div className="text-xs text-slate-400">{item.recipient_document}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded text-slate-600">
                          {item.origin_port} → {item.destination_port}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        S/ {parseFloat(item.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.payment_status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {item.issue_date ? item.issue_date.split('-').reverse().join('/') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.payment_status === 'NO PAGADO' ? (
                          <button
                            onClick={() => payment.openModal(item)}
                            disabled={payment.isConfirming}
                            className="text-primary hover:text-primary/70 font-semibold text-sm transition-colors disabled:opacity-50"
                          >
                            Gestionar
                          </button>
                        ) : (
                          <span className="text-slate-400 text-sm font-semibold">Pagada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">
                Mostrando {(pagination.current_page - 1) * pagination.page_size + 1} a{' '}
                {Math.min(pagination.current_page * pagination.page_size, total)} de {total} resultados
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-30 text-sm"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      pagination.current_page === page
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-slate-400">...</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        pagination.current_page === totalPages
                          ? 'bg-primary text-white'
                          : 'hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => goToPage(pagination.current_page + 1)}
                  disabled={pagination.current_page === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-30 text-sm"
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
