// src/features/quotations/components/QuotationPreviewModal.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  DocumentArrowDownIcon, 
  XMarkIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { MessageCircle } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useQuotationPDFGeneration } from '../hooks/useQuotationPDFGeneration';
import { QuotationWhatsAppModal } from './QuotationWhatsAppModal';
import { Quotation } from '../types';

interface QuotationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewQuotation: () => void;
  quotation: Quotation;
}

export const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({
  isOpen,
  onClose,
  onNewQuotation,
  quotation
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const { generateAndUploadPDF, generatePreviewPDF } = useQuotationPDFGeneration();

  // Generar PDF cuando se abra el modal
  useEffect(() => {
    if (isOpen && quotation) {
      generatePDFPreview();
    }
  }, [isOpen, quotation]);

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
      const { url } = await generatePreviewPDF(quotation);
      
      // Limpiar URL anterior si existe
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      setPdfUrl(url);
      
      // Auto-subir el PDF al backend después de generarlo
      try {
        const token = localStorage.getItem('authToken') || '';
        
        await generateAndUploadPDF(quotation, token);
        toast.success('PDF generado y subido automáticamente al sistema');
      } catch (uploadError) {
        console.error('❌ Error al subir PDF automáticamente:', uploadError);
        toast.warn('PDF generado correctamente, pero no se pudo subir automáticamente al sistema');
      }
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast.error('Error al generar la previsualización del PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
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
      link.download = `cotizacion-${quotation.series}-${quotation.number.toString().padStart(6, '0')}.pdf`;
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
    setShowWhatsAppModal(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="6xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Vista Previa - Cotización
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              N° {quotation.series}-{quotation.number.toString().padStart(6, '0')}
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
              title="Previsualización de la Cotización"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Error al generar la previsualización</p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Total: {quotation.currency_code} {parseFloat(quotation.total_payable).toFixed(2)}
          </div>
          
          <div className="flex space-x-3">
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
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={!pdfUrl}
              className="flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Descargar PDF</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowWhatsAppModal(true)}
              disabled={!pdfUrl}
              className="flex items-center space-x-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>

            <Button
              variant="primary"
              onClick={onNewQuotation}
            >
              Nueva Cotización
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de WhatsApp */}
      <QuotationWhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        quotation={quotation}
        pdfUrl={pdfUrl}
      />
    </Modal>
  );
};
