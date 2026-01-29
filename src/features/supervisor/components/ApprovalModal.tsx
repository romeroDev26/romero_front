// src/features/supervisor/components/ApprovalModal.tsx

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CancellationRequestListItem } from '../../accounting/types/cancellationRequests';

interface ApprovalModalProps {
  request: CancellationRequestListItem | null;
  onClose: () => void;
  onApprove: (creditNoteSeries: string) => Promise<void>;
  isLoading: boolean;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ request, onClose, onApprove, isLoading }) => {
  // La Nota de Crédito debe usar LA MISMA SERIE que el documento afectado
  // No usar series diferentes como BC01 o FC01
  const [creditNoteSeries, setCreditNoteSeries] = useState(() => 
    request?.series || ''
  );

  // Actualizar la serie cuando cambia la solicitud
  useEffect(() => {
    if (request) {
      setCreditNoteSeries(request.series);
    }
  }, [request]);

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onApprove(creditNoteSeries);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">Aprobar Solicitud de Anulación</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Información de la solicitud */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-blue-900">Información de la Solicitud</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Vendedor:</span>
                  <p className="text-blue-900">{request.requester_name}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Comprobante:</span>
                  <p className="text-blue-900">{request.series}-{request.number}</p>
                </div>
                {request.passenger_name && (
                  <div>
                    <span className="text-blue-700 font-medium">Pasajero:</span>
                    <p className="text-blue-900">{request.passenger_name}</p>
                  </div>
                )}
                {request.trip_info && (
                  <div>
                    <span className="text-blue-700 font-medium">Viaje:</span>
                    <p className="text-blue-900">{request.trip_info}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-blue-700 font-medium">Motivo de la solicitud:</span>
                  <p className="text-blue-900 mt-1">{request.request_reason}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Fecha de solicitud:</span>
                  <p className="text-blue-900">{new Date(request.created_at).toLocaleString('es-PE')}</p>
                </div>
              </div>
            </div>

            {/* Información de serie de NC */}
            <div>
              <label htmlFor="creditNoteSeries" className="block text-sm font-medium text-gray-700 mb-2">
                Serie de Nota de Crédito
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-semibold text-lg">{creditNoteSeries}</span>
                  <span className="text-sm text-gray-500">(Serie del documento afectado)</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                La Nota de Crédito debe usar la misma serie que el documento afectado. 
                Se generará automáticamente y se enviará a SUNAT.
              </p>
            </div>

            {/* Advertencia */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Importante:</strong> Al aprobar esta solicitud, se generará automáticamente una Nota de Crédito
                    que anulará el comprobante original. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Aprobando...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Aprobar y Generar NC</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalModal;
