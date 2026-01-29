// src/components/common/SellerNotificationsModal.tsx

import React from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CancellationRequestListItem } from '../../features/accounting/types/cancellationRequests';

interface SellerNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: CancellationRequestListItem[];
  isLoading: boolean;
}

const SellerNotificationsModal: React.FC<SellerNotificationsModalProps> = ({
  isOpen,
  onClose,
  requests,
  isLoading
}) => {
  if (!isOpen) return null;

  // Filtrar solo las resueltas (aprobadas o rechazadas)
  const resolvedRequests = requests.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED');

  // Obtener IDs de solicitudes ya vistas antes de abrir este modal
  const getViewedIds = (): Set<number> => {
    const viewedKey = 'cancellation_requests_viewed';
    const viewedStr = localStorage.getItem(viewedKey);
    return viewedStr ? new Set(JSON.parse(viewedStr)) : new Set();
  };

  const viewedIds = getViewedIds();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Respuestas a mis Solicitudes
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : resolvedRequests.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No tienes respuestas aún</p>
                <p className="text-gray-400 text-sm mt-2">
                  Aquí verás las respuestas del supervisor a tus solicitudes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resolvedRequests.map((request) => {
                  const isNew = !viewedIds.has(request.id);
                  return (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 relative ${
                      request.status === 'APPROVED'
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    {/* Badge de "Nueva" para respuestas no vistas */}
                    {isNew && (
                      <div className="absolute -top-2 -right-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full shadow-lg">
                          Nueva
                        </span>
                      </div>
                    )}
                    
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {request.status === 'APPROVED' ? (
                          <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
                        )}
                        <div>
                          <h4 className={`font-semibold ${
                            request.status === 'APPROVED' ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {request.status === 'APPROVED' ? 'Solicitud Aprobada' : 'Solicitud Rechazada'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Comprobante: <span className="font-medium">{request.series}-{request.number}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(request.updated_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Información del pasajero si existe */}
                    {request.passenger_name && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">
                          Pasajero: <span className="font-medium">{request.passenger_name}</span>
                        </span>
                      </div>
                    )}

                    {/* Tu motivo de solicitud */}
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Tu motivo de solicitud:</p>
                      <p className="text-sm text-gray-700 bg-white bg-opacity-50 rounded p-2">
                        {request.request_reason}
                      </p>
                    </div>

                    {/* Respuesta del supervisor (solo si está rechazada) */}
                    {request.status === 'REJECTED' && request.rejection_reason && (
                      <div>
                        <p className="text-xs font-medium text-red-700 mb-1">Motivo del rechazo:</p>
                        <p className="text-sm text-red-900 bg-white bg-opacity-50 rounded p-2 border-l-2 border-red-400">
                          {request.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Info adicional para aprobadas */}
                    {request.status === 'APPROVED' && (
                      <div className="mt-2">
                        <p className="text-sm text-green-700">
                          ✓ La nota de crédito ha sido generada automáticamente
                        </p>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerNotificationsModal;
