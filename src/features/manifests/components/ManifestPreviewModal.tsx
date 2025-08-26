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

  useEffect(() => {
    if (isOpen && manifestData) generatePDFPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, manifestData]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const generatePDFPreview = async () => {
    setIsGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob();
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      try {
        const file = new File([blob], `manifiesto-${manifestData.manifest_number}.pdf`, { type: 'application/pdf' });
        await manifestService.uploadManifestPDF(manifestData.id, file, 'a4');
        toast.success('PDF generado y subido automáticamente al sistema');
      } catch (uploadError) {
        console.warn('No se pudo subir PDF automáticamente:', uploadError);
        toast.warn('PDF generado, no se subió automáticamente');
      }
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast.error('Error al generar la previsualización del PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 15;
    let currentY = 20;

    // Header
    if (manifestData.company) {
      const company = manifestData.company;
      if (company.logo_url) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((res, rej) => {
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = company.logo_url as string;
          });
          const logoW = 30;
          const logoH = 15;
          pdf.addImage(img, 'PNG', margin, currentY - 5, logoW, logoH);
          const contentStartX = margin + logoW + 10;
          const availableWidth = pageWidth - contentStartX - margin;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(company.name, contentStartX, currentY);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          const info = `RUC: ${company.ruc} | ${company.address} | Tel: ${company.phone}`;
          pdf.text(pdf.splitTextToSize(info, availableWidth), contentStartX, currentY + 6);
          currentY += Math.max(logoH, 12);
        } catch (e) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(manifestData.company.name, pageWidth / 2, currentY, { align: 'center' });
          currentY += 8;
        }
      } else {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(manifestData.company.name, pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;
      }
    }

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const manifestTitle = manifestData.manifest_type === 'CARGO' ? 'MANIFIESTO DE CARGA' : 'MANIFIESTO DE PASAJEROS';
    pdf.text(manifestTitle, margin, currentY);
    pdf.setFontSize(10);
    pdf.text(`N° ${manifestData.manifest_number}`, pageWidth - margin - 30, currentY, { align: 'right' });
    currentY += 8;

    // Trip info
    pdf.setFontSize(9);
    let tripInfo = `Fecha: ${new Date(manifestData.generation_date).toLocaleDateString('es-PE')}`;
    if (manifestData.vessel_name) tripInfo += ` | Embarcación: ${manifestData.vessel_name}`;
    if (manifestData.departure_datetime) {
      const d = new Date(manifestData.departure_datetime);
      tripInfo += ` | Salida: ${d.toLocaleDateString('es-PE')} ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    tripInfo += ` | Estado: ${manifestData.status}`;
    pdf.text(tripInfo, margin, currentY);
    currentY += 8;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;

    // Totals
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    if (manifestData.manifest_type === 'CARGO') {
      pdf.text(`Total de Carga: ${manifestData.total_cargo_weight_kg} Kg`, margin, currentY);
    } else {
      pdf.text(`Total de Pasajeros: ${manifestData.total_passengers}`, margin, currentY);
    }
    currentY += 10;

    // Tables
    if (manifestData.manifest_type === 'CARGO') {
      const grouped = (manifestData as any).cargo_grouped_by_stops;
      if (grouped && Array.isArray(grouped.groups) && grouped.groups.length > 0) {
        for (const group of grouped.groups) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          // Ruta: usar guión simple para mejor visualización
          const origin = (group.origin_port_name || 'N/A').toString().toUpperCase();
          const dest = (group.destination_port_name || 'N/A').toString().toUpperCase();
          const routeText = `${origin} - ${dest}`;
          pdf.text(routeText, pageWidth / 2, currentY, { align: 'center' });
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

            // Calcular anchos de columna más simples y limpios como en el log
            const columnStyles: any = {
              0: { halign: 'center', cellWidth: 10 }, // N°
              1: { halign: 'left', cellWidth: 30 },   // DESCRIPCIÓN
              2: { halign: 'center', cellWidth: 15 }, // PESO
              3: { halign: 'center', cellWidth: 12 }, // UNIDAD
              4: { halign: 'left', cellWidth: 25 },   // REMITENTE
              5: { halign: 'center', cellWidth: 20 }, // DOC. REM.
              6: { halign: 'left', cellWidth: 25 },   // DESTINATARIO
              7: { halign: 'center', cellWidth: 20 }, // DOC. DEST.
              8: { halign: 'center', cellWidth: 22 }, // DOCUMENTO
            };

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

        // Calcular anchos de columna más simples y limpios como en el log
        const columnStyles2: any = {
          0: { halign: 'center', cellWidth: 10 }, // N°
          1: { halign: 'left', cellWidth: 30 },   // DESCRIPCIÓN
          2: { halign: 'center', cellWidth: 15 }, // PESO
          3: { halign: 'center', cellWidth: 12 }, // UNIDAD
          4: { halign: 'left', cellWidth: 25 },   // REMITENTE
          5: { halign: 'center', cellWidth: 20 }, // DOC. REM.
          6: { halign: 'left', cellWidth: 25 },   // DESTINATARIO
          7: { halign: 'center', cellWidth: 20 }, // DOC. DEST.
          8: { halign: 'center', cellWidth: 22 }, // DOCUMENTO
        };

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
      // PASAJEROS: usar el mismo estilo que la tabla de carga y centrar correctamente
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

        // Configurar anchos de columna para centrar la tabla como en carga
        const passengerColumnStyles: any = {
          0: { halign: 'center', cellWidth: 10 }, // N°
          1: { halign: 'left', cellWidth: 50 },   // APELLIDOS Y NOMBRES
          2: { halign: 'center', cellWidth: 25 }, // N° IDENTIDAD
          3: { halign: 'center', cellWidth: 20 }, // VENDEDOR
          4: { halign: 'center', cellWidth: 15 }, // ASIENTO
          5: { halign: 'center', cellWidth: 20 }, // ORIGEN
          6: { halign: 'center', cellWidth: 20 }, // DESTINO
          7: { halign: 'center', cellWidth: 20 }, // TELÉFONO
        };

        // Calcular el ancho total de la tabla
        const totalTableWidth = Object.values(passengerColumnStyles).reduce((sum: number, col: any) => sum + col.cellWidth, 0);
        const leftMargin = Math.max(margin, (pageWidth - totalTableWidth) / 2);

        autoTable(pdf, {
          startY: currentY,
          head: [['N°', 'APELLIDOS Y NOMBRES', 'N° IDENTIDAD', 'VENDEDOR', 'ASIENTO', 'ORIGEN', 'DESTINO', 'TELÉFONO']],
          body: tableData,
          styles: {
            fontSize: 6,
            cellPadding: 1.5,
            halign: 'center',
            valign: 'middle',
          },
          headStyles: {
            fillColor: [100, 100, 100], // Mismo color gris que la tabla de carga
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 6,
          },
          columnStyles: passengerColumnStyles,
          margin: { left: leftMargin, right: leftMargin },
          tableWidth: 'auto',
          theme: 'grid'
        });
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text('No hay registros para mostrar en este manifiesto.', margin, currentY);
        currentY += 8;
      }
    }

    // Observaciones
    if (manifestData.observations) {
      const finalY = (pdf as any).lastAutoTable?.finalY || currentY + 20;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Observaciones:', margin, finalY + 10);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(pdf.splitTextToSize(manifestData.observations, pageWidth - margin * 2), margin, finalY + 16);
    }

    const blob = pdf.output('blob');
    return blob;
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manifiesto-${manifestData.manifest_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const w = window.open(pdfUrl);
    w?.focus();
    w?.print();
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
        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Vista Previa - {manifestData.manifest_type === 'CARGO' ? 'Manifiesto de Carga' : 'Manifiesto de Pasajeros'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">N° {manifestData.manifest_number}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg" style={{ height: '70vh' }}>
          {isGeneratingPDF ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Generando previsualización del PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full rounded-lg border-0" title="Previsualización del Manifiesto" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Error al generar la previsualización</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
          <Button variant="outline" onClick={handlePrint} disabled={!pdfUrl} className="flex items-center space-x-2">
            <PrinterIcon className="w-4 h-4" />
            <span>Imprimir</span>
          </Button>
          <Button variant="primary" onClick={handleDownloadPDF} className="flex items-center space-x-2">
            <DocumentArrowDownIcon className="w-4 h-4" />
            <span>Descargar PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
