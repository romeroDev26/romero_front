import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DocumentArrowDownIcon, 
  XMarkIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { manifestService } from '../services/manifest.service';
import { Manifest } from '../types/manifest.types';

interface ManifestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifestData: Manifest;
}

export const ManifestPreviewModal: React.FC<ManifestPreviewModalProps> = ({
  isOpen,
  onClose,
  manifestData
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);


  // Generar PDF cuando se abra el modal
  useEffect(() => {
    if (isOpen && manifestData) {
      generatePDFPreview();
    }
  }, [isOpen, manifestData]);

  // Limpiar URL del PDF cuando se cierre el modal
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const generatePDFPreview = async () => {
    setIsGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob();
      // Limpiar URL anterior si existe
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      // Auto-subir el PDF al backend después de generarlo
      try {
        const file = new File([blob], `manifiesto-${manifestData.manifest_number}.pdf`, { type: 'application/pdf' });
        await manifestService.uploadManifestPDF(manifestData.id, file, 'a4');
        toast.success('PDF generado y subido automáticamente al sistema');
      } catch (uploadError) {
        console.error('Error al subir PDF automáticamente:', uploadError);
        toast.warn('PDF generado correctamente, pero no se pudo subir automáticamente al sistema');
      }
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast.error('Error al generar la previsualización del PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 15;
        let currentY = 20;

        // ============ HEADER CON LOGO EN SU PROPIO ESPACIO ============
        if (manifestData.company) {
          const company = manifestData.company;
          
          // Intentar cargar el logo si existe
          if (company.logo_url) {
            try {
              const logoImg = new Image();
              logoImg.crossOrigin = 'anonymous';
              
              await new Promise((logoResolve, logoReject) => {
                logoImg.onload = () => logoResolve(logoImg);
                logoImg.onerror = () => logoReject('Error loading logo');
                logoImg.src = company.logo_url;
              });
              
              // Logo en su propio espacio (lado izquierdo)
              const logoWidth = 30;
              const logoHeight = 15;
              pdf.addImage(logoImg, 'PNG', margin, currentY - 5, logoWidth, logoHeight);
              
              // Contenido de empresa ajustado al espacio restante (lado derecho)
              const contentStartX = margin + logoWidth + 10; // Más separación
              const availableWidth = pageWidth - contentStartX - margin;
              
              // Nombre de la empresa en el espacio disponible
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(12);
              pdf.text(company.name, contentStartX, currentY);
              
              // Información de la empresa en el espacio disponible
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(8);
              const infoText = `RUC: ${company.ruc} | ${company.address} | Tel: ${company.phone}`;
              const infoLines = pdf.splitTextToSize(infoText, availableWidth);
              pdf.text(infoLines, contentStartX, currentY + 6);
              
              currentY += Math.max(logoHeight, infoLines.length * 4 + 8);
              
            } catch (logoError) {
              console.warn('No se pudo cargar el logo, continuando sin logo:', logoError);
              // Fallback sin logo
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(12);
              pdf.text(company.name, pageWidth / 2, currentY, { align: 'center' });
              
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
            pdf.text(company.name, pageWidth / 2, currentY, { align: 'center' });
            
            currentY += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.text(`RUC: ${company.ruc} | ${company.address} | Tel: ${company.phone}`, pageWidth / 2, currentY, { align: 'center' });
            
            currentY += 10;
          }
        }

        // ============ TÍTULO DEL MANIFIESTO OPTIMIZADO ============
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        const manifestTitle = manifestData.manifest_type === 'CARGO' ? 'MANIFIESTO DE CARGA' : 'MANIFIESTO DE PASAJEROS';
        pdf.text(manifestTitle, margin, currentY);
        
        // Número del manifiesto en la esquina superior derecha
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(`N° ${manifestData.manifest_number}`, pageWidth - margin - 30, currentY, { align: 'right' });
        
        currentY += 8;

        // ============ INFORMACIÓN DEL VIAJE EN UNA LÍNEA ============
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        
        // Crear línea con toda la información del viaje
        let tripInfo = `Fecha: ${new Date(manifestData.generation_date).toLocaleDateString('es-PE')}`;
        
        if (manifestData.vessel_name) {
          tripInfo += ` | Embarcación: ${manifestData.vessel_name}`;
        }
        
        if (manifestData.departure_datetime) {
          const departureDate = new Date(manifestData.departure_datetime);
          tripInfo += ` | Salida: ${departureDate.toLocaleDateString('es-PE')} ${departureDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        tripInfo += ` | Estado: ${manifestData.status}`;
        
        pdf.text(tripInfo, margin, currentY);
        currentY += 6;
        
        // Línea separadora más sutil
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 6;
        
        // Total según el tipo de manifiesto
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        if (manifestData.manifest_type === 'CARGO') {
          pdf.text(`Total de Carga: ${manifestData.total_cargo_weight_kg} Kg`, margin, currentY);
        } else {
          pdf.text(`Total de Pasajeros: ${manifestData.total_passengers}`, margin, currentY);
        }
        currentY += 10;

        // ============ TABLA SEGÚN EL TIPO DE MANIFIESTO ============
        if (manifestData.items && manifestData.items.length > 0) {
          if (manifestData.manifest_type === 'CARGO') {
            // Tabla para manifiesto de CARGA
            const tableData = manifestData.items.map((item, index) => [
              (index + 1).toString(), // N°
              item.cargo_description || 'N/A', // DESCRIPCIÓN
              `${item.cargo_weight_kg} Kg`, // PESO
              item.unit_code || 'N/A', // UNIDAD
              item.remitente_nombre || 'N/A', // REMITENTE
              item.remitente_doc?.replace('1-', 'DNI: ') || 'N/A', // DOC REMITENTE
              item.destinatario_nombre || 'N/A', // DESTINATARIO
              item.destinatario_doc?.replace('1-', 'DNI: ') || 'N/A', // DOC DESTINATARIO
              item.source_document || 'N/A' // DOCUMENTO
            ]);

            autoTable(pdf, {
              startY: currentY,
              head: [['N°', 'DESCRIPCIÓN', 'PESO', 'UNIDAD', 'REMITENTE', 'DOC. REM.', 'DESTINATARIO', 'DOC. DEST.', 'DOCUMENTO']],
              body: tableData,
              styles: {
                fontSize: 6,
                cellPadding: 1.5,
                halign: 'center',
                valign: 'middle',
              },
              headStyles: {
                fillColor: [100, 100, 100],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 6,
              },
              columnStyles: {
                0: { halign: 'center', cellWidth: 10 }, // N°
                1: { halign: 'left', cellWidth: 30 },   // DESCRIPCIÓN
                2: { halign: 'center', cellWidth: 15 }, // PESO
                3: { halign: 'center', cellWidth: 12 }, // UNIDAD
                4: { halign: 'left', cellWidth: 25 },   // REMITENTE
                5: { halign: 'center', cellWidth: 20 }, // DOC. REM.
                6: { halign: 'left', cellWidth: 25 },   // DESTINATARIO
                7: { halign: 'center', cellWidth: 20 }, // DOC. DEST.
                8: { halign: 'center', cellWidth: 22 }, // DOCUMENTO
              },
              margin: { left: margin, right: margin },
              tableWidth: 'wrap',
              theme: 'grid',
            });
          } else {
            // Tabla para manifiesto de PASAJEROS (código existente)
            const tableData = manifestData.items.map((item, index) => [
              (index + 1).toString(), // N°
              item.passenger_name || 'N/A', // APELLIDOS Y NOMBRES
              `${item.passenger_doc_type === '1' ? 'DNI' : item.passenger_doc_type === '2' ? 'CE' : 'PAS'}: ${item.passenger_doc_number}`, // N° IDENTIDAD
              'Jhon', // VENDEDOR (hardcoded por ahora)
              item.seat_number || 'N/A', // ASIENTO
              item.boarding_port_name || 'N/A', // ORIGEN
              item.disembarking_port_name || 'N/A', // DESTINO
              item.passenger_phone || 'N/A' // TELÉFONO
            ]);

            autoTable(pdf, {
              startY: currentY,
              head: [['N°', 'APELLIDOS Y NOMBRES', 'N° IDENTIDAD', 'VENDEDOR', 'ASIENTO', 'ORIGEN', 'DESTINO', 'TELÉFONO']],
              body: tableData,
              styles: {
                fontSize: 7,
                cellPadding: 2,
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
                0: { halign: 'center', cellWidth: 15 }, // N°
                1: { halign: 'left', cellWidth: 35 }, // NOMBRES
                2: { halign: 'center', cellWidth: 25 }, // IDENTIDAD
                3: { halign: 'center', cellWidth: 20 }, // VENDEDOR
                4: { halign: 'center', cellWidth: 15 }, // ASIENTO
                5: { halign: 'center', cellWidth: 20 }, // ORIGEN
                6: { halign: 'center', cellWidth: 20 }, // DESTINO
                7: { halign: 'center', cellWidth: 25 }, // TELÉFONO
              },
              margin: { left: margin, right: margin },
              tableWidth: 'wrap',
              theme: 'grid',
            });
          }
        }

        // Observaciones si existen
        if (manifestData.observations) {
          const finalY = (pdf as any).lastAutoTable.finalY || currentY + 50;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.text('Observaciones:', margin, finalY + 15);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          const obsLines = pdf.splitTextToSize(manifestData.observations, pageWidth - (margin * 2));
          pdf.text(obsLines, margin, finalY + 22);
        }

        const blob = pdf.output('blob');
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleDownloadPDF = async () => {
    try {
      if (!pdfUrl) {
        toast.error('PDF no disponible');
        return;
      }
      // Crear link de descarga
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `manifiesto-${manifestData.manifest_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl);
      printWindow?.focus();
      printWindow?.print();
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="6xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Vista Previa - {manifestData.manifest_type === 'CARGO' ? 'Manifiesto de Carga' : 'Manifiesto de Pasajeros'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              N° {manifestData.manifest_number}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="bg-gray-50 rounded-lg" style={{ height: '70vh' }}>
          {isGeneratingPDF ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generando previsualización del PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg border-0"
              title="Previsualización del Manifiesto"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Error al generar la previsualización</p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleClose}
          >
            Cerrar
          </Button>
          
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!pdfUrl}
            className="flex items-center space-x-2"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Imprimir</span>
          </Button>
          
          <Button
            variant="primary"
            onClick={handleDownloadPDF}
            disabled={!pdfUrl}
            className="flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span>Descargar PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
