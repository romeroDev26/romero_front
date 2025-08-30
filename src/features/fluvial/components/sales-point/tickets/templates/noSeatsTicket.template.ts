// src/features/fluvial/components/sales-point/tickets/templates/noSeatsTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData } from '../types/ticket.types';

/**
 * Template para generar PDFs de tickets de venta para embarcaciones sin asientos
 * Formato térmico de 80mm de ancho
 */
export class NoSeatsTicketTemplate {
  private static readonly TICKET_WIDTH = 80; // mm
  private static readonly MARGIN = 2; // mm
  private static readonly CONTENT_WIDTH = NoSeatsTicketTemplate.TICKET_WIDTH - (NoSeatsTicketTemplate.MARGIN * 2);

  static async generatePDF(ticketData: TicketData): Promise<jsPDF> {
    const INITIAL_HEIGHT = 300; // altura inicial mayor para acomodar texto adicional
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [this.TICKET_WIDTH, INITIAL_HEIGHT] });
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

    // Ajustar altura final
    const finalHeight = currentY + 40;
    doc.internal.pageSize.height = finalHeight;
    return doc;
  }

  private static addVentaDetailBlock(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DETALLE DE LA VENTA', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;

    // Table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('CANT.', this.MARGIN, currentY);
    doc.text('DESCRIPCIÓN', this.MARGIN + 12, currentY);
    doc.text('P/U', this.TICKET_WIDTH - this.MARGIN - 22, currentY, { align: 'right' });
    doc.text('TOTAL', this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    ticketData.financial_breakdown.items.forEach(item => {
      doc.text(String(item.quantity), this.MARGIN, currentY);
      let desc = item.description;
      if (item.discount && item.discount > 0) desc += ` (descuento: ${item.discount.toFixed(2)})`;

      // Calcular ancho disponible para la columna DESCRIPCIÓN (entre descX y la columna de P/U)
  const descX = this.MARGIN + 12;
  const priceX = this.TICKET_WIDTH - this.MARGIN - 22;
  // Añadir un padding extra para evitar que la descripción invada la columna de precios
  const DESC_RIGHT_PADDING = 8; // mm adicionales de separación
  const descMaxWidth = Math.max(10, priceX - descX - DESC_RIGHT_PADDING);

      // Obtener líneas envueltas; splitText ahora rompe palabras largas sin espacios
      const descLines = this.splitText(doc, desc, descMaxWidth, 8);

      descLines.forEach((line, idx) => {
        doc.text(line, descX, currentY);
        if (idx < descLines.length - 1) currentY += 3;
      });

      // Alinear los precios en la misma Y que la última línea de descripción
      doc.text(item.unit_price.toFixed(2), priceX, currentY, { align: 'right' });
      doc.text(item.total_line.toFixed(2), this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });

    // Dashed separator
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    let x = 0;
    while (x < this.TICKET_WIDTH) { const xEnd = Math.min(x + 2, this.TICKET_WIDTH); doc.line(x, currentY, xEnd, currentY); x += 3.5; }
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
      doc.text(t.label + ':', this.MARGIN, currentY);
      doc.text('S/', this.TICKET_WIDTH - this.MARGIN - 18, currentY, { align: 'right' });
      doc.text((t.value ?? '0.00'), this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
      currentY += 4;
    });

    // Separator
    x = 0; doc.setDrawColor(180, 180, 180); while (x < this.TICKET_WIDTH) { const xEnd = Math.min(x + 2, this.TICKET_WIDTH); doc.line(x, currentY, xEnd, currentY); x += 3.5; }
    currentY += 4;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('SON: ' + (ticketData.payment_info.amount_in_words || ''), this.MARGIN, currentY); currentY += 3;
    const paymentLabel = ticketData.payment_info.payment_method_label || 'FORMA DE PAGO';
    doc.text(`${paymentLabel}: ${ticketData.payment_info.payment_method}`, this.MARGIN, currentY); currentY += 4;

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
    currentY += 5; // bajar logo 12mm (reducción para ocupar menos espacio en blanco)
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
    if (header.branch_office_address) { doc.setFontSize(8); doc.setFont('helvetica', 'normal'); const addrLines = this.splitText(doc, header.branch_office_address, this.CONTENT_WIDTH, 8); addrLines.forEach(line => { doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 2.8; }); currentY += 1.2; }

    // Teléfono de la sucursal
    if (header.branch_office_phone) { doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text(`Contacto de sucursal: ${header.branch_office_phone}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 2.8; }

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
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('PASAJERO:', this.MARGIN, currentY); currentY += 4;
    doc.setFont('helvetica', 'normal'); const nameLines = this.splitText(doc, passengerInfo.full_name, this.CONTENT_WIDTH, 7); nameLines.forEach(line => { doc.text(line, this.MARGIN, currentY); currentY += 3; }); currentY += 1; doc.setFontSize(7); doc.text(`${passengerInfo.doc_label}: ${passengerInfo.doc_number}`, this.MARGIN, currentY); currentY += 4;
    return currentY;
  }

  private static addTripDetails(doc: jsPDF, tripDetails: TicketData['trip_details'], startY: number): number {
    let currentY = startY;
    doc.setFontSize(7); doc.setLineWidth(0.2); doc.setDrawColor(180, 180, 180); doc.line(0, currentY, this.TICKET_WIDTH, currentY); currentY += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(tripDetails.title, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 6;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    const colWidth = (this.CONTENT_WIDTH - 2) / 2; const leftX = this.MARGIN; const rightX = this.MARGIN + colWidth + 2;

    const findByLabel = (pattern: RegExp) => tripDetails.details.find(d => pattern.test((d.label || '').toString().toUpperCase()));
    const vesselItem = findByLabel(/EMBARC|EMBARCACIÓN|EMBARCACION/);
    const dateItem = findByLabel(/FECHA/);
    const boardingItem = findByLabel(/EMBARQ|EMBARQUE|HORA\s*EMBARQUE/);
    const departureItem = findByLabel(/SALIDA|HORA\s*SALIDA|HORA\s*DE?\s*VIAJE|HORA\s*VIAJE/);
    const originItem = findByLabel(/ORIGEN/);
    const destItem = findByLabel(/DESTINO/);
    const seatItem = findByLabel(/ASIENTO/);

    // Row 1 labels
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text('EMBARCACIÓN:', leftX, currentY); doc.text('FECHA VIAJE:', rightX, currentY); currentY += 3;
    doc.setFontSize(8.5);
    const vesselLines = vesselItem ? this.splitText(doc, vesselItem.value, colWidth, 8.5) : [''];
    const dateLines = dateItem ? this.splitText(doc, dateItem.value, colWidth, 8.5) : [''];
    const maxLines1 = Math.max(vesselLines.length, dateLines.length);
    for (let i = 0; i < maxLines1; i++) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text(vesselLines[i] ?? '', leftX, currentY); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.text(dateLines[i] ?? '', rightX, currentY); currentY += 3; }
    currentY += 4;

    // Port
    if (tripDetails.port_name || tripDetails.port_address) {
      const portNameLines = this.splitText(doc, tripDetails.port_name ?? '', colWidth, 9);
      const portAddrLines = this.splitText(doc, tripDetails.port_address ?? '', colWidth, 9);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text('PUERTO:', leftX, currentY); doc.text('DIRECCIÓN PUERTO:', rightX, currentY); currentY += 3;
      const maxPortLines = Math.max(portNameLines.length, portAddrLines.length);
      for (let i = 0; i < maxPortLines; i++) { doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.text(portNameLines[i] ?? '', leftX, currentY); doc.text(portAddrLines[i] ?? '', rightX, currentY); currentY += 3; }
      currentY += 3;
    }

    // Embark / Departure
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text('EMBARQUE:', leftX, currentY); doc.text('SALIDA:', rightX, currentY); currentY += 3;
    const boardingLines = boardingItem ? this.splitText(doc, boardingItem.value, colWidth, 8.5) : [''];
    const departureLines = departureItem ? this.splitText(doc, departureItem.value, colWidth, 8.5) : [''];
    const maxLines2 = Math.max(boardingLines.length, departureLines.length);
    for (let i = 0; i < maxLines2; i++) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text(boardingLines[i] ?? '', leftX, currentY); doc.text(departureLines[i] ?? '', rightX, currentY); currentY += 3; }
    currentY += 3;

    // Origin / Destination
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text('ORIGEN:', leftX, currentY); doc.text('DESTINO:', rightX, currentY); currentY += 3;
    const originLines = originItem ? this.splitText(doc, originItem.value, colWidth, 9) : [''];
    const destLines = destItem ? this.splitText(doc, destItem.value, colWidth, 9) : [''];
    const maxLines3 = Math.max(originLines.length, destLines.length);
    for (let i = 0; i < maxLines3; i++) { doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text(originLines[i] ?? '', leftX, currentY); doc.text(destLines[i] ?? '', rightX, currentY); currentY += 3.5; }
    currentY += 3;

    // Seat
    if (seatItem) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(`ASIENTO: ${seatItem.value}`, leftX, currentY);
      const baggageLabel = 'N° EQUIPAJE:'; doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text(baggageLabel, rightX, currentY);
      const boxSize = 12; const boxX = this.TICKET_WIDTH - this.MARGIN - boxSize; const boxTopY = currentY - (boxSize - 4);
      doc.setLineWidth(0.8); doc.rect(boxX, boxTopY, boxSize, boxSize);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); currentY += 6;
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
