// src/features/fluvial/components/sales-point/tickets/templates/noSeatsCompanyTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData, TicketRepresentative, TicketCompanySummary } from '../types/ticket.types';

/**
 * Template para generar PDFs de tickets de venta empresarial SIN ASIENTOS
 * Especializado para embarcaciones que no manejan asientos numerados (como lanchas colectivas) 
 * con ventas empresariales (RUC con múltiples representantes)
 * Muestra "Elección libre" en lugar de números de asiento específicos
 * Formato térmico de 80mm de ancho
 */
export class NoSeatsCompanyTicketTemplate {
  
  private static readonly TICKET_WIDTH = 80; // mm
  private static readonly MARGIN = 2; // mm
  private static readonly CONTENT_WIDTH = NoSeatsCompanyTicketTemplate.TICKET_WIDTH - (NoSeatsCompanyTicketTemplate.MARGIN * 2);
  
  /**
   * Genera el PDF del ticket empresarial sin asientos usando los datos transformados
   */
  static async generatePDF(ticketData: TicketData & { representatives: TicketRepresentative[]; summary: TicketCompanySummary }): Promise<jsPDF> {
    // Crear documento con altura automática (se ajustará al contenido)
    const INITIAL_HEIGHT = 350; // Altura inicial para empresas
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [this.TICKET_WIDTH, INITIAL_HEIGHT]
    });
    
    doc.setFont('helvetica');
    let currentY = 0; // Comenzamos desde 0, pero addHeader agregará el margen
    
    // BLOQUE 1: CABECERA
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 5; // Espacio después del header
    
    // BLOQUE 2: INFORMACIÓN DE LA EMPRESA COMPRADORA
    currentY = this.addCompanyInfo(doc, ticketData.passenger_info, currentY);
    currentY += 2;
    
    // BLOQUE 3: DETALLES DEL VIAJE - ESPECIALIZADO PARA SIN ASIENTOS
    currentY = this.addTripDetails(doc, ticketData.trip_details, currentY);
    currentY += 2;
    
    // BLOQUE 4: RESUMEN DE REPRESENTANTES - ESPECIALIZADO PARA SIN ASIENTOS
    currentY = this.addRepresentativesSummary(doc, ticketData.representatives, currentY);
    currentY += 2;
    
    // BLOQUE 5: DETALLE DE LA VENTA
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
   * (Igual que CompanyTicketTemplate)
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    // Empezar compactado, igual que en normalTicket
    let currentY = Math.max(startY, 0);

  // LOGO (máximo 45mm de alto, 60mm de ancho)
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
  const maxLogoWidth = 60;
  const maxLogoHeight = 45;
        const logoAspectRatio = logoImg.height / logoImg.width;
        let logoWidth = Math.min(maxLogoWidth, logoImg.width);
        logoHeight = logoWidth * logoAspectRatio;
        if (logoHeight > maxLogoHeight) {
          logoHeight = maxLogoHeight;
          logoWidth = logoHeight / logoAspectRatio;
        }
  const logoX = (this.TICKET_WIDTH - logoWidth) / 2;
  // Bajar el logo más para que se note en impresoras térmicas
  const logoYOffset = 18; // mm (aumentado desde 8)
  const logoY = currentY + logoYOffset;
  doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
  currentY = logoY + logoHeight + 2.5;
      } catch (error) {
        console.error('Error cargando logo:', error);
        currentY += 2.5; // Deja espacio si no hay logo (compacto)
      }
    } else {
      currentY += 2.5; // Deja espacio si no hay logo configurado
    }

    // Frase estática de la empresa (slogan)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    try {
      doc.text('Sirviendo a la Amazonía Peruana', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    } catch (e) {
      console.error('Error escribiendo frase estática en ticket:', e);
    }
    currentY += 4.5;

    // Nombre de la empresa (máximo 3 líneas, fuente más pequeña si es muy largo)
    let companyFontSize = 11; // Aumentado de 9 a 11
    let companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, companyFontSize);
    if (companyLines.length > 3) {
      companyFontSize = 9; // Aumentado de 7 a 9
      companyLines = this.splitText(doc, header.company_name, this.CONTENT_WIDTH, companyFontSize);
    }
    doc.setFontSize(companyFontSize);
    doc.setFont('helvetica', 'bold');
    companyLines.forEach(line => {
      doc.text(line.toString().toUpperCase(), this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.8; // Aumentado de 3 a 3.8
    });
  currentY += 1;

    // RUC y dirección
    doc.setFontSize(9); // Aumentado de 7 a 9
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${header.company_ruc}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3.5; // Aumentado de 3 a 3.5

    const addressLines = this.splitText(doc, header.company_address, this.CONTENT_WIDTH, 8); // Aumentado de 7 a 8
    addressLines.forEach(line => {
      doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 2.8; // Aumentado de 3 a 2.8
    });
    currentY += 1.2; // Aumentado de 1 a 1.2

    // Teléfonos (empresa) — se muestran antes de PUNTO DE EMISIÓN para coincidir con el diseño
    if (header.company_phones && header.company_phones.length > 0) {
      doc.setFontSize(8); // Aumentado de 7 a 8
      doc.setFont('helvetica', 'normal');
      doc.text(`Tel: ${header.company_phones[0]}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.2; // Aumentado de 3 a 3.2
    }

    // PUNTO DE EMISIÓN (usar branch_office_name si está disponible)
    const branchName = (header as any).branch_office_name || header.emission_point || '';
    if (branchName) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`PUNTO DE EMISIÓN: ${branchName}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 3.2;
    }

    // Dirección de la sucursal (si viene) — aparecerá debajo del PUNTO DE EMISIÓN
    if ((header as any).branch_office_address) {
      const addrLines = this.splitText(doc, (header as any).branch_office_address, this.CONTENT_WIDTH, 8); // Aumentado de 7 a 8
      addrLines.forEach(line => { doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 2.2; }); // Aumentado de 3 a 2.2
      currentY += 1.2; // Aumentado de 1 a 1.2
    }

    // Contacto de la sucursal
    if ((header as any).branch_office_phone) {
      doc.setFontSize(8); // Aumentado de 7 a 8
      doc.setFont('helvetica', 'normal');
      doc.text(`Contacto de sucursal: ${(header as any).branch_office_phone}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
      currentY += 2.8; // Aumentado de 3 a 2.8
    }
    currentY += 1;

  // Línea separadora antes del documento (p.ej. FACTURA ELECTRÓNICA)
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 180, 180);
  doc.line(0, currentY, this.TICKET_WIDTH, currentY);
  currentY += 4;

  // Tipo de documento y numeración
  doc.setFontSize(10); // Aumentado de 8 a 10
  doc.setFont('helvetica', 'bold');
  doc.text(header.document_title, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
  currentY += 3.5; // Aumentado de 3 a 3.5
  doc.text(header.document_id, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
  currentY += 4;

    // Fecha de emisión
    doc.setFontSize(8); // Aumentado de 7 a 8
    doc.setFont('helvetica', 'normal');
    doc.text(header.emission_datetime, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3;
    doc.text(`Vendedor: ${header.seller_name}`, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 3; // Reducido de 5 a 3

    // Asegurar que el header no se solape con el borde superior
    if (currentY < 35) {
      currentY = 35;
    }
    return currentY;
  }

  /**
   * BLOQUE 2: Información de la empresa compradora (adaptado para datos empresariales)
   * (Igual que CompanyTicketTemplate)
   */
  private static addCompanyInfo(doc: jsPDF, passenger: TicketData['passenger_info'], startY: number): number {
    let currentY = startY;
    
    // Línea separadora
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;
    
    doc.setFontSize(8); // Aumentado de 7 a 8
    doc.setFont('helvetica', 'normal');
    
    // Cliente (empresa)
    doc.setFont('helvetica', 'bold'); // Añadido bold para etiqueta
    doc.text('CLIENTE:', this.MARGIN, currentY);
    doc.setFont('helvetica', 'normal'); // Volver a normal para valor
    const clientLines = this.splitText(doc, passenger.full_name, this.CONTENT_WIDTH - 15, 8); // Aumentado de 7 a 8
    doc.text(clientLines[0], this.MARGIN + 15, currentY);
    currentY += 3;
    
    for (let i = 1; i < clientLines.length; i++) {
      doc.text(clientLines[i], this.MARGIN + 15, currentY);
      currentY += 3;
    }
    
    // Documento (RUC)
    doc.setFont('helvetica', 'bold'); // Añadido bold para etiqueta
    doc.text('RUC:', this.MARGIN, currentY);
    doc.setFont('helvetica', 'normal'); // Volver a normal para valor
    doc.text(passenger.doc_number, this.MARGIN + 15, currentY);
    currentY += 3;
    
    currentY += 2;
    return currentY;
  }

  /**
   * BLOQUE 3: Detalles del viaje - ESPECIALIZADO PARA SIN ASIENTOS
   * Similar a CompanyTicketTemplate pero sin mostrar información específica de asientos
   */
  private static addTripDetails(doc: jsPDF, trip: TicketData['trip_details'], startY: number): number {
    let currentY = startY;
    // Línea separadora
    doc.setFontSize(7);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;

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

    // Helpers: buscar por etiquetas conocidas (case-insensitive)
    const findByLabel = (pattern: RegExp) => (trip.details || []).find(d => pattern.test((d.label || '').toString().toUpperCase()));

    const vesselItem = findByLabel(/EMBARC|EMBARCACIÓN|EMBARCACION/);
    const dateItem = findByLabel(/FECHA/);
    const boardingItem = findByLabel(/EMBARQ|EMBARQUE|HORA\s*EMBARQUE/);
    const departureItem = findByLabel(/SALIDA|HORA\s*SALIDA|HORA\s*DE?\s*VIAJE|HORA\s*VIAJE/);
    const originItem = findByLabel(/ORIGEN/);
    const destItem = findByLabel(/DESTINO/);
    const seatItem = findByLabel(/ASIENTO/);

    // FILA 1: etiquetas (EMBARCACIÓN / FECHA VIAJE)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('EMBARCACIÓN:', leftX, currentY);
    doc.text('FECHA VIAJE:', rightX, currentY);
    currentY += 3; // espacio antes de los valores

    // FILA 1b: valores debajo de las etiquetas (usar tamaño 8.5)
    doc.setFontSize(8.5);
    const vesselLines = vesselItem ? this.splitText(doc, vesselItem.value, colWidth, 8.5) : [''];
    const dateLines = dateItem ? this.splitText(doc, dateItem.value, colWidth, 8.5) : [''];
    const maxLines1 = Math.max(vesselLines.length, dateLines.length);
    for (let i = 0; i < maxLines1; i++) {
      // Embarcación: normal
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(vesselLines[i] ?? '', leftX, currentY);
      // Fecha de viaje: valor en negrita (misma medida)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(dateLines[i] ?? '', rightX, currentY);
      currentY += 3; // línea con más espacio
    }
    currentY += 4; // espacio aumentado entre bloques

    // --- PUERTO y DIRECCIÓN DEL PUERTO
    if (trip.port_name || trip.port_address) {
      const portNameLines = this.splitText(doc, trip.port_name ?? '', colWidth, 9);
      const portAddrLines = this.splitText(doc, trip.port_address ?? '', colWidth, 9);
      // Etiquetas PUERTO (normal) y valores en 8.5
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('PUERTO:', leftX, currentY);
      doc.text('DIRECCIÓN PUERTO:', rightX, currentY);
      currentY += 3;

      // Valores
      const maxPortLines = Math.max(portNameLines.length, portAddrLines.length);
      for (let i = 0; i < maxPortLines; i++) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(portNameLines[i] ?? '', leftX, currentY);
        doc.text(portAddrLines[i] ?? '', rightX, currentY);
        currentY += 3;
      }

      currentY += 3; // espacio después del bloque de puerto
    }

    // FILA 2: etiquetas (EMBARQUE / SALIDA)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('EMBARQUE:', leftX, currentY);
    doc.text('SALIDA:', rightX, currentY);
    currentY += 3;

    // FILA 2b: valores debajo (tamaño 8.5)
    const boardingLines = boardingItem ? this.splitText(doc, boardingItem.value, colWidth, 8.5) : [''];
    const departureLines = departureItem ? this.splitText(doc, departureItem.value, colWidth, 8.5) : [''];
    const maxLines2 = Math.max(boardingLines.length, departureLines.length);
    for (let i = 0; i < maxLines2; i++) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(boardingLines[i] ?? '', leftX, currentY);
      doc.text(departureLines[i] ?? '', rightX, currentY);
      currentY += 3;
    }
    currentY += 3;

    // FILA 3: etiquetas (ORIGEN / DESTINO)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('ORIGEN:', leftX, currentY);
    doc.text('DESTINO:', rightX, currentY);
    currentY += 3;

    // FILA 3b: valores debajo (ORIGEN y DESTINO en negrita, un poco más grandes)
    const originLines = originItem ? this.splitText(doc, originItem.value, colWidth, 9) : [''];
    const destLines = destItem ? this.splitText(doc, destItem.value, colWidth, 9) : [''];
    const maxLines3 = Math.max(originLines.length, destLines.length);
    for (let i = 0; i < maxLines3; i++) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(originLines[i] ?? '', leftX, currentY);
      doc.text(destLines[i] ?? '', rightX, currentY);
      currentY += 3.5; // un poco más de espacio por el tamaño mayor
    }
    currentY += 3;

    // ASIENTO en su propia línea (aunque en no-seats normalmente no se muestra)
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

  /**
   * BLOQUE 4: Resumen de representantes - ESPECIALIZADO PARA SIN ASIENTOS
   * Muestra "Elección libre" en lugar de números de asiento específicos
   */
  private static addRepresentativesSummary(doc: jsPDF, representatives: TicketRepresentative[], startY: number): number {
  let currentY = startY;

  // Título (se evita dibujar separador aquí porque el bloque anterior ya lo dejó)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10); // Aumentado de 9 a 10 para coincidir con títulos del ticket normal
  doc.text('RESUMEN DE PASAJEROS', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
  currentY += 6;
    
  // ESPECIALIZACIÓN PARA SIN ASIENTOS: Mostrar "Elección libre" limpio sin recuadro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
    
    // Texto centrado y destacado (sin recuadro azul)
    doc.text('ASIENTOS: Elección libre', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 8;
    
    // Resumen numérico
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // Aumentado de 7 a 8
    doc.text(`TOTAL REPRESENTANTES: ${representatives.length}`, this.MARGIN, currentY);
    currentY += 5;
    
    return currentY;
  }

  /**
   * BLOQUE 5: DETALLE DE LA VENTA (adaptado para empresa sin asientos)
   * (Igual que CompanyTicketTemplate)
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
    doc.setFontSize(9); // Aumentado de 8 a 9
    doc.text('DETALLE DE LA VENTA', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 5;
    
    // Encabezado de tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // Aumentado de 7 a 8
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
      const descLines = this.splitText(doc, desc, 32, 8); // Aumentado de 7 a 8
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
    doc.setFontSize(9); // Aumentado de 7 a 9
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
    doc.setFontSize(8); // Aumentado de 7 a 8
    const amountText = 'SON: ' + ticketData.payment_info.amount_in_words;
    const amountLines = this.splitText(doc, amountText, this.CONTENT_WIDTH, 8);
    amountLines.forEach(line => {
      doc.text(line, this.MARGIN, currentY);
      currentY += 3;
    });
    currentY += 1;
    doc.text(ticketData.payment_info.payment_method_label + ' ' + ticketData.payment_info.payment_method, this.MARGIN, currentY);
    currentY += 4;
    
    return currentY;
  }

  /**
   * BLOQUE 6: Añade el footer con QR real y URL de consulta
   * (Igual que CompanyTicketTemplate)
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
    doc.setFontSize(7); // Aumentado de 6 a 7
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
    // Añadir líneas legales si el transformer las proporcionó
    if ((footer as any).legal_lines && Array.isArray((footer as any).legal_lines)) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const legalLines: string[] = (footer as any).legal_lines;
      legalLines.forEach(line => {
        const wrapped = this.splitText(doc, line, this.CONTENT_WIDTH - 6, 7);
        wrapped.forEach(wl => { doc.text(wl, this.TICKET_WIDTH / 2, currentY, { align: 'center' }); currentY += 3; });
        currentY += 1;
      });
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
}
