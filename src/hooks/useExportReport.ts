// src/hooks/useExportReport.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { exportsService } from '../services/exports.service';
import type {
  ExportRequest,
  ExportStatusResponse,
  ExportRequestResponse,
} from '../types/exports';

interface UseExportReportOptions {
  pollingInterval?: number; // ms, default 2000 (2 seconds)
  onSuccess?: (status: ExportStatusResponse) => void;
  onError?: (error: Error) => void;
}

interface UseExportReportReturn {
  isExporting: boolean;
  status: ExportStatusResponse | null;
  progress: number;
  error: Error | null;
  requestExport: (data: ExportRequest) => Promise<void>;
  cancelExport: () => void;
  download: () => Promise<void>;
}

export const useExportReport = (
  options: UseExportReportOptions = {}
): UseExportReportReturn => {
  const {
    pollingInterval = 2000,
    onSuccess,
    onError,
  } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<ExportStatusResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exportIdRef = useRef<string | null>(null);

  /**
   * Detener polling
   */
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Verificar estado del job
   */
  const checkStatus = useCallback(async (exportId: string) => {
    try {
      const statusData = await exportsService.checkStatus(exportId);
      setStatus(statusData);
      setProgress(statusData.progress_percentage || 0);

      // Si completó o falló, detener polling
      if (statusData.status === 'completed') {
        stopPolling();
        setIsExporting(false);
        if (onSuccess) {
          onSuccess(statusData);
        }
      } else if (statusData.status === 'failed') {
        stopPolling();
        setIsExporting(false);
        const err = new Error(statusData.error?.message || 'Export failed');
        setError(err);
        if (onError) {
          onError(err);
        }
      } else {
        // Continuar polling si está en queue o procesando
        pollingTimeoutRef.current = setTimeout(() => {
          checkStatus(exportId);
        }, pollingInterval);
      }
    } catch (err) {
      stopPolling();
      setIsExporting(false);
      const error = err instanceof Error ? err : new Error('Failed to check status');
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [pollingInterval, onSuccess, onError, stopPolling]);

  /**
   * Solicitar exportación (unificada) - Soporta modo síncrono
   */
  const requestExport = useCallback(async (data: ExportRequest) => {
    try {
      setIsExporting(true);
      setError(null);
      setProgress(0);
      setStatus(null);

      // Si es modo síncrono, descargar directamente
      if (data.sync) {
        const blob = await exportsService.requestExport(data) as Blob;
        const fileName = data.metadata?.report_title || `reporte.${data.format}`;
        await exportsService.downloadFileFromBlob(blob, fileName);
        setIsExporting(false);
        if (onSuccess) {
          onSuccess({ status: 'completed' } as ExportStatusResponse);
        }
        return;
      }

      // Modo asíncrono normal
      const response = await exportsService.requestExport(data) as ExportRequestResponse;
      exportIdRef.current = response.export_id;

      // Iniciar polling
      await checkStatus(response.export_id);
    } catch (err) {
      setIsExporting(false);
      const error = err instanceof Error ? err : new Error('Failed to request export');
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [checkStatus, onSuccess, onError]);

  /**
   * Cancelar exportación (detener polling)
   */
  const cancelExport = useCallback(() => {
    stopPolling();
    setIsExporting(false);
    setStatus(null);
    setProgress(0);
    exportIdRef.current = null;
  }, [stopPolling]);

  /**
   * Descargar archivo cuando esté listo
   */
  const download = useCallback(async () => {
    if (!status || !status.file_name || !exportIdRef.current) {
      throw new Error('No export available for download');
    }

    try {
      await exportsService.downloadFile(exportIdRef.current, status.file_name);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to download file');
      setError(error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }, [status, onError]);

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isExporting,
    status,
    progress,
    error,
    requestExport,
    cancelExport,
    download,
  };
};
