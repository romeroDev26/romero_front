// src/features/remissionGuides/components/RemissionGuideSenderPreviewModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { RemissionGuideRemitente } from '../../../types';
import { convertSenderGuideToAutoGenerate } from '../utils/guideConversion';
import { generateRemissionGuidePDF } from './pdf/RemissionGuidePDFGenerator';
import { remissionGuidesSenderService } from '../../../services/remissionGuidesSender.service';
import { toast } from '@/utils/sileo-toast';

interface RemissionGuideSenderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: RemissionGuideRemitente | any; // Permitir any para datos del backend con estructura diferente
}

export const RemissionGuideSenderPreviewModal: React.FC<RemissionGuideSenderPreviewModalProps> = ({
  isOpen,
  onClose,
  guide
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generar PDF cuando se abre el modal
  useEffect(() => {
    if (isOpen && guide) {
      generatePDFForPreview();
    }
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, guide?.id]); // Usar optional chaining para guide.id

  const generatePDFForPreview = async () => {
    if (!guide) {
      toast.error('No se encontraron datos de la guía');
      return;
    }

    setIsGenerating(true);
    try {
      const convertedGuide = convertSenderGuideToAutoGenerate(guide);
      if (!convertedGuide) {
        toast.error('Error al procesar los datos de la guía');
        return;
      }

      const { blob } = await generateRemissionGuidePDF(convertedGuide, 'remitente');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF de previsualización');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const convertedGuide = convertSenderGuideToAutoGenerate(guide);
      if (!convertedGuide) return;

      const { pdf, blob } = await generateRemissionGuidePDF(convertedGuide, 'remitente');
      
      // Subir al backend
      try {
        const fileName = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
        const pdfFile = new File([blob], `guia-remision-remitente-${fileName}.pdf`, {
          type: 'application/pdf'
        });
        
        await remissionGuidesSenderService.uploadRemissionGuidePDF(guide.id, pdfFile, 'a4');
        toast.success('PDF descargado y actualizado en el sistema');
      } catch (uploadError) {
        console.warn('Error al subir PDF:', uploadError);
        toast.success('PDF descargado (no se pudo actualizar en el sistema)');
      }

      // Descargar
      const fileName = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
      pdf.save(`guia-remision-remitente-${fileName}.pdf`);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const handlePrintPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Fondo del modal */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Contenido del modal */}
        <div className="inline-block align-bottom bg-dm-bg-primary rounded-lg text-left overflow-hidden shadow-xl border border-dm-border-primary transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-dm-bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-dm-border-primary">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-dm-text-primary flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                  Guía de Remisión del Remitente Creada
                </h3>
                <p className="text-sm text-dm-text-muted mt-1">
                  {guide.series}-{guide.number.toString().padStart(8, '0')} - Vista previa del PDF generado
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="rounded-md text-dm-text-muted hover:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="bg-dm-bg-primary px-4 pt-5 pb-4 sm:p-6">
            {/* Información de la guía */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <div className="text-sm">
                  <p className="text-green-800 dark:text-green-300 font-medium">
                    La guía de remisión del remitente ha sido creada exitosamente
                  </p>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    Destinatario: {guide.receiver?.business_name || guide.recipient_name || 'N/A'} | 
                    Origen: {guide.origin_address?.address || guide.origin_address || 'N/A'} → 
                    Destino: {guide.destination_address?.address || guide.destination_address || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Visor PDF */}
            <div className="bg-dm-bg-secondary rounded-lg" style={{ height: '70vh' }}>
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-dm-text-secondary mt-4">Generando PDF...</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-lg"
                  title="Vista previa del PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-dm-text-muted">No se pudo cargar la vista previa del PDF</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-dm-bg-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <div className="flex space-x-3">
              <Button
                onClick={handleDownloadPDF}
                className="flex items-center"
                disabled={isGenerating}
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
              
              <Button
                variant="outline"
                onClick={handlePrintPDF}
                className="flex items-center"
                disabled={isGenerating || !pdfUrl}
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};