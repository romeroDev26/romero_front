import React, { useEffect, useState } from 'react';
import { toast } from '@/utils/sileo-toast';
import {
  DocumentArrowDownIcon,
  PrinterIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { Manifest } from '../types/manifest.types';
import { useManifestPDFGeneration } from '../hooks/useManifestPDFGeneration';

interface ManifestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifestData: Manifest;
}

export const ManifestPreviewModal: React.FC<ManifestPreviewModalProps> = ({
  isOpen,
  onClose,
  manifestData,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { isGeneratingPDF, generatePreview, downloadPDF } = useManifestPDFGeneration();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void generatePDFPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, manifestData.id, manifestData.updated_at]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const generatePDFPreview = async () => {
    try {
      const url = await generatePreview(manifestData, { upload: true });

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(url);
    } catch (error) {
      // El toast ya se maneja en el hook
    }
  };

  const handleDownloadPDF = async () => {
    await downloadPDF(manifestData);
  };

  const handlePrint = () => {
    if (!pdfUrl) {
      toast.error('No hay PDF disponible para imprimir');
      return;
    }

    const printWindow = window.open(pdfUrl, '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vista previa del manifiesto ${manifestData.manifest_number}`}
      maxWidth="6xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={generatePDFPreview} disabled={isGeneratingPDF}>
            Regenerar
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!pdfUrl || isGeneratingPDF}>
            <PrinterIcon className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="primary" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          <Button variant="secondary" onClick={onClose}>
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white min-h-[75vh]">
          {isGeneratingPDF && (
            <div className="h-[75vh] flex items-center justify-center text-gray-500">
              Generando PDF...
            </div>
          )}

          {!isGeneratingPDF && pdfUrl && (
            <iframe
              title={`Vista previa ${manifestData.manifest_number}`}
              src={pdfUrl}
              className="w-full h-[75vh]"
            />
          )}

          {!isGeneratingPDF && !pdfUrl && (
            <div className="h-[75vh] flex items-center justify-center text-gray-500">
              No se pudo generar la vista previa del PDF.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ManifestPreviewModal;
