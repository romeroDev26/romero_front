import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Manifest } from '../types/manifest.types';

interface ManifestPDFGeneratorProps {
  manifestData: Manifest;
}

export const generatePassengerManifestPDF = (
  manifestData: Manifest
): { pdf: jsPDF; blob: Blob } => {
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 15;
  let currentY = 20;

  // ============ HEADER CON INFORMACIÓN DE LA EMPRESA ============
  if (manifestData.company) {
    const company = manifestData.company;
    
    // Logo de la empresa (si está disponible)
    if (company.logo_url) {
      try {
        // TODO: Cargar logo desde la URL y agregarlo al PDF
        // Por ahora dejamos un espacio reservado para el logo
        const logoSize = 25;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, currentY, logoSize, logoSize);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('LOGO', margin + logoSize/2, currentY + logoSize/2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        
        // Información de la empresa al lado del logo
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(company.name, margin + logoSize + 8, currentY + 6);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`RUC: ${company.ruc}`, margin + logoSize + 8, currentY + 12);
        
        pdf.setFontSize(8);
        const addressLines = pdf.splitTextToSize(company.address, pageWidth - margin - logoSize - 20);
        pdf.text(addressLines, margin + logoSize + 8, currentY + 17);
        
        const addressHeight = addressLines.length * 3;
        pdf.text(`Teléfono: ${company.phone}`, margin + logoSize + 8, currentY + 17 + addressHeight + 3);
        
        currentY += Math.max(logoSize, 25) + 15;
      } catch (error) {
        console.error('Error loading company logo:', error);
        // Continuar sin logo en caso de error
        currentY += 10;
      }
    } else {
      // Sin logo, solo información de texto
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(company.name, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`RUC: ${company.ruc}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 6;
      pdf.setFontSize(9);
      const addressLines = pdf.splitTextToSize(company.address, pageWidth - (margin * 2));
      pdf.text(addressLines, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += addressLines.length * 4 + 3;
      pdf.text(`Teléfono: ${company.phone}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 15;
    }
  }

  // Línea separadora después del header de empresa
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // ============ TÍTULO DEL MANIFIESTO ============
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('MANIFIESTO DE PASAJEROS', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 8;
  pdf.setFontSize(12);
  pdf.text(`N° ${manifestData.manifest_number}`, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 15;

  // ============ INFORMACIÓN DEL VIAJE ============
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Fecha de generación
  pdf.text(`Fecha de Generación: ${new Date(manifestData.generation_date).toLocaleDateString('es-PE')}`, margin, currentY);
  pdf.text(`Estado: ${manifestData.status}`, pageWidth - margin - 60, currentY);
  
  currentY += 8;
  
  // Información del viaje si está disponible
  if (manifestData.vessel_name || manifestData.route_name) {
    if (manifestData.vessel_name) {
      pdf.text(`Embarcación: ${manifestData.vessel_name}`, margin, currentY);
    }
    if (manifestData.route_name) {
      pdf.text(`Ruta: ${manifestData.route_name}`, pageWidth / 2, currentY);
    }
    currentY += 8;
  }
  
  if (manifestData.departure_datetime) {
    const departureDate = new Date(manifestData.departure_datetime);
    pdf.text(
      `Fecha/Hora de Salida: ${departureDate.toLocaleDateString('es-PE')} ${departureDate.toLocaleTimeString('es-PE')}`, 
      margin, 
      currentY
    );
    currentY += 8;
  }
  
  // Línea separadora
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;
  
  // Total de pasajeros
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total de Pasajeros: ${manifestData.total_passengers}`, margin, currentY);
  
  currentY += 12;

  // ============ TABLA DE PASAJEROS ============
  // Preparar datos de la tabla según los campos solicitados:
  // N°, APELLIDOS Y NOMBRES, N° IDENTIDAD, VENDEDOR (PRIMER NOMBRE), ASIENTO, ORIGEN, DESTINO, TELÉFONO
  const tableData = manifestData.items.map((item, index) => [
    (index + 1).toString(), // N°
    item.passenger_name || 'N/A', // APELLIDOS Y NOMBRES
    `${item.passenger_doc_type === '1' ? 'DNI' : item.passenger_doc_type === '2' ? 'CE' : 'PAS'}: ${item.passenger_doc_number || 'N/A'}`, // N° IDENTIDAD
    manifestData.generated_by_name ? manifestData.generated_by_name.split(' ')[0] : 'VENDEDOR', // VENDEDOR (PRIMER NOMBRE)
    item.seat_number || 'N/A', // ASIENTO
    item.boarding_port_name || 'N/A', // ORIGEN
    item.disembarking_port_name || 'N/A', // DESTINO
    item.passenger_phone || 'N/A' // TELÉFONO
  ]);

  // Configurar la tabla con los campos específicos solicitados
  autoTable(pdf, {
    startY: currentY,
    head: [['N°', 'APELLIDOS Y NOMBRES', 'N° IDENTIDAD', 'VENDEDOR', 'ASIENTO', 'ORIGEN', 'DESTINO', 'TELÉFONO']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185], // Azul corporativo
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 }, // N°
      1: { halign: 'left', cellWidth: 50 },   // APELLIDOS Y NOMBRES
      2: { halign: 'center', cellWidth: 28 }, // N° IDENTIDAD
      3: { halign: 'center', cellWidth: 22 }, // VENDEDOR
      4: { halign: 'center', cellWidth: 16 }, // ASIENTO
      5: { halign: 'center', cellWidth: 24 }, // ORIGEN
      6: { halign: 'center', cellWidth: 24 }, // DESTINO
      7: { halign: 'center', cellWidth: 24 }  // TELÉFONO
    },
    margin: { left: margin, right: margin },
    tableWidth: 'wrap',
    styles: {
      overflow: 'linebreak',
      fontSize: 7,
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    }
  });

  // ============ OBSERVACIONES ============
  if (manifestData.observations) {
    const finalY = (pdf as any).lastAutoTable.finalY + 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Observaciones:', margin, finalY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const splitObservations = pdf.splitTextToSize(manifestData.observations, pageWidth - (margin * 2));
    pdf.text(splitObservations, margin, finalY + 8);
  }

  // ============ FOOTER ============
  const footerY = pdf.internal.pageSize.height - 25;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(
    `Generado el: ${new Date().toLocaleString('es-PE')}`,
    margin,
    footerY + 3
  );
  
  if (manifestData.generated_by_name) {
    pdf.text(
      `Por: ${manifestData.generated_by_name}`,
      margin,
      footerY + 8
    );
  }
  
  pdf.text(
    'Sistema de Gestión - Transportes Romero',
    pageWidth - margin - 60,
    footerY + 3
  );

  // Crear blob del PDF
  const blob = new Blob([pdf.output('blob')], { type: 'application/pdf' });

  return { pdf, blob };
};

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
