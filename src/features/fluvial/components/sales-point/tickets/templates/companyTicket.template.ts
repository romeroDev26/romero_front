// src/features/fluvial/components/sales-point/tickets/templates/companyTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData, TicketRepresentative, TicketCompanySummary } from '../types/ticket.types';

/**
 * Template para generar PDFs de tickets de venta empresarial (RESUMEN)
 * Basado en NormalTicketTemplate pero adaptado para ventas con RUC
 * Formato térmico de 80mm de ancho
 */
export class CompanyTicketTemplate {
  
  private static readonly TICKET_WIDTH = 80; // mm
  private static readonly MARGIN = 2; // mm
  private static readonly CONTENT_WIDTH = CompanyTicketTemplate.TICKET_WIDTH - (CompanyTicketTemplate.MARGIN * 2);
  
  /**
   * Genera el PDF del ticket resumen empresarial usando los datos transformados
   */
  static async generatePDF(ticketData: TicketData & { representatives: TicketRepresentative[]; summary: TicketCompanySummary }): Promise<jsPDF> {
    // Crear documento con altura automática (se ajustará al contenido)
    const INITIAL_HEIGHT = 350; // Aumentar aún más la altura inicial
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [this.TICKET_WIDTH, INITIAL_HEIGHT]
    });
    
    doc.setFont('helvetica');
    let currentY = 0; // Comenzamos desde 0, pero addHeader agregará el margen
    
    // BLOQUE 1: CABECERA
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 5; // Aún más espacio después del header
    
    // BLOQUE 2: INFORMACIÓN DE LA EMPRESA COMPRADORA
    currentY = this.addCompanyInfo(doc, ticketData.passenger_info, currentY);
    currentY += 2;
    
    // BLOQUE 3: DETALLES DEL VIAJE
    currentY = this.addTripDetails(doc, ticketData.trip_details, currentY);
    currentY += 2;
    
    // BLOQUE 4: RESUMEN DE REPRESENTANTES (tabla simple)
    currentY = this.addRepresentativesSummary(doc, ticketData.representatives, currentY);
    currentY += 2;
    
    // BLOQUE 5: DETALLE DE LA VENTA (con asientos múltiples)
    currentY = this.addVentaDetailBlock(doc, ticketData, currentY);
    currentY += 1;

    // BLOQUE 6: PIE DE PÁGINA CON QR
    currentY = await this.addFooter(doc, ticketData.footer, currentY);

    // Ajustar la altura del documento al contenido
    const finalHeight = currentY + 20;
    doc.internal.pageSize.height = finalHeight;

    return doc;
  }

  /**
   * BLOQUE 1: Añade el encabezado completo con logo y datos de empresa
   * (Igual que NormalTicketTemplate)
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    // Aumentar aún más el margen superior para evitar corte y separación del borde
    let currentY = startY + 55;

    // LOGO (máximo 30mm de alto, 40mm de ancho)
    let logoHeight = 0;
    if (header.company_logo_url) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error('Error cargando logo'));
          logoImg.src = header.company_logo_url!;
        });
        const maxLogoWidth = 40;
        const maxLogoHeight = 30;
        const logoAspectRatio = logoImg.height / logoImg.width;
        let logoWidth = Math.min(maxLogoWidth, logoImg.width);
        logoHeight = logoWidth * logoAspectRatio;
        if (logoHeight > maxLogoHeight) {
          logoHeight = maxLogoHeight;
          logoWidth = logoHeight / logoAspectRatio;
        }
        const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
        doc.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 4;
      } catch (error) {
        console.error('Error cargando logo:', error);
        currentY += 8; // Deja más espacio si no hay logo
      }
    } else {
      currentY += 8; // Deja más espacio si no hay logo configurado
    }

    // Nombre de la empresa (máximo 3 líneas, fuente más pequeña si es muy largo)
    let companyFontSize = 9;
    let companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, companyFontSize);
    if (companyLines.length > 3) {
      companyFontSize = 7;
      companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, companyFontSize);
    }
    doc.setFontSize(companyFontSize);
    doc.setFont('helvetica', 'bold');
    companyLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3;
    });
    currentY += 1;

    // RUC y dirección
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${header.company_ruc}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;

    const addressLines = this.splitText(doc, header.company_address, this.CONTENT_WIDTH, 7);
    addressLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3;
    });
    currentY += 1;

    // Teléfonos
    if (header.company_phones && header.company_phones.length > 0) {
      doc.text(`Tel: ${header.company_phones[0]}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3;
    }
    currentY += 1;

    // Tipo de documento y numeración
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;

    // Fecha de emisión
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(header.emission_datetime, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    doc.text(`Vendedor: ${header.seller_name}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;

    // Asegura que el header nunca se solape con el borde superior
    if (currentY < 35) {
      currentY = 35;
    }
    return currentY;
  }

  /**
   * BLOQUE 2: Información de la empresa compradora (adaptado para datos empresariales)
   */
  private static addCompanyInfo(doc: jsPDF, passenger: TicketData['passenger_info'], startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    // Cliente (empresa)
    doc.text('CLIENTE:', this.MARGIN, currentY);
    const clientLines = this.splitText(doc, passenger.full_name, this.CONTENT_WIDTH - 15, 7);
    doc.text(clientLines[0], this.MARGIN + 15, currentY);
    currentY += 3;
    
    for (let i = 1; i < clientLines.length; i++) {
      doc.text(clientLines[i], this.MARGIN + 15, currentY);
      currentY += 3;
    }
    
    // Documento (RUC)
    doc.text('RUC:', this.MARGIN, currentY);
    doc.text(passenger.doc_number, this.MARGIN + 15, currentY);
    currentY += 3;
    
    // Email si está disponible (comentado porque no está en el tipo)
    // if (passenger.email) {
    //   doc.text('EMAIL:', this.MARGIN, currentY);
    //   const emailText = this.truncateText(doc, passenger.email, this.CONTENT_WIDTH - 15, 7);
    //   doc.text(emailText, this.MARGIN + 15, currentY);
    //   currentY += 3;
    // }
    
    // Dirección si está disponible (comentado porque no está en el tipo)
    // if (passenger.address) {
    //   doc.text('DIRECCIÓN:', this.MARGIN, currentY);
    //   const addressLines = this.splitText(doc, passenger.address, this.CONTENT_WIDTH - 20, 7);
    //   doc.text(addressLines[0], this.MARGIN + 20, currentY);
    //   currentY += 3;
    //   
    //   for (let i = 1; i < addressLines.length; i++) {
    //     doc.text(addressLines[i], this.MARGIN + 20, currentY);
    //     currentY += 3;
    //   }
    // }
    
    currentY += 2;
    return currentY;
  }

  /**
   * BLOQUE 3: Detalles del viaje (usando estructura de details array)
   */
  private static addTripDetails(doc: jsPDF, trip: TicketData['trip_details'], startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    // Iterar sobre los detalles del viaje
    trip.details.forEach(detail => {
      doc.text(detail.label + ':', this.MARGIN, currentY);
      
      // Calcular el ancho disponible para el valor
      const labelWidth = doc.getTextWidth(detail.label + ':');
      const valueMaxWidth = this.CONTENT_WIDTH - labelWidth - 3;
      
      // Si el valor es muy largo, dividirlo en líneas
      const valueLines = this.splitText(doc, detail.value, valueMaxWidth, 7);
      doc.text(valueLines[0], this.MARGIN + labelWidth + 3, currentY);
      currentY += 3;
      
      // Líneas adicionales si el valor es muy largo
      for (let i = 1; i < valueLines.length; i++) {
        doc.text(valueLines[i], this.MARGIN + labelWidth + 3, currentY);
        currentY += 3;
      }
    });
    
    currentY += 2;
    return currentY;
  }

  /**
   * BLOQUE 4: Resumen de representantes (tabla simple con conteo y asientos)
   */
  private static addRepresentativesSummary(doc: jsPDF, representatives: TicketRepresentative[], startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('RESUMEN DE PASAJEROS', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    
    // Lista de asientos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    doc.text('ASIENTOS:', this.MARGIN, currentY);
    const seatNumbers = representatives
      .map(rep => rep.seat_number)
      .filter(seat => seat != null && seat !== '')
      .join(', ');
    
    if (seatNumbers) {
      const seatLines = this.splitText(doc, seatNumbers, this.CONTENT_WIDTH - 18, 7);
      if (seatLines && seatLines.length > 0) {
        doc.text(seatLines[0], this.MARGIN + 18, currentY);
        currentY += 3;
        
        for (let i = 1; i < seatLines.length; i++) {
          doc.text(seatLines[i], this.MARGIN + 18, currentY);
          currentY += 3;
        }
      }
    } else {
      doc.text('N/A', this.MARGIN + 18, currentY);
      currentY += 3;
    }
    
    // Resumen numérico
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL REPRESENTANTES: ${representatives.length}`, this.MARGIN, currentY);
    currentY += 5;
    
    return currentY;
  }

  /**
   * BLOQUE 5: DETALLE DE LA VENTA (adaptado para empresa con asientos múltiples)
   */
  private static addVentaDetailBlock(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
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
      
      // Descripción multilínea con descuento si aplica
      let desc = item.description;
      if (item.discount && item.discount > 0) {
        desc += ` (descuento: ${item.discount.toFixed(2)})`;
      }
      const descLines = this.splitText(doc, desc, 32, 7);
      descLines.forEach((line, idx) => {
        doc.text(line, this.MARGIN + 12, currentY);
        if (idx < descLines.length - 1) currentY += 3;
      });
      
      // P/U y TOTAL solo en la primera línea
      doc.text(item.unit_price.toFixed(2), this.TICKET_WIDTH - this.MARGIN - 22, currentY, { align: 'right' });
      doc.text(item.total_line.toFixed(2), this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });
    
    // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    let x = 0;
    while (x < this.TICKET_WIDTH) {
      const xEnd = Math.min(x + 2, this.TICKET_WIDTH);
      doc.line(x, currentY, xEnd, currentY);
      x += 3.5;
    }
    currentY += 4;
    
    // Totales SUNAT
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const sunat = ticketData.sunat_totals;
    
    const totalPagarRaw = ticketData.financial_breakdown.summary.find(s => s.label.toUpperCase().includes('TOTAL'))?.value ?? '0.00';
    const totalPagarClean = totalPagarRaw.toString().replace(/^S\/\s*/, '').trim();
    
    const totales = [
      { label: 'OP. GRAVADA', value: sunat.total_taxable },
      { label: 'OP. EXONERADA', value: sunat.total_exonerated },
      { label: 'OP. INAFECTA', value: sunat.total_unaffected },
      { label: 'OP. GRATUITA', value: sunat.total_free },
      { label: 'DESCUENTO GLOBAL', value: sunat.total_global_discount },
      { label: 'IGV', value: sunat.total_igv },
      { label: 'ISC', value: sunat.total_isc },
      { label: 'OTROS TRIBUTOS', value: sunat.total_other_taxes },
      { label: 'TOTAL A PAGAR', value: totalPagarClean },
    ];
    
    totales.forEach(t => {
      doc.text(t.label + ':', this.MARGIN, currentY);
      doc.text('S/', this.TICKET_WIDTH - this.MARGIN - 18, currentY, { align: 'right' });
      doc.text((t.value ?? '0.00'), this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });
    
    // Línea separadora
    x = 0;
    doc.setDrawColor(180, 180, 180);
    while (x < this.TICKET_WIDTH) {
      const xEnd = Math.min(x + 2, this.TICKET_WIDTH);
      doc.line(x, currentY, xEnd, currentY);
      x += 3.5;
    }
    currentY += 4;
    
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
   * BLOQUE 6: Añade el footer con QR real y URL de consulta
   */
  private static async addFooter(doc: jsPDF, footer: TicketData['footer'], startY: number): Promise<number> {
    let currentY = startY;
    
    // Línea separadora
    doc.setFontSize(7);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
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
    
    // QR Code
    if (footer.qr_code_base64) {
      try {
        const qrSize = 25;
        const qrDataUrl = footer.qr_code_base64.startsWith('data:image')
          ? footer.qr_code_base64
          : `data:image/png;base64,${footer.qr_code_base64}`;
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
    if (!text || text.trim() === '') {
      return [''];
    }
    
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

  /**
   * Trunca texto para que quepa en el ancho especificado
   */
  // private static truncateText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string {
  //   doc.setFontSize(fontSize);
  //   if (doc.getTextWidth(text) <= maxWidth) {
  //     return text;
  //   }
    
  //   let truncated = text;
  //   while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
  //     truncated = truncated.slice(0, -1);
  //   }
    
  //   return truncated + '...';
  // }
}
