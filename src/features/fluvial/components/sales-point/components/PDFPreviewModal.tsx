// src/features/fluvial/components/sales-point/components/PDFPreviewModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../../components/common/Modal';
import { Button } from '../../../../../components/common/Button';
import { Spinner } from '../../../../../components/common/Spinner';
import { PrinterIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

export interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfA4Blob?: Blob;
  pdfTicketBlob?: Blob;
  isGenerating?: boolean;
  invoiceNumber?: string;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfA4Blob,
  pdfTicketBlob,
  isGenerating = false,
  invoiceNumber = '',
}) => {
  const [previewMode, setPreviewMode] = useState<'a4' | 'ticket'>('a4');
  const [pdfA4Url, setPdfA4Url] = useState<string | null>(null);
  const [pdfTicketUrl, setPdfTicketUrl] = useState<string | null>(null);

  // Crear URLs para los blobs
  useEffect(() => {
    if (pdfA4Blob) {
      const url = URL.createObjectURL(pdfA4Blob);
      setPdfA4Url(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfA4Blob]);

  useEffect(() => {
    if (pdfTicketBlob) {
      const url = URL.createObjectURL(pdfTicketBlob);
      setPdfTicketUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfTicketBlob]);

  const handlePrint = (format: 'a4' | 'ticket') => {
    const url = format === 'a4' ? pdfA4Url : pdfTicketUrl;
    
    if (!url) {
      toast.error('PDF no disponible para imprimir');
      return;
    }

    // Abrir en nueva ventana para imprimir
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error('No se pudo abrir la ventana de impresión');
    }
  };

  const handleDownload = (format: 'a4' | 'ticket') => {
    const url = format === 'a4' ? pdfA4Url : pdfTicketUrl;
    const blob = format === 'a4' ? pdfA4Blob : pdfTicketBlob;
    
    if (!url || !blob) {
      toast.error('PDF no disponible para descargar');
      return;
    }

    // Crear enlace de descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber}_${format}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Comprobante ${format.toUpperCase()} descargado`);
  };

  const currentUrl = previewMode === 'a4' ? pdfA4Url : pdfTicketUrl;
  const currentBlob = previewMode === 'a4' ? pdfA4Blob : pdfTicketBlob;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprobante ${invoiceNumber ? `- ${invoiceNumber}` : ''}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Loading state */}
        {isGenerating && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600">Generando comprobantes PDF...</p>
            </div>
          </div>
        )}

        {/* Content when PDFs are ready */}
        {!isGenerating && (pdfA4Blob || pdfTicketBlob) && (
          <>
            {/* Format selector */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex space-x-2">
                <Button
                  variant={previewMode === 'a4' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('a4')}
                  disabled={!pdfA4Blob}
                >
                  Formato A4
                </Button>
                <Button
                  variant={previewMode === 'ticket' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('ticket')}
                  disabled={!pdfTicketBlob}
                >
                  Formato Ticket
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(previewMode)}
                  disabled={!currentBlob}
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handlePrint(previewMode)}
                  disabled={!currentBlob}
                >
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  Imprimir
                </Button>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="border rounded-lg overflow-hidden bg-white">
              {currentUrl ? (
                <iframe
                  src={currentUrl}
                  className="w-full h-96"
                  title={`Vista previa ${previewMode.toUpperCase()}`}
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <DocumentArrowDownIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>PDF no disponible en formato {previewMode.toUpperCase()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                {previewMode === 'a4' ? 
                  'Formato estándar para archivo e impresión en hoja A4' : 
                  'Formato compacto para impresoras térmicas'
                }
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Cerrar
                </Button>
                
                {/* Print both formats */}
                <Button
                  variant="primary"
                  onClick={() => {
                    handlePrint('a4');
                    handlePrint('ticket');
                  }}
                  disabled={!pdfA4Blob || !pdfTicketBlob}
                >
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  Imprimir Ambos
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Error state */}
        {!isGenerating && !pdfA4Blob && !pdfTicketBlob && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              <XMarkIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No hay comprobantes disponibles para mostrar</p>
              <Button
                variant="outline"
                onClick={onClose}
                className="mt-4"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
