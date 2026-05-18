// src/features/supervisor/pages/CancellationRequestsPage.tsx

import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/sileo-toast';
import {
  BellAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useCancellationRequests } from '../../../hooks/useCancellationRequests';
import { cancellationRequestsService } from '../../accounting/services/cancellationRequests.service';
import { CancellationRequestListItem, CancellationRequestStatus } from '../../accounting/types/cancellationRequests';
import ApprovalModal from '../components/ApprovalModal';
import RejectionModal from '../components/RejectionModal';

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
    refresh
  } = useCancellationRequests();

  // Escuchar eventos globales del WebSocket (gestionado en el layout)
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

  // Cargar datos iniciales solo una vez al montar el componente
  useEffect(() => {
    fetchPendingRequests();
    fetchAllRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Obtener lista filtrada
  const getFilteredRequests = (): CancellationRequestListItem[] => {
    let base: CancellationRequestListItem[];
    if (statusFilter === 'PENDING') {
      base = pendingRequests;
    } else if (statusFilter === 'ALL') {
      base = allRequests;
    } else {
      base = allRequests.filter(req => req.status === statusFilter);
    }
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      r =>
        r.requester_name.toLowerCase().includes(q) ||
        `${r.series}-${r.number}`.toLowerCase().includes(q) ||
        (r.passenger_name || '').toLowerCase().includes(q),
    );
  };

  const filteredRequests = getFilteredRequests();

  // Manejo de aprobación
  const handleApprove = async (creditNoteSeries: string) => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await cancellationRequestsService.approve(selectedRequest.id, { credit_note_series: creditNoteSeries });
      toast.success(`Solicitud aprobada. Nota de Crédito ${creditNoteSeries} generada exitosamente.`);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      
      // Actualizar datos completos incluyendo contador
      await Promise.all([
        fetchPendingRequests(),
        fetchAllRequests()
      ]);
      
      // Emitir evento personalizado para actualizar contador en navbar
      window.dispatchEvent(new CustomEvent('cancellation-request-resolved'));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Error al aprobar solicitud';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Manejo de rechazo
  const handleReject = async (reason: string) => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await cancellationRequestsService.reject(selectedRequest.id, { rejection_reason: reason });
      toast.success('Solicitud rechazada correctamente.');
      setShowRejectionModal(false);
      setSelectedRequest(null);
      
      // Actualizar datos completos incluyendo contador
      await Promise.all([
        fetchPendingRequests(),
        fetchAllRequests()
      ]);
      
      // Emitir evento personalizado para actualizar contador en navbar
      window.dispatchEvent(new CustomEvent('cancellation-request-resolved'));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Error al rechazar solicitud';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modales
  const openApprovalModal = (request: CancellationRequestListItem) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const openRejectionModal = (request: CancellationRequestListItem) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  // Cerrar modales
  const closeModals = () => {
    if (!actionLoading) {
      setShowApprovalModal(false);
      setShowRejectionModal(false);
      setSelectedRequest(null);
    }
  };

  // Estilos de badge según estado
  const getStatusBadge = (status: CancellationRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Pendiente</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Aprobada</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">Rechazada</span>;
    }
  };

  // Iniciales del nombre del solicitante
  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const approvedCount = allRequests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = allRequests.filter(r => r.status === 'REJECTED').length;

  const FILTERS = [
    { value: 'PENDING' as const, label: 'Pendientes' },
    { value: 'APPROVED' as const, label: 'Aprobadas' },
    { value: 'REJECTED' as const, label: 'Rechazadas' },
    { value: 'ALL' as const, label: 'Todas' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Solicitudes de Anulación
        </h1>
        <p className="text-slate-600 text-lg">
          Bienvenido de nuevo. Aquí puedes gestionar y revisar el estado de las solicitudes con total transparencia.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Pendientes</span>
            <ClockIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="text-amber-600 text-sm font-semibold">requieren atención</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Aprobadas</span>
            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{approvedCount}</span>
            <span className="text-slate-400 text-sm">total</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Rechazadas</span>
            <XCircleIcon className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{rejectedCount}</span>
            <span className="text-slate-400 text-sm">total</span>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors ml-1"
              title="Actualizar"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por vendedor o comprobante..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <p className="text-rose-700 text-sm">{error}</p>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && filteredRequests.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BellAlertIcon className="w-14 h-14 mb-3" />
            <p className="text-base font-medium">No hay solicitudes para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Comprobante</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pasajero</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                          {getInitials(request.requester_name)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{request.requester_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-primary font-medium">
                        {request.series}-{request.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {request.passenger_name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 max-w-xs truncate" title={request.request_reason}>
                        {request.request_reason}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(request.created_at).toLocaleDateString('es-PE')}
                      <div className="text-xs text-slate-400">
                        {new Date(request.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {request.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openApprovalModal(request)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => openRejectionModal(request)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer de tabla */}
        {filteredRequests.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {filteredRequests.length} resultado{filteredRequests.length !== 1 ? 's' : ''}
              {searchQuery && ` para "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>

      {/* Modales */}
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
