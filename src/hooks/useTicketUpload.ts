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
  uploadBothTickets: (
    ticket80mm: Blob,
    ticketA4: Blob,
    invoiceId: number
  ) => Promise<{ ticket80mmUrl: string | null; ticketA4Url: string | null }>;
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

  /**
   * Sube ambos tickets (80mm y A4) en paralelo
   */
  const uploadBothTickets = async (
    ticket80mm: Blob,
    ticketA4: Blob,
    invoiceId: number
  ): Promise<{ ticket80mmUrl: string | null; ticketA4Url: string | null }> => {
    try {
      setIsUploading(true);
      setError(null);

      // Subir ambos tickets en paralelo
      const [result80mm, resultA4] = await Promise.all([
        filesService.uploadInvoiceFile(ticket80mm, invoiceId, 'pdf_ticket'),
        filesService.uploadInvoiceFile(ticketA4, invoiceId, 'pdf_a4')
      ]);

      return {
        ticket80mmUrl: result80mm.file_url,
        ticketA4Url: resultA4.file_url
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al subir los tickets';
      setError(errorMessage);
      return {
        ticket80mmUrl: null,
        ticketA4Url: null
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    error,
    uploadTicketPdf,
    uploadTicketBlob,
    uploadBothTickets
  };
};
