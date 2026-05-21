// src/features/supervisor/components/ApprovalModal.tsx

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserIcon,
  DocumentTextIcon,
  MapPinIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { CancellationRequestListItem } from '../../accounting/types/cancellationRequests';

interface ApprovalModalProps {
  request: CancellationRequestListItem | null;
  onClose: () => void;
  onApprove: (creditNoteSeries: string) => Promise<void>;
  isLoading: boolean;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  request,
  onClose,
  onApprove,
  isLoading,
}) => {
  const [creditNoteSeries, setCreditNoteSeries] = useState(() => request?.series || '');

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
            <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-dm-text-primary tracking-tight">
                Aprobar solicitud de anulación
              </h2>
              <p className="text-[12px] text-dm-text-muted">
                {request.series}-{request.number}
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
            {/* Información de la solicitud */}
            <div className="rounded-[12px] border border-dm-border-primary bg-dm-bg-secondary p-5 space-y-3">
              <h3 className="text-[13px] font-semibold text-dm-text-primary">
                Información de la solicitud
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[6px] bg-dm-bg-primary border border-dm-border-primary flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                  </div>
                  <div>
                    <p className="text-[11px] text-dm-text-muted">Vendedor</p>
                    <p className="text-[13px] font-medium text-dm-text-primary">{request.requester_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[6px] bg-dm-bg-primary border border-dm-border-primary flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                  </div>
                  <div>
                    <p className="text-[11px] text-dm-text-muted">Comprobante</p>
                    <p className="text-[13px] font-medium text-dm-text-primary">
                      {request.series}-{request.number}
                    </p>
                  </div>
                </div>

                {request.passenger_name && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-dm-bg-primary border border-dm-border-primary flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                    </div>
                    <div>
                      <p className="text-[11px] text-dm-text-muted">Pasajero</p>
                      <p className="text-[13px] font-medium text-dm-text-primary">{request.passenger_name}</p>
                    </div>
                  </div>
                )}

                {request.trip_info && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-dm-bg-primary border border-dm-border-primary flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                    </div>
                    <div>
                      <p className="text-[11px] text-dm-text-muted">Viaje</p>
                      <p className="text-[13px] font-medium text-dm-text-primary">{request.trip_info}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[6px] bg-dm-bg-primary border border-dm-border-primary flex items-center justify-center flex-shrink-0">
                    <CalendarDaysIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                  </div>
                  <div>
                    <p className="text-[11px] text-dm-text-muted">Fecha de solicitud</p>
                    <p className="text-[13px] font-medium text-dm-text-primary">
                      {new Date(request.created_at).toLocaleString('es-PE')}
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-1">
                  <p className="text-[11px] text-dm-text-muted mb-1">Motivo de la solicitud</p>
                  <p className="text-[13px] text-dm-text-secondary leading-relaxed bg-dm-bg-primary rounded-[8px] border border-dm-border-primary px-3.5 py-2.5">
                    {request.request_reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Serie de NC */}
            <div>
              <label
                htmlFor="creditNoteSeries"
                className="block text-[13px] font-medium text-dm-text-primary mb-2"
              >
                Serie de Nota de Crédito
              </label>
              <div className="w-full px-4 py-3 rounded-[12px] border border-dm-border-primary bg-dm-bg-secondary">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-dm-text-primary">{creditNoteSeries}</span>
                  <span className="text-[12px] text-dm-text-muted">Serie del documento afectado</span>
                </div>
              </div>
              <p className="mt-2 text-[12px] text-dm-text-muted">
                La Nota de Crédito debe usar la misma serie que el documento afectado. Se generará
                automáticamente y se enviará a SUNAT.
              </p>
            </div>

            {/* Advertencia */}
            <div className="rounded-[12px] border border-amber-200/60 bg-amber-50 dark:bg-amber-950/30/40 p-5">
              <div className="flex items-start gap-3.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-amber-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-dm-text-secondary leading-relaxed">
                    <span className="font-semibold text-dm-text-primary">Importante:</span> al aprobar esta
                    solicitud, se generará automáticamente una Nota de Crédito que anulará el
                    comprobante original. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
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
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Aprobando…</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Aprobar y generar NC</span>
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
