// src/services/exports.service.ts
import api from '../config/api';
import type {
  ExportRequest,
  ExportRequestResponse,
  ExportStatusResponse,
  ExportHistoryResponse,
  CashGeneralRequest,
  CashDetailedRequest,
} from '../types/exports';

const BASE_PATH = '/admin/reports/exports';

class ExportsService {
  /**
   * Solicitar una nueva exportación (unificada) - Soporta modo síncrono
   */
  async requestExport(data: ExportRequest): Promise<ExportRequestResponse | Blob> {
    // Si es modo síncrono, devolver directamente el Blob
    if (data.sync) {
      const response = await api.post(`${BASE_PATH}/request`, data, {
        responseType: 'blob',
      });
      return response.data; // Blob directo
    }

    // Modo asíncrono normal
    const response = await api.post<ExportRequestResponse>(
      `${BASE_PATH}/request`,
      data
    );
    return response.data;
  }

  /**
   * Verificar el estado de una exportación
   */
  async checkStatus(exportId: string): Promise<ExportStatusResponse> {
    const response = await api.get<ExportStatusResponse>(
      `${BASE_PATH}/status/${exportId}`
    );
    return response.data;
  }

  /**
   * Descargar archivo de exportación
   * Retorna un Blob que puede ser descargado por el navegador
   */
  async downloadExport(exportId: string): Promise<Blob> {
    const response = await api.get(`${BASE_PATH}/download/${exportId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Obtener historial de exportaciones del usuario
   */
  async getHistory(page: number = 1, pageSize: number = 20): Promise<ExportHistoryResponse> {
    const response = await api.get<ExportHistoryResponse>(
      `${BASE_PATH}/history`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return response.data;
  }

  /**
   * Solicitar exportación de Caja General - Soporta modo síncrono
   */
  async requestCashGeneral(data: CashGeneralRequest): Promise<ExportRequestResponse | Blob> {
    // Si es modo síncrono, devolver directamente el Blob
    if (data.sync) {
      const response = await api.post(`${BASE_PATH}/cash-general/request`, data, {
        responseType: 'blob',
      });
      return response.data; // Blob directo
    }

    // Modo asíncrono normal
    const response = await api.post<ExportRequestResponse>(
      `${BASE_PATH}/cash-general/request`,
      data
    );
    return response.data;
  }

  /**
   * Solicitar exportación de Caja Detallada Individual - Soporta modo síncrono
   */
  async requestCashDetailed(data: CashDetailedRequest): Promise<ExportRequestResponse | Blob> {
    // Si es modo síncrono, devolver directamente el Blob
    if (data.sync) {
      const response = await api.post(`${BASE_PATH}/cash-detailed/request`, data, {
        responseType: 'blob',
      });
      return response.data; // Blob directo
    }

    // Modo asíncrono normal
    const response = await api.post<ExportRequestResponse>(
      `${BASE_PATH}/cash-detailed/request`,
      data
    );
    return response.data;
  }

  /**
   * Helper: Descargar archivo y guardarlo en el navegador (desde exportId)
   */
  async downloadFile(exportId: string, fileName: string): Promise<void> {
    const blob = await this.downloadExport(exportId);
    
    // Crear URL temporal del blob
    const url = window.URL.createObjectURL(blob);
    
    // Crear elemento <a> invisible para forzar descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper: Descargar archivo desde Blob
   */
  async downloadFileFromBlob(blob: Blob, fileName: string): Promise<void> {
    // Crear URL temporal del blob
    const url = window.URL.createObjectURL(blob);
    
    // Crear elemento <a> invisible para forzar descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const exportsService = new ExportsService();
