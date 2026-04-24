// src/services/pdfTasks.service.ts
// Servicio para consultar el estado de tareas de generación de PDF
// Usado cuando el backend retorna status: "uploading" (Bunny CDN aún en progreso)

import api from '../config/api';

/**
 * Respuesta del endpoint POST generate-pdf (nueva versión con espera inteligente)
 * - status: "completed" → url disponible de inmediato
 * - status: "uploading" → url null, usar task_id para polling
 */
export interface GeneratePdfResponse {
  invoice_id: number;
  size: string;
  stored_in_field: string;
  url: string | null;
  task_id: string;
  status: 'completed' | 'uploading' | 'failed';
  message: string;
}

/**
 * Respuesta del endpoint GET pdf-tasks/{task_id}/status
 */
export interface PdfTaskStatusResponse {
  task_id: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  url: string | null;
  error?: string;
}

class PdfTasksService {
  private readonly basePath = '/invoices/pdf-tasks';

  /**
   * Consulta el estado de una tarea de subida de PDF a Bunny CDN
   */
  async getTaskStatus(taskId: string): Promise<PdfTaskStatusResponse> {
    const response = await api.get<PdfTaskStatusResponse>(`${this.basePath}/${taskId}/status`);
    return response.data;
  }

  /**
   * Polling del estado de la tarea hasta obtener la URL o agotar el tiempo.
   * @param taskId - ID de la tarea retornado por generate-pdf
   * @param maxWaitMs - Tiempo máximo de espera en ms (default: 30000 = 30s)
   * @param intervalMs - Intervalo entre consultas en ms (default: 1500)
   * @returns URL del PDF o null si agotó el tiempo
   */
  async pollForUrl(
    taskId: string,
    maxWaitMs = 30_000,
    intervalMs = 1_500
  ): Promise<string | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const status = await this.getTaskStatus(taskId);

        if (status.status === 'completed' && status.url) {
          return status.url;
        }

        if (status.status === 'failed') {
          console.warn('[PdfTasksService] Tarea fallida:', status.error);
          return null;
        }

        // pending | uploading → esperar y reintentar
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (err) {
        console.warn('[PdfTasksService] Error consultando estado, reintentando...', err);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    console.warn(`[PdfTasksService] Tiempo agotado esperando PDF para task ${taskId}`);
    return null;
  }
}

export const pdfTasksService = new PdfTasksService();
