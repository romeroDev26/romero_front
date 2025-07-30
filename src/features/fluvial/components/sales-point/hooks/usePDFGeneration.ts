// src/features/fluvial/components/sales-point/hooks/usePDFGeneration.ts

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { pdfGenerationService } from '../services/pdfGenerationService';
import { pdfUploadService } from '../services/pdfUploadService';

export interface InvoiceData {
  // Para ventas normales (DNI/RUC simple)
  id: number;
  series: string;
  number: number;
  document_type_code: string;
  issue_date: string;
  issue_time: string;
  total_payable: string;
  total_in_words: string;
  client: {
    doc_type: string;
    doc_number: string;
    name: string;
    address_line: string;
    phone: string;
    email: string;
  };
  company: {
    ruc: string;
    business_name: string;
    trade_name: string;
    address: string;
    phone: string;
    email: string;
    logo_url?: string;
  };
  items: Array<{
    item_description: string;
    quantity: string;
    unit_price: string;
    total_line: string;
    discount: string;
    recipient_name?: string;
    recipient_doc_type?: string;
    recipient_doc_number?: string;
  }>;
  total_taxable: string;
  total_exonerated: string;
  total_igv: string;
  total_global_discount: string;
}

export interface CompanyInvoiceData {
  // Para ventas empresariales con representantes
  invoice: InvoiceData;
  representatives: Array<{
    passenger_name: string;
    passenger_doc_type: string;
    passenger_doc_number: string;
    passenger_phone: string;
    seat_number: string;
  }>;
  summary: {
    invoice_id: number;
    current_count: number;
    total_capacity: number;
  };
}

export interface PDFGenerationResult {
  success: boolean;
  pdfA4Url?: string;
  pdfTicketUrl?: string;
  error?: string;
}

export const usePDFGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAndUploadPDFs = useCallback(async (
    invoiceData: InvoiceData | CompanyInvoiceData,
    authToken: string
  ): Promise<PDFGenerationResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Determinar el tipo de factura
      const isCompanyInvoice = 'representatives' in invoiceData;
      const actualInvoice = isCompanyInvoice ? invoiceData.invoice : invoiceData;
      const representatives = isCompanyInvoice ? invoiceData.representatives : undefined;

      // 2. Generar PDFs en paralelo
      toast.info('Generando comprobantes PDF...', { autoClose: 2000 });
      
      const [pdfA4Blob, pdfTicketBlob] = await Promise.all([
        pdfGenerationService.generatePDF_A4(actualInvoice, representatives),
        pdfGenerationService.generatePDF_Ticket(actualInvoice, representatives)
      ]);

      setIsGenerating(false);
      setIsUploading(true);

      // 3. Subir PDFs al backend
      toast.info('Subiendo comprobantes al servidor...', { autoClose: 2000 });
      
      const uploadResult = await pdfUploadService.uploadInvoicePDFs(
        actualInvoice.id,
        pdfA4Blob,
        pdfTicketBlob,
        authToken
      );

      setIsUploading(false);

      if (uploadResult.success) {
        toast.success('¡Comprobantes generados exitosamente!', { autoClose: 3000 });
        return {
          success: true,
          pdfA4Url: uploadResult.pdf_a4_url,
          pdfTicketUrl: uploadResult.pdf_ticket_url
        };
      } else {
        throw new Error(uploadResult.error || 'Error al subir los PDFs');
      }

    } catch (error: any) {
      setIsGenerating(false);
      setIsUploading(false);
      const errorMessage = error.message || 'Error al generar los comprobantes';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  const generatePreviewPDFs = useCallback(async (
    invoiceData: InvoiceData | CompanyInvoiceData
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      const isCompanyInvoice = 'representatives' in invoiceData;
      const actualInvoice = isCompanyInvoice ? invoiceData.invoice : invoiceData;
      const representatives = isCompanyInvoice ? invoiceData.representatives : undefined;

      const [pdfA4Blob, pdfTicketBlob] = await Promise.all([
        pdfGenerationService.generatePDF_A4(actualInvoice, representatives),
        pdfGenerationService.generatePDF_Ticket(actualInvoice, representatives)
      ]);

      setIsGenerating(false);

      return {
        pdfA4Blob,
        pdfTicketBlob
      };

    } catch (error: any) {
      setIsGenerating(false);
      const errorMessage = error.message || 'Error al generar vista previa';
      setError(errorMessage);
      throw error;
    }
  }, []);

  return {
    generateAndUploadPDFs,
    generatePreviewPDFs,
    isGenerating,
    isUploading,
    error,
    isProcessing: isGenerating || isUploading
  };
};
