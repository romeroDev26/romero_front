// src/features/dashboard/components/ExportProgressModal.tsx
import React from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { ExportStatusResponse } from '../../../types/exports';

interface ExportProgressModalProps {
  isOpen: boolean;
  isExporting: boolean;
  status: ExportStatusResponse | null;
  progress: number;
  error: Error | null;
  onClose: () => void;
  onDownload: () => void;
  onCancel: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  status,
  progress,
  error,
  onClose,
  onDownload,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isCompleted = status?.status === 'completed';
  const isFailed = status?.status === 'failed' || !!error;
  const isProcessing = status?.status === 'processing' || status?.status === 'queued';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={isProcessing ? undefined : onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-dm-bg-primary text-left shadow-xl border border-dm-border-primary transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-dm-bg-primary px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {isCompleted && (
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                )}
                {isFailed && (
                  <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
                )}
                {isProcessing && (
                  <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2 animate-pulse" />
                )}
                <h3 className="text-lg font-semibold text-dm-text-primary">
                  {isCompleted && '✅ Exportación Completada'}
                  {isFailed && '❌ Error en Exportación'}
                  {isProcessing && '⏳ Generando Reporte'}
                </h3>
              </div>
              {!isProcessing && (
                <button
                  onClick={onClose}
                  className="text-dm-text-muted hover:text-dm-text-muted"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="mt-4">
              {/* Mensaje de estado */}
              <p className="text-sm text-dm-text-secondary mb-4">
                {status?.message || error?.message || 'Procesando...'}
              </p>

              {/* Current Step */}
              {isProcessing && status?.current_step && (
                <p className="text-xs text-dm-text-muted mb-3 italic">
                  {status.current_step}
                </p>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dm-text-secondary">Progreso</span>
                    <span className="text-sm font-medium text-dm-text-secondary">{progress}%</span>
                  </div>
                  <div className="w-full bg-dm-bg-secondary rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completed Info */}
              {isCompleted && status && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dm-text-secondary">Archivo:</span>
                      <span className="font-medium text-dm-text-primary">{status.file_name}</span>
                    </div>
                    {status.file_size_bytes && (
                      <div className="flex justify-between">
                        <span className="text-dm-text-secondary">Tamaño:</span>
                        <span className="font-medium text-dm-text-primary">
                          {(status.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    {status.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-dm-text-secondary">Expira:</span>
                        <span className="font-medium text-dm-text-primary">
                          {new Date(status.expires_at).toLocaleString('es-PE')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Info */}
              {isFailed && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {error?.message || status?.error?.message || 'Ocurrió un error desconocido'}
                  </p>
                  {status?.error?.details && (
                    <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto">
                      {JSON.stringify(status.error.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-dm-bg-secondary px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
            {isCompleted && (
              <button
                onClick={onDownload}
                className="inline-flex w-full justify-center items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:w-auto"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Descargar
              </button>
            )}
            
            {isProcessing && (
              <button
                onClick={onCancel}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
              >
                Cancelar
              </button>
            )}
            
            {!isProcessing && (
              <button
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-dm-bg-primary px-4 py-2 text-sm font-semibold text-dm-text-primary shadow-sm ring-1 ring-inset ring-dm-border-primary hover:bg-dm-bg-hover sm:mt-0 sm:w-auto"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
