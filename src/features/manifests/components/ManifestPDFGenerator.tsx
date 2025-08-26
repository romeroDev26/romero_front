import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Manifest } from '../types/manifest.types';

export const generatePassengerManifestPDF = (manifestData: Manifest): { pdf: jsPDF; blob: Blob } => {

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 15;
  let currentY = 20;

  // HEADER
  if (manifestData.company) {
    const company = manifestData.company;
    try {
      if (company.logo_url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        // carga sin bloquear: no esperamos promesa aquí (mejor fallback si falla)
        img.src = company.logo_url as string;
        const logoW = 30;
        const logoH = 15;
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, currentY - 4, logoW, logoH);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(company.name, margin + logoW + 8, currentY + 4);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`RUC: ${company.ruc}`, margin + logoW + 8, currentY + 9);
        currentY += Math.max(logoH, 16);
      } else {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(company.name, pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`RUC: ${company.ruc} | Tel: ${company.phone}`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;
      }
    } catch (e) {
      // fallback
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(company.name, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
    }
  }

  // Separador y título
  pdf.setLineWidth(0.8);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('MANIFIESTO DE PASAJEROS', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;
  pdf.setFontSize(12);
  pdf.text(`N° ${manifestData.manifest_number}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;

  // Trip info
  pdf.setFontSize(9);
  const genDate = manifestData.generation_date ? new Date(manifestData.generation_date).toLocaleDateString('es-PE') : '';
  const depInfo = manifestData.departure_datetime ? new Date(manifestData.departure_datetime) : null;
  let tripInfo = `Fecha: ${genDate}`;
  if (manifestData.vessel_name) tripInfo += ` | Embarcación: ${manifestData.vessel_name}`;
  if (depInfo) tripInfo += ` | Salida: ${depInfo.toLocaleDateString('es-PE')} ${depInfo.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
  tripInfo += ` | Estado: ${manifestData.status}`;
  pdf.text(tripInfo, margin, currentY);
  currentY += 10;

  // Totales
  pdf.setFont('helvetica', 'bold');
  if (manifestData.manifest_type === 'CARGO') {
    pdf.text(`Total de Carga: ${manifestData.total_cargo_weight_kg} Kg`, margin, currentY);
  } else {
    pdf.text(`Total de Pasajeros: ${manifestData.total_passengers}`, margin, currentY);
  }
  currentY += 12;

  // TABLAS
  if (manifestData.manifest_type === 'CARGO') {
    // Reutilizar la lógica existente para cargo (agrupado o plano)
    const grouped = (manifestData as any).cargo_grouped_by_stops;
    if (grouped && Array.isArray(grouped.groups) && grouped.groups.length > 0) {
      for (const group of grouped.groups) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        const origin = (group.origin_port_name || 'N/A').toString();
        const dest = (group.destination_port_name || 'N/A').toString();
        pdf.text(`${origin} → ${dest}`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        const tableData = (group.items || []).map((item: any, idx: number) => [
          (idx + 1).toString(),
          item.cargo_description || 'N/A',
          `${item.cargo_weight_kg} Kg`,
          item.unit_code || 'N/A',
          item.remitente_nombre || 'N/A',
          item.remitente_doc?.replace('1-', 'DNI: ') || 'N/A',
          item.destinatario_nombre || 'N/A',
          item.destinatario_doc?.replace('1-', 'DNI: ') || 'N/A',
          item.source_document || 'N/A'
        ]);

        const columnStyles: any = {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 30 },
          2: { halign: 'center', cellWidth: 15 },
          3: { halign: 'center', cellWidth: 12 },
          4: { halign: 'left', cellWidth: 25 },
          5: { halign: 'center', cellWidth: 20 },
          6: { halign: 'left', cellWidth: 25 },
          7: { halign: 'center', cellWidth: 20 },
          8: { halign: 'center', cellWidth: 22 }
        };

        autoTable(pdf, {
          startY: currentY,
          head: [['N°', 'DESCRIPCIÓN', 'PESO', 'UNIDAD', 'REMITENTE', 'DOC. REM.', 'DESTINATARIO', 'DOC. DEST.', 'DOCUMENTO']],
          body: tableData,
          styles: { fontSize: 6, cellPadding: 1.5, halign: 'center', valign: 'middle' },
          headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: 'bold', fontSize: 6 },
          columnStyles,
          margin: { left: margin, right: margin },
          tableWidth: 'wrap',
          theme: 'grid'
        });

        const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 8;
        const groupWeight = group.items?.reduce((s: number, it: any) => s + (Number(it.cargo_weight_kg) || 0), 0) || 0;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(`Subtotal: ${groupWeight} Kg`, margin, finalY + 8);
        currentY = finalY + 16;
      }
    } else if (manifestData.items && manifestData.items.length > 0) {
      const tableData = manifestData.items.map((item: any, idx: number) => [
        (idx + 1).toString(),
        item.cargo_description || 'N/A',
        `${item.cargo_weight_kg} Kg`,
        item.unit_code || 'N/A',
        item.remitente_nombre || 'N/A',
        item.remitente_doc?.replace('1-', 'DNI: ') || 'N/A',
        item.destinatario_nombre || 'N/A',
        item.destinatario_doc?.replace('1-', 'DNI: ') || 'N/A',
        item.source_document || 'N/A'
      ]);

      const columnStyles2: any = {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 12 },
        4: { halign: 'left', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 20 },
        6: { halign: 'left', cellWidth: 25 },
        7: { halign: 'center', cellWidth: 20 },
        8: { halign: 'center', cellWidth: 22 }
      };

      autoTable(pdf, {
        startY: currentY,
        head: [['N°', 'DESCRIPCIÓN', 'PESO', 'UNIDAD', 'REMITENTE', 'DOC. REM.', 'DESTINATARIO', 'DOC. DEST.', 'DOCUMENTO']],
        body: tableData,
        styles: { fontSize: 6, cellPadding: 1.5, halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: 'bold', fontSize: 6 },
        columnStyles: columnStyles2,
        margin: { left: margin, right: margin },
        tableWidth: 'wrap',
        theme: 'grid'
      });
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('No hay registros de carga para mostrar.', margin, currentY);
      currentY += 8;
    }
  } else {
    // PASAJEROS: construir tabla centrada y con estilo similar a carga
    if (manifestData.items && manifestData.items.length > 0) {
      const tableData = manifestData.items.map((item: any, idx: number) => {
        const rawSeller = item.seller_name ?? item?.seller?.name ?? manifestData.generated_by_name ?? manifestData.generated_by;
        const sellerDisplay = rawSeller ? String(rawSeller).trim().split(' ')[0] : 'VENDEDOR';
        const identityLabel = item.passenger_doc_type === '1' ? 'DNI' : item.passenger_doc_type === '2' ? 'CE' : 'PAS';
        return [
          (idx + 1).toString(),
          item.passenger_name || 'N/A',
          `${identityLabel}: ${item.passenger_doc_number || 'N/A'}`,
          sellerDisplay,
          item.seat_number || 'N/A',
          item.boarding_port_name || 'N/A',
          item.disembarking_port_name || 'N/A',
          item.passenger_phone || 'N/A'
        ];
      });

      // Column widths (mm) y centrado
      const colWidths = [12, 60, 32, 28, 14, 28, 28, 24];
      const totalTableWidth = colWidths.reduce((s, w) => s + w, 0);
      const leftMargin = Math.max(margin, (pageWidth - totalTableWidth) / 2);
      const passengerColumnStyles: any = {
        0: { halign: 'center', cellWidth: colWidths[0] },
        1: { halign: 'left', cellWidth: colWidths[1] },
        2: { halign: 'center', cellWidth: colWidths[2] },
        3: { halign: 'center', cellWidth: colWidths[3] },
        4: { halign: 'center', cellWidth: colWidths[4] },
        5: { halign: 'center', cellWidth: colWidths[5] },
        6: { halign: 'center', cellWidth: colWidths[6] },
        7: { halign: 'center', cellWidth: colWidths[7] }
      };

      autoTable(pdf, {
        startY: currentY,
        head: [['N°', 'APELLIDOS Y NOMBRES', 'N° IDENTIDAD', 'VENDEDOR', 'ASIENTO', 'ORIGEN', 'DESTINO', 'TELÉFONO']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center', valign: 'middle' },
        bodyStyles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
        columnStyles: passengerColumnStyles,
        margin: { left: leftMargin, right: leftMargin },
        tableWidth: 'auto',
        styles: { overflow: 'linebreak', fontSize: 7, lineColor: [0, 0, 0], lineWidth: 0.1 }
      });
      const lastY = (pdf as any).lastAutoTable?.finalY || currentY;
      currentY = lastY + 8;
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('No hay registros para mostrar en este manifiesto.', margin, currentY);
      currentY += 8;
    }
  }

  // OBSERVACIONES
  if (manifestData.observations) {
    const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Observaciones:', margin, finalY + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(pdf.splitTextToSize(manifestData.observations, pageWidth - margin * 2), margin, finalY + 14);
    currentY = finalY + 24;
  }

  // FOOTER
  const footerY = pdf.internal.pageSize.height - 25;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, margin, footerY + 3);
  if (manifestData.generated_by_name) pdf.text(`Por: ${manifestData.generated_by_name}`, margin, footerY + 8);
  pdf.text('Sistema de Gestión - Transportes Romero', pageWidth - margin - 60, footerY + 3);

  // Crear blob del PDF y devolver
  const blob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
  return { pdf, blob };
};

// Props del componente
interface ManifestPDFGeneratorProps {
  manifestData: Manifest;
}

// Componente React para generar y manejar el PDF
export const ManifestPDFGenerator: React.FC<ManifestPDFGeneratorProps> = ({ 
  manifestData
}) => {
  
  const handleGeneratePDF = () => {
    const { pdf } = generatePassengerManifestPDF(manifestData);
    
    // Abrir en nueva ventana para previsualización
    const blob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Limpiar el URL después de un tiempo
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleDownloadPDF = () => {
    const { pdf } = generatePassengerManifestPDF(manifestData);
    pdf.save(`manifiesto-${manifestData.manifest_number}.pdf`);
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={handleGeneratePDF}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Vista Previa
      </button>
      <button
        onClick={handleDownloadPDF}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Descargar
      </button>
    </div>
  );
};
