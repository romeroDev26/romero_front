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
import { BackendInvoiceData } from './tickets/types/backend.types';

interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: BackendInvoiceData;
  onSuccess: () => void;
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  isOpen,
  onClose,
  backendData,
  onSuccess
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
      
      // Generar PDF como blob para previsualización
      const pdfBlob = await generateNormalSaleTicketBlob(backendData);
      
      // Crear URL para el blob
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      
      console.log('Vista previa del ticket generada');
    } catch (error) {
      console.error('Error generando vista previa:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true);
      await downloadNormalSaleTicket(backendData);
      console.log('Ticket descargado exitosamente');
    } catch (error) {
      console.error('Error descargando ticket:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintTicket = async () => {
    try {
      setIsPrinting(true);
      
      // Generar PDF como blob para impresión
      const pdfBlob = await generateNormalSaleTicketBlob(backendData);
      
      // Crear URL para el blob
      const url = URL.createObjectURL(pdfBlob);
      
      // Abrir ventana de impresión
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Limpiar URL después de imprimir
          setTimeout(() => {
            URL.revokeObjectURL(url);
            printWindow.close();
          }, 100);
        };
      }
      
      console.log('Ticket enviado a impresión');
    } catch (error) {
      console.error('Error imprimiendo ticket:', error);
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
