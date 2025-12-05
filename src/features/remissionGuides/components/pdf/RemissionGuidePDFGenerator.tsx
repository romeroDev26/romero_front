// src/features/remissionGuides/components/pdf/RemissionGuidePDFGenerator.tsx

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutoGenerateRemissionGuide } from '../../../../types';

// Tipo para especificar el tipo de guía de remisión
export type RemissionGuideType = 'transportista' | 'remitente';

/**
 * Genera un PDF A4 para una guía de remisión
 * Soporta tanto guías de transportista como de remitente
 * @param guideData Datos de la guía
 * @param guideType Tipo de guía (transportista o remitente)
 */
export const generateRemissionGuidePDF = async (
  guideData: AutoGenerateRemissionGuide,
  guideType: RemissionGuideType = 'transportista'
): Promise<{ pdf: jsPDF; blob: Blob }> => {
  // Log detallado para diagnosticar el problema con la URL del logo
  console.debug('[DEBUG] Datos relacionados con el logo:', {
    company_logo_url: guideData.company_logo_url,
    tipoCompanyLogoUrl: typeof guideData.company_logo_url,
    tieneValor: Boolean(guideData.company_logo_url),
    esStringValido: typeof guideData.company_logo_url === 'string' && guideData.company_logo_url.trim() !== '',
    urlExplicita: "https://romero-cdn.b-cdn.net/companies/20602423248/2025/08/logos/logo.png"
  });
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width; // 210mm
  const pageHeight = pdf.internal.pageSize.height; // 297mm
  const margin = 8; // Margen mínimo optimizado para impresión (8mm)
  let currentY = 12;

  // ============ HEADER CON LOGO Y DATOS DE LA EMPRESA ============
  // Logo mejorado en el lado izquierdo
  const logoX = margin;
  const logoY = currentY;
  const logoW = 50;
  const logoH = 25;
  
  // Ya no usamos loadImageElement, ahora usamos la estrategia directa de ManifestPreviewModal.tsx

  // Implementando la estrategia que funciona en ManifestPreviewModal.tsx
  try {
    // SOLUCIÓN: Para garantizar que siempre tengamos una URL válida, usaremos
    // la URL de log.md como respaldo si la URL dinámica falla
    let logoUrl = guideData.company_logo_url;
    
    // Verificamos si la URL es válida, si no, usamos la URL de respaldo
    if (!logoUrl || typeof logoUrl !== 'string' || logoUrl.trim() === '') {
      logoUrl = "https://romero-cdn.b-cdn.net/companies/20602423248/2025/08/logos/logo.png";
      console.debug('URL dinámica inválida, usando URL de respaldo:', logoUrl);
    } else {
      console.debug('Usando URL dinámica correcta:', logoUrl);
    }
    
    // Ya tenemos garantizado que logoUrl es válida
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = () => {
        console.debug('Logo cargado exitosamente:', img.width, 'x', img.height);
        resolve(img);
      };
      img.onerror = (e) => {
        console.error('Error cargando imagen:', e);
        reject(e);
      };
      img.src = logoUrl;
    });
      
    // Calcular proporciones para mantener aspecto
    const ratio = img.width / img.height;
    let drawW = logoW - 10; // Reducir para que quepa bien
    let drawH = drawW / ratio;
    if (drawH > logoH - 10) {
      drawH = logoH - 10;
      drawW = drawH * ratio;
    }
    const dx = logoX + (logoW - drawW) / 2;
    const dy = logoY + (logoH - drawH) / 2;
    
    // Añadir la imagen especificando formato PNG explícitamente
    pdf.addImage(img, 'PNG', dx, dy, drawW, drawH);
    console.debug('Imagen añadida al PDF correctamente');
  } catch (err) {
    // En caso de cualquier error, registrar y mostrar texto de fallback
    console.error('Error cargando o procesando logo:', err);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(guideData.company_business_name || 'Empresa', logoX + logoW / 2, logoY + logoH / 2 - 2, { align: 'center' });
    pdf.setFontSize(7);
    const companyType = guideType === 'transportista' ? 'TRANSPORTISTA' : 'REMITENTE';
    pdf.text(`S.A.C. - ${companyType}`, logoX + logoW / 2, logoY + logoH / 2 + 4, { align: 'center' });
  }

  // Colocamos la información de la compañía al mismo nivel que el logo (a la derecha)
  const companyX = logoX + logoW + 10;
  const companyMaxWidth = pageWidth - companyX - margin;
  const companyStartY = logoY + 4; // un poco desde arriba del logo

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(guideData.company_business_name, companyX, companyStartY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  let companyInfoY = companyStartY + 6;
  // Dirección (puede ocupar varias líneas)
  const addressLines = pdf.splitTextToSize(guideData.company_address || '', companyMaxWidth);
  addressLines.forEach((line: string) => {
    pdf.text(line, companyX, companyInfoY);
    companyInfoY += 4;
  });
  // RUC
  pdf.text(`RUC: ${guideData.company_ruc}`, companyX, companyInfoY);
  companyInfoY += 5;
  // Teléfono y email si existen
  if (guideData.company_phone) {
    pdf.text(`Tel: ${guideData.company_phone}`, companyX, companyInfoY);
    companyInfoY += 4;
  }
  if (guideData.company_email) {
    pdf.text(guideData.company_email, companyX, companyInfoY);
    companyInfoY += 4;
  }

  // Ajustar currentY al mayor entre la base del logo y la info de la compañía
  const bottomOfLogo = logoY + logoH;
  const bottomOfCompanyInfo = companyInfoY;
  currentY = Math.max(bottomOfLogo, bottomOfCompanyInfo) + 6;

  // La observación se moverá para colocarla antes de la sección BIENES TRANSPORTADOS

  // ============ TÍTULO CENTRADO ============
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  
  // Título diferente según el tipo de guía
  const guideTitle = guideType === 'transportista' 
    ? 'GUÍA DE REMISIÓN TRANSPORTISTA'
    : 'GUÍA DE REMISIÓN REMITENTE';
  
  pdf.text(guideTitle, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  pdf.text('ELECTRÓNICA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;
  
  // Número de documento centrado
  pdf.setFontSize(11);
  pdf.text(guideData.document_number, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;

  // ============ SECCIONES DEL DOCUMENTO (2 COLUMNAS SIN RAYAS) ============
  
  // Helper functions para el nuevo diseño
  const checkPageSpace = (requiredSpace: number): number => {
    // Margen inferior más agresivo - solo 20mm desde el final
    if (currentY + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      return 20; // Nueva Y en nueva página (más arriba)
    }
    return currentY;
  };
  
  const addTwoColumnSection = (title: string, leftData: string[], rightData: string[]): void => {
    currentY = checkPageSpace(30 + Math.max(leftData.length, rightData.length) * 5); // Reducido de 35 a 30
    
    // Título de la sección con fondo gris claro
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(title, margin + 3, currentY + 6);
    currentY += 12;
    
    // Definir ancho de columnas
    const columnWidth = (pageWidth - 2 * margin) / 2;
    
    // Columna izquierda
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    let leftY = currentY;
    leftData.forEach(line => {
      if (line.trim()) {
        pdf.text(line, margin + 3, leftY);
        leftY += 5;
      }
    });
    
    // Columna derecha
    let rightY = currentY;
    rightData.forEach(line => {
      if (line.trim()) {
        pdf.text(line, margin + columnWidth + 3, rightY);
        rightY += 5;
      }
    });
    
    currentY = Math.max(leftY, rightY) + 5; // Reducido de 6 a 5
  };

  // Formatear fechas correctamente
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // REMITENTE Y DESTINATARIO en 2 columnas
  addTwoColumnSection(
    'DATOS DEL REMITENTE Y DESTINATARIO',
    [
      'REMITENTE:',
      `Razón Social: ${guideData.sender_name}`,
      `RUC: ${guideData.sender_doc_number}`,
      '',
      'DIRECCIÓN:',
      `${guideData.origin_address}`
    ],
    [
      'DESTINATARIO:',
      `Nombres: ${guideData.recipient_name}`,
      `DNI: ${guideData.recipient_doc_number}`,
      '',
      'DESTINO:',
      `${guideData.destination_address}`
    ]
  );

  // TRASLADO Y TRANSPORTE en 2 columnas
  addTwoColumnSection(
    'DATOS DEL TRASLADO Y TRANSPORTE',
    [
      'FECHAS DEL TRASLADO:',
      `Fecha de Emisión: ${formatDate(guideData.issue_date)}`,
      `Fecha Inicio: ${formatDate(guideData.shipment_start_date)}`,
      '',
      'MODALIDAD:',
      'Transporte Fluvial'
    ],
    [
      'DATOS DE LA EMBARCACIÓN:',
      `Embarcación: ${guideData.vessel_name}`,
      `Matrícula: ${guideData.vessel_plate}`,
      '',
      'CAPITÁN:',
      `${guideData.captain_name}`,
      `DNI: ${guideData.captain_doc_number}`
    ]
  );
  
  // DATOS DEL COMPROBANTE RELACIONADO (si existen)
  if (guideData.related_doc_type && guideData.related_doc_number) {
    const tiposDoc = {
      '01': 'FACTURA',
      '03': 'BOLETA',
      '07': 'NOTA DE CRÉDITO',
      '08': 'NOTA DE DÉBITO',
      '09': 'GUÍA DE REMISIÓN REMITENTE',
      '31': 'GUÍA DE REMISIÓN TRANSPORTISTA'
    };
    
    const tipoDoc = tiposDoc[guideData.related_doc_type as keyof typeof tiposDoc] || guideData.related_doc_type;
    
    // Convertimos a any para acceder a las propiedades no definidas en el tipo pero que existen en el JSON
    const guideDataExtended = guideData as any;
    
    addTwoColumnSection(
      'DATOS DEL COMPROBANTE RELACIONADO',
      [
        'COMPROBANTE:',
        `Tipo: ${tipoDoc}`,
        `Número: ${guideData.related_doc_number}`,
        guideDataExtended.related_doc_ruc ? `RUC: ${guideDataExtended.related_doc_ruc}` : '',
      ],
      [
        'DESCRIPCIÓN:',
        guideDataExtended.related_doc_description || 'No especificada'
      ]
    );
  }

  // Imprimir observación si existe (campo que en log.md está como "observation")
  if (guideData.observation) {
    // Asegurar que hay suficiente espacio para la observación
    currentY = checkPageSpace(15); // Espacio estimado para observación
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    // Dejar un pequeño espacio y luego escribir la observación en una línea amplia
    const obsLines = pdf.splitTextToSize(`Observación: ${guideData.observation}`, pageWidth - 2 * margin);
    obsLines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += 4;
    });
    currentY += 2;
  }

  // ============ BIENES TRANSPORTADOS (CON CONTROL DE PAGINACIÓN) ============
  currentY = checkPageSpace(35); // Reducido de 40 a 35
  
  // Título de la sección
  pdf.setFillColor(248, 249, 250);
  pdf.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);
  pdf.text('BIENES TRANSPORTADOS', margin + 3, currentY + 6);
  currentY += 12;

  // Tabla de bienes con mejor formato y paginación automática
  const tableColumns = ['CANT.', 'UNIDAD', 'PESO (KGM)', 'DESCRIPCIÓN'];
  const tableData = guideData.package_items.map(item => [
    item.quantity.toFixed(2),
    item.unit_code,
    guideData.total_weight.toFixed(2),
    item.description
  ]);

  autoTable(pdf, {
    startY: currentY,
    head: [tableColumns],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontSize: 8, // Reducido de 9 a 8
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 3, // Reducido de 4 a 3
    },
    bodyStyles: {
      fontSize: 7, // Reducido de 8 a 7
      cellPadding: 2, // Reducido de 3 a 2
      halign: 'center',
      textColor: [0, 0, 0],
    },
    alternateRowStyles: { 
      fillColor: [252, 252, 252] 
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' }, // CANT
      1: { cellWidth: 25, halign: 'center' }, // UNIDAD  
      2: { cellWidth: 30, halign: 'center' }, // PESO
      3: { cellWidth: 'auto', halign: 'left' }, // DESCRIPCIÓN
    },
    margin: { left: margin, right: margin },
    styles: {
      overflow: 'linebreak',
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 6; // Reducido de 8 a 6

  // ============ FOOTER CON QR Y DATOS DE GENERACIÓN (CON CONTROL DE PAGINACIÓN) ============
  const footerHeight = 25; // Reducido aún más de 35 a 25
  currentY = checkPageSpace(footerHeight);
  
  // Verificación más precisa para el footer - solo saltar si realmente no cabe
  const availableSpace = pageHeight - currentY - 15; // 15mm de margen inferior mínimo
  if (availableSpace < footerHeight) {
    pdf.addPage();
    currentY = 15; // Comenzar más arriba en nueva página
  }
  
  // Separador sutil
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, currentY, pageWidth - 2 * margin, 1, 'F');
  currentY += 4; // Reducido de 6 a 4

  // Layout en 2 columnas: QR + Información
  const qrSize = 20; // Reducido aún más de 22 a 20mm
  const qrX = margin;
  const qrY = currentY;
  
  try {
    if (guideData.qr_code_data) {
      // Agregar QR real desde base64
      pdf.addImage(
        `data:image/png;base64,${guideData.qr_code_data}`,
        'PNG',
        qrX,
        qrY,
        qrSize,
        qrSize
      );
    } else {
      // Fallback: rectángulo con texto
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.5);
      pdf.rect(qrX, qrY, qrSize, qrSize);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(120, 120, 120);
      pdf.text('QR Code', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
    }
  } catch (error) {
    console.warn('Error al agregar QR code, usando fallback:', error);
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.5);
    pdf.rect(qrX, qrY, qrSize, qrSize);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(120, 120, 120);
    pdf.text('QR Code', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
  }

  // Información al lado del QR
  const infoX = qrX + qrSize + 6; // Reducido de 8 a 6
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(80, 80, 80);
  
  let footerInfoY = qrY + 3; // Reducido de 4 a 3
  pdf.text('Representación impresa de la Guía de Remisión Electrónica', infoX, footerInfoY);
  footerInfoY += 4; // Reducido de 5 a 4
  
  const currentDate = new Date();
  const generationInfo = `Generado: ${currentDate.toLocaleDateString('es-PE')} ${currentDate.toLocaleTimeString('es-PE')}`;
  pdf.text(generationInfo, infoX, footerInfoY);
  footerInfoY += 4; // Reducido de 5 a 4
  
  if (guideData.document_number) {
    pdf.text(`Documento: ${guideData.document_number}`, infoX, footerInfoY);
  }

  currentY += qrSize + 4; // Reducido de 6 a 4

  // ============ BORDE FINAL ============
  pdf.setLineWidth(0.6);
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  // Crear blob del PDF
  const blob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
  
  return { pdf, blob };
};

// ============ FUNCIÓN PARA GENERAR MÚLTIPLES PDFs ============
export const generateMultipleRemissionGuidePDFs = (
  guidesData: AutoGenerateRemissionGuide[]
): { pdfs: jsPDF[]; blobs: Blob[]; zipBlob?: Blob } => {
  const pdfs: jsPDF[] = [];
  const blobs: Blob[] = [];

  // Generar PDF para cada guía (notar: generateRemissionGuidePDF es async)
  // Para mantener compatibilidad con consumidores sin async, generamos en serie
  const gen = async () => {
    for (const guide of guidesData) {
      // eslint-disable-next-line no-await-in-loop
      const { pdf, blob } = await generateRemissionGuidePDF(guide);
      pdfs.push(pdf);
      blobs.push(blob);
    }
  };
  // Ejecutar generación síncrona bloqueante corta
  // Nota: esta función devuelve inmediatamente las referencias; los pdfs y blobs
  // se poblarán cuando finalice la generación. Para la mayoría de usos se
  // invoca generateMultipleRemissionGuidePDFs seguido de acciones que esperan
  // o se usa la variante en memoria del componente.
  gen();

  return { pdfs, blobs };
};

// ============ PROPS DEL COMPONENTE ============
interface RemissionGuidePDFGeneratorProps {
  guideData: AutoGenerateRemissionGuide;
  onPDFGenerated?: (blob: Blob) => void;
}

// ============ COMPONENTE REACT ============
export const RemissionGuidePDFGenerator: React.FC<RemissionGuidePDFGeneratorProps> = ({
  guideData,
  onPDFGenerated
}) => {
  
  const handleGeneratePDF = () => {
    (async () => {
      const { blob } = await generateRemissionGuidePDF(guideData);
      // Abrir PDF en nueva ventana para previsualización
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Limpiar URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      // Callback si se proporciona
      if (onPDFGenerated) {
        onPDFGenerated(blob);
      }
    })();
  };

  const handleDownloadPDF = () => {
    (async () => {
      const { pdf } = await generateRemissionGuidePDF(guideData);
      pdf.save(`guia-remision-${guideData.document_number}.pdf`);
    })();
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={handleGeneratePDF}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        Vista Previa PDF
      </button>
      
      <button
        onClick={handleDownloadPDF}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
      >
        Descargar PDF
      </button>
    </div>
  );
};

// ============ COMPONENTE PARA MÚLTIPLES GUÍAS ============
interface MultipleRemissionGuidePDFGeneratorProps {
  guidesData: AutoGenerateRemissionGuide[];
  onPDFsGenerated?: (blobs: Blob[]) => void;
}

export const MultipleRemissionGuidePDFGenerator: React.FC<MultipleRemissionGuidePDFGeneratorProps> = ({
  guidesData,
  onPDFsGenerated
}) => {

  const handleGenerateAllPDFs = () => {
    (async () => {
      // Esperar generación completa
      const genResult = await (async () => {
        const pdfs: jsPDF[] = [];
        const blobs: Blob[] = [];
        for (const guide of guidesData) {
          // eslint-disable-next-line no-await-in-loop
          const { pdf, blob } = await generateRemissionGuidePDF(guide);
          pdfs.push(pdf);
          blobs.push(blob);
        }
        return { pdfs, blobs };
      })();

      // Abrir cada PDF en una nueva ventana
      genResult.blobs.forEach(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      });

      if (onPDFsGenerated) {
        onPDFsGenerated(genResult.blobs);
      }
    })();
  };

  const handleDownloadAllPDFs = () => {
    (async () => {
      for (const guide of guidesData) {
        // eslint-disable-next-line no-await-in-loop
        const { pdf } = await generateRemissionGuidePDF(guide);
        pdf.save(`guia-remision-${guide.document_number}.pdf`);
      }
    })();
  };

  const handleDownloadSinglePDF = (guide: AutoGenerateRemissionGuide) => {
    (async () => {
      const { pdf } = await generateRemissionGuidePDF(guide);
      pdf.save(`guia-remision-${guide.document_number}.pdf`);
    })();
  };

  return (
    <div className="space-y-4">
      {/* Botones de acción general */}
      <div className="flex space-x-3 pb-4 border-b border-gray-200">
        <button
          onClick={handleGenerateAllPDFs}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Vista Previa Todos ({guidesData.length})
        </button>
        
        <button
          onClick={handleDownloadAllPDFs}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          Descargar Todos
        </button>
      </div>

      {/* Lista de guías individuales */}
      <div className="space-y-3">
        {guidesData.map(guide => (
          <div key={guide.guide_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">
                Guía #{guide.document_number}
              </div>
              <div className="text-sm text-gray-600">
                Destino: {guide.destination_port_name} | 
                Destinatario: {guide.recipient_name}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  (async () => {
                    const { blob } = await generateRemissionGuidePDF(guide);
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                  })();
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                Ver PDF
              </button>
              
              <button
                onClick={() => handleDownloadSinglePDF(guide)}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
              >
                Descargar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};