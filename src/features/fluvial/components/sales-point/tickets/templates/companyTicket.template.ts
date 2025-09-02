// src/features/fluvial/components/sales-point/tickets/templates/companyTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData, TicketRepresentative, TicketCompanySummary } from '../types/ticket.types';

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
  currentY = await this.addFooter(doc, ticketData.footer, ticketData.header, currentY);

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
    // Reducir significativamente el offset para subir el logo y aprovechar mejor el espacio
    const TOP_OFFSET = 2; // mm (reducido de 10 a 2 para subir el logo)
    let currentY = Math.max(startY + TOP_OFFSET, 0);
     
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
    currentY += logoHeight + 2.5; // Aumentado de 1.5 a 2.5 para evitar interferencia con las letras
      } catch (error) {
        console.error('Error cargando logo:', error);
        // Si no hay logo, no mostrar nada - continuar directamente
        currentY += 1.0; // Reducido de 2.5 a 1.0 para mantener consistencia
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
  currentY += 4.5; // Aumentado de 4 a 4.5 para mejor separación
    
  // Nombre de la empresa
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, 11);
    companyLines.forEach(line => {
      doc.text(line.toString().toUpperCase(), this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.8; // Aumentado de 3.5 a 3.8 para mejor legibilidad
    });
    
  // RUC
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${header.company_ruc}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3.5; // Aumentado de 3 a 3.5
    
  // Dirección
  doc.setFontSize(8);
  const addressLines = this.splitText(doc, header.company_address, this.CONTENT_WIDTH, 8);
    addressLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 2.8; // Aumentado de 2.5 a 2.8 para mejor legibilidad
    });
    currentY += 1.2; // Aumentado de 1 a 1.2 para mejor separación
    
  // Teléfonos
    if (header.company_phones.length > 0) {
      const phonesText = `Tel: ${header.company_phones.join(', ')}`;
      doc.text(phonesText, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.2; // Aumentado de 3 a 3.2 para mejor separación
    }
    
  // Punto de emisión (mostrará el nombre de la sucursal como en el backend)
    if (header.emission_point) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
      doc.text(`PUNTO DE EMISIÓN: ${header.emission_point}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.2; // Aumentado de 3 a 3.2 para mejor separación
    }
  // Dirección de la sucursal
    if (header.branch_office_address) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const addrLines = this.splitText(doc, header.branch_office_address, this.CONTENT_WIDTH, 8);
      addrLines.forEach(line => {
        doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 2.2; // Aumentado de 2 a 2.2 para mejor legibilidad
      });
      currentY += 1.2; // Aumentado de 1 a 1.2 para mejor separación
    }
  // Teléfono de la sucursal
    if (header.branch_office_phone) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Contacto de sucursal: ${header.branch_office_phone}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 2.8; // Aumentado de 2.5 a 2.8 para mejor separación
    }

  // Línea separadora continua (gris)
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Aumentado de 3 a 4 para dar más espaciado a la primera separadora
    
  // Tipo y número de documento
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
    doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3.5; // Reducido de 4 a 3.5
    doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4; // Reducido de 5 a 4
    
  // Fecha y hora de emisión
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
    doc.text(header.emission_datetime, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3; // Reducido de 4 a 3
    
  // Vendedor
  doc.text(`Vendedor: ${header.seller_name}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3; // Reducido de 4 a 3
    
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
    
    // Preparar columnas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.MARGIN;
    const rightX = this.MARGIN + colWidth + 2;

    // FILA 1: etiquetas (CLIENTE / RUC)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('CLIENTE:', leftX, currentY);
    doc.text('RUC:', rightX, currentY);
    currentY += 4; // espacio antes de los valores (aumentado de 3 a 4)

    // FILA 1b: valores debajo de las etiquetas (usar tamaño 11)
    doc.setFontSize(11);
    const clientLines = this.splitText(doc, passenger.full_name, colWidth, 11);
    const rucLines = this.splitText(doc, passenger.doc_number, colWidth, 11);
    const maxLines = Math.max(clientLines.length, rucLines.length);
    for (let i = 0; i < maxLines; i++) {
      // Cliente: normal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((clientLines[i] ?? '').toUpperCase(), leftX, currentY);
      // RUC: normal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((rucLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4; // línea con más espacio (aumentado de 3 a 4)
    }
    currentY += 4; // espacio aumentado entre bloques

    // Dirección del cliente si está disponible (en línea separada)
    if ((passenger as any).address && (passenger as any).address.toString().trim() !== '') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('DIRECCIÓN:', this.MARGIN, currentY);
      currentY += 4; // aumentado de 3 a 4
      const clientAddrLines = this.splitText(doc, (passenger as any).address, this.CONTENT_WIDTH, 11);
      clientAddrLines.forEach(line => {
        doc.setFontSize(11);
        doc.text(line.toUpperCase(), this.MARGIN, currentY);
        currentY += 4; // aumentado de 3 a 4
      });
      currentY += 4; // espacio después
    }
    
    return currentY;
  }

  /**
   * BLOQUE 3: Detalles del viaje (usando estructura de details array)
   */
  private static addTripDetails(doc: jsPDF, trip: TicketData['trip_details'], startY: number): number {
    let currentY = startY;
    // Línea separadora continua (gris)
    doc.setFontSize(7);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4; // Espacio adecuado después del separador

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(trip.title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 6;

    // Preparar columnas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.MARGIN;
    const rightX = this.MARGIN + colWidth + 2;

    // Helpers: buscar por etiquetas conocidas
    const findByLabel = (pattern: RegExp) => trip.details.find(d => pattern.test((d.label || '').toString().toUpperCase()));

  const vesselItem = findByLabel(/EMBARC|EMBARCACIÓN|EMBARCACION/);
  // Fecha puede venir como 'FECHA', 'F. SALIDA', 'F SALIDA' o 'FECHA VIAJE'
  const dateItem = findByLabel(/FECHA|F\.?\s*SALIDA|FECHA\s*VIAJE/);
  // Embarque puede venir como 'EMBARQUE', 'EMBARQ', 'ABORDAJE', 'H. ABORDAJE', etc.
  const boardingItem = findByLabel(/EMBARQ|EMBARQUE|ABORDAJE|H\.?\s*ABORDAJE|HORA\s*EMBARQUE|HORA\s*ABORDAJE/);
  const departureItem = findByLabel(/SALIDA|HORA\s*SALIDA|HORA\s*DE?\s*VIAJE|HORA\s*VIAJE|H\.?\s*SALIDA/);
  const originItem = findByLabel(/ORIGEN/);
  const destItem = findByLabel(/DESTINO/);

    // FILA 1: etiquetas (EMBARCACIÓN / FECHA VIAJE)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('EMBARCACIÓN:', leftX, currentY);
    doc.text('FECHA VIAJE:', rightX, currentY);
    currentY += 4; // espacio antes de los valores (aumentado de 3 a 4)

    // FILA 1b: valores debajo de las etiquetas (usar tamaño 11)
    doc.setFontSize(11);
    const vesselLines = vesselItem ? this.splitText(doc, vesselItem.value, colWidth, 11) : [''];
    const dateLines = dateItem ? this.splitText(doc, dateItem.value, colWidth, 11) : [''];
    const maxLines1 = Math.max(vesselLines.length, dateLines.length);
    for (let i = 0; i < maxLines1; i++) {
      // Embarcación: normal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((vesselLines[i] ?? '').toUpperCase(), leftX, currentY);
      // Fecha de viaje: valor en negrita (misma medida)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text((dateLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4; // línea con más espacio (aumentado de 3 a 4)
    }
    currentY += 4; // espacio aumentado entre bloques

    // --- PUERTO y DIRECCIÓN DEL PUERTO (tomados de trip.port_name / trip.port_address)
    if (trip.port_name || trip.port_address) {
      const portNameLines = this.splitText(doc, trip.port_name ?? '', colWidth, 11);
      const portAddrLines = this.splitText(doc, trip.port_address ?? '', colWidth, 11);
      // Etiquetas PUERTO (normal) y valores en 11
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('PUERTO:', leftX, currentY);
      doc.text('DIRECCIÓN PUERTO:', rightX, currentY);
      currentY += 4; // aumentado de 3 a 4

      // Valores
      const maxPortLines = Math.max(portNameLines.length, portAddrLines.length);
      for (let i = 0; i < maxPortLines; i++) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text((portNameLines[i] ?? '').toUpperCase(), leftX, currentY);
        doc.text((portAddrLines[i] ?? '').toUpperCase(), rightX, currentY);
        currentY += 4; // aumentado de 3 a 4
      }

      currentY += 4; // espacio después del bloque de puerto (aumentado de 3 a 4)
    }

    // FILA 2: etiquetas (EMBARQUE / SALIDA)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('EMBARQUE:', leftX, currentY);
    doc.text('SALIDA:', rightX, currentY);
    currentY += 4; // aumentado de 3 a 4

     // FILA 2b: valores debajo (tamaño 11)
    const boardingLines = boardingItem ? this.splitText(doc, boardingItem.value, colWidth, 11) : [''];
    const departureLines = departureItem ? this.splitText(doc, departureItem.value, colWidth, 11) : [''];
    const maxLines2 = Math.max(boardingLines.length, departureLines.length);
    for (let i = 0; i < maxLines2; i++) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((boardingLines[i] ?? '').toUpperCase(), leftX, currentY);
      doc.text((departureLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4; // aumentado de 3 a 4
    }
    currentY += 4; // aumentado de 3 a 4    // FILA 3: etiquetas (ORIGEN / DESTINO)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('ORIGEN:', leftX, currentY);
    doc.text('DESTINO:', rightX, currentY);
    currentY += 4; // aumentado de 3 a 4

    // FILA 3b: valores debajo (ORIGEN y DESTINO en negrita, tamaño 11)
    const originLines = originItem ? this.splitText(doc, originItem.value, colWidth, 11) : [''];
    const destLines = destItem ? this.splitText(doc, destItem.value, colWidth, 11) : [''];
    const maxLines3 = Math.max(originLines.length, destLines.length);
    for (let i = 0; i < maxLines3; i++) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text((originLines[i] ?? '').toUpperCase(), leftX, currentY);
      doc.text((destLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4; // aumentado de 3.5 a 4 para consistencia
    }
    currentY += 4; // aumentado de 3 a 4

  // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;

    return currentY;
  }

  /**
   * BLOQUE 4: Resumen de representantes (tabla simple con conteo y asientos)
   */
  private static addRepresentativesSummary(doc: jsPDF, representatives: TicketRepresentative[], startY: number): number {
    let currentY = startY;
    
    // Título (mismo tamaño que otros títulos del bloque)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('RESUMEN DE PASAJEROS', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 6;

    // Preparar columnas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.MARGIN;
    const rightX = this.MARGIN + colWidth + 2;

    // FILA 1: etiquetas (ASIENTO(S) / TOTAL REPRESENTANTES)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('ASIENTO(S):', leftX, currentY);
    doc.text('TOTAL REPRESENTANTES:', rightX, currentY);
    currentY += 4; // espacio antes de los valores

    // FILA 1b: valores debajo de las etiquetas (usar tamaño 11)
    doc.setFontSize(11);
    const seatNumbers = representatives
      .map(rep => rep.seat_number)
      .filter(seat => seat != null && seat !== '')
      .join(', ');
    const seatLines = seatNumbers ? this.splitText(doc, seatNumbers, colWidth, 11) : ['N/A'];
    const totalLines = this.splitText(doc, representatives.length.toString(), colWidth, 11);
    const maxLines = Math.max(seatLines.length, totalLines.length);
    for (let i = 0; i < maxLines; i++) {
      // Asientos: normal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((seatLines[i] ?? '').toUpperCase(), leftX, currentY);
      // Total representantes: normal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text((totalLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4; // línea con más espacio
    }
    currentY += 4; // espacio aumentado entre bloques
    
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
  doc.setFontSize(9);
    doc.text('DETALLE DE LA VENTA', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    
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
  doc.setFontSize(9);
    const sunat = ticketData.sunat_totals;
    
    // Buscar específicamente la línea 'TOTAL A PAGAR' o la etiqueta exacta 'TOTAL'
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
  doc.setFontSize(8);
  doc.text('SON: ' + ticketData.payment_info.amount_in_words, this.MARGIN, currentY);
  currentY += 4;
  doc.text(ticketData.payment_info.payment_method_label + ' ' + ticketData.payment_info.payment_method, this.MARGIN, currentY);
  currentY += 4;
    
    return currentY;
  }

  /**
   * BLOQUE 6: Añade el footer con QR real y URL de consulta
   */
  private static async addFooter(doc: jsPDF, footer: TicketData['footer'], header: TicketData['header'], startY: number): Promise<number> {
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

  /**
   * Divide texto en múltiples líneas para que quepa en el ancho especificado
   */
  private static splitText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    if (!text || text.toString().trim() === '') return [''];

    // Primero intentamos separar por espacios, pero si una palabra es mas larga que el ancho, la partimos
    const words = text.toString().split(' ');
    const lines: string[] = [];
    let currentLine = '';

    const pushLine = (line: string) => {
      if (line === '') return;
      lines.push(line);
    };

    words.forEach(word => {
      // Si la palabra individual es mas larga que el ancho, partiremos la palabra
      doc.setFontSize(fontSize);
      if (doc.getTextWidth(word) > maxWidth) {
        if (currentLine) { pushLine(currentLine); currentLine = ''; }
        let sub = '';
        for (let ch of word) {
          const test = sub + ch;
          if (doc.getTextWidth(test) > maxWidth) {
            pushLine(sub);
            sub = ch;
          } else {
            sub = test;
          }
        }
        if (sub) pushLine(sub);
      } else {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = doc.getTextWidth(testLine);
        if (testWidth > maxWidth && currentLine) {
          pushLine(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
    });

    if (currentLine) pushLine(currentLine);
    return lines;
}

}
