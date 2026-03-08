// src/features/quotations/services/quotationPdfUpload.service.ts

import api from '../../../config/api';

export interface QuotationPDFUploadResult {
  success: boolean;
  pdf_url?: string;
  error?: string;
}

export const quotationPdfUploadService = {
  /**
   * Genera el PDF de una cotización y lo sube al servidor
   */
  uploadQuotationPDF: async (
    quotationId: number,
    pdfBlob: Blob,
    authToken: string
  ): Promise<QuotationPDFUploadResult> => {
    try {
      // 1. Subir PDF usando el endpoint específico de cotizaciones
      const pdfURL = await quotationPdfUploadService.uploadPDF({
        file: pdfBlob,
        quotationId: quotationId,
        authToken: authToken
      });

      return {
        success: true,
        pdf_url: pdfURL
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error desconocido al subir PDF'
      };
    }
  },

  /**
   * Sube un archivo PDF al servidor usando el endpoint específico para cotizaciones
   */
  uploadPDF: async ({ 
    file, 
    quotationId, 
    authToken 
  }: {
    file: Blob;
    quotationId: number;
    authToken?: string;
  }): Promise<string> => {
    try {
      // Convertir el blob a base64
      const base64Content = await quotationPdfUploadService.blobToBase64(file);
      
      // Crear nombre de archivo descriptivo
      const fileName = `cotizacion_${quotationId}_${Date.now()}.pdf`;
      
      // Preparar el payload según la API
      const payload = {
        quotation_id: quotationId,
        content: base64Content,
        filename: fileName
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await api.post('/quotations/upload-pdf-base64', payload, {
        headers,
      });

      if (response.data && response.data.pdf_file_path) {
        return response.data.pdf_file_path;
      } else {
        throw new Error('La respuesta del servidor no contiene la URL del PDF');
      }
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Convierte un Blob a string base64
   */
  blobToBase64: (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remover el prefijo data:application/pdf;base64, si existe
          const base64 = reader.result.split(',')[1] || reader.result;
          resolve(base64);
        } else {
          reject(new Error('Error al convertir blob a base64'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Verifica si un PDF se ha subido correctamente consultando la cotización
   */
  verifyPDFUpload: async (quotationId: number, authToken?: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await api.get(`/quotations/${quotationId}`, {
        headers,
      });

      // Verificar si la cotización tiene una URL de PDF
      return !!(response.data && response.data.pdf_file_path);
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtiene la URL del PDF de una cotización si existe
   */
  getQuotationPDFUrl: async (quotationId: number, authToken?: string): Promise<string | null> => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await api.get(`/quotations/${quotationId}`, {
        headers,
      });

      return response.data?.pdf_file_path || null;
    } catch (error) {
      return null;
    }
  }
};
