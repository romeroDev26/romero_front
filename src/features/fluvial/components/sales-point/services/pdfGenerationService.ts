// src/features/fluvial/components/sales-point/services/pdfGenerationService.ts

import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { pdfTemplateA4 } from '../utils/pdfTemplates';
import { pdfTemplateTicket } from '../utils/pdfTemplates';
import { formatCurrency, formatDocumentNumber, getDocumentTypeName } from '../utils/pdfUtils';

export interface InvoiceData {
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

export interface RepresentativeData {
  passenger_name: string;
  passenger_doc_type: string;
  passenger_doc_number: string;
  passenger_phone: string;
  seat_number: string;
}

export const pdfGenerationService = {
  /**
   * Genera PDF en formato A4 (estándar)
   */
  generatePDF_A4: async (
    invoice: InvoiceData, 
    representatives?: RepresentativeData[]
  ): Promise<Blob> => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      // Aplicar plantilla A4
      await pdfTemplateA4.applyTemplate(doc, invoice, representatives);
      
      // Retornar como Blob
      const pdfBlob = doc.output('blob');
      return pdfBlob;
      
    } catch (error) {
      console.error('Error generando PDF A4:', error);
      throw new Error(`Error al generar PDF A4: ${error}`);
    }
  },

  /**
   * Genera PDF en formato Ticket (térmico)
   */
  generatePDF_Ticket: async (
    invoice: InvoiceData, 
    representatives?: RepresentativeData[]
  ): Promise<Blob> => {
    try {
      // Formato ticket: 80mm de ancho (aprox), altura variable
      const doc = new jsPDF('portrait', 'mm', [80, 200]); // Altura inicial, se ajustará
      
      // Aplicar plantilla Ticket
      await pdfTemplateTicket.applyTemplate(doc, invoice, representatives);
      
      // Retornar como Blob
      const pdfBlob = doc.output('blob');
      return pdfBlob;
      
    } catch (error) {
      console.error('Error generando PDF Ticket:', error);
      throw new Error(`Error al generar PDF Ticket: ${error}`);
    }
  },

  /**
   * Valida que los datos de la factura están completos
   */
  validateInvoiceData: (invoice: InvoiceData): boolean => {
    const requiredFields = [
      'id', 'series', 'number', 'document_type_code',
      'issue_date', 'total_payable', 'client', 'company', 'items'
    ];

    for (const field of requiredFields) {
      if (!invoice[field as keyof InvoiceData]) {
        console.error(`Campo requerido faltante: ${field}`);
        return false;
      }
    }

    if (!invoice.items || invoice.items.length === 0) {
      console.error('La factura debe tener al menos un item');
      return false;
    }

    return true;
  },

  /**
   * Obtiene información básica del documento
   */
  getDocumentInfo: (invoice: InvoiceData) => {
    const documentTypeName = getDocumentTypeName(invoice.document_type_code);
    const documentNumber = formatDocumentNumber(invoice.series, invoice.number);
    const formattedDate = format(parseISO(invoice.issue_date), 'dd/MM/yyyy', { locale: es });
    const formattedTime = invoice.issue_time ? 
      format(parseISO(`2000-01-01T${invoice.issue_time}`), 'HH:mm:ss') : 
      '';

    return {
      documentTypeName,
      documentNumber,
      formattedDate,
      formattedTime,
      totalAmount: formatCurrency(parseFloat(invoice.total_payable)),
      clientDocType: getDocumentTypeName(invoice.client.doc_type),
    };
  }
};
