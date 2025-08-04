// src/features/fluvial/components/sales-point/TicketPreviewModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { Download, Printer, Eye } from 'lucide-react';
import { 
  downloadNormalSaleTicket, 
  generateNormalSaleTicketBlob 
} from './tickets';
import jsPDF from 'jspdf';
import { BackendInvoiceData } from './tickets/types/backend.types';

interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: BackendInvoiceData;
  onSuccess: () => void;
  // Props para tickets de empresa (RUC)
  customGeneratePDF?: () => Promise<jsPDF>;
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  isOpen,
  onClose,
  backendData,
  onSuccess,
  customGeneratePDF
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');


  // Generar el PDF inmediatamente cuando se abre el modal
  useEffect(() => {
    if (isOpen && !previewUrl) {
      generatePreview();
    }
  }, [isOpen]);

  // Limpiar URL cuando se cierra el modal
  useEffect(() => {
    if (!isOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  }, [isOpen, previewUrl]);

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      let pdfBlob;
      if (customGeneratePDF) {
        // Usar lógica custom para empresa
        const doc = await customGeneratePDF();
        pdfBlob = doc.output('blob');
      } else {
        pdfBlob = await generateNormalSaleTicketBlob(backendData);
      }
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      // Eliminado console.log de depuración
    } catch (error) {
      // Eliminado console.error de depuración
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true);
      if (customGeneratePDF) {
        // Descargar ticket resumen de empresa
        const doc = await customGeneratePDF();
        doc.save('ticket_empresa_resumen.pdf');
      } else {
        await downloadNormalSaleTicket(backendData);
      }
      // Eliminado console.log de depuración
    } catch (error) {
      // Eliminado console.error de depuración
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintTicket = async () => {
    try {
      setIsPrinting(true);
      let pdfBlob;
      if (customGeneratePDF) {
        const doc = await customGeneratePDF();
        pdfBlob = doc.output('blob');
      } else {
        pdfBlob = await generateNormalSaleTicketBlob(backendData);
      }
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => {
            URL.revokeObjectURL(url);
            printWindow.close();
          }, 100);
        };
      }
      // Eliminado console.log de depuración
    } catch (error) {
      // Eliminado console.error de depuración
    } finally {
      setIsPrinting(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Previsualización del Ticket"
      maxWidth="2xl"
    >
      <div className="p-6">
        {/* Vista previa del PDF real */}
        <div className="mb-6">
          <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: '600px' }}>
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-gray-600">Generando vista previa del ticket...</p>
                  <p className="text-sm text-gray-500">Sistema de 8 bloques con QR</p>
                </div>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Vista previa del ticket"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No se pudo generar la vista previa</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Button
            onClick={handleDownloadTicket}
            disabled={isGenerating || isDownloading || isPrinting}
            className="bg-green-600 hover:bg-green-700 py-3"
          >
            {isDownloading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Descargando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descargar Ticket
              </>
            )}
          </Button>
          <Button
            onClick={handlePrintTicket}
            disabled={isGenerating || isDownloading || isPrinting}
            className="bg-purple-600 hover:bg-purple-700 py-3"
          >
            {isPrinting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Imprimiendo...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Ticket
              </>
            )}
          </Button>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating || isDownloading || isPrinting}
          >
            Cerrar
          </Button>
          
          <Button
            onClick={() => { 
              handleDownloadTicket().then(() => {
                onClose();
                onSuccess();
              });
            }}
            disabled={isGenerating || isDownloading || isPrinting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Descargar y Finalizar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
