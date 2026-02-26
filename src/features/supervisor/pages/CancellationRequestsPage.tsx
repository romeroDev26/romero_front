// src/features/supervisor/pages/CancellationRequestsPage.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  BellAlertIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useCancellationRequests } from '../../../hooks/useCancellationRequests';
import { cancellationRequestsService } from '../../accounting/services/cancellationRequests.service';
import { CancellationRequestListItem, CancellationRequestStatus } from '../../accounting/types/cancellationRequests';
import ApprovalModal from '../components/ApprovalModal';
import RejectionModal from '../components/RejectionModal';

const CancellationRequestsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<CancellationRequestStatus | 'ALL'>('PENDING');
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
    if (statusFilter === 'PENDING') {
      return pendingRequests;
    }
    if (statusFilter === 'ALL') {
      return allRequests;
    }
    return allRequests.filter(req => req.status === statusFilter);
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
        return <span className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pendiente</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Aprobada</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Rechazada</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <BellAlertIcon className="w-10 h-10 text-red-500 flex-shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Solicitudes de Anulación</h1>
            <div className="text-gray-600 mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Gestiona las solicitudes de anulación de comprobantes</span>
              {isConnected && (
                <span className="inline-flex items-center w-fit gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Conectado en tiempo real
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-900">{pendingCount}</p>
            </div>
            <ClockIcon className="w-12 h-12 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Aprobadas</p>
              <p className="text-3xl font-bold text-green-900">
                {allRequests.filter(r => r.status === 'APPROVED').length}
              </p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Rechazadas</p>
              <p className="text-3xl font-bold text-red-900">
                {allRequests.filter(r => r.status === 'REJECTED').length}
              </p>
            </div>
            <XCircleIcon className="w-12 h-12 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'PENDING' && 'Pendientes'}
                {status === 'APPROVED' && 'Aprobadas'}
                {status === 'REJECTED' && 'Rechazadas'}
                {status === 'ALL' && 'Todas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && filteredRequests.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Lista de solicitudes */}
      {!isLoading && filteredRequests.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BellAlertIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay solicitudes {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''}</p>
        </div>
      )}

      {filteredRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pasajero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.requester_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.series}-{request.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.passenger_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={request.request_reason}>
                        {request.request_reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('es-PE')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(request.created_at).toLocaleTimeString('es-PE')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {request.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openApprovalModal(request)}
                            className="text-green-600 hover:text-green-900 font-medium"
                            title="Aprobar"
                          >
                            <CheckCircleIcon className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => openRejectionModal(request)}
                            className="text-red-600 hover:text-red-900 font-medium"
                            title="Rechazar"
                          >
                            <XCircleIcon className="w-6 h-6" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
