// src/features/fluvial/components/sales-point/services/pdfUploadService.ts

import api from '../../../../../config/api';
import { asApiError } from '../../../../../utils/errorHandler';

export interface UploadResult {
  success: boolean;
  pdf_a4_url?: string;
  pdf_ticket_url?: string;
  error?: string;
}

/** Archivo almacenado tal como lo devuelve /files/search. */
export interface StoredFile {
  type: string;
  url?: string;
  name?: string;
  size?: number;
}

/** Respuesta de /files/search agrupada por documento. */
interface FileSearchResponse {
  success: boolean;
  data: {
    files: Array<{ files: StoredFile[] }>;
  };
}

/** Respuesta del PATCH de rutas de PDF; el backend confirma las guardadas. */
interface UpdatePdfPathsResponse {
  pdf_a4_file_path?: string;
  pdf_ticket_file_path?: string;
  pdf_file_path?: string;
}

export const pdfUploadService = {
  /**
   * Sube los PDFs de una factura al backend
   */
  uploadInvoicePDFs: async (
    invoiceId: number,
    pdfA4Blob: Blob,
    pdfTicketBlob: Blob,
    authToken: string
  ): Promise<UploadResult> => {
    try {
      // 1. Subir PDF A4
      const pdfA4URL = await pdfUploadService.uploadPDF({
        file: pdfA4Blob,
        section: 'invoices',
        documentId: invoiceId,
        fileType: 'pdf_a4',
        authToken: authToken
      });

      // 2. Subir PDF Ticket
      const pdfTicketURL = await pdfUploadService.uploadPDF({
        file: pdfTicketBlob,
        section: 'invoices',
        documentId: invoiceId,
        fileType: 'pdf_ticket',
        authToken: authToken
      });

      // 3. Actualizar la factura con las URLs de los PDFs
      await pdfUploadService.updateInvoicePDFPaths(invoiceId, {
        pdf_a4_file_path: pdfA4URL,
        pdf_ticket_file_path: pdfTicketURL
      }, authToken);

      return {
        success: true,
        pdf_a4_url: pdfA4URL,
        pdf_ticket_url: pdfTicketURL
      };

    } catch (error) {
      const apiError = asApiError(error);
      console.error('Error uploading PDFs:', error);
      return {
        success: false,
        error: apiError.message || 'Error al subir los PDFs'
      };
    }
  },

  /**
   * Función auxiliar para subir un PDF individual
   */
  uploadPDF: async ({ 
    file, 
    section, 
    documentId, 
    fileType, 
    authToken 
  }: {
    file: Blob;
    section: string;
    documentId: number;
    fileType: string;
    authToken: string;
  }): Promise<string> => {
    const formData = new FormData();
    
    // Crear nombre de archivo descriptivo
    const fileName = `${section}_${documentId}_${fileType}_${Date.now()}.pdf`;
    
    formData.append('file', file, fileName);
    formData.append('section', section);
    formData.append('document_id', documentId.toString());

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status !== 200) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = response.data;
    return result.data.file_url;
  },

  /**
   * Actualiza los campos PDF en la factura
   */
  updateInvoicePDFPaths: async (
    invoiceId: number, 
    pdfPaths: {
      pdf_a4_file_path?: string;
      pdf_ticket_file_path?: string;
      pdf_file_path?: string;
    }, 
    authToken: string
  ): Promise<UpdatePdfPathsResponse> => {
    const response = await api.patch<UpdatePdfPathsResponse>(
      `/invoices/${invoiceId}/pdf-paths`,
      pdfPaths,
      {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to update PDF paths: ${response.statusText}`);
    }

    return response.data;
  },

  /**
   * Verifica que los PDFs se subieron correctamente
   */
  verifyPDFUpload: async (invoiceId: number, authToken: string): Promise<StoredFile[]> => {
    try {
      const response = await api.get<FileSearchResponse>(
        `/files/search?section=invoices&document_id=${invoiceId}`,
        {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const result = response.data;
      
      if (result.success && result.data.files.length > 0) {
        const invoice = result.data.files[0];
        const pdfFiles = invoice.files.filter((f) => f.type.includes('pdf'));
        
        console.log('PDFs encontrados:', pdfFiles);
        return pdfFiles;
      }

      return [];
    } catch (error) {
      console.error('Error verificando PDFs:', error);
      return [];
    }
  }
};
