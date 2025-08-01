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
    
    // BLOQUE 4: DESGLOSE FINANCIERO
    currentY = this.addFinancialBreakdown(doc, ticketData.financial_breakdown, currentY);
    currentY += 1;
    
    // BLOQUE 5: INFORMACIÓN DE PAGO
    currentY = this.addPaymentInfo(doc, ticketData.payment_info, currentY);
    currentY += 1;
    
    // BLOQUE 6: PIE DE PÁGINA CON QR
    currentY = await this.addFooter(doc, ticketData.footer, currentY);
    
    // Ajustar la altura del documento al contenido
    const finalHeight = currentY + 10;
    doc.internal.pageSize.height = finalHeight;
    
    return doc;
  }
  
  /**
   * BLOQUE 1: Añade el encabezado completo con logo y datos de empresa
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
    
    // Logo de la empresa (si existe)
    if (header.company_logo_url) {
      try {
        // Cargar imagen real del logo
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error('Error cargando logo'));
          logoImg.src = header.company_logo_url!;
        });
        
        // Calcular dimensiones del logo (máximo 25mm de ancho)
        const maxLogoWidth = 25;
        const logoAspectRatio = logoImg.height / logoImg.width;
        const logoWidth = Math.min(maxLogoWidth, 25);
        const logoHeight = logoWidth * logoAspectRatio;
        
        // Centrar el logo
        const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
        
        // Añadir logo al PDF
        doc.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight;
        
      } catch (error) {
        console.error('Error cargando logo:', error);
        // Fallback: mostrar texto si falla la carga
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('[LOGO NO DISPONIBLE]', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 4;
      }
    } else {
      // Sin logo disponible
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
    
    // Línea separadora
    doc.text('------------------------------', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
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
    
    // Línea separadora
    doc.setFontSize(7);
    doc.text('- - - - - - - - - - - - - - - - -', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
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
    
    // Línea separadora
    doc.setFontSize(7);
    doc.text('- - - - - - - - - - - - - - - - -', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(tripDetails.title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    
    // Detalles del viaje
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    tripDetails.details.forEach(detail => {
      // Asiento destacado más grande
      if (detail.label === 'ASIENTO') {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}: ${detail.value}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        currentY += 6;
      } else {
        doc.text(`${detail.label}: ${detail.value}`, this.MARGIN, currentY);
        currentY += 3.5;
      }
    });
    
    return currentY;
  }
  
  /**
   * BLOQUE 4: Añade el desglose financiero detallado
   */
  private static addFinancialBreakdown(doc: jsPDF, financialBreakdown: TicketData['financial_breakdown'], startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setFontSize(7);
    doc.text('- - - - - - - - - - - - - - - - -', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(financialBreakdown.title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    
    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    
    financialBreakdown.items.forEach(item => {
      // Descripción del item
      const descLines = this.splitText(doc, item.description, this.CONTENT_WIDTH, 6);
      descLines.forEach(line => {
        doc.text(line, this.MARGIN, currentY);
        currentY += 3;
      });
      
      // Cantidad y precio unitario
      const itemLine = `${item.quantity} x S/ ${item.unit_price.toFixed(2)}`;
      doc.text(itemLine, this.MARGIN, currentY);
      doc.text(`S/ ${item.total_line.toFixed(2)}`, this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 3;
      
      // Descuento si existe
      if (item.discount > 0) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Descuento: -S/ ${item.discount.toFixed(2)}`, this.MARGIN + 2, currentY);
        doc.setFont('helvetica', 'normal');
        currentY += 3;
      }
      
      currentY += 2; // Espacio entre items
    });
    
    // Línea antes del resumen
    currentY += 2;
    doc.text('- - - - - - - - - - - - - - - - -', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Resumen de totales
    financialBreakdown.summary.forEach(summaryItem => {
      if (summaryItem.is_bold) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      doc.text(summaryItem.label, this.MARGIN, currentY);
      doc.text(summaryItem.value, this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });
    
    return currentY;
  }
  
  /**
   * BLOQUE 5: Añade la información de pago
   */
  private static addPaymentInfo(doc: jsPDF, paymentInfo: TicketData['payment_info'], startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('- - - - - - - - - - - - - - - - -', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    // Monto en palabras
    doc.setFontSize(6);
    const amountText = `${paymentInfo.amount_in_words_prefix} ${paymentInfo.amount_in_words}`;
    const amountLines = this.splitText(doc, amountText, this.CONTENT_WIDTH, 6);
    amountLines.forEach(line => {
      doc.text(line, this.MARGIN, currentY);
      currentY += 3;
    });
    
    currentY += 2;
    
    // Forma de pago
    doc.setFontSize(7);
    doc.text(`${paymentInfo.payment_method_label} ${paymentInfo.payment_method}`, this.MARGIN, currentY);
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
    doc.text('------------------------------', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
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
    
    // Generar QR code real
    if (footer.qr_code_base64) {
      try {
        // Generar QR de 25mm x 25mm
        const qrSize = 25;
        const qrDataUrl = await QRCode.toDataURL(footer.qr_code_base64, {
          width: 100, // pixels para buena calidad
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Centrar el QR
        const qrX = (this.TICKET_WIDTH - qrSize) / 2;
        doc.addImage(qrDataUrl, 'PNG', qrX, currentY, qrSize, qrSize);
        currentY += qrSize + 3;
        
      } catch (error) {
        console.error('Error generando QR:', error);
        // Fallback si falla el QR
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
