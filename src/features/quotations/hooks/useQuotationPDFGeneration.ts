// src/features/quotations/hooks/useQuotationPDFGeneration.ts

import { useState } from 'react';
import { toast } from '@/utils/sileo-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { quotationPdfUploadService } from '../services/quotationPdfUpload.service';
import { Quotation } from '../types';
import { drawLogoInPdf } from '../../../utils/pdfLogo';
import { getDocumentCompanyInfo } from '../../../utils/documentCompanyInfo';
import { asApiError } from '../../../utils/errorHandler';

export interface QuotationPDFResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

// Función asíncrona para generar PDF con logo
// Helper function para formatear fechas evitando problemas de timezone
const formatDateString = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const generateQuotationPDFWithLogo = async (quotationData: Quotation): Promise<{ pdf: jsPDF; blob: Blob }> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 15;
  let currentY = 20;
  const company = await getDocumentCompanyInfo();

  // ============ HEADER CON LOGO EN SU PROPIO ESPACIO ============
  if (company.logoUrl) {
    try {
      // Logo en su propio espacio (lado izquierdo)
      const logoWidth = 30;
      const logoHeight = 15;
      const hasLogo = await drawLogoInPdf(pdf, company.logoUrl, {
        x: margin,
        y: currentY - 5,
        width: logoWidth,
        height: logoHeight,
      });

      if (!hasLogo) {
        throw new Error('No se pudo renderizar el logo');
      }

      // Contenido de empresa ajustado al espacio restante (lado derecho)
      const contentStartX = margin + logoWidth + 10; // Más separación
      const availableWidth = pageWidth - contentStartX - margin;

      // Nombre de la empresa en el espacio disponible
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(company.businessName, contentStartX, currentY);

      // Información de la empresa en el espacio disponible
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const infoText = `RUC: ${company.ruc} | ${company.address} | Tel: ${company.phone}`;
      const infoLines = pdf.splitTextToSize(infoText, availableWidth);
      pdf.text(infoLines, contentStartX, currentY + 6);

      currentY += Math.max(logoHeight, infoLines.length * 4 + 8);
    } catch {
      // Fallback sin logo
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(company.businessName, pageWidth / 2, currentY, { align: 'center' });

      currentY += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`RUC: ${company.ruc} | ${company.address} | Tel: ${company.phone}`, pageWidth / 2, currentY, { align: 'center' });

      currentY += 10;
    }
  } else {
    // Sin logo, centrado
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(company.businessName, pageWidth / 2, currentY, { align: 'center' });

    currentY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`RUC: ${company.ruc} | ${company.address} | Tel: ${company.phone}`, pageWidth / 2, currentY, { align: 'center' });

    currentY += 10;
  }

  // ============ TÍTULO DE LA COTIZACIÓN OPTIMIZADO ============
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('COTIZACIÓN', margin, currentY);
  
  // Número de la cotización en la esquina superior derecha
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(`N° ${quotationData.series}-${quotationData.number.toString().padStart(6, '0')}`, pageWidth - margin - 30, currentY, { align: 'right' });
  
  currentY += 8;

  // ============ INFORMACIÓN EN UNA LÍNEA ============
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  // Crear línea con toda la información
  let quotationInfo = `Fecha: ${formatDateString(quotationData.issue_date)}`;
  quotationInfo += ` | Válida hasta: ${formatDateString(quotationData.valid_until)}`;
  quotationInfo += ` | Moneda: ${quotationData.currency_code}`;
  
  pdf.text(quotationInfo, margin, currentY);
  currentY += 6;
  
  // Línea separadora más sutil
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
  currentY += 7;

  // ============ INFORMACIÓN DEL VIAJE (si existe en internal_notes) ============
  if (quotationData.internal_notes) {
    // Parsear "Viaje: xxx | Embarcacion: yyy" desde internal_notes
    const noteParts: Record<string, string> = {};
    quotationData.internal_notes.split('|').forEach(part => {
      const colonIdx = part.indexOf(':');
      if (colonIdx !== -1) {
        const key = part.slice(0, colonIdx).trim();
        const value = part.slice(colonIdx + 1).trim();
        noteParts[key] = value;
      }
    });

    const tripName = noteParts['Viaje'];
    const vesselName = noteParts['Embarcacion'];

    if (tripName || vesselName) {
      // Fondo gris claro como banda informativa
      const bandHeight = 8;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY, pageWidth - margin * 2, bandHeight, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(50, 50, 50);
      let tripLine = '';
      if (tripName) tripLine += `Viaje: ${tripName}`;
      if (vesselName) tripLine += `${tripName ? '   |   ' : ''}Embarcación: ${vesselName}`;
      pdf.text(tripLine, margin + 2, currentY + 5.5);
      pdf.setTextColor(0, 0, 0); // Restaurar color negro

      currentY += bandHeight + 4;
    } else {
      currentY += 3;
    }
  } else {
    currentY += 3;
  }

  // ============ TABLA DE SERVICIOS OPTIMIZADA (ESTILO MANIFIESTO) ============
  if (quotationData.items && quotationData.items.length > 0) {
    const tableData = quotationData.items.map((item, index) => [
      (index + 1).toString(), // N°
      item.item_description || 'N/A', // DESCRIPCIÓN
      item.quantity.toString(), // CANT.
      item.unit_code || 'UND', // UNIDAD
      `${quotationData.currency_code} ${parseFloat(item.unit_price.toString()).toFixed(2)}`, // P. UNITARIO
      `${quotationData.currency_code} ${item.discount.toString()}`, // DESCUENTO
      `${quotationData.currency_code} ${(parseFloat(item.unit_price.toString()) * item.quantity - parseFloat(item.discount.toString())).toFixed(2)}` // SUBTOTAL
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
        0: { halign: 'center', cellWidth: 10 }, // N°
        1: { halign: 'left', cellWidth: 60 },   // DESCRIPCIÓN
        2: { halign: 'center', cellWidth: 15 }, // CANT.
        3: { halign: 'center', cellWidth: 15 }, // UND.
        4: { halign: 'right', cellWidth: 25 },  // P. UNITARIO
        5: { halign: 'right', cellWidth: 25 },  // DESCUENTO
        6: { halign: 'right', cellWidth: 30 },  // SUBTOTAL
      },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
      theme: 'grid',
    });

    let contentY = pdf.lastAutoTable?.finalY || currentY + 50;
    contentY += 10;

    // ============ TOTALES (ALINEADOS AL EXTREMO DERECHO) ============
    // Posicionar los totales más hacia la derecha para mejor estética
    const totalsX = pageWidth - margin - 50; // Reducido de 70 a 50 para mover más a la derecha
    
    // Usar tamaño de fuente consistente para todos los totales
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8); // Tamaño consistente más pequeño
    
    let totalY = contentY;
    
    // Subtotal Neto = total con descuento ya aplicado (coherente con la tabla de ítems)
    const subtotalNeto = parseFloat(quotationData.total_payable) - parseFloat(quotationData.total_igv);
    pdf.text('Subtotal:', totalsX, totalY);
    pdf.text(`${quotationData.currency_code} ${subtotalNeto.toFixed(2)}`, pageWidth - margin - 5, totalY, { align: 'right' });
    totalY += 5;

    // IGV (siempre visible, aunque sea 0, para transparencia fiscal)
    pdf.text('IGV (18%):', totalsX, totalY);
    pdf.text(`${quotationData.currency_code} ${parseFloat(quotationData.total_igv).toFixed(2)}`, pageWidth - margin - 5, totalY, { align: 'right' });
    totalY += 5;
    
    // Línea separadora antes del total
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(totalsX, totalY + 1, pageWidth - margin - 5, totalY + 1);
    totalY += 4;
    
    // Total (ligeramente más grande que el resto pero consistente)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9); // Solo ligeramente más grande que el resto
    pdf.text('TOTAL:', totalsX, totalY);
    pdf.text(`${quotationData.currency_code} ${parseFloat(quotationData.total_payable).toFixed(2)}`, pageWidth - margin - 5, totalY, { align: 'right' });
    
    totalY += 15;

    // ============ TOTAL EN PALABRAS ============
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.text(`Total en palabras: ${quotationData.total_in_words}`, margin, totalY);
    
    totalY += 10;

    // ============ OBSERVACIONES Y NOTAS ============
    if (quotationData.notes && quotationData.notes.trim() !== '') {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Observaciones:', margin, totalY);
      totalY += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const splitNotes = pdf.splitTextToSize(quotationData.notes, pageWidth - (margin * 2));
      pdf.text(splitNotes, margin, totalY);
      totalY += splitNotes.length * 5 + 20;
    }

    // ============ TABLA DE CUENTAS BANCARIAS (AL FINAL, CERCA DEL PIE) ============
    // Calcular posición cerca del pie de página
    const footerSpacing = 35;
    const bankTableHeight = 35; // Altura estimada de la tabla + título
    const targetY = pdf.internal.pageSize.height - footerSpacing - bankTableHeight;
    
    // Usar la posición más baja entre el contenido actual y la posición objetivo
    const bankTableY = Math.max(totalY + 10, targetY);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('DEPOSITAR A NUESTRAS CTAS:', margin, bankTableY);
    
    const bankAccountsData = [
      ['BBVA SOLES', '0011-0301-01001363-48', '011-301-000100136348-98'],
      ['BCP SOLES', '390-71637705-0-89', '002390171637705088933'],
      ['BBVA DÓLARES', '0011-0301-02016350-78', '011-301-000201635078-93'],
      ['BCP DÓLARES', '390-71637719-1-03', '002390171637719103336']
    ];

    autoTable(pdf, {
      startY: bankTableY + 8,
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

    totalY = (pdf.lastAutoTable?.finalY ?? totalY) + 10;
    
    // ============ FOOTER ============
    // Asegurar que haya suficiente espacio para el footer
    const footerHeight = 30;
    const minFooterY = pdf.internal.pageSize.height - footerHeight;
    const finalFooterY = Math.max(totalY + 3, minFooterY); 
    
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
      'Sistema de Gestión',
      pageWidth - margin - 70,
      finalFooterY + 3
    );
    
    pdf.text(
      `Válida hasta: ${formatDateString(quotationData.valid_until)}`,
      pageWidth - margin - 70,
      finalFooterY + 8
    );
  }

  // Crear blob del PDF
  const blob = new Blob([pdf.output('blob')], { type: 'application/pdf' });

  return { pdf, blob };
};

export const useQuotationPDFGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Genera y sube el PDF de una cotización al servidor
   */
  const generateAndUploadPDF = async (
    quotationData: Quotation,
    authToken?: string
  ): Promise<QuotationPDFResult> => {
    setIsGenerating(true);
    
    try {
      // 1. Generar el PDF con logo asíncrono
      const { blob } = await generateQuotationPDFWithLogo(quotationData);
      
      setIsGenerating(false);
      setIsUploading(true);
      
      // 2. Subir al servidor si tenemos token
      if (authToken) {
        const result = await quotationPdfUploadService.uploadQuotationPDF(
          quotationData.id,
          blob,
          authToken
        );
        
        setIsUploading(false);
        
        if (result.success) {
          toast.success('PDF generado y guardado exitosamente');
          return {
            success: true,
            pdfUrl: result.pdf_url
          };
        } else {
          toast.error(result.error || 'Error al guardar el PDF');
          return {
            success: false,
            error: result.error
          };
        }
      } else {
        // Sin token, solo generar para vista previa
        setIsUploading(false);
        return {
          success: true
        };
      }
      
    } catch (error) {
      const apiError = asApiError(error);
      setIsGenerating(false);
      setIsUploading(false);
      
      const errorMessage = apiError.message || 'Error al generar el PDF';
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  /**
   * Solo genera el PDF para vista previa (con logo asíncrono)
   */
  const generatePreviewPDF = async (quotationData: Quotation): Promise<{ blob: Blob; url: string }> => {
    const { blob } = await generateQuotationPDFWithLogo(quotationData);
    
    // Crear URL para vista previa
    const url = URL.createObjectURL(blob);
    
    return { blob, url };
  };

  /**
   * Abre el PDF en una nueva ventana para vista previa
   */
  const openPDFPreview = async (quotationData: Quotation) => {
    try {
      const { url } = await generatePreviewPDF(quotationData);
      
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error('No se pudo abrir la ventana de vista previa');
      } else {
        // Limpiar URL después de un tiempo
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 10000);
      }
    } catch {
      toast.error('Error al generar vista previa');
    }
  };

  /**
   * Descarga el PDF directamente
   */
  const downloadPDF = async (quotationData: Quotation) => {
    try {
      const { blob } = await generatePreviewPDF(quotationData);
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotizacion-${quotationData.series}-${quotationData.number.toString().padStart(8, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
    } catch {
      toast.error('Error al descargar el PDF');
    }
  };

  /**
   * Verifica si el PDF ya existe en el servidor
   */
  const checkPDFExists = async (
    quotationId: number, 
    authToken?: string
  ): Promise<boolean> => {
    try {
      return await quotationPdfUploadService.verifyPDFUpload(quotationId, authToken);
    } catch {
      return false;
    }
  };

  /**
   * Obtiene la URL del PDF si ya existe
   */
  const getPDFUrl = async (
    quotationId: number,
    authToken?: string
  ): Promise<string | null> => {
    try {
      return await quotationPdfUploadService.getQuotationPDFUrl(quotationId, authToken);
    } catch {
      return null;
    }
  };

  return {
    // Estados
    isGenerating,
    isUploading,
    isProcessing: isGenerating || isUploading,
    
    // Funciones principales
    generateAndUploadPDF,
    generatePreviewPDF,
    openPDFPreview,
    downloadPDF,
    
    // Funciones auxiliares
    checkPDFExists,
    getPDFUrl
  };
};
