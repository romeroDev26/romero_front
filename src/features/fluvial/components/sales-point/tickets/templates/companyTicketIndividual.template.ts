// src/features/fluvial/components/sales-point/tickets/templates/companyTicketIndividual.template.ts

import jsPDF from 'jspdf';
import { TicketData, TicketRepresentative } from '../types/ticket.types';

/**
 * Template para generar PDFs de tickets individuales de representantes
 * Un ticket por cada representante con información específica del asiento
 * Formato térmico de 80mm de ancho
 */
export class CompanyTicketIndividualTemplate {
  
  private static readonly TICKET_WIDTH = 80; // mm
  private static readonly MARGIN = 2; // mm
  private static readonly CONTENT_WIDTH = CompanyTicketIndividualTemplate.TICKET_WIDTH - (CompanyTicketIndividualTemplate.MARGIN * 2);
  
  /**
   * Genera el PDF del ticket individual para un representante específico
   */
  static async generatePDF(ticketData: TicketData, representative: TicketRepresentative): Promise<jsPDF> {
    // Crear documento con altura automática
    const INITIAL_HEIGHT = 250;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [this.TICKET_WIDTH, INITIAL_HEIGHT]
    });
    
    doc.setFont('helvetica');
    let currentY = 0;
    
    // BLOQUE 1: CABECERA
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 1;
    
    // BLOQUE 2: INFORMACIÓN DEL REPRESENTANTE (específica)
    currentY = this.addRepresentativeInfo(doc, representative, currentY);
    currentY += 1;
    
    // BLOQUE 3: DETALLES DEL VIAJE
    currentY = this.addTripDetails(doc, ticketData.trip_details, currentY);
    currentY += 1;
    
    // BLOQUE 4: INFORMACIÓN DEL ASIENTO
    currentY = this.addSeatInfo(doc, representative, currentY);
    currentY += 1;
    
    // BLOQUE 5: PIE DE PÁGINA CON QR (mismo QR que el ticket resumen)
    currentY = await this.addFooter(doc, ticketData.footer, currentY);

    // Ajustar la altura del documento al contenido
    const finalHeight = currentY + 20;
    doc.internal.pageSize.height = finalHeight;

    return doc;
  }

  /**
   * BLOQUE 1: Añade el encabezado (similar al resumen pero más compacto)
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
    
    // LOGO (más pequeño)
    if (header.company_logo_url) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error('Error cargando logo'));
          logoImg.src = header.company_logo_url!;
        });
        
        const maxLogoWidth = 30; // Más pequeño
        const logoAspectRatio = logoImg.height / logoImg.width;
        const logoWidth = Math.min(maxLogoWidth, 30);
        const logoHeight = logoWidth * logoAspectRatio;
        const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
        
        doc.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 2;
      } catch (error) {
        console.error('Error cargando logo:', error);
        currentY += 0;
      }
    }
    
    // Nombre de la empresa (más compacto)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, 8);
    companyLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3;
    });
    currentY += 1;
    
    // Tipo de documento
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Título específico de ticket individual
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET INDIVIDUAL', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    return currentY;
  }

  /**
   * BLOQUE 2: Información específica del representante
   */
  private static addRepresentativeInfo(doc: jsPDF, representative: TicketRepresentative, startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    // Pasajero
    doc.text('PASAJERO:', this.MARGIN, currentY);
    const nameLines = this.splitText(doc, representative.passenger_name, this.CONTENT_WIDTH - 18, 7);
    doc.text(nameLines[0], this.MARGIN + 18, currentY);
    currentY += 3;
    
    for (let i = 1; i < nameLines.length; i++) {
      doc.text(nameLines[i], this.MARGIN + 18, currentY);
      currentY += 3;
    }
    
    // Documento
    doc.text('DOCUMENTO:', this.MARGIN, currentY);
    doc.text(`${representative.passenger_doc_type} ${representative.passenger_doc_number}`, this.MARGIN + 20, currentY);
    currentY += 3;
    
    // Asiento destacado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ASIENTO:', this.MARGIN, currentY);
    doc.text(representative.seat_number, this.MARGIN + 18, currentY);
    currentY += 4;
    
    return currentY;
  }

  /**
   * BLOQUE 3: Detalles del viaje (versión compacta)
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
    
    // Solo mostrar los detalles más importantes para el ticket individual
    const importantDetails = trip.details.filter(detail => 
      detail.label.toLowerCase().includes('ruta') ||
      detail.label.toLowerCase().includes('fecha') ||
      detail.label.toLowerCase().includes('hora') ||
      detail.label.toLowerCase().includes('embarcación') ||
      detail.label.toLowerCase().includes('terminal')
    );
    
    importantDetails.forEach(detail => {
      doc.text(detail.label + ':', this.MARGIN, currentY);
      
      const labelWidth = doc.getTextWidth(detail.label + ':');
      const valueMaxWidth = this.CONTENT_WIDTH - labelWidth - 3;
      
      const valueLines = this.splitText(doc, detail.value, valueMaxWidth, 7);
      doc.text(valueLines[0], this.MARGIN + labelWidth + 3, currentY);
      currentY += 3;
      
      for (let i = 1; i < valueLines.length; i++) {
        doc.text(valueLines[i], this.MARGIN + labelWidth + 3, currentY);
        currentY += 3;
      }
    });
    
    currentY += 2;
    return currentY;
  }

  /**
   * BLOQUE 4: Información específica del asiento y notas
   */
  private static addSeatInfo(doc: jsPDF, representative: TicketRepresentative, startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('INFORMACIÓN DEL ASIENTO', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    // Asiento destacado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ASIENTO:', this.MARGIN, currentY);
    doc.text(representative.seat_number, this.MARGIN + 20, currentY);
    currentY += 5;
    
    // Notas especiales si existen
    if (representative.special_notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('NOTAS:', this.MARGIN, currentY);
      const notesLines = this.splitText(doc, representative.special_notes, this.CONTENT_WIDTH - 12, 7);
      doc.text(notesLines[0], this.MARGIN + 12, currentY);
      currentY += 3;
      
      for (let i = 1; i < notesLines.length; i++) {
        doc.text(notesLines[i], this.MARGIN + 12, currentY);
        currentY += 3;
      }
    }
    
    currentY += 2;
    return currentY;
  }

  /**
   * BLOQUE 5: Footer con QR (el mismo QR que el ticket resumen)
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
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('¡Buen viaje!', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // QR Code (más pequeño)
    if (footer.qr_code_base64) {
      try {
        const qrSize = 20; // Más pequeño para ticket individual
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
