// src/features/supervisor/pages/CancellationRequestsPage.tsx

import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/sileo-toast';
import {
  BellAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  InboxIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useCancellationRequests } from '../../../hooks/useCancellationRequests';
import { cancellationRequestsService } from '../../accounting/services/cancellationRequests.service';
import {
  CancellationRequestListItem,
  CancellationRequestStatus,
} from '../../accounting/types/cancellationRequests';
import ApprovalModal from '../components/ApprovalModal';
import RejectionModal from '../components/RejectionModal';
import { Spinner } from '../../../components/common/Spinner';

const CancellationRequestsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<CancellationRequestStatus | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequestListItem | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    pendingRequests,
    allRequests,
    pendingCount,
    isLoading,
    error,
    fetchPendingRequests,
    fetchAllRequests,
    refresh,
  } = useCancellationRequests();

  // Escuchar eventos globales del WebSocket
  useEffect(() => {
    const handleCreated = () => refresh();
    const handleResolved = () => refresh();

    window.addEventListener('cancellation-request-created', handleCreated as EventListener);
    window.addEventListener('cancellation-request-resolved', handleResolved as EventListener);

    return () => {
      window.removeEventListener('cancellation-request-created', handleCreated as EventListener);
      window.removeEventListener('cancellation-request-resolved', handleResolved as EventListener);
    };
  }, [refresh]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchPendingRequests();
    fetchAllRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFilteredRequests = (): CancellationRequestListItem[] => {
    let base: CancellationRequestListItem[];
    if (statusFilter === 'PENDING') {
      base = pendingRequests;
    } else if (statusFilter === 'ALL') {
      base = allRequests;
    } else {
      base = allRequests.filter((req) => req.status === statusFilter);
    }
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (r) =>
        r.requester_name.toLowerCase().includes(q) ||
        `${r.series}-${r.number}`.toLowerCase().includes(q) ||
        (r.passenger_name || '').toLowerCase().includes(q)
    );
  };

  const filteredRequests = getFilteredRequests();

  const handleApprove = async (creditNoteSeries: string) => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await cancellationRequestsService.approve(selectedRequest.id, {
        credit_note_series: creditNoteSeries,
      });
      toast.success(
        `Solicitud aprobada. Nota de Crédito ${creditNoteSeries} generada exitosamente.`
      );
      setShowApprovalModal(false);
      setSelectedRequest(null);
      await Promise.all([fetchPendingRequests(), fetchAllRequests()]);
      window.dispatchEvent(new CustomEvent('cancellation-request-resolved'));
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail || err?.message || 'Error al aprobar solicitud';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await cancellationRequestsService.reject(selectedRequest.id, {
        rejection_reason: reason,
      });
      toast.success('Solicitud rechazada correctamente.');
      setShowRejectionModal(false);
      setSelectedRequest(null);
      await Promise.all([fetchPendingRequests(), fetchAllRequests()]);
      window.dispatchEvent(new CustomEvent('cancellation-request-resolved'));
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail || err?.message || 'Error al rechazar solicitud';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const openApprovalModal = (request: CancellationRequestListItem) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const openRejectionModal = (request: CancellationRequestListItem) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const closeModals = () => {
    if (!actionLoading) {
      setShowApprovalModal(false);
      setShowRejectionModal(false);
      setSelectedRequest(null);
    }
  };

  const getStatusBadge = (status: CancellationRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <ClockIcon className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircleIcon className="w-3 h-3" />
            Aprobada
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-100">
            <XCircleIcon className="w-3 h-3" />
            Rechazada
          </span>
        );
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const approvedCount = allRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = allRequests.filter((r) => r.status === 'REJECTED').length;

  const FILTERS = [
    { value: 'PENDING' as const, label: 'Pendientes' },
    { value: 'APPROVED' as const, label: 'Aprobadas' },
    { value: 'REJECTED' as const, label: 'Rechazadas' },
    { value: 'ALL' as const, label: 'Todas' },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-[#1F4690]/10">
            <ShieldCheckIcon className="w-5 h-5 text-[#1F4690]" />
          </div>
          <h1 className="text-[22px] font-semibold text-[#202020] tracking-tight">
            Solicitudes de anulación
          </h1>
        </div>
        <p className="text-[14px] text-[#828282] max-w-2xl">
          Gestiona y revisa el estado de las solicitudes de anulación enviadas por los vendedores.
        </p>
      </header>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[12px] border border-[#e8e8e8] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#828282] uppercase tracking-wider">
              Pendientes
            </span>
            <div className="w-8 h-8 rounded-[8px] bg-amber-50 flex items-center justify-center">
              <ClockIcon className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-[#202020] leading-none">{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="text-[12px] font-medium text-amber-600">requieren atención</span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-[12px] border border-[#e8e8e8] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#828282] uppercase tracking-wider">
              Aprobadas
            </span>
            <div className="w-8 h-8 rounded-[8px] bg-emerald-50 flex items-center justify-center">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-[#202020] leading-none">{approvedCount}</span>
            <span className="text-[12px] text-[#828282]">total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[12px] border border-[#e8e8e8] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#828282] uppercase tracking-wider">
              Rechazadas
            </span>
            <div className="w-8 h-8 rounded-[8px] bg-red-50 flex items-center justify-center">
              <XCircleIcon className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-[#202020] leading-none">{rejectedCount}</span>
            <span className="text-[12px] text-[#828282]">total</span>
          </div>
        </div>
      </div>

      {/* ── Filtros y búsqueda ── */}
      <div className="bg-white rounded-[12px] border border-[#e8e8e8] p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-[#1F4690] text-white'
                    : 'bg-[#f5f5f5] text-[#4d4d4d] hover:bg-[#e8e8e8]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por vendedor o comprobante..."
              className="w-full pl-10 pr-4 py-2.5 text-[13px] text-[#202020] bg-[#f5f5f5] border border-[#e8e8e8] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-[12px] border border-red-200 bg-red-50/40 p-4">
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="bg-white rounded-[12px] border border-[#e8e8e8] overflow-hidden">
        {isLoading && filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" color="text-[#1F4690]" />
            <p className="text-[13px] text-[#828282]">Cargando solicitudes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#f5f5f5]">
              <InboxIcon className="w-8 h-8 text-[#828282]" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-[#202020]">
                No hay solicitudes para mostrar
              </p>
              <p className="text-[13px] text-[#828282] mt-1">
                {searchQuery
                  ? `No se encontraron resultados para "${searchQuery}"`
                  : 'Las solicitudes aparecerán aquí cuando los vendedores las envíen.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e8e8e8]">
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                    Comprobante
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                    Pasajero
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#828282] uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5]">
                {filteredRequests.map((request) => {
                  const { date, time } = formatDate(request.created_at);
                  return (
                    <tr key={request.id} className="hover:bg-[#fafafa]/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1F4690]/10 flex items-center justify-center text-[#1F4690] font-bold text-[11px] flex-shrink-0">
                            {getInitials(request.requester_name)}
                          </div>
                          <span className="text-[13px] font-medium text-[#202020]">
                            {request.requester_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-mono font-medium text-[#1F4690]">
                          {request.series}-{request.number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#4d4d4d]">
                        {request.passenger_name || (
                          <span className="text-[#c4c4c4]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className="text-[13px] text-[#4d4d4d] max-w-xs truncate"
                          title={request.request_reason}
                        >
                          {request.request_reason}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-[#4d4d4d]">{date}</span>
                        <div className="text-[11px] text-[#828282]">{time}</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4 text-right">
                        {request.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openApprovalModal(request)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              Aprobar
                            </button>
                            <button
                              onClick={() => openRejectionModal(request)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-red-700 bg-red-50 border border-red-100 rounded-full hover:bg-red-100 transition-colors"
                            >
                              <XCircleIcon className="w-3.5 h-3.5" />
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[13px] text-[#c4c4c4]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer de tabla */}
        {filteredRequests.length > 0 && (
          <div className="px-6 py-3.5 bg-[#fafafa] border-t border-[#e8e8e8]">
            <p className="text-[12px] text-[#828282]">
              Mostrando {filteredRequests.length} resultado
              {filteredRequests.length !== 1 ? 's' : ''}
              {searchQuery && ` para "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {showApprovalModal && (
        <ApprovalModal
          request={selectedRequest}
          onClose={closeModals}
          onApprove={handleApprove}
          isLoading={actionLoading}
        />
      )}

      {showRejectionModal && (
        <RejectionModal
          request={selectedRequest}
          onClose={closeModals}
          onReject={handleReject}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default CancellationRequestsPage;
