// src/components/common/SellerNotificationsModal.tsx

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  InboxIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { CancellationRequestListItem } from '../../features/accounting/types/cancellationRequests';
import { Pagination } from './Pagination';
import { Spinner } from './Spinner';

interface SellerNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: CancellationRequestListItem[];
  isLoading: boolean;
  onMarkAllAsRead: () => Promise<void>;
  onMarkOneAsRead: (requestId: number) => Promise<void>;
}

const SellerNotificationsModal: React.FC<SellerNotificationsModalProps> = ({
  isOpen,
  onClose,
  requests,
  isLoading,
  onMarkAllAsRead,
  onMarkOneAsRead,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [markingRequestId, setMarkingRequestId] = useState<number | null>(null);
  const itemsPerPage = 10;

  // Resetear página cuando se abre el modal
  useEffect(() => {
    if (isOpen) setCurrentPage(1);
  }, [isOpen]);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAsRead(true);
    try {
      await onMarkAllAsRead();
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleMarkOneAsRead = async (requestId: number) => {
    setMarkingRequestId(requestId);
    try {
      await onMarkOneAsRead(requestId);
    } finally {
      setMarkingRequestId(null);
    }
  };

  if (!isOpen) return null;

  const resolvedRequests = requests
    .filter((r) => r.status === 'APPROVED' || r.status === 'REJECTED')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const totalItems = resolvedRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = resolvedRequests.slice(startIndex, startIndex + itemsPerPage);
  const unreadCount = resolvedRequests.filter((r) => !r.requester_read_at).length;

  // ── helpers visuales ──
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[85vh] bg-dm-bg-primary rounded-[20px] border border-dm-border-primary overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-dm-border-primary">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-[8px] bg-primary/10">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-dm-text-primary tracking-tight">
                Respuestas a mis solicitudes
              </h3>
              <p className="text-[12px] text-dm-text-muted mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} respuesta${unreadCount > 1 ? 's' : ''} sin leer`
                  : 'Todas las respuestas han sido leídas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-dm-text-muted hover:text-dm-text-primary hover:bg-dm-bg-hover transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner size="lg" color="text-primary" />
              <p className="text-[13px] text-dm-text-muted">Cargando respuestas…</p>
            </div>
          ) : resolvedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-dm-bg-secondary">
                <InboxIcon className="w-8 h-8 text-dm-text-muted" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-medium text-dm-text-primary">
                  No tienes respuestas aún
                </p>
                <p className="text-[13px] text-dm-text-muted mt-1 max-w-[280px]">
                  Aquí aparecerán las respuestas del supervisor a tus solicitudes de anulación.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedRequests.map((request) => {
                const isNew = !request.requester_read_at;
                const isApproved = request.status === 'APPROVED';

                return (
                  <div
                    key={request.id}
                    className={`relative group rounded-[12px] border transition-all duration-200 ${
                      isNew
                        ? 'border-primary/20 bg-primary/[0.02]'
                        : 'border-dm-border-primary bg-dm-bg-primary hover:border-dm-border-secondary'
                    }`}
                  >
                    {/* Badge "Nueva" */}
                    {isNew && (
                      <div className="absolute -top-2.5 right-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold text-white bg-primary rounded-full shadow-sm">
                          Nueva
                        </span>
                      </div>
                    )}

                    <div className="p-5">
                      {/* Fila superior: estado + fecha */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-[8px] flex-shrink-0 ${
                              isApproved
                                ? 'bg-emerald-50 dark:bg-emerald-950/30'
                                : 'bg-red-50 dark:bg-red-950/30'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold text-dm-text-primary">
                              {isApproved
                                ? 'Solicitud aprobada'
                                : 'Solicitud rechazada'}
                            </h4>
                            <p className="text-[12px] text-dm-text-muted">
                              {request.series}-{request.number}
                              {request.passenger_name && (
                                <span className="text-dm-text-secondary">
                                  {' · '}
                                  {request.passenger_name}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-dm-text-muted font-medium whitespace-nowrap mt-1">
                          {formatDate(request.updated_at)}
                        </span>
                      </div>

                      {/* Motivo de solicitud */}
                      <div className="mb-3">
                        <p className="text-[11px] font-medium text-dm-text-muted uppercase tracking-wider mb-1.5">
                          Tu motivo
                        </p>
                        <p className="text-[13px] text-dm-text-secondary leading-relaxed bg-dm-bg-secondary rounded-[8px] px-3.5 py-2.5">
                          {request.request_reason}
                        </p>
                      </div>

                      {/* Respuesta del supervisor */}
                      {isApproved ? (
                        <div className="flex items-start gap-2 rounded-[8px] bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2.5">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[13px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                            La nota de crédito fue generada automáticamente.
                          </p>
                        </div>
                      ) : request.rejection_reason ? (
                        <div className="rounded-[8px] bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3.5 py-2.5">
                          <p className="text-[11px] font-medium text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">
                            Motivo del rechazo
                          </p>
                          <p className="text-[13px] text-red-900 dark:text-red-200 leading-relaxed">
                            {request.rejection_reason}
                          </p>
                        </div>
                      ) : null}

                      {/* Marcar como leída */}
                      {isNew && (
                        <div className="mt-4 pt-3 border-t border-dm-border-primary">
                          <button
                            onClick={() => handleMarkOneAsRead(request.id)}
                            disabled={markingRequestId === request.id}
                            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {markingRequestId === request.id ? (
                              <>
                                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                <span>Marcando…</span>
                              </>
                            ) : (
                              <>
                                <CheckIcon className="w-3.5 h-3.5" />
                                <span>Marcar como leída</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    total={totalItems}
                    limit={itemsPerPage}
                    onPageChange={setCurrentPage}
                    loading={false}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-8 py-4 border-t border-dm-border-primary bg-dm-bg-secondary">
          <div>
            {unreadCount > 0 && !isLoading && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAsRead}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-primary hover:bg-primary/90 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingAsRead ? (
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckIcon className="w-3.5 h-3.5" />
                )}
                <span>
                  Marcar todas como leídas
                  <span className="ml-1.5 opacity-80">({unreadCount})</span>
                </span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-[13px] font-medium text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg-hover rounded-full transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerNotificationsModal;
