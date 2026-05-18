// src/features/accounting/components/RequestCancellationModal.tsx

import React, { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';
import { cancellationRequestsService } from '../services/cancellationRequests.service';

interface RequestCancellationModalProps {
  invoiceId: number;
  invoiceSeries: string;
  invoiceNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

const RequestCancellationModal: React.FC<RequestCancellationModalProps> = ({
  invoiceId,
  invoiceSeries,
  invoiceNumber,
  onClose,
  onSuccess
}) => {
  const [requestReason, setRequestReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestReason.trim()) {
      toast.warn('Debes explicar el motivo de la solicitud');
      return;
    }

    try {
      setIsLoading(true);
      await cancellationRequestsService.create({
        invoice_id: invoiceId,
        request_reason: requestReason
      });
      toast.success('Solicitud enviada correctamente. Espera la aprobación del supervisor.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Error al enviar solicitud';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Solicitar Aprobación de Anulación</h2>
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
            {/* Info del viaje */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    El viaje ya ha partido
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      No puedes anular directamente el comprobante <strong>{invoiceSeries}-{invoiceNumber}</strong> porque
                      el viaje ya salió. Debes solicitar la aprobación de un supervisor.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campo de motivo */}
            <div>
              <label htmlFor="requestReason" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la Solicitud *
              </label>
              <textarea
                id="requestReason"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Ej: El pasajero tuvo un accidente camino a la embarcación y está en agencia solicitando la devolución. Se encuentra hospitalizado y tiene certificado médico."
                required
                disabled={isLoading}
              />
              <p className="mt-2 text-sm text-gray-500">
                Explica detalladamente por qué necesitas anular este comprobante. El supervisor revisará tu solicitud.
              </p>
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">¿Qué sucederá después?</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Tu solicitud se enviará al supervisor para su revisión</li>
                <li>El supervisor evaluará el motivo y decidirá aprobar o rechazar</li>
                <li>Si se aprueba, se generará automáticamente la Nota de Crédito</li>
                <li>Recibirás una notificación con la decisión del supervisor</li>
              </ol>
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
              className="px-6 py-2 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading || !requestReason.trim()}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span>Enviar Solicitud</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestCancellationModal;
