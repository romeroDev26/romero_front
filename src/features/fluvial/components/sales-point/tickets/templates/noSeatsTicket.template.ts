// src/features/fluvial/components/sales-point/tickets/templates/noSeatsTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData } from '../types/ticket.types';

/**
 * Template para generar PDFs de tickets de venta para embarcaciones sin asientos
 * Formato térmico de 80mm de ancho
 */
export class NoSeatsTicketTemplate {
  private static readonly TICKET_WIDTH = 80; // mm
  private static readonly HORIZONTAL_MARGIN = 2; // mm
  private static readonly BOTTOM_MARGIN = 10; // mm
  private static readonly CONTENT_WIDTH = NoSeatsTicketTemplate.TICKET_WIDTH - (NoSeatsTicketTemplate.HORIZONTAL_MARGIN * 2);
  
  // Constantes para cálculo de altura
  private static readonly BASE_HEIGHT = 280; // mm
  private static readonly MAX_CHARS_PER_DESCRIPTION = 170;
  private static readonly CHARS_PER_LINE = 35;
  private static readonly FINANCIAL_SUMMARY_HEIGHT = 60; // mm

  /**
   * Calcula la altura fija del ticket basada en el contenido
   */
  private static calculateFixedTicketHeight(ticketData: TicketData): number {
    let totalDescriptionChars = 0;
    
    // Contar caracteres de todas las descripciones
    ticketData.financial_breakdown.items.forEach(item => {
      let desc = item.description;
      if (item.discount && item.discount > 0) {
        desc += ` (descuento: ${item.discount.toFixed(2)})`;
      }
      totalDescriptionChars += desc.length;
    });
    
    // Calcular líneas adicionales necesarias
    const extraChars = Math.max(0, totalDescriptionChars - this.MAX_CHARS_PER_DESCRIPTION);
    const extraLines = Math.ceil(extraChars / this.CHARS_PER_LINE);
    const extraHeight = extraLines * 4; // 4mm por línea adicional
    
    // Altura total = altura base + altura del resumen financiero + altura extra + margen inferior
    const totalHeight = this.BASE_HEIGHT + this.FINANCIAL_SUMMARY_HEIGHT + extraHeight + this.BOTTOM_MARGIN;
    
    // Limitar entre 200 y 400mm
    return Math.max(200, Math.min(400, totalHeight));
  }

  static async generatePDF(ticketData: TicketData): Promise<jsPDF> {
    const calculatedHeight = this.calculateFixedTicketHeight(ticketData);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [this.TICKET_WIDTH, calculatedHeight] });
    doc.setFont('helvetica');
    let currentY = 0;

    // Header
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 1;

    // Passenger
    currentY = this.addPassengerInfo(doc, ticketData.passenger_info, currentY);
    currentY += 1;

    // Trip details
    currentY = this.addTripDetails(doc, ticketData.trip_details, currentY);
    currentY += 1;

    // Sale detail
    currentY = this.addVentaDetailBlock(doc, ticketData, currentY);
    currentY += 1;

    // Footer with QR
    currentY = await this.addFooter(doc, ticketData.footer, ticketData.header, currentY);

    return doc;
  }

  private static addVentaDetailBlock(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    const LINE_HEIGHT = 3.5; // Altura de línea consistente

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DETALLE DE LA VENTA', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;

    // Table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CANT.', this.HORIZONTAL_MARGIN, currentY);
    doc.text('DESCRIPCIÓN', this.HORIZONTAL_MARGIN + 12, currentY);
    doc.text('P/U', this.TICKET_WIDTH - this.HORIZONTAL_MARGIN - 22, currentY, { align: 'right' });
    doc.text('TOTAL', this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY, { align: 'right' });
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    ticketData.financial_breakdown.items.forEach(item => {
      // Dibujar columnas estáticas primero
      doc.text(String(item.quantity), this.HORIZONTAL_MARGIN, currentY);
      doc.text(item.unit_price.toFixed(2), this.TICKET_WIDTH - this.HORIZONTAL_MARGIN - 22, currentY, { align: 'right' });
      doc.text(item.total_line.toFixed(2), this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY, { align: 'right' });

      // Preparar y dibujar descripción
      let desc = item.description;
      if (item.discount && item.discount > 0) desc += ` (descuento: ${item.discount.toFixed(2)})`;

      const descX = this.HORIZONTAL_MARGIN + 12;
      const priceX = this.TICKET_WIDTH - this.HORIZONTAL_MARGIN - 22;
      const DESC_RIGHT_PADDING = 8;
      const descMaxWidth = Math.max(10, priceX - descX - DESC_RIGHT_PADDING);

      // Obtener líneas envueltas con ancho fijo (35 caracteres por línea, máximo 8 líneas)
      const descLines = this.splitText(doc, desc, descMaxWidth, 8).slice(0, 8);

      descLines.forEach((line, idx) => {
        doc.text(line, descX, currentY + (idx * LINE_HEIGHT));
      });

      // Avanzar currentY basado en máximo de 5 líneas posibles
      currentY += Math.max(5, descLines.length) * LINE_HEIGHT;
    });

    // Línea separadora sólida
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(this.HORIZONTAL_MARGIN, currentY, this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY);
    currentY += 4;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const sunat = ticketData.sunat_totals;
    // Buscar específicamente la entrada 'TOTAL A PAGAR' en el resumen.
    // Evitamos usar includes('TOTAL') porque 'SUBTOTAL' contiene la misma subcadena.
    const totalSummaryEntry = ticketData.financial_breakdown.summary.find(s => {
      const lab = (s.label || '').toString().toUpperCase().trim();
      return lab === 'TOTAL A PAGAR' || lab === 'TOTAL' || lab.includes('TOTAL A PAGAR');
    });
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
      doc.text('S/', this.TICKET_WIDTH - this.HORIZONTAL_MARGIN - 18, currentY, { align: 'right' });
      doc.text((t.value ?? '0.00'), this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });

    // Línea separadora sólida
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(this.HORIZONTAL_MARGIN, currentY, this.TICKET_WIDTH - this.HORIZONTAL_MARGIN, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('SON: ' + (ticketData.payment_info.amount_in_words || ''), this.HORIZONTAL_MARGIN, currentY); currentY += 3;
    const paymentLabel = ticketData.payment_info.payment_method_label || 'FORMA DE PAGO';
    doc.text(`${paymentLabel}: ${ticketData.payment_info.payment_method}`, this.HORIZONTAL_MARGIN, currentY); currentY += 4;

    return currentY;
  }

  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    let currentY = Math.max(startY, 0);

    // Logo (bajado ~24mm)
    if (header.company_logo_url) {
      try {
        const logoImg = new Image(); logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => { logoImg.onload = () => resolve(); logoImg.onerror = () => reject(new Error('Error cargando logo')); logoImg.src = header.company_logo_url!; });
        const maxLogoWidth = 46; const logoAspectRatio = logoImg.height / logoImg.width; const logoWidth = Math.min(maxLogoWidth, 46); const logoHeight = logoWidth * logoAspectRatio;
        const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
        currentY += 12; // bajar logo con más margen superior
        doc.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 2.5;
      } catch (e) { console.error('Error cargando logo:', e); currentY += 2.5; }
    }

    // Frase estática
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); try { doc.text('Sirviendo a la Amazonía Peruana', this.TICKET_WIDTH / 2, currentY, { align: 'center' }); } catch {} currentY += 4.5;

    // Nombre de la empresa
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); const companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, 11);
    companyLines.forEach(line => { doc.text(line.toString().toUpperCase(), this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3.8; });

    // RUC
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(`RUC: ${header.company_ruc}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3.5;

    // Dirección
    doc.setFontSize(8); const addressLines = this.splitText(doc, header.company_address, this.CONTENT_WIDTH, 8);
    addressLines.forEach(line => { doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 2.8; }); currentY += 1.2;

    // Teléfonos
    if (header.company_phones.length > 0) { const phonesText = `Tel: ${header.company_phones.join(', ')}`; doc.setFontSize(8); doc.text(phonesText, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3.2; }

    // Punto de emisión
    if (header.emission_point) { doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text(`PUNTO DE EMISIÓN: ${header.emission_point}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3.2; }

    // Dirección de sucursal
    if (header.branch_office_address) { 
      const addrLines = this.splitText(doc, header.branch_office_address, this.CONTENT_WIDTH, 8); // Aumentado de 7 a 8
      addrLines.forEach(line => { doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 2.2; }); // Aumentado de 3 a 2.2
      currentY += 1.2; // Aumentado de 1 a 1.2
    }

    // Teléfono de la sucursal
    if (header.branch_office_phone) { 
      doc.setFontSize(8); // Aumentado de 7 a 8
      doc.setFont('helvetica', 'normal'); 
      doc.text(`Contacto de sucursal: ${header.branch_office_phone}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); 
      currentY += 2.8; // Aumentado de 3 a 2.8
    }
    currentY += 1;

    // Separador
    doc.setLineWidth(0.2); doc.setDrawColor(180, 180, 180); doc.line(0, currentY, this.TICKET_WIDTH, currentY); currentY += 4;

    // Tipo y número de documento
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3.5; doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 4;

    // Fecha y vendedor
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text(header.emission_datetime, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3; doc.text(`Vendedor: ${header.seller_name}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3;

    return currentY;
  }

  private static addPassengerInfo(doc: jsPDF, passengerInfo: TicketData['passenger_info'], startY: number): number {
    let currentY = startY;
    doc.setFontSize(8); doc.setLineWidth(0.2); doc.setDrawColor(180, 180, 180); doc.line(0, currentY, this.TICKET_WIDTH, currentY); currentY += 4;
    
    // Preparar columnas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.HORIZONTAL_MARGIN;
    const rightX = this.HORIZONTAL_MARGIN + colWidth + 2;

    // FILA 1: etiquetas (NOMBRE / DOCUMENTO)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('NOMBRE:', leftX, currentY);
    doc.text('DOCUMENTO:', rightX, currentY);
    currentY += 4; // espacio antes de los valores (aumentado de 3 a 4)

    // FILA 1b: valores debajo de las etiquetas (usar tamaño 11)
    doc.setFontSize(11);
    const nameLines = this.splitText(doc, passengerInfo.full_name, colWidth, 11);
    const docLines = this.splitText(doc, `${passengerInfo.doc_label}: ${passengerInfo.doc_number}`, colWidth, 11);
    const maxLines = Math.max(nameLines.length, docLines.length);
    for (let i = 0; i < maxLines; i++) {
      // Nombre: normal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((nameLines[i] ?? '').toUpperCase(), leftX, currentY);
      // Documento: normal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((docLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4; // línea con más espacio (aumentado de 3 a 4)
    }
    currentY += 4; // espacio aumentado entre bloques
    return currentY;
  }

  private static addTripDetails(doc: jsPDF, tripDetails: TicketData['trip_details'], startY: number): number {
    let currentY = startY;
    doc.setFontSize(7); doc.setLineWidth(0.2); doc.setDrawColor(180, 180, 180); doc.line(0, currentY, this.TICKET_WIDTH, currentY); currentY += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(tripDetails.title, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 6;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    const colWidth = (this.CONTENT_WIDTH - 2) / 2; const leftX = this.HORIZONTAL_MARGIN; const rightX = this.HORIZONTAL_MARGIN + colWidth + 2;

    const findByLabel = (pattern: RegExp) => tripDetails.details.find(d => pattern.test((d.label || '').toString().toUpperCase()));
    const vesselItem = findByLabel(/EMBARC|EMBARCACIÓN|EMBARCACION/);
    const dateItem = findByLabel(/FECHA/);
    const boardingItem = findByLabel(/EMBARQ|EMBARQUE|HORA\s*EMBARQUE/);
    const departureItem = findByLabel(/SALIDA|HORA\s*SALIDA|HORA\s*DE?\s*VIAJE|HORA\s*VIAJE/);
    const originItem = findByLabel(/ORIGEN/);
    const destItem = findByLabel(/DESTINO/);
    const seatItem = findByLabel(/ASIENTO/);

    // Row 1 labels
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text('EMBARCACIÓN:', leftX, currentY); doc.text('FECHA VIAJE:', rightX, currentY); currentY += 4; // aumentado de 3 a 4
    doc.setFontSize(11);
    const vesselLines = vesselItem ? this.splitText(doc, vesselItem.value.toUpperCase(), colWidth, 11) : [''];
    const dateLines = dateItem ? this.splitText(doc, dateItem.value.toUpperCase(), colWidth, 11) : [''];
    const maxLines1 = Math.max(vesselLines.length, dateLines.length);
    for (let i = 0; i < maxLines1; i++) { doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text(vesselLines[i] ?? '', leftX, currentY); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(dateLines[i] ?? '', rightX, currentY); currentY += 4; } // aumentado de 3 a 4
    currentY += 4; // aumentado de 4 a 4 (ya estaba)

    // Port
    if (tripDetails.port_name || tripDetails.port_address) {
      const portNameLines = this.splitText(doc, (tripDetails.port_name ?? '').toUpperCase(), colWidth, 11);
      const portAddrLines = this.splitText(doc, (tripDetails.port_address ?? '').toUpperCase(), colWidth, 11);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text('PUERTO:', leftX, currentY); doc.text('DIRECCIÓN PUERTO:', rightX, currentY); currentY += 3;
      const maxPortLines = Math.max(portNameLines.length, portAddrLines.length);
      for (let i = 0; i < maxPortLines; i++) { doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text(portNameLines[i] ?? '', leftX, currentY); doc.text(portAddrLines[i] ?? '', rightX, currentY); currentY += 3; }
      currentY += 3;
    }

    // Embark / Departure
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text('EMBARQUE:', leftX, currentY); doc.text('SALIDA:', rightX, currentY); currentY += 4; // aumentado de 3 a 4
    const boardingLines = boardingItem ? this.splitText(doc, boardingItem.value.toUpperCase(), colWidth, 11) : [''];
    const departureLines = departureItem ? this.splitText(doc, departureItem.value.toUpperCase(), colWidth, 11) : [''];
    const maxLines2 = Math.max(boardingLines.length, departureLines.length);
    for (let i = 0; i < maxLines2; i++) { doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text(boardingLines[i] ?? '', leftX, currentY); doc.text(departureLines[i] ?? '', rightX, currentY); currentY += 4; } // aumentado de 3 a 4
    currentY += 4; // aumentado de 3 a 4

    // Origin / Destination
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text('ORIGEN:', leftX, currentY); doc.text('DESTINO:', rightX, currentY); currentY += 4; // aumentado de 3 a 4
    const originLines = originItem ? this.splitText(doc, originItem.value.toUpperCase(), colWidth, 11) : [''];
    const destLines = destItem ? this.splitText(doc, destItem.value.toUpperCase(), colWidth, 11) : [''];
    const maxLines3 = Math.max(originLines.length, destLines.length);
    for (let i = 0; i < maxLines3; i++) { doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(originLines[i] ?? '', leftX, currentY); doc.text(destLines[i] ?? '', rightX, currentY); currentY += 4; } // aumentado de 3.5 a 4
    currentY += 4; // aumentado de 3 a 4

    // Seat
    if (seatItem) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(`ASIENTO: ${seatItem.value.toUpperCase()}`, leftX, currentY);
      currentY += 6;
    }

    doc.setLineWidth(0.2); doc.setDrawColor(180, 180, 180); doc.line(0, currentY, this.TICKET_WIDTH, currentY); currentY += 4;
    return currentY;
  }

  private static async addFooter(doc: jsPDF, footer: TicketData['footer'], header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
    doc.setFontSize(7); doc.setLineWidth(0.2); doc.setDrawColor(180, 180, 180); doc.line(0, currentY, this.TICKET_WIDTH, currentY); currentY += 4;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.text('¡Gracias por su preferencia!', this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 6;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.text(footer.consultation_text, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3; doc.text(footer.consultation_url, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 5;

    if (footer.qr_code_base64) {
      try {
        const qrSize = 25; const qrDataUrl = footer.qr_code_base64.startsWith('data:image') ? footer.qr_code_base64 : `data:image/png;base64,${footer.qr_code_base64}`;
        const qrX = (this.TICKET_WIDTH - qrSize) / 2; doc.addImage(qrDataUrl, 'PNG', qrX, currentY, qrSize, qrSize); currentY += qrSize + 3;
      } catch (error) { console.error('Error generando QR:', error); doc.setFontSize(5); doc.text('[ERROR QR]', this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 8; }
    }

    // Texto legal
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    try {
      const titleLower = (header && header.document_title) ? header.document_title.toLowerCase() : '';
      const docType = titleLower.includes('boleta') ? 'BOLETA' : titleLower.includes('factura') ? 'FACTURA' : (header.document_title ? header.document_title.toString().toUpperCase() : '');
      const legalLines = [
        'Bienes y servicios Transferidos en la amazonía región selva para ser consumidos en la misma',
        `Representación impresa de la ${docType} DE VENTA ELECTRÓNICA, autorizado mediante la resolución N° 0340050001931 - SUNAT.`,
      ];
      const extraMargin = 6; const maxLineWidth = Math.max(10, this.CONTENT_WIDTH - (extraMargin * 2));
      legalLines.forEach((line, idx) => { const wrapped = this.splitText(doc, line, maxLineWidth, 7); wrapped.forEach(wl => { doc.text(wl, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3; }); currentY += (idx === 1) ? 2 : 1; });
    } catch (e) { console.error('Error añadiendo texto legal:', e); }

    return currentY;
  }

  private static splitText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    const raw = (text || '').toString();
    const words = raw.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    const pushLine = (line: string) => { if (line !== undefined && line !== null && line !== '') lines.push(line); };

    for (const word of words) {
      const prefix = currentLine ? currentLine + ' ' : '';
      const testLine = prefix + word;
      if (doc.getTextWidth(testLine) <= maxWidth) {
        currentLine = testLine;
        continue;
      }

      // Si la palabra por sí sola cabe en una nueva línea, empujar la línea actual y empezar nueva
      if (doc.getTextWidth(word) <= maxWidth) {
        if (currentLine) { pushLine(currentLine); }
        currentLine = word;
        continue;
      }

      // La palabra es demasiado larga (sin espacios). Romperla en fragmentos que quepan.
      if (currentLine) { pushLine(currentLine); currentLine = ''; }
      let fragment = '';
      for (const ch of word) {
        const testFrag = fragment + ch;
        if (doc.getTextWidth(testFrag) <= maxWidth) {
          fragment = testFrag;
        } else {
          // empujar fragmento y empezar uno nuevo
          pushLine(fragment);
          fragment = ch;
        }
      }
      if (fragment) pushLine(fragment);
    }

    if (currentLine) pushLine(currentLine);
    return lines;
  }
}
