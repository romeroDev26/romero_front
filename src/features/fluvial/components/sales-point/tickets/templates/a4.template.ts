// src/features/fluvial/components/sales-point/tickets/templates/a4.template.ts

import jsPDF from 'jspdf';
import { TicketData } from '../types/ticket.types';
import { getCurrencySymbol } from '../utils/ticketHelpers';

/**
 * Template para generar PDFs en formato A4 (210mm x 297mm)
 * Multi-modal: funciona para todos los tipos de ventas
 * (pasajes normales, con representante, sin asiento, encomiendas)
 */
export class A4Template {
  
  private static readonly PAGE_WIDTH = 210; // mm
  private static readonly MARGIN = 15; // mm
  private static readonly CONTENT_WIDTH = A4Template.PAGE_WIDTH - (A4Template.MARGIN * 2);
  
  /**
   * Genera el PDF A4 usando los datos transformados
   */
  static async generatePDF(ticketData: TicketData): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.setFont('helvetica');
    let currentY = this.MARGIN;
    
    // Renderizar el documento
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 5;
    
    currentY = this.addClientInfo(doc, ticketData, currentY);
    currentY += 5;
    
    // Para encomiendas, mostrar info del destinatario
    if (this.isCargoSale(ticketData)) {
      currentY = this.addRecipientInfo(doc, ticketData, currentY);
      currentY += 5;
    }
    
    currentY = this.addItemsTable(doc, ticketData, currentY);
    currentY += 5;
    
    currentY = this.addTotalsSection(doc, ticketData, currentY);
    currentY += 10;
    
    currentY = await this.addFooter(doc, ticketData, currentY);
    
    return doc;
  }

  /**
   * Detecta si es una venta de encomienda
   */
  private static isCargoSale(ticketData: TicketData): boolean {
    return ticketData.trip_details.details.some(d => 
      d.label.toLowerCase().includes('destinatario')
    );
  }

  /**
   * BLOQUE 1: Encabezado con logo y datos de empresa
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
    
    // Logo a la izquierda
    if (header.company_logo_url) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error('Error cargando logo'));
          logoImg.src = header.company_logo_url!;
        });

        const maxLogoWidth = 50;
        const maxLogoHeight = 30;
        const logoAspectRatio = logoImg.height / logoImg.width;
        let logoWidth = Math.min(maxLogoWidth, logoImg.width * 0.3);
        let logoHeight = logoWidth * logoAspectRatio;
        
        if (logoHeight > maxLogoHeight) {
          logoHeight = maxLogoHeight;
          logoWidth = logoHeight / logoAspectRatio;
        }
        
        doc.addImage(logoImg, 'PNG', this.MARGIN, currentY, logoWidth, logoHeight);
      } catch (error) {
        console.error('Error cargando logo:', error);
      }
    }
    
    // Información de la empresa a la derecha
    const rightColumnX = this.PAGE_WIDTH / 2 + 10;
    const rightStartY = currentY;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const companyLines = this.splitText(doc, header.company_name.toUpperCase(), 80, 10);
    companyLines.forEach((line, i) => {
      doc.text(line, rightColumnX, rightStartY + (i * 5));
    });
    
    let rightY = rightStartY + (companyLines.length * 5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${header.company_ruc}`, rightColumnX, rightY);
    rightY += 4;
    
    const addressLines = this.splitText(doc, header.company_address, 80, 9);
    addressLines.forEach(line => {
      doc.text(line, rightColumnX, rightY);
      rightY += 4;
    });
    
    if (header.company_phones.length > 0) {
      doc.text(header.company_phones.join(' / '), rightColumnX, rightY);
      rightY += 4;
    }
    
    currentY = Math.max(currentY + 35, rightY);
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
    currentY += 5;
    
    return currentY;
  }

  /**
   * BLOQUE 2: Información del cliente y documento
   */
  private static addClientInfo(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    // Recuadro azul para el cliente
    doc.setFillColor(230, 240, 255);
    doc.rect(this.MARGIN, currentY, this.CONTENT_WIDTH * 0.6, 25, 'F');
    
    // Información del cliente dentro del recuadro
    const clientX = this.MARGIN + 3;
    let clientY = currentY + 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', clientX, clientY);
    clientY += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const clientName = ticketData.passenger_info.full_name.toUpperCase();
    const nameLines = this.splitText(doc, clientName, this.CONTENT_WIDTH * 0.55, 9);
    nameLines.forEach(line => {
      doc.text(line, clientX, clientY);
      clientY += 4;
    });
    
    doc.setFontSize(8);
    doc.text(`${ticketData.passenger_info.doc_label}: ${ticketData.passenger_info.doc_number}`, 
      clientX, clientY);
    
    // Información del documento a la derecha
    const docX = this.MARGIN + (this.CONTENT_WIDTH * 0.62);
    let docY = currentY + 3;
    
    // Recuadro para el documento
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.rect(docX, docY, this.CONTENT_WIDTH * 0.35, 22);
    
    docY += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const docTitle = ticketData.header.document_title.toUpperCase();
    doc.text(docTitle, docX + (this.CONTENT_WIDTH * 0.175), docY, { align: 'center' });
    docY += 6;
    
    doc.setFontSize(11);
    doc.text(ticketData.header.document_id, docX + (this.CONTENT_WIDTH * 0.175), docY, { align: 'center' });
    docY += 6;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emisión: ${ticketData.header.emission_datetime}`, 
      docX + (this.CONTENT_WIDTH * 0.175), docY, { align: 'center' });
    
    currentY += 27;
    
    // Información adicional: vendedor y tipo de venta
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const additionalInfo = [];
    additionalInfo.push(`Vendedor: ${ticketData.header.seller_name}`);
    
    if (ticketData.payment_info.payment_method) {
      const paymentType = ticketData.payment_info.payment_method_label || 'Tipo venta';
      additionalInfo.push(`${paymentType}: ${ticketData.payment_info.payment_method}`);
    }
    
    additionalInfo.forEach(info => {
      doc.text(info, this.MARGIN, currentY);
      currentY += 4;
    });
    
    currentY += 2;
    return currentY;
  }

  /**
   * BLOQUE 3: Información del destinatario (solo para encomiendas)
   */
  private static addRecipientInfo(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    // Buscar info del destinatario en trip_details
    const destinatario = ticketData.trip_details.details.find(d => d.label === 'Destinatario');
    const docDestinatario = ticketData.trip_details.details.find(d => d.label === 'Doc. Destinatario');
    const telDestinatario = ticketData.trip_details.details.find(d => d.label === 'Tel. Destinatario');
    
    if (!destinatario) return currentY;
    
    // Recuadro para destinatario
    doc.setFillColor(255, 245, 230);
    doc.rect(this.MARGIN, currentY, this.CONTENT_WIDTH, 18, 'F');
    
    const infoX = this.MARGIN + 3;
    let infoY = currentY + 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATARIO:', infoX, infoY);
    infoY += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(destinatario.value.toUpperCase(), infoX, infoY);
    infoY += 5;
    
    doc.setFontSize(8);
    const destDetails = [];
    if (docDestinatario) destDetails.push(docDestinatario.value);
    if (telDestinatario) destDetails.push(`Tel: ${telDestinatario.value}`);
    
    doc.text(destDetails.join('  |  '), infoX, infoY);
    
    currentY += 20;
    return currentY;
  }

  /**
   * BLOQUE 4: Tabla de items
   */
  private static addItemsTable(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    // Encabezado de la tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, currentY, this.CONTENT_WIDTH, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const descX = this.MARGIN + 2;
    const cantX = this.PAGE_WIDTH - this.MARGIN - 92;
    const unidadX = this.PAGE_WIDTH - this.MARGIN - 72;
    const precioX = this.PAGE_WIDTH - this.MARGIN - 42;
    const totalX = this.PAGE_WIDTH - this.MARGIN - 2;
    
    doc.text('DESCRIPCIÓN', descX, currentY + 5);
    doc.text('CANTIDAD', cantX, currentY + 5, { align: 'center' });
    doc.text('UNIDAD', unidadX, currentY + 5, { align: 'center' });
    doc.text('PRECIO UNIT.', precioX, currentY + 5, { align: 'right' });
    doc.text('TOTAL', totalX, currentY + 5, { align: 'right' });
    
    currentY += 8;
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
    currentY += 3;
    
    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    ticketData.financial_breakdown.items.forEach((item, index) => {
      const itemStartY = currentY;
      
      // Descripción (puede ser multilínea)
      let description = item.description;
      
      // Para pasajes, agregar info del viaje en la descripción
      if (!this.isCargoSale(ticketData)) {
        const tripInfo = this.getTripInfo(ticketData);
        if (tripInfo) {
          description += `\n${tripInfo}`;
        }
      }
      
      const descLines = this.splitText(doc, description, 105, 9);
      descLines.forEach((line, i) => {
        doc.text(line, descX, currentY + (i * 4.5));
      });
      
      const lineHeight = Math.max(descLines.length * 4.5, 8);
      
      // Cantidad
      const cantX = this.PAGE_WIDTH - this.MARGIN - 92;
      doc.text(item.quantity.toString(), cantX, itemStartY + 4, { align: 'center' });
      
      // Unidad
      const unidadX = this.PAGE_WIDTH - this.MARGIN - 72;
      doc.text('NIU', unidadX, itemStartY + 4, { align: 'center' });
      
      // Precio unitario
      const precioX = this.PAGE_WIDTH - this.MARGIN - 42;
      doc.text(
        `${getCurrencySymbol(ticketData.currency_code || 'PEN')} ${item.unit_price.toFixed(2)}`,
        precioX,
        itemStartY + 4,
        { align: 'right' }
      );
      
      // Total
      const totalX = this.PAGE_WIDTH - this.MARGIN - 2;
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${getCurrencySymbol(ticketData.currency_code || 'PEN')} ${item.total_line.toFixed(2)}`,
        totalX,
        itemStartY + 4,
        { align: 'right' }
      );
      doc.setFont('helvetica', 'normal');
      
      currentY += lineHeight;
      
      // Línea separadora entre items
      if (index < ticketData.financial_breakdown.items.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
        currentY += 2;
      }
    });
    
    // Línea final de la tabla
    currentY += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
    currentY += 3;
    
    return currentY;
  }

  /**
   * Obtiene información del viaje para mostrar en la descripción
   */
  private static getTripInfo(ticketData: TicketData): string | null {
    const details = ticketData.trip_details.details;
    
    const origen = details.find(d => d.label === 'Origen')?.value;
    const destino = details.find(d => d.label === 'Destino')?.value;
    const fecha = details.find(d => d.label.includes('Fecha'))?.value;
    const embarque = details.find(d => d.label.includes('Embarque'))?.value;
    const asiento = details.find(d => d.label === 'Asiento')?.value;
    
    const parts = [];
    if (origen && destino) parts.push(`Ruta: ${origen} - ${destino}`);
    if (fecha) parts.push(`Fecha: ${fecha}`);
    if (embarque) parts.push(`Embarque: ${embarque}`);
    if (asiento && !asiento.toLowerCase().includes('libre')) parts.push(`Asiento: ${asiento}`);
    
    return parts.length > 0 ? parts.join(' | ') : null;
  }

  /**
   * BLOQUE 5: Sección de totales
   */
  private static addTotalsSection(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    const leftX = this.MARGIN;
    const rightX = this.PAGE_WIDTH - this.MARGIN - 50;
    const valueX = this.PAGE_WIDTH - this.MARGIN - 2;
    
    // Monto en palabras (izquierda)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SON:', leftX, currentY);
    
    doc.setFont('helvetica', 'normal');
    const wordsLines = this.splitText(doc, ticketData.payment_info.amount_in_words, 90, 8);
    let wordsY = currentY;
    wordsLines.forEach(line => {
      doc.text(line, leftX + 10, wordsY);
      wordsY += 4;
    });
    
    // Totales SUNAT (derecha)
    doc.setFontSize(9);
    
    const sunat = ticketData.sunat_totals;
    const currencySymbol = getCurrencySymbol(ticketData.currency_code || 'PEN');
    
    const totales = [
      { label: 'SUBTOTAL', value: sunat.total_taxable, show: parseFloat(sunat.total_taxable) > 0 },
      { label: 'EXONERADA', value: sunat.total_exonerated, show: parseFloat(sunat.total_exonerated) > 0 },
      { label: 'IGV 18%', value: sunat.total_igv, show: parseFloat(sunat.total_igv) > 0 },
    ];
    
    totales.forEach(t => {
      if (t.show) {
        doc.setFont('helvetica', 'normal');
        doc.text(t.label, rightX, currentY);
        doc.text(`${currencySymbol} ${parseFloat(t.value).toFixed(2)}`, valueX, currentY, { align: 'right' });
        currentY += 5;
      }
    });
    
    // Total final destacado
    currentY += 2;
    doc.setFillColor(34, 139, 34);
    doc.rect(rightX - 2, currentY - 4, 52, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL', rightX, currentY);
    
    const totalPagar = ticketData.financial_breakdown.summary.find(s =>
      s.label.toUpperCase().includes('TOTAL')
    )?.value || ticketData.sunat_totals.total_taxable;
    
    const totalClean = totalPagar.toString().replace(/^S\/\s*/, '').trim();
    doc.text(`${currencySymbol} ${parseFloat(totalClean).toFixed(2)}`, valueX, currentY, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    currentY += 10;
    
    return Math.max(currentY, wordsY + 5);
  }

  /**
   * BLOQUE 6: Footer con QR y texto legal
   */
  private static async addFooter(doc: jsPDF, ticketData: TicketData, startY: number): Promise<number> {
    let currentY = startY;
    
    // QR a la izquierda
    if (ticketData.footer.qr_code_base64) {
      try {
        const qrSize = 35;
        const qrDataUrl = ticketData.footer.qr_code_base64.startsWith('data:image')
          ? ticketData.footer.qr_code_base64
          : `data:image/png;base64,${ticketData.footer.qr_code_base64}`;
        
        doc.addImage(qrDataUrl, 'PNG', this.MARGIN, currentY, qrSize, qrSize);
        
        // Texto del QR
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Representación impresa de la factura electrónica,', this.MARGIN, currentY + qrSize + 3);
        doc.text('puede consultar este documento en', this.MARGIN, currentY + qrSize + 6);
        doc.text(ticketData.footer.consultation_url, this.MARGIN, currentY + qrSize + 9);
      } catch (error) {
        console.error('Error añadiendo QR:', error);
      }
    }
    
    // Texto legal (derecha)
    const legalX = this.MARGIN + 80;
    let legalY = currentY;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    const legalText = 'Bienes y servicios transferidos en la amazonía región selva para ser consumidos en la misma.';
    const legalLines = this.splitText(doc, legalText, 90, 7);
    
    legalLines.forEach(line => {
      doc.text(line, legalX, legalY);
      legalY += 3;
    });
    
    legalY += 2;
    doc.text(`Comprobante generado con S.E.G.R.E.`, legalX, legalY);
    /**
   * SISTEMA EMPRESARIAL DE GESRION ROMERO EXPRESS "SEGRE"
   */
    return Math.max(currentY + 50, legalY + 5);
  }

  /**
   * Utilidad para dividir texto en múltiples líneas
   */
  private static splitText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    if (!text || text.trim() === '') return [''];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }
}
