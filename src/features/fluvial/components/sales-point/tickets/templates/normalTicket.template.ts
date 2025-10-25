// src/features/fluvial/components/sales-point/tickets/templates/normalTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData } from '../types/ticket.types';
import { getCurrencySymbol } from '../utils/ticketHelpers';

/**
 * Template para generar PDFs de tickets de venta normal.
 * Formato térmico de 80mm de ancho con altura dinámica y márgenes controlados.
 * El ticket crece automáticamente hacia abajo para acomodar contenido variable.
 */
export class NormalTicketTemplate {
  
  // --- CONSTANTES DE DISEÑO ---
  private static readonly TICKET_WIDTH = 80;
  private static readonly BOTTOM_MARGIN = 6; // Margen final para asegurar que nada se corte
  private static readonly HORIZONTAL_MARGIN = 2;
  private static readonly CONTENT_WIDTH = NormalTicketTemplate.TICKET_WIDTH - (NormalTicketTemplate.HORIZONTAL_MARGIN * 2);
  
  static async generatePDF(ticketData: TicketData): Promise<jsPDF> {
    // Calcular altura fija basada en límites conocidos de comentarios (85 chars cada uno = 170 total)
    const FIXED_HEIGHT = this.calculateFixedTicketHeight(ticketData);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [this.TICKET_WIDTH, FIXED_HEIGHT],
      compress: true,
      putOnlyUsedFonts: true
    });
    
    doc.setFont('helvetica');

    let currentY = 0;
    
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 1;
    
    currentY = this.addPassengerInfo(doc, ticketData.passenger_info, currentY);
    currentY += 1;
    
    currentY = this.addTripDetails(doc, ticketData.trip_details, currentY);
    currentY += 1;
    
    currentY = this.addVentaDetailBlock(doc, ticketData, currentY);
    currentY += 1;

    currentY = await this.addFooter(doc, ticketData.footer, ticketData.header, currentY);

    return doc;
  }

  /** Calcula la altura fija del ticket basada en límites conocidos de contenido */
  private static calculateFixedTicketHeight(ticketData: TicketData): number {
    const BASE_HEIGHT = 250; // Altura base para header, passenger info, trip details y footer (ajustada)
    
    // Calcular altura del bloque de venta basado en número de items y longitud máxima de descripciones
    const itemsCount = ticketData.financial_breakdown.items.length;
    const MAX_CHARS_PER_DESCRIPTION = 170; // 85 + 85 (ambos comentarios limitados)
    const CHARS_PER_LINE = 35; // Caracteres promedio por línea en el ticket
    const MAX_LINES_PER_ITEM = Math.ceil(MAX_CHARS_PER_DESCRIPTION / CHARS_PER_LINE);
    const LINE_HEIGHT = 3.5;
    
    // Altura del bloque de items
    const itemsBlockHeight = itemsCount * (MAX_LINES_PER_ITEM * LINE_HEIGHT + 4); // +4 para espaciado
    
    // Altura del resumen financiero (fija)
    const FINANCIAL_SUMMARY_HEIGHT = 60;
    
    // Altura total calculada
    const calculatedHeight = BASE_HEIGHT + itemsBlockHeight + FINANCIAL_SUMMARY_HEIGHT + this.BOTTOM_MARGIN;
    
    // Asegurar altura mínima y máxima razonable
    return Math.max(200, Math.min(400, calculatedHeight));
  }

  /** BLOQUE 1: Añade el encabezado completo con logo y datos de empresa */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
     
    const LOGO_TOP_Y = 12; // Margen superior del logo aumentado
    currentY = LOGO_TOP_Y;

    if (header.company_logo_url) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = (err) => reject(new Error(`Error cargando logo: ${err}`));
          logoImg.src = header.company_logo_url!;
        });

        const maxLogoWidth = 46;
        const logoAspectRatio = logoImg.height / logoImg.width;
        const logoWidth = Math.min(maxLogoWidth, logoImg.width);
        const logoHeight = logoWidth * logoAspectRatio;
        
        const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
        doc.addImage(logoImg, 'PNG', logoX, LOGO_TOP_Y, logoWidth, logoHeight);
        currentY = LOGO_TOP_Y + logoHeight + 2.5;
      } catch (error) {
        console.error('Error al cargar o añadir el logo:', error);
        currentY = 4;
      }
    } else {
        currentY = 4;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Sirviendo a la Amazonía Peruana', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4.5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, 11);
    companyLines.forEach(line => {
      doc.text(line.toUpperCase(), this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.8;
    });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${header.company_ruc}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3.5;
    
    doc.setFontSize(8);
    const addressLines = this.splitText(doc, header.company_address, this.CONTENT_WIDTH, 8);
    addressLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 2.8;
    });
    currentY += 1.2;
    
    if (header.company_phones.length > 0) {
      const phonesText = `Tel: ${header.company_phones.join(', ')}`;
      doc.text(phonesText, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.2;
    }
    
    if (header.emission_point) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`PUNTO DE EMISIÓN: ${header.emission_point}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.2;
    }
    
    if (header.branch_office_address) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const addrLines = this.splitText(doc, header.branch_office_address, this.CONTENT_WIDTH, 8);
      addrLines.forEach(line => {
        doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 2.2;
      });
      currentY += 1.2;
    }
    
    if (header.branch_office_phone) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Contacto de sucursal: ${header.branch_office_phone}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 2.8;
    }

    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3.5;
    doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(header.emission_datetime, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    
    doc.text(`Vendedor: ${header.seller_name}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    
    return currentY;
  }

  /** BLOQUE 2: Añade la información del pasajero */
  private static addPassengerInfo(doc: jsPDF, passengerInfo: TicketData['passenger_info'], startY: number): number {
    let currentY = startY;
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
  // Reducir levemente el ancho de cada columna para forzar saltos de línea
  // más tempranos y aumentar la separación entre columnas evitando solapamientos.
  const colGap = 4; // espacio entre columnas
  const adjustedContent = this.CONTENT_WIDTH - colGap;
  const colWidth = Math.floor(adjustedContent / 2);
  const leftX = this.HORIZONTAL_MARGIN;
  const rightX = this.HORIZONTAL_MARGIN + colWidth + colGap;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('NOMBRE:', leftX, currentY);
    doc.text('DOCUMENTO:', rightX, currentY);
    currentY += 4;

    doc.setFontSize(11);
    // Usar un ancho ligeramente menor para el nombre para forzar el salto
    const nameColWidth = Math.max(20, colWidth - 6);
    const nameLines = this.splitText(doc, passengerInfo.full_name, nameColWidth, 11);
    // Documento puede usar un ancho completo de columna
    const docLines = this.splitText(doc, `${passengerInfo.doc_label}: ${passengerInfo.doc_number}`, colWidth, 11);
    const maxLines = Math.max(nameLines.length, docLines.length);
    for (let i = 0; i < maxLines; i++) {
      doc.setFont('helvetica', 'normal');
      doc.text((nameLines[i] ?? '').toUpperCase(), leftX, currentY);
      // Si la línea del documento es muy larga, asegurarse de que no pase el borde
      const docText = (docLines[i] ?? '').toUpperCase();
      const trimmedDocLines = this.splitText(doc, docText, colWidth, 11);
      doc.text((trimmedDocLines[0] ?? ''), rightX, currentY);
      currentY += 4;
    }
    currentY += 2;
    
    return currentY;
  }

  /** BLOQUE 3: Añade los detalles del viaje */
  private static addTripDetails(doc: jsPDF, tripDetails: TicketData['trip_details'], startY: number): number {
    let currentY = startY;
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(tripDetails.title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 6;

    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.HORIZONTAL_MARGIN;
    const rightX = this.HORIZONTAL_MARGIN + colWidth + 2;

    const findByLabel = (pattern: RegExp) => tripDetails.details.find(d => pattern.test((d.label || '').toString().toUpperCase()));
    const vesselItem = findByLabel(/EMBARC|EMBARCACIÓN|EMBARCACION/);
    const dateItem = findByLabel(/FECHA/);
    const boardingItem = findByLabel(/EMBARQ|EMBARQUE|HORA\s*EMBARQUE/);
    const departureItem = findByLabel(/SALIDA|HORA\s*SALIDA|HORA\s*DE?\s*VIAJE|HORA\s*VIAJE/);
    const originItem = findByLabel(/ORIGEN/);
    const destItem = findByLabel(/DESTINO/);
    const seatItem = findByLabel(/ASIENTO/);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('EMBARCACIÓN:', leftX, currentY);
    doc.text('FECHA VIAJE:', rightX, currentY);
    currentY += 4;
    const vesselLines = vesselItem ? this.splitText(doc, vesselItem.value, colWidth, 11) : [''];
    const dateLines = dateItem ? this.splitText(doc, dateItem.value, colWidth, 11) : [''];
    for (let i = 0; i < Math.max(vesselLines.length, dateLines.length); i++) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text((vesselLines[i] ?? '').toUpperCase(), leftX, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text((dateLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4;
    }
    currentY += 2;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('EMBARQUE:', leftX, currentY);
    doc.text('SALIDA:', rightX, currentY);
    currentY += 4;
    const boardingLines = boardingItem ? this.splitText(doc, boardingItem.value, colWidth, 11) : [''];
    const departureLines = departureItem ? this.splitText(doc, departureItem.value, colWidth, 11) : [''];
    for (let i = 0; i < Math.max(boardingLines.length, departureLines.length); i++) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((boardingLines[i] ?? '').toUpperCase(), leftX, currentY);
      doc.text((departureLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4;
    }
    currentY += 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('ORIGEN:', leftX, currentY);
    doc.text('DESTINO:', rightX, currentY);
    currentY += 4;
    const originLines = originItem ? this.splitText(doc, originItem.value, colWidth, 11) : [''];
    const destLines = destItem ? this.splitText(doc, destItem.value, colWidth, 11) : [''];
    for (let i = 0; i < Math.max(originLines.length, destLines.length); i++) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text((originLines[i] ?? '').toUpperCase(), leftX, currentY);
      doc.text((destLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4;
    }
    currentY += 2;
    
    if (tripDetails.port_name || tripDetails.port_address) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('PUERTO:', leftX, currentY);
      doc.text('DIRECCIÓN PUERTO:', rightX, currentY);
      currentY += 4;
      const portNameLines = this.splitText(doc, tripDetails.port_name ?? '', colWidth, 11);
      const portAddrLines = this.splitText(doc, tripDetails.port_address ?? '', colWidth, 11);
      for (let i = 0; i < Math.max(portNameLines.length, portAddrLines.length); i++) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text((portNameLines[i] ?? '').toUpperCase(), leftX, currentY);
        doc.text((portAddrLines[i] ?? '').toUpperCase(), rightX, currentY);
        currentY += 4;
      }
      currentY += 2;
    }

    if (seatItem) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`ASIENTO: ${seatItem.value}`, leftX, currentY);
      currentY += 4;
    }

    return currentY;
  }
  
  /** BLOQUE 4: DETALLE DE LA VENTA (tabla de items y totales) */
  private static addVentaDetailBlock(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DETALLE DE LA VENTA', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CANT.', this.HORIZONTAL_MARGIN, currentY);
    doc.text('DESCRIPCIÓN', this.HORIZONTAL_MARGIN + 12, currentY);
    doc.text('P/U', this.TICKET_WIDTH - this.HORIZONTAL_MARGIN - 22, currentY, { align: 'right' });
    doc.text('TOTAL', this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY, { align: 'right' });
    currentY += 4;
    
    doc.setFont('helvetica', 'normal');
    const LINE_HEIGHT = 3.5;
    
    ticketData.financial_breakdown.items.forEach(item => {
        const itemStartY = currentY;

        // 1. Dibujar las columnas estáticas
        doc.text(String(item.quantity), this.HORIZONTAL_MARGIN, itemStartY);
        doc.text(item.unit_price.toFixed(2), this.TICKET_WIDTH - this.HORIZONTAL_MARGIN - 22, itemStartY, { align: 'right' });
        doc.text(item.total_line.toFixed(2), this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, itemStartY, { align: 'right' });

        // 2. Preparar y dibujar la descripción con ancho fijo optimizado para 170 caracteres máximo
        let desc = item.description;
        if (item.discount && item.discount > 0) {
            desc += ` (descuento: ${item.discount.toFixed(2)})`;
        }
        
        // Usar ancho fijo optimizado para máximo 170 caracteres (85+85)
        const descLines = this.splitText(doc, desc, 35, 8);
        
        descLines.forEach((line, idx) => {
            const yPos = itemStartY + (idx * LINE_HEIGHT);
            doc.text(line, this.HORIZONTAL_MARGIN + 12, yPos);
        });
        
        // Avanzar posición fija basada en máximo de líneas posibles (5 líneas para 170 chars)
        currentY = itemStartY + (Math.max(descLines.length, 5) * LINE_HEIGHT) + 2;
    });
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(this.HORIZONTAL_MARGIN, currentY, this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const sunat = ticketData.sunat_totals;
    const totalSummaryEntry = ticketData.financial_breakdown.summary.find(s => 
      ['TOTAL A PAGAR', 'TOTAL'].includes((s.label || '').toString().toUpperCase().trim())
    );
    const totalPagarRaw = totalSummaryEntry?.value ?? '0.00';
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
      doc.text(t.label + ':', this.HORIZONTAL_MARGIN, currentY);
      doc.text(getCurrencySymbol(ticketData.currency_code || 'PEN'), this.TICKET_WIDTH - this.HORIZONTAL_MARGIN - 18, currentY, { align: 'right' });
      doc.text((Number(t.value ?? 0).toFixed(2)), this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });

    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(this.HORIZONTAL_MARGIN, currentY, this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const amountText = 'SON: ' + (ticketData.payment_info.amount_in_words || '');
    const amountLines = this.splitText(doc, amountText, this.CONTENT_WIDTH, 8);
    amountLines.forEach(line => {
      doc.text(line, this.HORIZONTAL_MARGIN, currentY);
      currentY += 3;
    });
    
    currentY += 1;
    const paymentLabel = ticketData.payment_info.payment_method_label || 'FORMA DE PAGO';
    doc.text(`${paymentLabel}: ${ticketData.payment_info.payment_method}`, this.HORIZONTAL_MARGIN, currentY);
    currentY += 4;

    return currentY;
  }

  /** BLOQUE 5: Añade el footer con QR y textos finales */
  private static async addFooter(doc: jsPDF, footer: TicketData['footer'], header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('¡Gracias por su preferencia!', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 6;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(footer.consultation_text, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    doc.text(footer.consultation_url, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    
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
        console.error('Error al generar QR:', error);
        doc.setFontSize(6);
        doc.text('[ERROR AL CARGAR QR]', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 8;
      }
    }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const titleLower = (header?.document_title || '').toLowerCase();
    const docType = titleLower.includes('boleta') ? 'BOLETA' : 
                    titleLower.includes('factura') ? 'FACTURA' : 
                    (header.document_title || '').toUpperCase();

    const legalLines = [
      'Bienes y servicios Transferidos en la amazonía región selva para ser consumidos en la misma.',
      `Representación impresa de la ${docType} DE VENTA ELECTRÓNICA, autorizado mediante la resolución N° 0340050001931 - SUNAT.`
    ];

    const maxLineWidth = this.CONTENT_WIDTH - 6;
    legalLines.forEach(line => {
      const wrappedLines = this.splitText(doc, line, maxLineWidth, 7);
      wrappedLines.forEach(wl => {
        doc.text(wl, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 3;
      });
      currentY += 1;
    });

    return currentY;
  }
  
  /** 
   * Utilidad para dividir texto en múltiples líneas si excede un ancho máximo.
   */
  private static splitText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    if (!text) return [''];

    // Primero dividir por saltos de línea explícitos
    const paragraphs = text.toString().split('\n');
    const allLines: string[] = [];

    // Procesar cada párrafo por separado
    paragraphs.forEach(paragraph => {
      if (!paragraph || paragraph.trim() === '') {
        allLines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        // Manejar palabras muy largas (como URLs o texto sin espacios)
        if (doc.getTextWidth(word) > maxWidth) {
          if (currentLine) {
            allLines.push(currentLine);
            currentLine = '';
          }
          let subWord = '';
          for (const char of word) {
            if (doc.getTextWidth(subWord + char) > maxWidth) {
              if (subWord) allLines.push(subWord);
              subWord = char;
            } else {
              subWord += char;
            }
          }
          if (subWord) {
            currentLine = subWord;
          }
          continue;
        }

        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (doc.getTextWidth(testLine) > maxWidth) {
          if (currentLine) allLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        allLines.push(currentLine);
      }
    });
    
    return allLines.length > 0 ? allLines : [''];
  }
}