// src/features/fluvial/components/sales-point/tickets/templates/cargoTicket.template.ts

import jsPDF from 'jspdf';
import { TicketData } from '../types/ticket.types';
import { getCurrencySymbol } from '../utils/ticketHelpers';

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
  // Estrategia: primera pasada sobre un doc temporal para medir altura usada,
  // luego recrear el doc final con la altura exacta y volver a renderizar.
  const INITIAL_HEIGHT = 450; // Tamaño amplio para la pasada de medición

  // 1) Primera pasada: medición
  const measureDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [this.TICKET_WIDTH, INITIAL_HEIGHT] });
  measureDoc.setFont('helvetica');
  let measuredY = 0;

  measuredY = await this.addHeader(measureDoc, ticketData.header, measuredY);
  measuredY += 1;
  measuredY = this.addSenderInfo(measureDoc, ticketData.passenger_info, measuredY);
  measuredY += 1;
  measuredY = this.addRecipientInfo(measureDoc, ticketData, measuredY);
  measuredY += 1;
  measuredY = this.addShipmentDetails(measureDoc, ticketData.trip_details, measuredY);
  measuredY += 1;
  measuredY = this.addCargoItems(measureDoc, ticketData, measuredY);
  measuredY += 1;
  measuredY = this.addTotals(measureDoc, ticketData, measuredY);
  measuredY += 1;
  measuredY = await this.addFooter(measureDoc, ticketData.footer, measuredY);

  const finalHeight = Math.max((measuredY + 60), 150); // margen final aumentado a 60mm y altura mínima 150mm

  // 2) Segunda pasada: render final con altura correcta
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [this.TICKET_WIDTH, finalHeight] });
  doc.setFont('helvetica');
  let currentY = 0;

  // Re-dibujar todos los bloques en el doc final (esperando las operaciones async donde corresponde)
  currentY = await this.addHeader(doc, ticketData.header, currentY);
  currentY += 1;
  currentY = this.addSenderInfo(doc, ticketData.passenger_info, currentY);
  currentY += 1;
  currentY = this.addRecipientInfo(doc, ticketData, currentY);
  currentY += 1;
  currentY = this.addShipmentDetails(doc, ticketData.trip_details, currentY);
  currentY += 1;
  currentY = this.addCargoItems(doc, ticketData, currentY);
  currentY += 1;
  currentY = this.addTotals(doc, ticketData, currentY);
  currentY += 1;
  currentY = await this.addFooter(doc, ticketData.footer, currentY);

  return doc;
  }

  /**
   * BLOQUE 1: Añade el encabezado completo con logo y datos de empresa
   * Siguiendo exactamente la estructura del NormalTicketTemplate
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
     
  const LOGO_TOP_Y = 8; // Bajar logo ligeramente para mejorar espaciado (antes -2)
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

  /**
   * BLOQUE 2: Añade la información del remitente
   * Siguiendo el formato de dos columnas del normalTicket
   */
  private static addSenderInfo(doc: jsPDF, passengerInfo: TicketData['passenger_info'], startY: number): number {
    let currentY = startY;
    
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;

    // Título de la sección centrado
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('REMITENTE', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.MARGIN;
    const rightX = this.MARGIN + colWidth + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('NOMBRE:', leftX, currentY);
    doc.text('DOCUMENTO:', rightX, currentY);
    currentY += 4;

  doc.setFontSize(11);
  // Limitar un poco el ancho de la columna nombre para forzar saltos de línea
  const nameMaxWidth = Math.max(20, colWidth - 6); // mm, clamp mínimo para evitar valores muy pequeños
  const nameLines = this.splitText(doc, passengerInfo.full_name, nameMaxWidth, 11);
    const docLines = this.splitText(doc, `${passengerInfo.doc_label}: ${passengerInfo.doc_number}`, colWidth, 11);
    const maxLines = Math.max(nameLines.length, docLines.length);
    for (let i = 0; i < maxLines; i++) {
      doc.setFont('helvetica', 'normal');
      doc.text((nameLines[i] ?? '').toUpperCase(), leftX, currentY);
      doc.text((docLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4;
    }
    currentY += 2;
    
    return currentY;
  }

  /**
   * BLOQUE 3: Añade la información del destinatario (específico para encomiendas)
   * Siguiendo el formato de dos columnas del normalTicket
   */
  private static addRecipientInfo(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;

    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;

    // Título de la sección centrado
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATARIO', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.MARGIN;
    const rightX = this.MARGIN + colWidth + 2;
    
    // Extraer información del destinatario de trip_details
    const destinatarioDetail = ticketData.trip_details.details.find(d => d.label === 'Destinatario');
    const docDestinatarioDetail = ticketData.trip_details.details.find(d => d.label === 'Doc. Destinatario');
    const telDestinatarioDetail = ticketData.trip_details.details.find(d => d.label === 'Tel. Destinatario');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('NOMBRE:', leftX, currentY);
    doc.text('DOCUMENTO:', rightX, currentY);
    currentY += 4;

  doc.setFontSize(11);
  // Usar un ancho ligeramente menor para el nombre del destinatario para evitar que la última palabra "colapse" en la columna derecha
  const destNameMaxWidth = Math.max(20, colWidth - 6);
  const nameLines = destinatarioDetail ? this.splitText(doc, destinatarioDetail.value, destNameMaxWidth, 11) : [''];
    const docLines = docDestinatarioDetail ? this.splitText(doc, docDestinatarioDetail.value, colWidth, 11) : [''];
    const maxLines = Math.max(nameLines.length, docLines.length);
    for (let i = 0; i < maxLines; i++) {
      doc.setFont('helvetica', 'normal');
      doc.text((nameLines[i] ?? '').toUpperCase(), leftX, currentY);
      doc.text((docLines[i] ?? '').toUpperCase(), rightX, currentY);
      currentY += 4;
    }
    currentY += 2;
    
    // Teléfono del destinatario en una sola línea
    if (telDestinatarioDetail) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('TELÉFONO:', leftX, currentY);
      currentY += 4;
      
      doc.setFontSize(11);
      doc.text(telDestinatarioDetail.value.toUpperCase(), leftX, currentY);
      currentY += 6;
    }

    return currentY;
  }

  /**
   * BLOQUE 4: Añade los detalles del envío
   * Siguiendo el formato de dos columnas del normalTicket
   */
  private static addShipmentDetails(doc: jsPDF, tripDetails: TicketData['trip_details'], startY: number): number {
    let currentY = startY;

    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(0, currentY, this.TICKET_WIDTH, currentY);
    currentY += 4;

    // Título de la sección centrado
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DEL ENVÍO', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
    currentY += 4;
    
    const colWidth = (this.CONTENT_WIDTH - 2) / 2;
    const leftX = this.MARGIN;
    const rightX = this.MARGIN + colWidth + 2;
    
    // Extraer información de los detalles del envío de trip_details
    const origenDetail = tripDetails.details.find(d => d.label === 'Origen');
    const destinoDetail = tripDetails.details.find(d => d.label === 'Destino');

    // Solo mostrar Origen y Destino
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('ORIGEN', leftX, currentY);
    doc.text('DESTINO', rightX, currentY);
    currentY += 4;
    
    doc.setFontSize(11);
    doc.text((origenDetail?.value || '').toUpperCase(), leftX, currentY);
    doc.setFont('helvetica', 'bold');
    
    // Manejar destino largo con salto de línea
     const destinoText = (destinoDetail?.value || '').toUpperCase();
     const maxWidth = colWidth - 2;
     const destinoLines = CargoTicketTemplate.splitText(doc, destinoText, maxWidth, 11);
    
    for (let i = 0; i < destinoLines.length; i++) {
      doc.text(destinoLines[i], rightX, currentY + (i * 4));
    }
    
    currentY += Math.max(6, destinoLines.length * 4 + 2);

    return currentY;
  }

  /**
   * BLOQUE 5: Añade los items de encomienda con detalles específicos
   * Siguiendo el formato del normalTicket con descripción más ancha
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

    // Encabezado de tabla con más espacio para descripción
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CANT.', this.MARGIN, currentY);
    doc.text('DESCRIPCIÓN', this.MARGIN + 10, currentY);
    doc.text('P/U', this.TICKET_WIDTH - this.MARGIN - 20, currentY, { align: 'right' });
    doc.text('TOTAL', this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
    currentY += 4;

    // Items con fuente consistente con el resto del ticket
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7); // Tamaño consistente con 'total en palabras'
    ticketData.financial_breakdown.items.forEach(item => {
      // Cantidad
      doc.text(String(item.quantity), this.MARGIN, currentY);

      // Descripción multilínea: calcular dinámicamente el ancho disponible
      let desc = (item.description || '').toString();
      if (item.discount && item.discount > 0) {
        desc += ` (descuento: ${item.discount.toFixed(2)})`;
      }
      desc = desc.toUpperCase();

      const descX = this.MARGIN + 10;
      // Column positions for price and total (as used elsewhere)
      const priceX = this.TICKET_WIDTH - this.MARGIN - 20;
      const totalX = this.TICKET_WIDTH - this.MARGIN;
      // Right padding to avoid touching price/total columns
  const DESC_RIGHT_PADDING = 4; // mm
  // Reducir ligeramente el ancho disponible para forzar que la descripción
  // haga salto de línea antes y no invada la columna de P/U.
  const extraReduction = 8; // mm adicionales a recortar del ancho disponible
  // Mantener un tope aproximado igual al valor anterior (42mm) para compatibilidad
  const descMaxWidth = Math.max(10, Math.min(42, priceX - descX - DESC_RIGHT_PADDING - extraReduction));

      // Limitar líneas para que no crezca demasiado (por ejemplo máximo 6 líneas)
      const LINE_HEIGHT = 3.5;
      const maxDescLines = 6;
      const descLines = this.splitText(doc, desc, descMaxWidth, 7).slice(0, maxDescLines);

      // Dibujar las líneas de descripción y calcular la Y donde se dibujarán precio/total
      descLines.forEach((line, idx) => {
        doc.text(line, descX, currentY + (idx * LINE_HEIGHT));
      });

      // Imprimir precio unitario y total en la primera línea visible
      doc.text(item.unit_price.toFixed(2), priceX, currentY, { align: 'right' });
      doc.text(item.total_line.toFixed(2), totalX, currentY, { align: 'right' });

      // Avanzar currentY basado en el número de líneas usadas
      currentY += Math.max( (descLines.length || 1) * LINE_HEIGHT, 5 );
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
        doc.text(`${getCurrencySymbol(ticketData.currency_code || 'PEN')} ${total.value}`, this.TICKET_WIDTH - this.MARGIN, currentY, { align: 'right' });
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

    // Agregar mensaje de detalle de pago si existe (para contraentrega)
    if (ticketData.payment_info.payment_detail_message) {
      doc.setFontSize(7);
      doc.text(ticketData.payment_info.payment_detail_message.toUpperCase(), this.MARGIN, currentY);
      currentY += 4;
    }

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
    
  // Texto de consulta (aumentado para coincidir con el tamaño de la forma de pago)
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
        doc.setFontSize(5);
        doc.text('[ERROR QR]', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 8;
      }
    }
    
  // Información adicional
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Representación impresa del comprobante electrónico', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
  currentY += 3;
  doc.text('CONSERVE ESTE COMPROBANTE', this.TICKET_WIDTH / 2, currentY, { align: 'center' });
  currentY += 3;

    // Líneas legales completas como en normalTicket
    const legalTexts = [
      'Conserve este ticket como comprobante de su envío.',
      'No nos hacemos responsables por objetos de valor no declarados.',
      'El remitente debe presentarse 30 minutos antes de la salida.',
      'Prohibido el transporte de sustancias peligrosas o ilegales.',
      'Los horarios están sujetos a cambios por condiciones climáticas.',
      'Reclamos hasta 24 horas después del servicio.'
    ];
    
    legalTexts.forEach(text => {
      const lines = this.splitText(doc, text, this.CONTENT_WIDTH, 7);
      lines.forEach(line => {
        doc.text(line, this.TICKET_WIDTH / 2, currentY, { align: 'center' });
        currentY += 3;
      });
    });

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
