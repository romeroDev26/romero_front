// src/features/supervisor/components/RejectionModal.tsx

import React, { useState } from 'react';
import {
  XMarkIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserIcon,
  DocumentTextIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { CancellationRequestListItem } from '../../accounting/types/cancellationRequests';

interface RejectionModalProps {
  request: CancellationRequestListItem | null;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
  isLoading: boolean;
}

const RejectionModal: React.FC<RejectionModalProps> = ({
  request,
  onClose,
  onReject,
  isLoading,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  if (!request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectionReason.trim()) {
      await onReject(rejectionReason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202020]/30 backdrop-blur-[2px] transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[90vh] bg-white rounded-[20px] border border-[#e8e8e8] overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#e8e8e8]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-red-50">
              <XCircleIcon className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#202020] tracking-tight">
                Rechazar solicitud de anulación
              </h2>
              <p className="text-[12px] text-[#828282]">
                {request.series}-{request.number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex items-center justify-center w-8 h-8 rounded-full text-[#828282] hover:text-[#202020] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-6">
            {/* Información de la solicitud */}
            <div className="rounded-[12px] border border-[#e8e8e8] bg-[#fafafa] p-5 space-y-3">
              <h3 className="text-[13px] font-semibold text-[#202020]">
                Información de la solicitud
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[6px] bg-white border border-[#e8e8e8] flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-3.5 h-3.5 text-[#828282]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#828282]">Vendedor</p>
                    <p className="text-[13px] font-medium text-[#202020]">{request.requester_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[6px] bg-white border border-[#e8e8e8] flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon className="w-3.5 h-3.5 text-[#828282]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#828282]">Comprobante</p>
                    <p className="text-[13px] font-medium text-[#202020]">
                      {request.series}-{request.number}
                    </p>
                  </div>
                </div>

                {request.passenger_name && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-white border border-[#e8e8e8] flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-[#828282]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#828282]">Pasajero</p>
                      <p className="text-[13px] font-medium text-[#202020]">{request.passenger_name}</p>
                    </div>
                  </div>
                )}

                {request.trip_info && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-white border border-[#e8e8e8] flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="w-3.5 h-3.5 text-[#828282]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#828282]">Viaje</p>
                      <p className="text-[13px] font-medium text-[#202020]">{request.trip_info}</p>
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2 pt-1">
                  <p className="text-[11px] text-[#828282] mb-1">Motivo de la solicitud</p>
                  <p className="text-[13px] text-[#4d4d4d] leading-relaxed bg-white rounded-[8px] border border-[#e8e8e8] px-3.5 py-2.5">
                    {request.request_reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Campo de motivo de rechazo */}
            <div>
              <label
                htmlFor="rejectionReason"
                className="block text-[13px] font-medium text-[#202020] mb-2"
              >
                Motivo del rechazo
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                disabled={isLoading}
                className="w-full px-4 py-3 text-[14px] text-[#202020] bg-white border border-[#e8e8e8] rounded-[12px] placeholder:text-[#828282] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-colors resize-none"
                placeholder="Ej: No procede según política de empresa: se requiere certificado médico para anulaciones post-zarpe."
                required
              />
              <p className="mt-2 text-[12px] text-[#828282]">
                Explica claramente por qué se rechaza esta solicitud. El vendedor verá este mensaje.
              </p>
            </div>

            {/* Advertencia */}
            <div className="rounded-[12px] border border-amber-200/60 bg-amber-50/40 p-5">
              <div className="flex items-start gap-3.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-amber-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#4d4d4d] leading-relaxed">
                    <span className="font-semibold text-[#202020]">Nota:</span> al rechazar esta
                    solicitud, el comprobante original permanecerá válido y no se generará ninguna
                    nota de crédito.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[#e8e8e8] bg-[#fafafa]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-[13px] font-medium text-[#4d4d4d] hover:text-[#202020] hover:bg-[#f5f5f5] rounded-full transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !rejectionReason.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Rechazando…</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-3.5 h-3.5" />
                  <span>Rechazar solicitud</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionModal;
