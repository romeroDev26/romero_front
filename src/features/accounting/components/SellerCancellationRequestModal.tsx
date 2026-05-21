// src/features/accounting/components/SellerCancellationRequestModal.tsx

import React, { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';
import { cancellationRequestsService } from '../services/cancellationRequests.service';

interface SellerCancellationRequestModalProps {
  invoiceId: number;
  invoiceSeries: string;
  invoiceNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

const SellerCancellationRequestModal: React.FC<SellerCancellationRequestModalProps> = ({
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
      <div className="bg-dm-bg-primary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dm-border-primary">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-dm-text-primary">Solicitar Anulación</h2>
          </div>
          <button
            onClick={onClose}
            className="text-dm-text-muted hover:text-dm-text-secondary transition-colors"
            disabled={isLoading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Info de solicitud */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Solicitud de Anulación
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      La solicitud de anulación del comprobante <strong>{invoiceSeries}-{invoiceNumber}</strong> será enviada a tu supervisor asignado para su aprobación. El supervisor podrá aprobar o rechazar la solicitud según sea necesario.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campo de motivo */}
            <div>
              <label htmlFor="requestReason" className="block text-sm font-medium text-dm-text-secondary mb-2">
                Motivo de la Solicitud *
              </label>
              <textarea
                id="requestReason"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Ej: El pasajero tuvo un accidente camino a la embarcación y está en agencia solicitando la devolución. Se encuentra hospitalizado y tiene certificado médico."
                required
                disabled={isLoading}
              />
              <p className="mt-2 text-sm text-dm-text-muted">
                Explica detalladamente por qué necesitas anular este comprobante. El supervisor revisará tu solicitud.
              </p>
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">¿Qué sucederá después?</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li>Tu solicitud se enviará al supervisor para su revisión</li>
                <li>El supervisor evaluará el motivo y decidirá aprobar o rechazar</li>
                <li>Si se aprueba, se generará automáticamente la Nota de Crédito</li>
                <li>Recibirás una notificación con la decisión del supervisor</li>
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-dm-border-primary bg-dm-bg-secondary">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-dm-text-secondary bg-dm-bg-primary border border-dm-border-primary rounded-lg hover:bg-dm-bg-hover transition-colors"
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
                  <PaperAirplaneIcon className="h-5 w-5" />
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

export default SellerCancellationRequestModal;
