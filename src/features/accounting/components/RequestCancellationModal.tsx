// src/features/accounting/components/RequestCancellationModal.tsx

import React, { useState } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ClockIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';
import { cancellationRequestsService } from '../services/cancellationRequests.service';
import { asApiError, detailToString } from '../../../utils/errorHandler';

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
  onSuccess,
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
        request_reason: requestReason,
      });
      toast.success('Solicitud enviada correctamente. Espera la aprobación del supervisor.');
      onSuccess();
      onClose();
    } catch (err) {
      const apiError = asApiError(err);
      const errorMessage =
        detailToString(apiError.response?.data?.detail) || apiError.message || 'Error al enviar solicitud';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[90vh] bg-dm-bg-primary rounded-[20px] border border-dm-border-primary overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-dm-border-primary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-[#1F4690]/10">
              <ShieldExclamationIcon className="w-5 h-5 text-[#1F4690]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-dm-text-primary tracking-tight">
                Solicitar aprobación de anulación
              </h2>
              <p className="text-[12px] text-dm-text-muted">
                {invoiceSeries}-{String(invoiceNumber).padStart(8, '0')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center justify-center w-8 h-8 rounded-full text-dm-text-muted hover:text-dm-text-primary hover:bg-dm-bg-secondary transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-6">
            {/* Alerta: viaje ya partido */}
            <div className="rounded-[12px] border border-amber-200/60 bg-amber-50 dark:bg-amber-950/40 p-5">
              <div className="flex items-start gap-3.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-amber-100 flex items-center justify-center">
                  <ClockIcon className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-dm-text-primary">
                    El viaje ya ha partido
                  </h3>
                  <p className="mt-1 text-[13px] text-dm-text-secondary leading-relaxed">
                    No puedes anular directamente el comprobante{' '}
                    <span className="font-semibold text-dm-text-primary">
                      {invoiceSeries}-{invoiceNumber}
                    </span>{' '}
                    porque el viaje ya salió. Debes solicitar la aprobación de un supervisor.
                  </p>
                </div>
              </div>
            </div>

            {/* Campo de motivo */}
            <div>
              <label
                htmlFor="requestReason"
                className="block text-[13px] font-medium text-dm-text-primary mb-2"
              >
                Motivo de la solicitud
                <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
              </label>
              <textarea
                id="requestReason"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={5}
                disabled={isLoading}
                className="w-full px-4 py-3 text-[14px] text-dm-text-primary bg-dm-bg-primary border border-dm-border-primary rounded-[12px] placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-colors resize-none"
                placeholder="Ej: El pasajero tuvo un accidente camino a la embarcación y está en agencia solicitando la devolución. Se encuentra hospitalizado y tiene certificado médico."
                required
              />
              <p className="mt-2 text-[12px] text-dm-text-muted">
                Explica detalladamente por qué necesitas anular este comprobante. El supervisor revisará tu solicitud.
              </p>
            </div>

            {/* Instrucciones */}
            <div className="rounded-[12px] border border-dm-border-primary bg-dm-bg-secondary p-5">
              <div className="flex items-center gap-2 mb-3">
                <InformationCircleIcon className="w-4 h-4 text-[#1F4690]" />
                <h4 className="text-[13px] font-semibold text-dm-text-primary">
                  ¿Qué sucederá después?
                </h4>
              </div>
              <ol className="space-y-2.5">
                {[
                  'Tu solicitud se enviará al supervisor para su revisión',
                  'El supervisor evaluará el motivo y decidirá aprobar o rechazar',
                  'Si se aprueba, se generará automáticamente la Nota de Crédito',
                  'Recibirás una notificación con la decisión del supervisor',
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[13px] text-dm-text-secondary">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1F4690]/10 text-[#1F4690] text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-dm-border-primary bg-dm-bg-secondary">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-[13px] font-medium text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg-secondary rounded-full transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !requestReason.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-medium text-white bg-[#1F4690] hover:bg-[#16377a] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando…</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />
                  <span>Enviar solicitud</span>
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
