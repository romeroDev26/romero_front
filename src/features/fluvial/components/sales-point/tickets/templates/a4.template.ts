// src/features/fluvial/components/sales-point/tickets/templates/a4.template.ts

import jsPDF from 'jspdf';
import { TicketData, TicketRepresentative, TicketCompanySummary } from '../types/ticket.types';
import { getCurrencySymbol } from '../utils/ticketHelpers';

/**
 * Template para generar PDFs en formato A4 (210mm x 297mm)
 * Multi-modal: funciona para todos los tipos de ventas
 * (pasajes normales, con representante, sin asiento, encomiendas)
 * Actualizado: Ahora incluye lista de representantes para ventas empresariales
 */
export class A4Template {
  
  private static readonly PAGE_WIDTH = 210; // mm
  private static readonly MARGIN = 15; // mm
  private static readonly CONTENT_WIDTH = A4Template.PAGE_WIDTH - (A4Template.MARGIN * 2);
  
  /**
   * Genera el PDF A4 usando los datos transformados
   * Actualizado: Acepta representantes opcionales para ventas empresariales
   * rawBackendItems: Items raw del backend con unit_code para A4
   */
  static async generatePDF(
    ticketData: TicketData & { 
      representatives?: TicketRepresentative[]; 
      summary?: TicketCompanySummary;
      rawBackendItems?: any[]; // Items raw del backend para acceder a unit_code
    }
  ): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.setFont('helvetica');
    let currentY = this.MARGIN;
    
    // Renderizar el documento
    currentY = await this.addHeader(doc, ticketData.header, currentY);
    currentY += 5;
    
    currentY = this.addClientInfo(doc, ticketData, currentY);
    currentY += 5;
    
    // Agregar tabla de representantes si existen (ventas empresariales)
    // Y si el flag showRepresentatives no está explícitamente en false
    if (ticketData.representatives && 
        ticketData.representatives.length > 0 && 
        ticketData.showRepresentatives !== false) {
      currentY = this.addRepresentativesTable(doc, ticketData.representatives, currentY);
      currentY += 5;
    }
    
    currentY = this.addItemsTable(doc, ticketData, currentY, ticketData.rawBackendItems);
    currentY += 3;
    
    currentY = this.addTotalsSection(doc, ticketData, currentY);
    currentY += 10;
    
    currentY = await this.addFooter(doc, ticketData, currentY);
    
    return doc;
  }

  /**
   * BLOQUE 1: Encabezado con logo y datos de empresa
   */
  private static async addHeader(doc: jsPDF, header: TicketData['header'], startY: number): Promise<number> {
    let currentY = startY;
    
    // Logo a la izquierda
    if (header.company_logo_url) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject(new Error('Error cargando logo'));
          logoImg.src = header.company_logo_url!;
        });

        const maxLogoWidth = 50;
        const maxLogoHeight = 30;
        const logoAspectRatio = logoImg.height / logoImg.width;
        let logoWidth = Math.min(maxLogoWidth, logoImg.width * 0.3);
        let logoHeight = logoWidth * logoAspectRatio;
        
        if (logoHeight > maxLogoHeight) {
          logoHeight = maxLogoHeight;
          logoWidth = logoHeight / logoAspectRatio;
        }
        
        doc.addImage(logoImg, 'PNG', this.MARGIN, currentY, logoWidth, logoHeight);
      } catch (error) {
        console.error('Error cargando logo:', error);
      }
    }
    
    // Información de la empresa a la derecha
    const rightColumnX = this.PAGE_WIDTH / 2 + 10;
    const rightStartY = currentY;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const companyLines = this.splitText(doc, header.company_name.toUpperCase(), 80, 10);
    companyLines.forEach((line, i) => {
      doc.text(line, rightColumnX, rightStartY + (i * 5));
    });
    
    let rightY = rightStartY + (companyLines.length * 5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`RUC: ${header.company_ruc}`, rightColumnX, rightY);
    rightY += 4;
    
    const addressLines = this.splitText(doc, header.company_address, 80, 9);
    addressLines.forEach(line => {
      doc.text(line, rightColumnX, rightY);
      rightY += 4;
    });
    
    if (header.company_phones.length > 0) {
      doc.text(header.company_phones.join(' / '), rightColumnX, rightY);
      rightY += 4;
    }
    
    currentY = Math.max(currentY + 35, rightY);
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
    currentY += 5;
    
    return currentY;
  }

  /**
   * BLOQUE 2: Información del cliente y documento
   */
  private static addClientInfo(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    // Recuadro azul para el cliente
    doc.setFillColor(230, 240, 255);
    doc.rect(this.MARGIN, currentY, this.CONTENT_WIDTH * 0.6, 25, 'F');
    
    // Información del cliente dentro del recuadro
    const clientX = this.MARGIN + 3;
    let clientY = currentY + 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', clientX, clientY);
    clientY += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const clientName = ticketData.passenger_info.full_name.toUpperCase();
    const nameLines = this.splitText(doc, clientName, this.CONTENT_WIDTH * 0.55, 9);
    nameLines.forEach(line => {
      doc.text(line, clientX, clientY);
      clientY += 4;
    });
    
    doc.setFontSize(8);
    doc.text(`${ticketData.passenger_info.doc_label}: ${ticketData.passenger_info.doc_number}`, 
      clientX, clientY);
    
    // Información del documento a la derecha
    const docX = this.MARGIN + (this.CONTENT_WIDTH * 0.62);
    let docY = currentY + 3;
    
    // Recuadro para el documento
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.rect(docX, docY, this.CONTENT_WIDTH * 0.35, 22);
    
    docY += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const docTitle = ticketData.header.document_title.toUpperCase();
    doc.text(docTitle, docX + (this.CONTENT_WIDTH * 0.175), docY, { align: 'center' });
    docY += 6;
    
    doc.setFontSize(11);
    doc.text(ticketData.header.document_id, docX + (this.CONTENT_WIDTH * 0.175), docY, { align: 'center' });
    docY += 6;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emisión: ${ticketData.header.emission_datetime}`, 
      docX + (this.CONTENT_WIDTH * 0.175), docY, { align: 'center' });
    
    currentY += 27;
    
    // Información adicional: vendedor y tipo de venta
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const additionalInfo = [];
    additionalInfo.push(`Vendedor: ${ticketData.header.seller_name}`);
    
    if (ticketData.payment_info.payment_method) {
      const paymentType = ticketData.payment_info.payment_method_label || 'Tipo venta';
      additionalInfo.push(`${paymentType}: ${ticketData.payment_info.payment_method}`);
    }
    
    additionalInfo.forEach(info => {
      doc.text(info, this.MARGIN, currentY);
      currentY += 4;
    });
    
    currentY += 2;
    return currentY;
  }

  /**
   * 🆕 BLOQUE 3: Tabla de Representantes (solo para ventas empresariales)
   * Muestra la lista de pasajeros que viajan con sus datos y asientos
   */
  private static addRepresentativesTable(
    doc: jsPDF, 
    representatives: TicketRepresentative[], 
    startY: number
  ): number {
    let currentY = startY;
    
    // Título de la sección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `PASAJEROS QUE VIAJAN (${representatives.length})`, 
      this.MARGIN, 
      currentY
    );
    currentY += 6;
    
    // Encabezado de la tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, currentY, this.CONTENT_WIDTH, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const numX = this.MARGIN + 2;
    const nameX = this.MARGIN + 10;
    const docX = this.MARGIN + 90;
    const seatX = this.MARGIN + 150;
    
    doc.text('#', numX, currentY + 5);
    doc.text('NOMBRE', nameX, currentY + 5);
    doc.text('DOCUMENTO', docX, currentY + 5);
    doc.text('ASIENTO', seatX, currentY + 5);
    
    currentY += 8;
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
    currentY += 2;
    
    // Filas de representantes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    representatives.forEach((rep, index) => {
      // Número
      doc.text(`${index + 1}`, numX, currentY + 4, { align: 'left' });
      
      // Nombre (máx 70mm, truncar si es muy largo)
      const name = this.splitText(doc, rep.passenger_name, 70, 8)[0];
      doc.text(name, nameX, currentY + 4);
      
      // Documento
      const docLabel = this.getDocTypeLabel(rep.passenger_doc_type);
      doc.text(`${docLabel}: ${rep.passenger_doc_number}`, docX, currentY + 4);
      
      // Asiento
      doc.text(rep.seat_number || '-', seatX, currentY + 4);
      
      currentY += 6;
      
      // Línea separadora entre filas
      if (index < representatives.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
        currentY += 1;
      }
    });
    
    // Línea final de la tabla
    currentY += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
    currentY += 5;
    
    return currentY;
  }

  /**
   * Obtiene la etiqueta del tipo de documento
   */
  private static getDocTypeLabel(docType: string): string {
    const types: Record<string, string> = {
      '1': 'DNI',
      '4': 'Carnet Ext.',
      '6': 'RUC',
      '7': 'Pasaporte',
      '0': 'Otros'
    };
    return types[docType] || 'Doc';
  }

  /**
   * Agrupa items idénticos sumando cantidades
   * Items se consideran idénticos si tienen la misma descripción, precio unitario y descuento
   */
  private static groupItems(items: any[]): any[] {
    const grouped = new Map<string, any>();
    
    items.forEach(item => {
      // Crear clave única basada en descripción, precio unitario y descuento
      const key = `${item.description}|${item.unit_price}|${item.discount || 0}`;
      
      if (grouped.has(key)) {
        // Sumar cantidad y total
        const existing = grouped.get(key)!;
        existing.quantity += item.quantity;
        existing.total_line += item.total_line;
      } else {
        // Clonar el item para no modificar el original
        grouped.set(key, { ...item });
      }
    });
    
    return Array.from(grouped.values());
  }

  /**
   * BLOQUE 4: Tabla de items
   */
  private static addItemsTable(doc: jsPDF, ticketData: TicketData, startY: number, rawBackendItems?: any[]): number {
    let currentY = startY;
    
    // Encabezado de la tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(this.MARGIN, currentY, this.CONTENT_WIDTH, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const descX = this.MARGIN + 2;
    const cantX = this.PAGE_WIDTH - this.MARGIN - 92;
    const unidadX = this.PAGE_WIDTH - this.MARGIN - 72;
    const precioX = this.PAGE_WIDTH - this.MARGIN - 42;
    const totalX = this.PAGE_WIDTH - this.MARGIN - 2;
    
    doc.text('DESCRIPCIÓN', descX, currentY + 5);
    doc.text('CANTIDAD', cantX, currentY + 5, { align: 'center' });
    doc.text('UNIDAD', unidadX, currentY + 5, { align: 'center' });
    doc.text('PRECIO UNIT.', precioX, currentY + 5, { align: 'right' });
    doc.text('TOTAL', totalX, currentY + 5, { align: 'right' });
    
    currentY += 8;
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
    currentY += 3;
    
    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // 🔧 AGRUPACIÓN: Agrupar items idénticos sumando cantidades
    const groupedItems = this.groupItems(ticketData.financial_breakdown.items);
    
    groupedItems.forEach((item, index) => {
      const itemStartY = currentY;
      
      // Descripción (puede ser multilínea)
      let description = item.description;
      
      // Agregar descuento a la descripción si existe
      if (item.discount && item.discount > 0) {
        description += ` (descuento: ${item.discount.toFixed(2)})`;
      }
      
      // Agregar info del viaje en la descripción SOLO si NO es encomienda
      // Las encomiendas tienen descripciones más largas y detalladas que no requieren info del viaje
      const isCargoItem = description.toLowerCase().includes('encomienda') || 
                          description.toLowerCase().includes('envío') ||
                          description.toLowerCase().includes('paquete');
      
      if (!isCargoItem) {
        const tripInfo = this.getTripInfo(ticketData);
        if (tripInfo) {
          description += `\n${tripInfo}`;
        }
      }
      
      // Calcular ancho máximo para la descripción (desde descX hasta antes de cantX)
      // Dejar un margen de seguridad de 3mm antes de la columna CANTIDAD
      // cantX está en: this.PAGE_WIDTH - this.MARGIN - 92
      const cantidadColumnX = this.PAGE_WIDTH - this.MARGIN - 92;
      const maxDescWidth = cantidadColumnX - descX - 3;
      
      // Dividir descripción en líneas respetando el ancho máximo
      const descLines = this.splitText(doc, description, maxDescWidth, 9);
      
      // Dibujar cada línea de la descripción
      descLines.forEach((line, i) => {
        doc.text(line, descX, itemStartY + 4 + (i * 4.5));
      });
      
      // Calcular altura total del item basado en número de líneas
      const itemHeight = Math.max(descLines.length * 4.5, 6);
      
      // Cantidad (alineado con primera línea)
      const cantX = this.PAGE_WIDTH - this.MARGIN - 92;
      doc.text(item.quantity.toString(), cantX, itemStartY + 4, { align: 'center' });
      
      // Unidad (alineado con primera línea) - usar unit_code del backend si está disponible
      const unidadX = this.PAGE_WIDTH - this.MARGIN - 72;
      const unitCode = item.unit_code || 
                      (rawBackendItems && rawBackendItems[index]?.unit_code) || 
                      'NIU';
      doc.text(unitCode, unidadX, itemStartY + 4, { align: 'center' });
      
      // Precio unitario (alineado con primera línea)
      const precioX = this.PAGE_WIDTH - this.MARGIN - 42;
      doc.text(
        `${getCurrencySymbol(ticketData.currency_code || 'PEN')} ${item.unit_price.toFixed(2)}`,
        precioX,
        itemStartY + 4,
        { align: 'right' }
      );
      
      // Total (alineado con primera línea)
      const totalX = this.PAGE_WIDTH - this.MARGIN - 2;
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${getCurrencySymbol(ticketData.currency_code || 'PEN')} ${item.total_line.toFixed(2)}`,
        totalX,
        itemStartY + 4,
        { align: 'right' }
      );
      doc.setFont('helvetica', 'normal');
      
      // Avanzar currentY según la altura del item + espacio adicional
      currentY = itemStartY + itemHeight + 4;
      
      // Línea separadora entre items
      if (index < groupedItems.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
        currentY += 2;
      }
    });
    
    // Línea final de la tabla
    currentY += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(this.MARGIN, currentY, this.PAGE_WIDTH - this.MARGIN, currentY);
    currentY += 3;
    
    return currentY;
  }

  /**
   * Obtiene información del viaje para mostrar en la descripción
   */
  private static getTripInfo(ticketData: TicketData): string | null {
    const details = ticketData.trip_details.details;
    
    const origen = details.find(d => d.label === 'Origen')?.value;
    const destino = details.find(d => d.label === 'Destino')?.value;
    const fecha = details.find(d => d.label.includes('Fecha'))?.value;
    const embarque = details.find(d => d.label.includes('Embarque'))?.value;
    const asiento = details.find(d => d.label === 'Asiento')?.value;
    
    const parts = [];
    if (origen && destino) parts.push(`Ruta: ${origen} - ${destino}`);
    if (fecha) parts.push(`Fecha: ${fecha}`);
    if (embarque) parts.push(`Embarque: ${embarque}`);
    if (asiento && !asiento.toLowerCase().includes('libre')) parts.push(`Asiento: ${asiento}`);
    
    return parts.length > 0 ? parts.join(' | ') : null;
  }

  /**
   * BLOQUE 5: Sección de totales
   */
  private static addTotalsSection(doc: jsPDF, ticketData: TicketData, startY: number): number {
    let currentY = startY;
    
    const leftX = this.MARGIN;
    const rightX = this.PAGE_WIDTH - this.MARGIN - 50;
    const valueX = this.PAGE_WIDTH - this.MARGIN - 2;
    
    // Monto en palabras (izquierda)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SON:', leftX, currentY);
    
    doc.setFont('helvetica', 'normal');
    const wordsLines = this.splitText(doc, ticketData.payment_info.amount_in_words, 90, 8);
    let wordsY = currentY;
    wordsLines.forEach(line => {
      doc.text(line, leftX + 10, wordsY);
      wordsY += 4;
    });
    
    // Totales SUNAT (derecha)
    doc.setFontSize(9);
    
    const sunat = ticketData.sunat_totals;
    const currencySymbol = getCurrencySymbol(ticketData.currency_code || 'PEN');
    
    const totales = [
      { label: 'SUBTOTAL', value: sunat.total_taxable, show: parseFloat(sunat.total_taxable) > 0 },
      { label: 'IGV 18%', value: sunat.total_igv, show: true }, // Siempre mostrar IGV
      { label: 'EXONERADA', value: sunat.total_exonerated, show: parseFloat(sunat.total_exonerated) > 0 },
    ];
    
    totales.forEach(t => {
      if (t.show) {
        doc.setFont('helvetica', 'normal');
        doc.text(t.label, rightX, currentY);
        doc.text(`${currencySymbol} ${parseFloat(t.value).toFixed(2)}`, valueX, currentY, { align: 'right' });
        currentY += 5;
      }
    });
    
    // Total final destacado
    currentY += 2;
    doc.setFillColor(34, 139, 34);
    doc.rect(rightX - 2, currentY - 4, 52, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL', rightX, currentY);
    
    const totalPagar = ticketData.financial_breakdown.summary.find(s =>
      s.label.toUpperCase().includes('TOTAL')
    )?.value || ticketData.sunat_totals.total_taxable;
    
    const totalClean = totalPagar.toString().replace(/^S\/\s*/, '').trim();
    doc.text(`${currencySymbol} ${parseFloat(totalClean).toFixed(2)}`, valueX, currentY, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    currentY += 10;
    
    return Math.max(currentY, wordsY + 5);
  }

  /**
   * BLOQUE 6: Footer con QR y texto legal
   */
  private static async addFooter(doc: jsPDF, ticketData: TicketData, startY: number): Promise<number> {
    let currentY = startY;
    
    // QR a la izquierda
    if (ticketData.footer.qr_code_base64) {
      try {
        const qrSize = 35;
        const qrDataUrl = ticketData.footer.qr_code_base64.startsWith('data:image')
          ? ticketData.footer.qr_code_base64
          : `data:image/png;base64,${ticketData.footer.qr_code_base64}`;
        
        doc.addImage(qrDataUrl, 'PNG', this.MARGIN, currentY, qrSize, qrSize);
        
        // Texto del QR
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Representación impresa de la factura electrónica,', this.MARGIN, currentY + qrSize + 3);
        doc.text('puede consultar este documento en', this.MARGIN, currentY + qrSize + 6);
        doc.text(ticketData.footer.consultation_url, this.MARGIN, currentY + qrSize + 9);
      } catch (error) {
        console.error('Error añadiendo QR:', error);
      }
    }
    
    // Texto legal (derecha)
    const legalX = this.MARGIN + 80;
    let legalY = currentY;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    const legalText = 'Bienes y servicios transferidos en la amazonía región selva para ser consumidos en la misma.';
    const legalLines = this.splitText(doc, legalText, 90, 7);
    
    legalLines.forEach(line => {
      doc.text(line, legalX, legalY);
      legalY += 3;
    });
    
    legalY += 2;
    doc.text(`Comprobante generado con S.E.G.R.E.`, legalX, legalY);
    /**
   * SISTEMA EMPRESARIAL DE GESRION ROMERO EXPRESS "SEGRE"
   */
    return Math.max(currentY + 50, legalY + 5);
  }

  /**
   * Utilidad para dividir texto en múltiples líneas
   */
  private static splitText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
    doc.setFontSize(fontSize);
    if (!text || text.trim() === '') return [''];

    // Primero dividir por saltos de línea explícitos
    const paragraphs = text.split('\n');
    const allLines: string[] = [];

    // Procesar cada párrafo por separado
    paragraphs.forEach(paragraph => {
      if (!paragraph || paragraph.trim() === '') {
        allLines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = doc.getTextWidth(testLine);
        
        if (testWidth > maxWidth && currentLine) {
          allLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) {
        allLines.push(currentLine);
      }
    });

    return allLines.length > 0 ? allLines : [''];
  }
}
