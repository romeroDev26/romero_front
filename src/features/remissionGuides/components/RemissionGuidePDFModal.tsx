import React from 'react';
import {
  DocumentArrowDownIcon,
  XMarkIcon,
  PrinterIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';

interface RemissionGuidePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  guideNumber: string;
  guideType: 'transportista' | 'remitente';
}

export const RemissionGuidePDFModal: React.FC<RemissionGuidePDFModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  guideNumber,
  guideType,
}) => {
  const handleDownloadPDF = () => {
    if (!pdfUrl) return;

    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `guia-remision-${guideType}-${guideNumber}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;

    const w = window.open(pdfUrl);
    w?.focus();
    w?.print();
  };

  const handleOpenInNewTab = () => {
    if (!pdfUrl) return;

    window.open(pdfUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="6xl">
      <div className="space-y-4">
        <div className="flex items-start justify-between pb-4 border-b border-dm-border-primary">
          <div>
            <h2 className="text-xl font-semibold text-dm-text-primary">
              Guía de Remisión - {guideType === 'transportista' ? 'Transportista' : 'Remitente'}
            </h2>
            <p className="text-sm text-dm-text-secondary mt-1">
              N° {guideNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dm-bg-hover rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-dm-text-muted" />
          </button>
        </div>

        <div className="bg-dm-bg-secondary rounded-lg" style={{ height: '70vh' }}>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg border-0"
              title={`Guía de Remisión ${guideType} - ${guideNumber}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <EyeIcon className="w-12 h-12 text-dm-text-muted mx-auto mb-4" />
                <p className="text-dm-text-muted">
                  PDF no disponible para esta guía
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-dm-border-primary">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {pdfUrl && (
            <>
              <Button
                variant="outline"
                onClick={handleOpenInNewTab}
                className="flex items-center space-x-2"
              >
                <EyeIcon className="w-4 h-4" />
                <span>Abrir en nueva pestaña</span>
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center space-x-2"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Imprimir</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Descargar PDF</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};