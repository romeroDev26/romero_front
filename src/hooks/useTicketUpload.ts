// src/hooks/useTicketUpload.ts

import { useState } from 'react';
import { filesService, FileType } from '../services/files.service';
import jsPDF from 'jspdf';

interface TicketUploadHook {
  isUploading: boolean;
  error: string | null;
  uploadTicketPdf: (
    pdfDoc: jsPDF,
    invoiceId: number,
    fileType?: FileType
  ) => Promise<string | null>;
  uploadTicketBlob: (
    pdfBlob: Blob,
    invoiceId: number,
    fileType?: FileType
  ) => Promise<string | null>;
}

export const useTicketUpload = (): TicketUploadHook => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sube un PDF generado por jsPDF al sistema de almacenamiento
   */
  const uploadTicketPdf = async (
    pdfDoc: jsPDF,
    invoiceId: number,
    fileType: FileType = 'pdf_ticket'
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setError(null);

      // Convertir el PDF a Blob
      const pdfBlob = pdfDoc.output('blob');
      
      // Subir al backend
      const result = await filesService.uploadInvoiceFile(
        pdfBlob,
        invoiceId,
        fileType
      );
      return result.file_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al subir el ticket';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Sube un Blob PDF al sistema de almacenamiento
   */
  const uploadTicketBlob = async (
    pdfBlob: Blob,
    invoiceId: number,
    fileType: FileType = 'pdf_ticket'
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setError(null);

      // Subir al backend
      const result = await filesService.uploadInvoiceFile(
        pdfBlob,
        invoiceId,
        fileType
      );
      return result.file_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al subir el ticket';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    error,
    uploadTicketPdf,
    uploadTicketBlob
  };
};
