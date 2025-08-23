import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation } from '../types';

export const generateQuotationPDF = (
  quotationData: Quotation
): { pdf: jsPDF; blob: Blob } => {
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 15;
  let currentY = 20;

  // ============ HEADER CON INFORMACIÓN DE LA EMPRESA ============
  if (quotationData.company) {
    const company = quotationData.company;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(company.business_name, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const infoText = `RUC: ${company.ruc} | ${company.address} | Tel: ${company.phone}`;
    pdf.text(infoText, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
  }

  // ============ TÍTULO DE LA COTIZACIÓN ============
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('COTIZACIÓN', margin, currentY);
  
  // Número de la cotización
  pdf.setFontSize(10);
  pdf.text(`N° ${quotationData.series}-${quotationData.number.toString().padStart(6, '0')}`, pageWidth - margin - 30, currentY, { align: 'right' });
  
  currentY += 8;

  // ============ INFORMACIÓN EN UNA LÍNEA ============
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  let quotationInfo = `Fecha: ${new Date(quotationData.issue_date).toLocaleDateString('es-PE')}`;
  quotationInfo += ` | Válida hasta: ${new Date(quotationData.valid_until).toLocaleDateString('es-PE')}`;
  quotationInfo += ` | Moneda: ${quotationData.currency_code}`;
  
  pdf.text(quotationInfo, margin, currentY);
  currentY += 6;
  
  // Línea separadora
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;
  
  // Información del cliente
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`Cliente: ${quotationData.client.name}`, margin, currentY);
  pdf.setFont('helvetica', 'normal');
  const clientDoc = quotationData.client.doc_type === '1' ? 'DNI' : quotationData.client.doc_type === '6' ? 'RUC' : 'Documento';
  pdf.text(`${clientDoc}: ${quotationData.client.doc_number}`, margin + 80, currentY);
  currentY += 10;

  // ============ TABLA DE SERVICIOS ============
  if (quotationData.items && quotationData.items.length > 0) {
    const tableData = quotationData.items.map((item, index) => [
      (index + 1).toString(),
      item.item_description || 'N/A',
      item.quantity.toString(),
      item.unit_code || 'UND',
      `${quotationData.currency_code} ${parseFloat(item.unit_price.toString()).toFixed(2)}`,
      `${quotationData.currency_code} ${item.discount.toString()}`,
      `${quotationData.currency_code} ${(parseFloat(item.unit_price.toString()) * item.quantity - parseFloat(item.discount.toString())).toFixed(2)}`
    ]);

    autoTable(pdf, {
      startY: currentY,
      head: [['N°', 'DESCRIPCIÓN', 'CANT.', 'UND.', 'P. UNITARIO', 'DESCUENTO', 'SUBTOTAL']],
      body: tableData,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [100, 100, 100],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 60 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'right', cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
      theme: 'grid',
    });

    let contentY = (pdf as any).lastAutoTable.finalY || currentY + 50;
    contentY += 10;

    // ============ OBSERVACIONES ============
    if (quotationData.notes && quotationData.notes.trim() !== '') {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Observaciones:', margin, contentY);
      contentY += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const splitNotes = pdf.splitTextToSize(quotationData.notes, pageWidth - (margin * 2));
      pdf.text(splitNotes, margin, contentY);
      contentY += splitNotes.length * 5 + 10;
    }

    // ============ TABLA DE CUENTAS BANCARIAS ============
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('DEPOSITAR A NUESTRAS CTAS:', margin, contentY);
    contentY += 8;
    
    const bankAccountsData = [
      ['BBVA SOLES', '0011-0301-01001363-48', '011-301-000100136348-98'],
      ['BCP SOLES', '390-71637705-0-89', '002390171637705088933'],
      ['BBVA DÓLARES', '0011-0301-02016350-78', '011-301-000201635078-93'],
      ['BCP DÓLARES', '390-71637719-1-03', '002390171637719103336']
    ];

    autoTable(pdf, {
      startY: contentY,
      head: [['ENTIDAD FINANCIERA', 'NÚMERO DE CUENTA', 'CCI']],
      body: bankAccountsData,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [100, 100, 100],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 50 },
        1: { halign: 'center', cellWidth: 60 },
        2: { halign: 'center', cellWidth: 70 },
      },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
      theme: 'grid',
    });

    contentY = (pdf as any).lastAutoTable.finalY + 15;

    // ============ TOTALES AL FINAL DEL DOCUMENTO ============
    const totalsX = pageWidth - margin - 70;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    let totalY = contentY;
    pdf.text('Subtotal:', totalsX, totalY);
    pdf.text(`${quotationData.currency_code} ${parseFloat(quotationData.total_taxable).toFixed(2)}`, totalsX + 40, totalY, { align: 'right' });
    totalY += 6;
    
    if (parseFloat(quotationData.total_discount) > 0) {
      pdf.text('Descuento:', totalsX, totalY);
      pdf.text(`${quotationData.currency_code} ${parseFloat(quotationData.total_discount).toFixed(2)}`, totalsX + 40, totalY, { align: 'right' });
      totalY += 6;
    }
    
    pdf.text('IGV (18%):', totalsX, totalY);
    pdf.text(`${quotationData.currency_code} ${parseFloat(quotationData.total_igv).toFixed(2)}`, totalsX + 40, totalY, { align: 'right' });
    totalY += 6;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(totalsX, totalY + 1, totalsX + 40, totalY + 1);
    totalY += 5;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('TOTAL:', totalsX, totalY);
    pdf.text(`${quotationData.currency_code} ${parseFloat(quotationData.total_payable).toFixed(2)}`, totalsX + 40, totalY, { align: 'right' });
    
    totalY += 10;

    // ============ TOTAL EN PALABRAS ============
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.text(`Total en palabras: ${quotationData.total_in_words}`, margin, totalY);
    
    totalY += 15;
    
    // ============ FOOTER ============
    // Asegurar que haya suficiente espacio para el footer
    const footerHeight = 30;
    const minFooterY = pdf.internal.pageSize.height - footerHeight;
    const finalFooterY = Math.max(totalY + 10, minFooterY);
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, finalFooterY - 5, pageWidth - margin, finalFooterY - 5);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(
      `Generado el: ${new Date().toLocaleString('es-PE')}`,
      margin,
      finalFooterY + 3
    );
    
    if (quotationData.seller && quotationData.seller.full_name) {
      pdf.text(
        `Vendedor: ${quotationData.seller.full_name}`,
        margin,
        finalFooterY + 8
      );
    }
    
    pdf.text(
      'Sistema de Gestión - Transportes Romero',
      pageWidth - margin - 70,
      finalFooterY + 3
    );
    
    pdf.text(
      `Válida hasta: ${new Date(quotationData.valid_until).toLocaleDateString('es-PE')}`,
      pageWidth - margin - 70,
      finalFooterY + 8
    );
  }

  const blob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
  return { pdf, blob };
};
