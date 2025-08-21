// src/features/fluvial/components/sales-point/tickets/templates/normalTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData } from '../types/ticket.types';

/**
 * Template para generar PDFs de tickets de venta normal
 * Formato térmico de 80mm de ancho
 */
export class NormalTicketTemplate {
  
  private static readonly TICKET_WIDTH = 80; // mm
  private static readonly MARGIN = 2; // mm
  private static readonly CONTENT_WIDTH = NormalTicketTemplate.TICKET_WIDTH - (NormalTicketTemplate.MARGIN * 2);
  
  /** Genera el PDF del ticket usando los datos transformados */
  static async generatePDF(ticketData: TicketData): Promise<jsPDF> {
    // Crear documento con altura automática (se ajustará al contenido)
    // Aumentar la altura inicial del ticket para dejar espacio extra para texto legal
    const INITIAL_HEIGHT = 300; // altura inicial mayor para acomodar texto adicional
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [this.TICKET_WIDTH, INITIAL_HEIGHT] // Altura inicial aumentada
    });
    
  doc.setFont('helvetica');
  let currentY = 0;
    
  // BLOQUE 1: CABECERA
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 1; // Pequeño espacio después de la cabecera
    
  // BLOQUE 2: INFORMACIÓN DEL PASAJERO
    currentY = this.addPassengerInfo(doc, ticketData.passenger_info, currentY);
    currentY += 1; // Pequeño espacio después del pasajero
    
  // BLOQUE 3: DETALLES DEL VIAJE
    currentY = this.addTripDetails(doc, ticketData.trip_details, currentY);
    currentY += 1; // Pequeño espacio después del viaje
    
    // BLOQUE 5: DETALLE DE LA VENTA (tabla de items y totales SUNAT)
    currentY = this.addVentaDetailBlock(doc, ticketData, currentY);
    currentY += 1; // Pequeño espacio después de la venta

  // BLOQUE 6: PIE DE PÁGINA CON QR
  currentY = await this.addFooter(doc, ticketData.footer, ticketData.header, currentY);

  // Ajustar la altura del documento al contenido
  const finalHeight = currentY + 40; // margen final mayor para el nuevo texto
    doc.internal.pageSize.height = finalHeight;

    return doc;
  }


  /** BLOQUE 5: DETALLE DE LA VENTA (tabla de items y totales SUNAT) */
  private static addVentaDetailBlock(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DETALLE DE LA VENTA', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5; // Espacio adecuado después del título
    // Encabezado de tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
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
      const descLines = this.splitText(doc, desc, 32, 8);
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
  currentY += 4; // Espacio adecuado después del separador
  // Totales SUNAT
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const sunat = ticketData.sunat_totals;
    // Tomar el valor de TOTAL A PAGAR exactamente como viene del transformer/backend
    const totalPagarRaw = ticketData.financial_breakdown.summary.find(s => s.label.toUpperCase().includes('TOTAL'))?.value ?? '0.00';
    // Limpiar el S/ del valor si viene incluido desde el backend
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
  // Línea separadora (gris)
    doc.setDrawColor(180, 180, 180);
    x = 0;
    while (x < this.TICKET_WIDTH) {
      const xEnd = Math.min(x + 2, this.TICKET_WIDTH);
      doc.line(x, currentY, xEnd, currentY);
      x += 3.5;
    }
  currentY += 4; // Espacio adecuado después del separador
  // Monto en palabras y forma de pago
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('SON: ' + ticketData.payment_info.amount_in_words, this.MARGIN, currentY);
    currentY += 4;
    doc.text(ticketData.payment_info.payment_method_label + ' ' + ticketData.payment_info.payment_method, this.MARGIN, currentY);
    currentY += 4;
    return currentY;
  }
  
  /** BLOQUE 1: Añade el encabezado completo con logo y datos de empresa */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    let currentY = Math.max(startY, 0.5);
     
    // SOLO LOGO - sin texto adicional
  if (header.company_logo_url) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error('Error cargando logo'));
          logoImg.src = header.company_logo_url!;
        });
  // Calcular dimensiones del logo (máximo 46mm de ancho)
  const maxLogoWidth = 46;
  const logoAspectRatio = logoImg.height / logoImg.width;
  const logoWidth = Math.min(maxLogoWidth, 46);
  const logoHeight = logoWidth * logoAspectRatio;
        // Centrar el logo
        const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
        // Colocar el logo completamente arriba
  doc.addImage(logoImg, 'PNG', logoX, currentY, logoWidth, logoHeight);
    currentY += logoHeight + 4;
      } catch (error) {
        console.error('Error cargando logo:', error);
        // Si no hay logo, no mostrar nada - continuar directamente
        currentY += 6;
      }
    }

  // Frase estática de la empresa
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
    try {
      doc.text('Sirviendo a la Amazonía Peruana', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    } catch (e) {
      console.error('Error escribiendo frase estática en ticket:', e);
    }
  currentY += 6;
    
  // Nombre de la empresa
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, 11);
    companyLines.forEach(line => {
      doc.text(line.toString().toUpperCase(), this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 4.0; // más separación entre líneas del nombre de la empresa
    });
    
  // RUC
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${header.company_ruc}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
  // Dirección
  doc.setFontSize(8);
  const addressLines = this.splitText(doc, header.company_address, this.CONTENT_WIDTH, 8);
    addressLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.0; // mayor interlineado para dirección
    });
    currentY += 2.0; // espacio después de dirección
    
  // Teléfonos
    if (header.company_phones.length > 0) {
      const phonesText = `Tel: ${header.company_phones.join(', ')}`;
      doc.text(phonesText, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.5; // más espacio para que coincida con el ejemplo
    }
    
  // Punto de emisión
    if (header.emission_point) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
      doc.text(`PUNTO DE EMISIÓN: ${header.emission_point}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.2;
    }
  // Dirección de la sucursal
    if (header.branch_office_address) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const addrLines = this.splitText(doc, header.branch_office_address, this.CONTENT_WIDTH, 8);
      addrLines.forEach(line => {
        doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 2.2;
      });
      currentY += 1;
    }
  // Teléfono de la sucursal
    if (header.branch_office_phone) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Contacto de sucursal: ${header.branch_office_phone}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 2.6;
    }

  // Línea separadora continua (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador
    
  // Tipo y número de documento
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
    doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5; // Espacio adecuado después del documento
    
  // Fecha y hora de emisión
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
    doc.text(header.emission_datetime, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
  // Vendedor
  doc.text(`Vendedor: ${header.seller_name}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    return currentY;
  }
  
  /** BLOQUE 2: Añade la información del pasajero */
  private static addPassengerInfo(doc: jsPDF, passengerInfo: TicketData['passenger_info'], startY: number): number {
    let currentY = startY;
    
  // Línea separadora continua (gris)
  doc.setFontSize(8);
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador
    
  // PASAJERO:
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PASAJERO:', this.MARGIN, currentY);
    currentY += 4;

    // Nombre del pasajero (una o varias líneas)
    doc.setFont('helvetica', 'normal');
    const nameLines = this.splitText(doc, passengerInfo.full_name, this.CONTENT_WIDTH, 7);
    nameLines.forEach(line => {
      doc.text(line, this.MARGIN, currentY);
      currentY += 3;
    });

  currentY += 1;

    // Documento del pasajero en su propia línea
    doc.setFontSize(7);
    doc.text(`${passengerInfo.doc_label}: ${passengerInfo.doc_number}`, this.MARGIN, currentY);
    currentY += 4;
    
  return currentY;
  }
  
  /** BLOQUE 3: Añade los detalles del viaje */
  private static addTripDetails(doc: jsPDF, tripDetails: TicketData['trip_details'], startY: number): number {
    let currentY = startY;
    // Línea separadora continua (gris)
    doc.setFontSize(7);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador
    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(tripDetails.title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;

  // Preparar columnas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.MARGIN;
    const rightX = this.MARGIN + colWidth + 2;

  // Helpers: buscar por etiquetas conocidas
    const findByLabel = (pattern: RegExp) => tripDetails.details.find(d => pattern.test((d.label || '').toString().toUpperCase()));

    const vesselItem = findByLabel(/EMBARC|EMBARCACIÓN|EMBARCACION/);
    const dateItem = findByLabel(/FECHA/);
    const boardingItem = findByLabel(/EMBARQ|EMBARQUE|HORA\s*EMBARQUE/);
    const departureItem = findByLabel(/SALIDA|HORA\s*SALIDA|HORA\s*DE?\s*VIAJE|HORA\s*VIAJE/);
    const originItem = findByLabel(/ORIGEN/);
    const destItem = findByLabel(/DESTINO/);
    const seatItem = findByLabel(/ASIENTO/);

  // FILA 1: etiquetas (EMBARCACIÓN / FECHA VIAJE)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('EMBARCACIÓN:', leftX, currentY);
    doc.text('FECHA VIAJE:', rightX, currentY);
    currentY += 2.5; // menor espacio antes de los valores

    // FILA 1b: valores debajo de las etiquetas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const vesselLines = vesselItem ? this.splitText(doc, vesselItem.value, colWidth, 7) : [''];
    const dateLines = dateItem ? this.splitText(doc, dateItem.value, colWidth, 7) : [''];
    const maxLines1 = Math.max(vesselLines.length, dateLines.length);
    for (let i = 0; i < maxLines1; i++) {
      doc.text(vesselLines[i] ?? '', leftX, currentY);
      doc.text(dateLines[i] ?? '', rightX, currentY);
      currentY += 2.5; // linea más ajustada
    }
  currentY += 3; // espacio reducido entre bloques

  // --- PUERTO y DIRECCIÓN DEL PUERTO
    if (tripDetails.port_name || tripDetails.port_address) {
      const portNameLines = this.splitText(doc, tripDetails.port_name ?? '', colWidth, 9);
      const portAddrLines = this.splitText(doc, tripDetails.port_address ?? '', colWidth, 9);
  // Etiquetas
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('PUERTO:', leftX, currentY);
      doc.text('DIRECCIÓN PUERTO:', rightX, currentY);
      currentY += 2.7;

  // Valores
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const maxPortLines = Math.max(portNameLines.length, portAddrLines.length);
      for (let i = 0; i < maxPortLines; i++) {
        doc.text(portNameLines[i] ?? '', leftX, currentY);
        doc.text(portAddrLines[i] ?? '', rightX, currentY);
        currentY += 3;
      }

  currentY += 2; // espacio después del bloque de puerto
    }

  // FILA 2: etiquetas (EMBARQUE / SALIDA)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('EMBARQUE:', leftX, currentY);
    doc.text('SALIDA:', rightX, currentY);
    currentY += 2.5;

    // FILA 2b: valores debajo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const boardingLines = boardingItem ? this.splitText(doc, boardingItem.value, colWidth, 7) : [''];
    const departureLines = departureItem ? this.splitText(doc, departureItem.value, colWidth, 7) : [''];
    const maxLines2 = Math.max(boardingLines.length, departureLines.length);
    for (let i = 0; i < maxLines2; i++) {
      doc.text(boardingLines[i] ?? '', leftX, currentY);
      doc.text(departureLines[i] ?? '', rightX, currentY);
      currentY += 2.5;
    }
    currentY += 3;

  // FILA 3: etiquetas (ORIGEN / DESTINO)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ORIGEN:', leftX, currentY);
    doc.text('DESTINO:', rightX, currentY);
    currentY += 2.5;

    // FILA 3b: valores debajo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const originLines = originItem ? this.splitText(doc, originItem.value, colWidth, 7) : [''];
    const destLines = destItem ? this.splitText(doc, destItem.value, colWidth, 7) : [''];
    const maxLines3 = Math.max(originLines.length, destLines.length);
    for (let i = 0; i < maxLines3; i++) {
      doc.text(originLines[i] ?? '', leftX, currentY);
      doc.text(destLines[i] ?? '', rightX, currentY);
      currentY += 2.5;
    }
    currentY += 3;

  // ASIENTO en su propia línea
    if (seatItem) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9); // mismo tamaño que los valores de PUERTO
      // ASIENTO a la izquierda
      doc.text(`ASIENTO: ${seatItem.value}`, leftX, currentY);

  // Etiqueta N° EQUIPAJE en la columna derecha
      const baggageLabel = 'N° EQUIPAJE:';
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(baggageLabel, rightX, currentY);

  // Dibujar un cuadrado para N° EQUIPAJE
      const boxSize = 12; // mm
      const boxX = this.TICKET_WIDTH - this.MARGIN - boxSize; // posición derecha
      const boxTopY = currentY - (boxSize - 4); // ajustar para alinear verticalmente con el texto
      doc.setLineWidth(0.8);
      doc.rect(boxX, boxTopY, boxSize, boxSize);

      // Restaurar fuente y avanzar
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      currentY += 6;
    }

  // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;

    return currentY;
  }
  
  
  
  /** BLOQUE 6: Añade el footer con QR real y URL de consulta */
  private static async addFooter(doc: jsPDF, footer: TicketData['footer'], header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
    
  // Línea separadora continua (gris)
    doc.setFontSize(7);
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
  doc.setFontSize(7);
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
  doc.setFontSize(6);
        doc.text('[ERROR QR]', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 8;
      }
    }

  // TEXTO LEGAL: añadir texto centrado después del QR
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
    try {
  const titleLower = (header && header.document_title) ? header.document_title.toLowerCase() : '';
  const docType = titleLower.includes('boleta') ? 'BOLETA' : titleLower.includes('factura') ? 'FACTURA' : (header.document_title ? header.document_title.toString().toUpperCase() : '');
  // Forzar saltos de línea explícitos
      const legalLines = [
        'Bienes y servicios Transferidos en la amazonía región selva para ser consumidos en la misma',
        `Representación impresa de la ${docType} DE VENTA ELECTRÓNICA, autorizado mediante la resolución N° 0340050001931 - SUNAT.`,
      ];
  // Márgenes internos para el texto legal
  const extraMargin = 6;
      const maxLineWidth = Math.max(10, this.CONTENT_WIDTH - (extraMargin * 2));
      legalLines.forEach((line, idx) => {
        const wrapped = this.splitText(doc, line, maxLineWidth, 7);
        wrapped.forEach(wl => {
          doc.text(wl, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
          currentY += 3;
        });
        // Espaciado extra antes de la línea que dice "Representación impresa"
        currentY += (idx === 1) ? 2 : 1;
      });
    } catch (e) {
      console.error('Error añadiendo texto legal:', e);
    }

    return currentY;
  }
  
  /** Divide texto en múltiples líneas para que quepa en el ancho especificado */
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
