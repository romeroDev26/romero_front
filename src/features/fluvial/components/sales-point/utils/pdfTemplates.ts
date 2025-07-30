// src/features/fluvial/components/sales-point/utils/pdfTemplates.ts

import jsPDF from 'jspdf';
import { 
  formatCurrency, 
  formatDocumentNumber, 
  getDocumentTypeName, 
  formatDate, 
  formatTime, 
  truncateText,
  splitTextToLines,
  calculateTotals,
  safeParseFloat
} from './pdfUtils';

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

/**
 * Plantilla para PDF A4 (formato estándar)
 */
export const pdfTemplateA4 = {
  applyTemplate: async (
    doc: jsPDF, 
    invoice: InvoiceData, 
    representatives?: RepresentativeData[]
  ): Promise<void> => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Configuración de fuentes
    doc.setFont('helvetica');

    // Header de la empresa
    currentY = pdfTemplateA4.addCompanyHeader(doc, invoice.company, currentY, pageWidth);
    
    // Información del documento
    currentY = pdfTemplateA4.addDocumentInfo(doc, invoice, currentY, pageWidth);
    
    // Información del cliente
    currentY = pdfTemplateA4.addClientInfo(doc, invoice.client, currentY, pageWidth);
    
    // Items de la factura
    currentY = pdfTemplateA4.addItemsTable(doc, invoice.items, currentY, pageWidth);
    
    // Representantes (si existen)
    if (representatives && representatives.length > 0) {
      currentY = pdfTemplateA4.addRepresentativesTable(doc, representatives, currentY, pageWidth);
    }
    
    // Totales
    currentY = pdfTemplateA4.addTotals(doc, invoice, currentY, pageWidth);
    
    // Footer
    pdfTemplateA4.addFooter(doc, pageHeight);
  },

  addCompanyHeader: (doc: jsPDF, company: InvoiceData['company'], startY: number, pageWidth: number): number => {
    let currentY = startY;
    
    // Nombre de la empresa
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(company.business_name, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    
    // RUC
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${company.ruc}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
    
    // Dirección
    doc.setFontSize(10);
    const addressLines = splitTextToLines(company.address, pageWidth - 40, 10);
    addressLines.forEach(line => {
      doc.text(line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4;
    });
    
    // Teléfono y email
    doc.text(`Tel: ${company.phone} | Email: ${company.email}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, currentY, pageWidth - 20, currentY);
    currentY += 10;
    
    return currentY;
  },

  addDocumentInfo: (doc: jsPDF, invoice: InvoiceData, startY: number, pageWidth: number): number => {
    let currentY = startY;
    
    // Tipo de documento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const documentTypeName = getDocumentTypeName(invoice.document_type_code);
    doc.text(documentTypeName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    
    // Número de documento
    doc.setFontSize(12);
    const documentNumber = formatDocumentNumber(invoice.series, invoice.number);
    doc.text(documentNumber, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Fecha y hora
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const formattedDate = formatDate(invoice.issue_date);
    const formattedTime = formatTime(invoice.issue_time || '');
    doc.text(`Fecha: ${formattedDate}`, 20, currentY);
    doc.text(`Hora: ${formattedTime}`, pageWidth - 60, currentY);
    currentY += 15;
    
    return currentY;
  },

  addClientInfo: (doc: jsPDF, client: InvoiceData['client'], startY: number, _pageWidth: number): number => {
    let currentY = startY;
    
    // Título
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 20, currentY);
    currentY += 8;
    
    // Información del cliente
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const clientDocType = getDocumentTypeName(client.doc_type);
    doc.text(`${clientDocType}: ${client.doc_number}`, 20, currentY);
    currentY += 5;
    
    doc.text(`Nombre: ${client.name}`, 20, currentY);
    currentY += 5;
    
    if (client.address_line) {
      doc.text(`Dirección: ${client.address_line}`, 20, currentY);
      currentY += 5;
    }
    
    if (client.phone) {
      doc.text(`Teléfono: ${client.phone}`, 20, currentY);
      currentY += 5;
    }
    
    if (client.email) {
      doc.text(`Email: ${client.email}`, 20, currentY);
      currentY += 5;
    }
    
    currentY += 10;
    return currentY;
  },

  addItemsTable: (doc: jsPDF, items: InvoiceData['items'], startY: number, pageWidth: number): number => {
    let currentY = startY;
    
    // Título
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE SERVICIOS', 20, currentY);
    currentY += 8;
    
    // Headers de la tabla
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Comentario: _colWidths se mantiene para referencia futura
    const colX = [20, 100, 120, 150, 170];
    
    doc.text('Descripción', colX[0], currentY);
    doc.text('Cant.', colX[1], currentY);
    doc.text('P. Unitario', colX[2], currentY);
    doc.text('Desc.', colX[3], currentY);
    doc.text('Total', colX[4], currentY);
    currentY += 5;
    
    // Línea bajo headers
    doc.setLineWidth(0.3);
    doc.line(20, currentY, pageWidth - 20, currentY);
    currentY += 5;
    
    // Items
    doc.setFont('helvetica', 'normal');
    items.forEach((item) => {
      const description = truncateText(item.item_description, 45);
      doc.text(description, colX[0], currentY);
      doc.text(item.quantity, colX[1], currentY);
      doc.text(formatCurrency(safeParseFloat(item.unit_price)), colX[2], currentY);
      doc.text(formatCurrency(safeParseFloat(item.discount)), colX[3], currentY);
      doc.text(formatCurrency(safeParseFloat(item.total_line)), colX[4], currentY);
      
      currentY += 6;
      
      // Información del destinatario si existe
      if (item.recipient_name) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Destinatario: ${item.recipient_name} (${item.recipient_doc_type}: ${item.recipient_doc_number})`, colX[0], currentY);
        currentY += 4;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
      }
    });
    
    currentY += 10;
    return currentY;
  },

  addRepresentativesTable: (doc: jsPDF, representatives: RepresentativeData[], startY: number, pageWidth: number): number => {
    let currentY = startY;
    
    // Título
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPRESENTANTES', 20, currentY);
    currentY += 8;
    
    // Headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre', 20, currentY);
    doc.text('Documento', 80, currentY);
    doc.text('Teléfono', 130, currentY);
    doc.text('Asiento', 170, currentY);
    currentY += 5;
    
    // Línea bajo headers
    doc.setLineWidth(0.3);
    doc.line(20, currentY, pageWidth - 20, currentY);
    currentY += 5;
    
    // Representantes
    doc.setFont('helvetica', 'normal');
    representatives.forEach(rep => {
      doc.text(truncateText(rep.passenger_name, 25), 20, currentY);
      doc.text(`${rep.passenger_doc_type}: ${rep.passenger_doc_number}`, 80, currentY);
      doc.text(rep.passenger_phone, 130, currentY);
      doc.text(rep.seat_number, 170, currentY);
      currentY += 6;
    });
    
    currentY += 10;
    return currentY;
  },

  addTotals: (doc: jsPDF, invoice: InvoiceData, startY: number, pageWidth: number): number => {
    let currentY = startY;
    const totals = calculateTotals(invoice);
    
    // Área de totales (lado derecho)
    const rightX = pageWidth - 80;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (totals.subtotal > 0) {
      doc.text('Subtotal:', rightX, currentY);
      doc.text(totals.subtotalFormatted, rightX + 40, currentY, { align: 'right' });
      currentY += 5;
    }
    
    if (totals.descuento > 0) {
      doc.text('Descuento:', rightX, currentY);
      doc.text(`-${totals.descuentoFormatted}`, rightX + 40, currentY, { align: 'right' });
      currentY += 5;
    }
    
    if (totals.igv > 0) {
      doc.text('IGV (18%):', rightX, currentY);
      doc.text(totals.igvFormatted, rightX + 40, currentY, { align: 'right' });
      currentY += 5;
    }
    
    // Línea antes del total
    doc.setLineWidth(0.5);
    doc.line(rightX, currentY, rightX + 40, currentY);
    currentY += 5;
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', rightX, currentY);
    doc.text(totals.totalFormatted, rightX + 40, currentY, { align: 'right' });
    currentY += 10;
    
    // Total en palabras
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Son: ${invoice.total_in_words}`, 20, currentY);
    currentY += 15;
    
    return currentY;
  },

  addFooter: (doc: jsPDF, pageHeight: number): void => {
    const footerY = pageHeight - 20;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Gracias por su preferencia', doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
  }
};

/**
 * Plantilla para PDF Ticket (formato térmico)
 */
export const pdfTemplateTicket = {
  applyTemplate: async (
    doc: jsPDF, 
    invoice: InvoiceData, 
    representatives?: RepresentativeData[]
  ): Promise<void> => {
    const pageWidth = 80; // Ancho del ticket térmico
    let currentY = 10;

    // Configuración de fuentes para ticket
    doc.setFont('helvetica');

    // Header compacto
    currentY = pdfTemplateTicket.addCompactHeader(doc, invoice.company, currentY, pageWidth);
    
    // Info del documento
    currentY = pdfTemplateTicket.addCompactDocumentInfo(doc, invoice, currentY, pageWidth);
    
    // Cliente
    currentY = pdfTemplateTicket.addCompactClientInfo(doc, invoice.client, currentY, pageWidth);
    
    // Items
    currentY = pdfTemplateTicket.addCompactItems(doc, invoice.items, currentY, pageWidth);
    
    // Representantes
    if (representatives && representatives.length > 0) {
      currentY = pdfTemplateTicket.addCompactRepresentatives(doc, representatives, currentY, pageWidth);
    }
    
    // Totales
    currentY = pdfTemplateTicket.addCompactTotals(doc, invoice, currentY, pageWidth);
    
    // Nota: La altura del documento se establece al crear el jsPDF
    // No es posible cambiarla dinámicamente después
  },

  addCompactHeader: (doc: jsPDF, company: InvoiceData['company'], startY: number, pageWidth: number): number => {
    let currentY = startY;
    
    // Nombre empresa (más pequeño)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const nameLines = splitTextToLines(company.business_name, pageWidth - 10, 10);
    nameLines.forEach(line => {
      doc.text(line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4;
    });
    
    // RUC
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${company.ruc}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Teléfono
    doc.text(`Tel: ${company.phone}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
    
    // Línea separadora
    doc.text('--------------------------------', pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
    
    return currentY;
  },

  addCompactDocumentInfo: (doc: jsPDF, invoice: InvoiceData, startY: number, pageWidth: number): number => {
    let currentY = startY;
    
    // Tipo y número de documento
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const documentTypeName = getDocumentTypeName(invoice.document_type_code);
    doc.text(documentTypeName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    
    const documentNumber = formatDocumentNumber(invoice.series, invoice.number);
    doc.text(documentNumber, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
    
    // Fecha y hora
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const formattedDate = formatDate(invoice.issue_date);
    const formattedTime = formatTime(invoice.issue_time || '');
    doc.text(`${formattedDate} ${formattedTime}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
    
    return currentY;
  },

  addCompactClientInfo: (doc: jsPDF, client: InvoiceData['client'], startY: number, pageWidth: number): number => {
    let currentY = startY;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    const clientDocType = getDocumentTypeName(client.doc_type);
    doc.text(`${clientDocType}: ${client.doc_number}`, 2, currentY);
    currentY += 3;
    
    const nameLines = splitTextToLines(client.name, pageWidth - 4, 7);
    nameLines.forEach(line => {
      doc.text(line, 2, currentY);
      currentY += 3;
    });
    
    currentY += 3;
    return currentY;
  },

  addCompactItems: (doc: jsPDF, items: InvoiceData['items'], startY: number, pageWidth: number): number => {
    let currentY = startY;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    items.forEach(item => {
      // Descripción
      const descLines = splitTextToLines(item.item_description, pageWidth - 4, 7);
      descLines.forEach(line => {
        doc.text(line, 2, currentY);
        currentY += 3;
      });
      
      // Cantidad y precio
      doc.text(`${item.quantity} x ${formatCurrency(safeParseFloat(item.unit_price))}`, 2, currentY);
      doc.text(formatCurrency(safeParseFloat(item.total_line)), pageWidth - 2, currentY, { align: 'right' });
      currentY += 4;
      
      // Destinatario si existe
      if (item.recipient_name) {
        doc.setFontSize(6);
        doc.text(`Para: ${item.recipient_name}`, 2, currentY);
        currentY += 3;
        doc.setFontSize(7);
      }
    });
    
    currentY += 3;
    return currentY;
  },

  addCompactRepresentatives: (doc: jsPDF, representatives: RepresentativeData[], startY: number, _pageWidth: number): number => {
    let currentY = startY;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('REPRESENTANTES:', 2, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    
    representatives.forEach(rep => {
      doc.text(`${rep.passenger_name}`, 2, currentY);
      currentY += 3;
      doc.text(`${rep.passenger_doc_type}: ${rep.passenger_doc_number}`, 2, currentY);
      currentY += 3;
      doc.text(`Asiento: ${rep.seat_number}`, 2, currentY);
      currentY += 4;
    });
    
    return currentY;
  },

  addCompactTotals: (doc: jsPDF, invoice: InvoiceData, startY: number, pageWidth: number): number => {
    let currentY = startY;
    const totals = calculateTotals(invoice);
    
    // Línea separadora
    doc.setFontSize(7);
    doc.text('--------------------------------', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Totales
    doc.setFont('helvetica', 'normal');
    
    if (totals.subtotal > 0) {
      doc.text('Subtotal:', 2, currentY);
      doc.text(totals.subtotalFormatted, pageWidth - 2, currentY, { align: 'right' });
      currentY += 3;
    }
    
    if (totals.descuento > 0) {
      doc.text('Descuento:', 2, currentY);
      doc.text(`-${totals.descuentoFormatted}`, pageWidth - 2, currentY, { align: 'right' });
      currentY += 3;
    }
    
    if (totals.igv > 0) {
      doc.text('IGV:', 2, currentY);
      doc.text(totals.igvFormatted, pageWidth - 2, currentY, { align: 'right' });
      currentY += 3;
    }
    
    // Total final
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL:', 2, currentY);
    doc.text(totals.totalFormatted, pageWidth - 2, currentY, { align: 'right' });
    currentY += 6;
    
    // Línea final
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('--------------------------------', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    
    doc.text('Gracias por su preferencia', pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
    
    return currentY;
  }
};
