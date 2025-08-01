// src/features/fluvial/components/sales-point/tickets/templates/normalTicket.template.ts

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { TicketData } from '../types/ticket.types';

/**
 * Template para generar PDFs de tickets de venta normal
 * Actualizado para la nueva estructura completa con todos los bloques
 * Formato térmico de 80mm de ancho
 */
export class NormalTicketTemplate {
  
  private static readonly TICKET_WIDTH = 80; // mm
  private static readonly MARGIN = 2; // mm
  private static readonly CONTENT_WIDTH = NormalTicketTemplate.TICKET_WIDTH - (NormalTicketTemplate.MARGIN * 2);
  
  /**
   * Genera el PDF del ticket usando los datos transformados
   */
  static async generatePDF(ticketData: TicketData): Promise<jsPDF> {
    // Crear documento con altura automática (se ajustará al contenido)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [this.TICKET_WIDTH, 200] // Altura inicial, se ajustará después
    });
    
    doc.setFont('helvetica');
    let currentY = 0;
    
    // BLOQUE 1: CABECERA
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 1;
    
    // BLOQUE 2: INFORMACIÓN DEL PASAJERO
    currentY = this.addPassengerInfo(doc, ticketData.passenger_info, currentY);
    currentY += 1;
    
    // BLOQUE 3: DETALLES DEL VIAJE
    currentY = this.addTripDetails(doc, ticketData.trip_details, currentY);
    currentY += 1;
    

    

    // BLOQUE 5: DETALLE DE LA VENTA (tabla de items y totales SUNAT)
    currentY = this.addVentaDetailBlock(doc, ticketData, currentY);
    currentY += 1;

    // BLOQUE 6: PIE DE PÁGINA CON QR
    currentY = await this.addFooter(doc, ticketData.footer, currentY);

    // Ajustar la altura del documento al contenido
    const finalHeight = currentY + 10;
    doc.internal.pageSize.height = finalHeight;

    return doc;
  }


  /**
   * BLOQUE 5: DETALLE DE LA VENTA (tabla de items y totales SUNAT)
   */
  private static addVentaDetailBlock(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DETALLE DE LA VENTA', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    // Encabezado de tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('CANT.', this.MARGIN, currentY);
    doc.text('DESCRIPCIÓN', this.MARGIN + 12, currentY);
    doc.text('P/U', this.TICKET_WIDTH - this.MARGIN - 22, currentY, { align: 'right' });
    doc.text('TOTAL', this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    // Items
    ticketData.financial_breakdown.items.forEach(item => {
      doc.text(String(item.quantity), this.MARGIN, currentY);
      // Descripción multilínea
      const descLines = this.splitText(doc, item.description, 32, 7);
      descLines.forEach((line, idx) => {
        doc.text(line, this.MARGIN + 12, currentY);
        if (idx < descLines.length - 1) currentY += 3;
      });
      // P/U y TOTAL solo en la primera línea
      doc.text(item.unit_price.toFixed(2), this.TICKET_WIDTH - this.MARGIN - 22, currentY, { align: 'right' });
      doc.text(item.total_line.toFixed(2), this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });
    // Línea separadora (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    let x = 0;
    while (x < this.TICKET_WIDTH) {
      const xEnd = Math.min(x + 2, this.TICKET_WIDTH);
      doc.line(x, currentY, xEnd, currentY);
      x += 3.5;
    }
    currentY += 3;
    // Totales SUNAT
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const sunat = ticketData.sunat_totals;
    const totales = [
      { label: 'OP. GRAVADA', value: sunat.total_taxable },
      { label: 'OP. EXONERADA', value: sunat.total_exonerated },
      { label: 'OP. INAFECTA', value: sunat.total_unaffected },
      { label: 'OP. GRATUITA', value: sunat.total_free },
      { label: 'DESCUENTO GLOBAL', value: sunat.total_global_discount },
      { label: 'IGV', value: sunat.total_igv },
      { label: 'ISC', value: sunat.total_isc },
      { label: 'OTROS TRIBUTOS', value: sunat.total_other_taxes },
      { label: 'TOTAL A PAGAR', value: ticketData.financial_breakdown.summary.find(s => s.label.toUpperCase().includes('TOTAL'))?.value || sunat.total_exonerated || sunat.total_taxable },
    ];
    totales.forEach(t => {
      doc.text(t.label + ':', this.MARGIN, currentY);
      doc.text('S/', this.TICKET_WIDTH - this.MARGIN - 18, currentY, { align: 'right' });
      doc.text(t.value ?? '0.00', this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });
    // Línea separadora (gris)
    x = 0;
    doc.setDrawColor(180, 180, 180);
    while (x < this.TICKET_WIDTH) {
      const xEnd = Math.min(x + 2, this.TICKET_WIDTH);
      doc.line(x, currentY, xEnd, currentY);
      x += 3.5;
    }
    currentY += 3;
    // Monto en palabras y forma de pago
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('SON: ' + ticketData.payment_info.amount_in_words, this.MARGIN, currentY);
    currentY += 4;
    doc.text(ticketData.payment_info.payment_method_label + ' ' + ticketData.payment_info.payment_method, this.MARGIN, currentY);
    currentY += 4;
    return currentY;
  }
  
  /**
   * BLOQUE 1: Añade el encabezado completo con logo y datos de empresa
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    // Colocar el logo exactamente en la parte superior (sin margen artificial)
    let currentY = startY;
    if (header.company_logo_url) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error('Error cargando logo'));
          logoImg.src = header.company_logo_url!;
        });
        // Calcular dimensiones del logo (máximo 30mm de ancho)
        const maxLogoWidth = 30;
        const logoAspectRatio = logoImg.height / logoImg.width;
        const logoWidth = Math.min(maxLogoWidth, 30);
        const logoHeight = logoWidth * logoAspectRatio;
        // Centrar el logo
        const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
        // Dejar solo 2.5mm debajo del logo para evitar conflicto visual
        doc.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 2.5;
      } catch (error) {
        console.error('Error cargando logo:', error);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('[LOGO NO DISPONIBLE]', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 4;
      }
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('[SIN LOGO]', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 4;
    }
    
    // Nombre de la empresa
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, 9);
    companyLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3;
    });
    
    // RUC
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${header.company_ruc}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    
    // Dirección
    doc.setFontSize(7);
    const addressLines = this.splitText(doc, header.company_address, this.CONTENT_WIDTH, 7);
    addressLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 2.5;
    });
    currentY += 1;
    
    // Teléfonos
    if (header.company_phones.length > 0) {
      const phonesText = `Tel: ${header.company_phones.join(', ')}`;
      doc.text(phonesText, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3;
    }
    
    // Punto de emisión
    if (header.emission_point) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`PUNTO DE EMISIÓN: ${header.emission_point}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3;
    }
    
    // Línea separadora continua (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 3;
    
    // Tipo y número de documento
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Fecha y hora de emisión
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(header.emission_datetime, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Vendedor
    doc.text(`Vendedor: ${header.seller_name}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    return currentY;
  }
  
  /**
   * BLOQUE 2: Añade la información del pasajero
   */
  private static addPassengerInfo(doc: jsPDF, passengerInfo: TicketData['passenger_info'], startY: number): number {
    let currentY = startY;
    
    // Línea separadora continua (gris)
    doc.setFontSize(7);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 3;
    
    // Documento del pasajero
    doc.setFont('helvetica', 'normal');
    doc.text(`${passengerInfo.doc_label}: ${passengerInfo.doc_number}`, this.MARGIN, currentY);
    currentY += 4;
    
    // Nombre del pasajero
    const nameLines = this.splitText(doc, `${passengerInfo.name_label}: ${passengerInfo.full_name}`, this.CONTENT_WIDTH, 7);
    nameLines.forEach(line => {
      doc.text(line, this.MARGIN, currentY);
      currentY += 3;
    });
    
    return currentY;
  }
  
  /**
   * BLOQUE 3: Añade los detalles del viaje
   */
  private static addTripDetails(doc: jsPDF, tripDetails: TicketData['trip_details'], startY: number): number {
    let currentY = startY;
    // Línea separadora continua (gris)
    doc.setFontSize(7);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 3;
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(tripDetails.title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    // Detalles del viaje en dos columnas, pero ASIENTO a la izquierda y línea separadora antes de venta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const col1 = tripDetails.details.filter(d => !d.col || d.col === 1);
    const col2 = tripDetails.details.filter(d => d.col === 2);
    const maxRows = Math.max(col1.length, col2.length);
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    let asientoY = null;
    for (let i = 0; i < maxRows; i++) {
      const d1 = col1[i];
      const d2 = col2[i];
      let rowHeight = 3.5;
      if (d1 && d1.label === 'ASIENTO') {
        // Mostrar ASIENTO a la izquierda, más grande
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${d1.label}: ${d1.value}`, this.MARGIN, currentY);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        asientoY = currentY + 5; // Guardar Y para la línea separadora
        rowHeight = 6;
      } else {
        if (d1) doc.text(`${d1.label}: ${d1.value}`, this.MARGIN, currentY);
      }
      if (d2) doc.text(`${d2.label}: ${d2.value}`, this.MARGIN + colWidth + 2, currentY);
      currentY += rowHeight;
    }
    // Línea separadora entre ASIENTO y DETALLE DE LA VENTA (gris)
    if (asientoY !== null) {
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 180, 180);
      doc.line(0, asientoY, this.TICKET_WIDTH, asientoY);
      currentY = asientoY + 2;
    }
    return currentY;
  }
  
  
  
  /**
   * BLOQUE 6: Añade el footer con QR real y URL de consulta
   */
  private static async addFooter(doc: jsPDF, footer: TicketData['footer'], startY: number): Promise<number> {
    let currentY = startY;
    
    // Línea separadora continua (gris)
    doc.setFontSize(7);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 3;
    
    // Texto de agradecimiento
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('¡Gracias por su preferencia!', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 6;
    
    // Texto de consulta
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(footer.consultation_text, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    doc.text(footer.consultation_url, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    
    // Usar directamente la imagen base64 del QR enviada por el backend
    if (footer.qr_code_base64) {
      try {
        // El backend ya envía el QR como imagen PNG en base64
        const qrSize = 25;
        const qrDataUrl = footer.qr_code_base64.startsWith('data:image')
          ? footer.qr_code_base64
          : `data:image/png;base64,${footer.qr_code_base64}`;
        // Centrar el QR
        const qrX = (this.TICKET_WIDTH - qrSize) / 2;
        doc.addImage(qrDataUrl, 'PNG', qrX, currentY, qrSize, qrSize);
        currentY += qrSize + 3;
      } catch (error) {
        console.error('Error generando QR:', error);
        doc.setFontSize(5);
        doc.text('[ERROR QR]', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 8;
      }
    }
    
    return currentY;
  }
  
  /**
   * Divide texto en múltiples líneas para que quepa en el ancho especificado
   */
  private static splitText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
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
    
    return lines;
  }
}
