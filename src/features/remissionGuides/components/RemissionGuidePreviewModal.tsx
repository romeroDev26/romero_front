// src/features/remissionGuides/components/RemissionGuidePreviewModal.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  DocumentArrowDownIcon,
  XMarkIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { remissionGuidesService } from '../../../services/remissionGuides.service';
import { generateRemissionGuidePDF } from './pdf/RemissionGuidePDFGenerator';
import { AutoGenerateRemissionGuidesResponse } from '../../../types';

interface RemissionGuidePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  generationResult: AutoGenerateRemissionGuidesResponse;
}

export const RemissionGuidePreviewModal: React.FC<RemissionGuidePreviewModalProps> = ({
  isOpen,
  onClose,
  generationResult,
}) => {
  const [pdfUrls, setPdfUrls] = useState<Record<number, string>>({});
  const [isGeneratingPDFs, setIsGeneratingPDFs] = useState(false);
  const [currentGuideIndex, setCurrentGuideIndex] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<Record<number, 'uploading' | 'success' | 'error'>>({});

  useEffect(() => {
    if (isOpen && generationResult?.guides_generated?.length > 0) {
      generateAllPDFPreviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, generationResult]);

  useEffect(() => {
    return () => {
      // Limpiar URLs al desmontar
      Object.values(pdfUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [pdfUrls]);

  const generateAllPDFPreviews = async () => {
    setIsGeneratingPDFs(true);
    const newPdfUrls: Record<number, string> = {};
    const newUploadStatus: Record<number, 'uploading' | 'success' | 'error'> = {};

    try {
      // Generar PDFs para todas las guías
      for (const guide of generationResult.guides_generated) {
        try {
          // generateRemissionGuidePDF es async ahora
          const { blob } = await generateRemissionGuidePDF(guide);
          if (!(blob instanceof Blob)) {
            throw new Error('generateRemissionGuidePDF no devolvió un Blob válido');
          }
          const url = URL.createObjectURL(blob);
          newPdfUrls[guide.guide_id] = url;

          // Subir automáticamente al backend
          newUploadStatus[guide.guide_id] = 'uploading';
          setUploadStatus(prev => ({ ...prev, [guide.guide_id]: 'uploading' }));
          
          try {
            const file = new File(
              [blob],
              `guia-remision-${guide.document_number}.pdf`,
              { type: 'application/pdf' }
            );
            
            await remissionGuidesService.uploadRemissionGuidePDF(guide.guide_id, file);
            newUploadStatus[guide.guide_id] = 'success';
            setUploadStatus(prev => ({ ...prev, [guide.guide_id]: 'success' }));
          } catch (uploadError) {
            console.warn(`No se pudo subir PDF automáticamente para guía ${guide.guide_id}:`, uploadError);
            newUploadStatus[guide.guide_id] = 'error';
            setUploadStatus(prev => ({ ...prev, [guide.guide_id]: 'error' }));
          }
        } catch (pdfError) {
          console.error(`Error generando PDF para guía ${guide.guide_id}:`, pdfError);
        }
      }

      setPdfUrls(newPdfUrls);
      
      // Mostrar mensaje de resultado
      const successCount = Object.values(newUploadStatus).filter(status => status === 'success').length;
      const totalCount = generationResult.guides_generated.length;
      
      if (successCount === totalCount) {
        toast.success(`${successCount} PDFs generados y subidos automáticamente al sistema`);
      } else if (successCount > 0) {
        toast.warn(`${successCount}/${totalCount} PDFs subidos automáticamente. Algunos fallaron.`);
      } else {
        toast.warn('PDFs generados, pero no se pudieron subir automáticamente');
      }
      
    } catch (error) {
      console.error('Error generating PDF previews:', error);
      toast.error('Error al generar las previsualizaciones');
    } finally {
      setIsGeneratingPDFs(false);
    }
  };

  const handleDownloadPDF = async (guide: (typeof generationResult.guides_generated)[0]) => {
    try {
      const { pdf } = await generateRemissionGuidePDF(guide);
      pdf.save(`guia-remision-${guide.document_number}.pdf`);
      toast.success(`PDF descargado: ${guide.document_number}`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const handleDownloadAllPDFs = async () => {
    try {
      for (let i = 0; i < generationResult.guides_generated.length; i++) {
        const guide = generationResult.guides_generated[i];

        // Programar descarga en cadena para evitar generar muchos blobs simultáneamente
        setTimeout(() => {
          (async () => {
            try {
              const { pdf } = await generateRemissionGuidePDF(guide);
              pdf.save(`guia-remision-${guide.document_number}.pdf`);
            } catch (err) {
              console.error('Error generando PDF para descarga masiva:', err);
            }
          })();
        }, i * 300); // 300ms delay between downloads
      }
      
      toast.success(`${generationResult.guides_generated.length} PDFs programados para descarga`);
    } catch (error) {
      console.error('Error downloading PDFs:', error);
      toast.error('Error al descargar los PDFs');
    }
  };

  const handlePrint = (guideId: number) => {
    const pdfUrl = pdfUrls[guideId];
    if (!pdfUrl) return;
    const w = window.open(pdfUrl);
    w?.focus();
    w?.print();
  };

  const handleClose = () => {
    Object.values(pdfUrls).forEach(url => URL.revokeObjectURL(url));
    setPdfUrls({});
    onClose();
  };

  const currentGuide = generationResult.guides_generated[currentGuideIndex];
  const currentPdfUrl = currentGuide ? pdfUrls[currentGuide.guide_id] : null;
  const currentUploadStatus = currentGuide ? uploadStatus[currentGuide.guide_id] : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="6xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Vista Previa - Guías de Remisión Generadas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {generationResult.guides_generated.length} guías para "{generationResult.trip_name}"
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Selector de guías */}
        {generationResult.guides_generated.length > 1 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Seleccionar Guía:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {generationResult.guides_generated.map((guide, index) => (
                <button
                  key={guide.guide_id}
                  onClick={() => setCurrentGuideIndex(index)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    currentGuideIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{guide.document_number}</div>
                  <div className="text-xs text-gray-600">
                    {guide.destination_port_name}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {guide.recipient_name.split(' ')[0]}...
                    </span>
                    {uploadStatus[guide.guide_id] === 'success' && (
                      <span className="text-xs text-green-600">✓ Subido</span>
                    )}
                    {uploadStatus[guide.guide_id] === 'uploading' && (
                      <span className="text-xs text-blue-600">↑ Subiendo...</span>
                    )}
                    {uploadStatus[guide.guide_id] === 'error' && (
                      <span className="text-xs text-red-600">✗ Error</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Información de la guía actual */}
        {currentGuide && (
          <div className="bg-white border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Guía:</span> {currentGuide.document_number}
              </div>
              <div>
                <span className="font-medium text-gray-700">Destino:</span> {currentGuide.destination_port_name}
              </div>
              <div>
                <span className="font-medium text-gray-700">Destinatario:</span> {currentGuide.recipient_name}
              </div>
            </div>
          </div>
        )}

        {/* Visor PDF */}
        <div className="bg-gray-50 rounded-lg" style={{ height: '70vh' }}>
          {isGeneratingPDFs ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  Generando PDFs y subiendo al sistema...
                </p>
              </div>
            </div>
          ) : currentPdfUrl ? (
            <iframe
              src={currentPdfUrl}
              className="w-full h-full rounded-lg border-0"
              title={`PDF Guía ${currentGuide?.document_number}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                Error al generar la previsualización
              </p>
            </div>
          )}
        </div>

        {/* Status de upload */}
        {currentUploadStatus && (
          <div className="text-center text-sm">
            {currentUploadStatus === 'success' && (
              <span className="text-green-600">✓ PDF subido automáticamente al sistema</span>
            )}
            {currentUploadStatus === 'uploading' && (
              <span className="text-blue-600">↑ Subiendo PDF al sistema...</span>
            )}
            {currentUploadStatus === 'error' && (
              <span className="text-red-600">✗ Error al subir PDF automáticamente</span>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
          
          <div className="flex space-x-3">
            {currentGuide && currentPdfUrl && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handlePrint(currentGuide.guide_id)}
                  className="flex items-center space-x-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Imprimir</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(currentGuide)}
                  className="flex items-center space-x-2"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Descargar Esta</span>
                </Button>
              </>
            )}
            
            <Button
              variant="primary"
              onClick={handleDownloadAllPDFs}
              className="flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Descargar Todas ({generationResult.guides_generated.length})</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};