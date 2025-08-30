// src/features/fluvial/components/sales-point/tickets/templates/cargoTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData } from '../types/ticket.types';

/**
 * Template para generar PDFs de tickets de ENCOMIENDAS/CARGO
 * Especializado para servicios de envío de encomiendas y carga
 * Incluye información del destinatario y detalles específicos de carga
 * Formato térmico de 80mm de ancho
 */
export class CargoTicketTemplate {
  
  private static readonly TICKET_WIDTH = 80; // mm
  private static readonly MARGIN = 2; // mm
  private static readonly CONTENT_WIDTH = CargoTicketTemplate.TICKET_WIDTH - (CargoTicketTemplate.MARGIN * 2);
  
  /**
   * Genera el PDF del ticket usando los datos transformados para encomiendas
   */
  static async generatePDF(ticketData: TicketData): Promise<jsPDF> {
    // Crear documento con altura automática (se ajustará al contenido)
    const INITIAL_HEIGHT = 260; // Altura inicial aumentada para encomiendas
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
    
    // BLOQUE 2: INFORMACIÓN DEL REMITENTE
    currentY = this.addSenderInfo(doc, ticketData.passenger_info, currentY);
    currentY += 1;
    
    // BLOQUE 3: INFORMACIÓN DEL DESTINATARIO (ESPECÍFICO PARA ENCOMIENDAS)
    currentY = this.addRecipientInfo(doc, ticketData, currentY);
    currentY += 1;
    
    // BLOQUE 4: DETALLES DEL ENVÍO
    currentY = this.addShipmentDetails(doc, ticketData.trip_details, currentY);
    currentY += 1;
    
    // BLOQUE 5: DETALLE DE LOS ITEMS DE ENCOMIENDA
    currentY = this.addCargoItems(doc, ticketData, currentY);
    currentY += 1;
    
    // BLOQUE 6: TOTALES SUNAT
    currentY = this.addTotals(doc, ticketData, currentY);
    currentY += 1;

    // BLOQUE 7: PIE DE PÁGINA CON QR
    currentY = await this.addFooter(doc, ticketData.footer, currentY);

    // AJUSTE AUTOMÁTICO DE ALTURA
    const finalHeight = currentY + 10; // 10mm de margen final
    doc.internal.pageSize.height = finalHeight;

    return doc;
  }

  /**
   * BLOQUE 1: Añade el encabezado completo con logo y datos de empresa
   * Basado en la estructura del NormalTicketTemplate que funciona correctamente
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
  // Aumentar el offset superior para bajar el logo y compensar el espacio eliminado
  let currentY = startY + 28; // antes 20, ahora +28mm
    
    // LOGO REAL - igual que en NormalTicketTemplate
    if (header.company_logo_url) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error('Error cargando logo'));
          logoImg.src = header.company_logo_url!;
        });
        // Calcular dimensiones del logo (máximo 40mm de ancho)
        const maxLogoWidth = 40;
        const logoAspectRatio = logoImg.height / logoImg.width;
        const logoWidth = Math.min(maxLogoWidth, 40);
        const logoHeight = logoWidth * logoAspectRatio;
        // Centrar el logo
        const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
        // Colocar el logo completamente arriba
        doc.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 3; // Espacio adecuado después del logo
      } catch (error) {
        console.error('Error cargando logo:', error);
        // Si no hay logo, no mostrar nada - continuar directamente
        currentY += 0;
      }
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
    if (header.company_phones && header.company_phones.length > 0) {
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
    currentY += 4; // Espacio adecuado después del separador
    
    // Tipo y número de documento
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5; // Espacio adecuado después del documento
    
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
   * BLOQUE 2: Añade la información del remitente
   */
  private static addSenderInfo(doc: jsPDF, passengerInfo: TicketData['passenger_info'], startY: number): number {
    let currentY = startY;

    // Línea separadora continua (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('REMITENTE:', this.MARGIN, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    // Nombre del remitente
    const nameLines = this.splitText(doc, passengerInfo.full_name, this.CONTENT_WIDTH, 7);
    nameLines.forEach(line => {
      doc.text(line, this.MARGIN, currentY);
      currentY += 3;
    });

    // Documento del remitente
    doc.text(`${passengerInfo.doc_label}: ${passengerInfo.doc_number}`, this.MARGIN, currentY);
    currentY += 4;

    return currentY;
  }

  /**
   * BLOQUE 3: Añade la información del destinatario (específico para encomiendas)
   */
  private static addRecipientInfo(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;

    // Línea separadora continua (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATARIO:', this.MARGIN, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    // Extraer información del destinatario de trip_details
    const destinatarioDetail = ticketData.trip_details.details.find(d => d.label === 'Destinatario');
    const docDestinatarioDetail = ticketData.trip_details.details.find(d => d.label === 'Doc. Destinatario');
    const telDestinatarioDetail = ticketData.trip_details.details.find(d => d.label === 'Tel. Destinatario');
    
    // Nombre del destinatario
    if (destinatarioDetail) {
      const nameLines = this.splitText(doc, destinatarioDetail.value, this.CONTENT_WIDTH, 7);
      nameLines.forEach(line => {
        doc.text(line, this.MARGIN, currentY);
        currentY += 3;
      });
    } else {
      doc.text('Por definir según estructura de datos', this.MARGIN, currentY);
      currentY += 3;
    }

    // Documento del destinatario
    if (docDestinatarioDetail) {
      doc.text(docDestinatarioDetail.value, this.MARGIN, currentY);
      currentY += 3;
    } else {
      doc.text('Doc: Por definir', this.MARGIN, currentY);
      currentY += 3;
    }

    // Teléfono del destinatario
    if (telDestinatarioDetail) {
      doc.text(`Tel: ${telDestinatarioDetail.value}`, this.MARGIN, currentY);
      currentY += 4;
    } else {
      doc.text('Tel: Por definir', this.MARGIN, currentY);
      currentY += 4;
    }

    return currentY;
  }

  /**
   * BLOQUE 4: Añade los detalles del envío
   */
  private static addShipmentDetails(doc: jsPDF, tripDetails: TicketData['trip_details'], startY: number): number {
    let currentY = startY;

    // Línea separadora continua (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DEL ENVÍO:', this.MARGIN, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    // Mostrar detalles del viaje basados en la estructura de la interfaz
    // Excluir destinatario y variantes de hora de embarque, ruta y hora de salida
    const shipmentDetails = tripDetails.details.filter(detail => {
      const label = detail.label ? String(detail.label).trim().toLowerCase() : '';
      if (!label) return true;

      // Etiquetas exactas que debemos ignorar (destinatario ya manejado en otro bloque)
      const exactIgnored = ['destinatario', 'doc. destinatario', 'tel. destinatario'];
      if (exactIgnored.includes(label)) return false;

      // Ignorar cualquier etiqueta que contenga estas palabras clave (cubre variantes como 'Hora Embarque', 'Hora de embarque', 'HORA DE SALIDA', etc.)
      if (label.includes('embar') || label.includes('salid') || label.includes('ruta')) return false;

      return true;
    });
    
    shipmentDetails.forEach(detail => {
      doc.text(`${detail.label}: ${detail.value}`, this.MARGIN, currentY);
      currentY += 3;
    });

    currentY += 2; // Espacio antes del siguiente bloque

    return currentY;
  }

  /**
   * BLOQUE 5: Añade los items de encomienda con detalles específicos
   */
  private static addCargoItems(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;

    // Línea separadora continua (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEMS DE ENCOMIENDA:', this.MARGIN, currentY);
    currentY += 4;

    // Encabezado de tabla
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CANT.', this.MARGIN, currentY);
    doc.text('DESCRIPCIÓN', this.MARGIN + 10, currentY); // Más espacio para descripción
    doc.text('P/U', this.TICKET_WIDTH - this.MARGIN - 24, currentY, { align: 'right' }); // Ajustar posición
    doc.text('TOTAL', this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
    currentY += 4;

    // Items
    doc.setFont('helvetica', 'normal');
    ticketData.financial_breakdown.items.forEach(item => {
      // Cantidad
      doc.text(String(item.quantity), this.MARGIN, currentY);
      
      // Descripción multilínea con descuento si aplica - ESPACIO REDUCIDO
      let desc = item.description;
      if (item.discount && item.discount > 0) {
        desc += ` (descuento: ${item.discount.toFixed(2)})`;
      }
      // Reducir el espacio disponible para descripción de 38 a 30 caracteres para no invadir P/U
      const descLines = this.splitText(doc, desc, 30, 7);
      descLines.forEach((line, idx) => {
        doc.text(line, this.MARGIN + 10, currentY); // Misma posición horizontal
        if (idx < descLines.length - 1) currentY += 3;
      });
      
      // P/U y TOTAL solo en la primera línea - ajustar posición
      doc.text(item.unit_price.toFixed(2), this.TICKET_WIDTH - this.MARGIN - 24, currentY, { align: 'right' });
      doc.text(item.total_line.toFixed(2), this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 4; // Espacio entre items
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
    currentY += 4; // Espacio adecuado después del separador

    return currentY;
  }

  /**
   * BLOQUE 6: Añade los totales SUNAT
   */
  private static addTotals(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const sunat = ticketData.sunat_totals;

    // Obtener el total exacto
    const totalPagarRaw = ticketData.financial_breakdown.summary.find(s => 
      s.label.toUpperCase().includes('TOTAL')
    )?.value ?? '0.00';
    const totalPagarClean = totalPagarRaw.toString().replace(/^S\/\s*/, '').trim();

    const totales = [
      { label: 'OP. GRAVADA', value: sunat.total_taxable },
      { label: 'OP. EXONERADA', value: sunat.total_exonerated },
      { label: 'OP. INAFECTA', value: sunat.total_unaffected },
      { label: 'IGV', value: sunat.total_igv },
      { label: 'TOTAL A PAGAR', value: totalPagarClean, highlight: true }
    ];

    totales.forEach(total => {
      if (parseFloat(total.value) > 0 || total.highlight) {
        if (total.highlight) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(total.label + ':', this.MARGIN, currentY);
        doc.text(`S/ ${total.value}`, this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
        currentY += 3;
      }
    });

    currentY += 2;

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
   * BLOQUE 7: Añade el pie de página con QR real y información adicional
   * Basado en la estructura del NormalTicketTemplate que funciona correctamente
   */
  private static async addFooter(doc: jsPDF, footer: TicketData['footer'], startY: number): Promise<number> {
    let currentY = startY;

    // Línea separadora continua (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador
    
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
    
    // Información adicional
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Representación impresa del comprobante electrónico', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    doc.text('CONSERVE ESTE COMPROBANTE', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;

    return currentY;
  }

  /**
   * Divide texto en múltiples líneas para que quepa en el ancho especificado
   */
  private static splitText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    if (!text || text.toString().trim() === '') return [''];

    const words = text.toString().split(' ');
    const lines: string[] = [];
    let currentLine = '';

    const pushLine = (line: string) => { if (line === '') return; lines.push(line); };

    words.forEach(word => {
      if (doc.getTextWidth(word) > maxWidth) {
        if (currentLine) { pushLine(currentLine); currentLine = ''; }
        let sub = '';
        for (let ch of word) {
          const test = sub + ch;
          if (doc.getTextWidth(test) > maxWidth) { pushLine(sub); sub = ch; } else { sub = test; }
        }
        if (sub) pushLine(sub);
      } else {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (doc.getTextWidth(testLine) > maxWidth && currentLine) { pushLine(currentLine); currentLine = word; } else { currentLine = testLine; }
      }
    });

    if (currentLine) pushLine(currentLine);
    return lines;
  }
}
