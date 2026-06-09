// src/features/quotations/components/QuotationPDFViewer.tsx

import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Quotation } from '../types';

interface QuotationPDFViewerProps {
  quotation: Quotation;
  pdfUrl: string; // URL del PDF real almacenado en el servidor
}

export const QuotationPDFViewer: React.FC<QuotationPDFViewerProps> = ({
  quotation,
  pdfUrl
}) => {
  const [showPdfError, setShowPdfError] = useState(false);

  return (
    <div className="bg-dm-bg-primary rounded-lg shadow-sm border border-dm-border-primary">
      {/* Header del visor PDF */}
      <div className="px-6 py-4 border-b bg-dm-bg-secondary rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-dm-text-primary">
              Cotización {quotation.series}-{quotation.number.toString().padStart(6, '0')}
            </h2>
          </div>
          <div className="text-sm text-dm-text-muted">
            Cliente: {quotation.client.name}
          </div>
        </div>
      </div>

      {/* Visor PDF */}
      <div className="p-6">
        <div className="relative bg-dm-bg-secondary rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
          {!showPdfError ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              style={{ minHeight: '600px' }}
              title={`Cotización ${quotation.series}-${quotation.number.toString().padStart(6, '0')}`}
              onError={() => setShowPdfError(true)}
              onLoad={(e) => {
                // Verificar si el iframe se cargó correctamente
                try {
                  const iframe = e.target as HTMLIFrameElement;
                  if (!iframe.contentWindow) {
                    setShowPdfError(true);
                  }
                } catch (error) {
                  setShowPdfError(true);
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-dm-text-muted">
              <ExclamationTriangleIcon className="h-12 w-12 mb-4 text-dm-text-muted" />
              <h3 className="text-lg font-medium mb-2">No se pudo cargar la cotización</h3>
              <p className="text-sm text-center mb-4">
                El PDF no se puede mostrar en el navegador. 
                Puedes abrirlo en una nueva ventana usando el botón de abajo.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.open(pdfUrl, '_blank')}
                className="flex items-center"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Abrir en nueva ventana
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
