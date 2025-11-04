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
   * Solicitar una nueva exportación (unificada)
   */
  async requestExport(data: ExportRequest): Promise<ExportRequestResponse> {
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
   * Solicitar exportación de Caja General
   */
  async requestCashGeneral(data: CashGeneralRequest): Promise<ExportRequestResponse> {
    const response = await api.post<ExportRequestResponse>(
      `${BASE_PATH}/cash-general/request`,
      data
    );
    return response.data;
  }

  /**
   * Solicitar exportación de Caja Detallada Individual
   */
  async requestCashDetailed(data: CashDetailedRequest): Promise<ExportRequestResponse> {
    const response = await api.post<ExportRequestResponse>(
      `${BASE_PATH}/cash-detailed/request`,
      data
    );
    return response.data;
  }

  /**
   * Helper: Descargar archivo y guardarlo en el navegador
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
}

export const exportsService = new ExportsService();
