import React from 'react';
import { usePDFGeneration, InvoiceData, CompanyInvoiceData } from './hooks/usePDFGeneration';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { Download, Printer, FileText, Receipt } from 'lucide-react';

interface PDFManagerProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | CompanyInvoiceData;
  authToken: string;
  onSaleSuccess?: () => void; // NUEVO: Callback para notificar al padre cuando termine el flujo
}

export const PDFManager: React.FC<PDFManagerProps> = ({
  isOpen,
  onClose,
  invoiceData,
  authToken,
  onSaleSuccess
}) => {
  const {
    generateAndUploadPDFs,
    generatePreviewPDFs,
    isGenerating,
    error,
    isProcessing
  } = usePDFGeneration();

  const [previewBlobs, setPreviewBlobs] = React.useState<{
    pdfA4Blob?: Blob;
    pdfTicketBlob?: Blob;
  }>({});
  const [showPreview, setShowPreview] = React.useState(false);
  const [currentFormat, setCurrentFormat] = React.useState<'A4' | 'ticket'>('A4');

  // Generar PDFs de vista previa cuando se abre el modal
  React.useEffect(() => {
    if (isOpen && invoiceData) {
      console.log('PDFManager abierto, generando vista previa...', invoiceData);
      generatePreviewPDFs(invoiceData)
        .then((blobs) => {
          if (blobs) {
            setPreviewBlobs(blobs);
            console.log('Vista previa generada exitosamente');
          }
        })
        .catch((error) => {
          console.error('Error generando vista previa:', error);
        });
    }
  }, [isOpen, invoiceData, generatePreviewPDFs]);

  const handlePrintAndUpload = async (format: 'A4' | 'ticket') => {
    try {
      const result = await generateAndUploadPDFs(invoiceData, authToken);
      if (result.success) {
        // Imprimir desde el blob de vista previa
        const blob = format === 'A4' ? previewBlobs.pdfA4Blob : previewBlobs.pdfTicketBlob;
        if (blob) {
          const url = URL.createObjectURL(blob);
          const printWindow = window.open(url);
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
              URL.revokeObjectURL(url);
            };
          }
        }
        onClose();
        // NUEVO: Notificar al padre que el flujo terminó
        if (onSaleSuccess) {
          onSaleSuccess();
        }
      }
    } catch (error) {
      console.error('Error en imprimir y subir:', error);
    }
  };

  const handleDownloadAndUpload = async (format: 'A4' | 'ticket') => {
    try {
      const result = await generateAndUploadPDFs(invoiceData, authToken);
      if (result.success) {
        // Descargar desde el blob de vista previa
        const blob = format === 'A4' ? previewBlobs.pdfA4Blob : previewBlobs.pdfTicketBlob;
        if (blob) {
          const actualInvoice = 'invoice' in invoiceData ? invoiceData.invoice : invoiceData;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = format === 'A4' 
            ? `factura-${actualInvoice.series}-${actualInvoice.number}-A4.pdf`
            : `ticket-${actualInvoice.series}-${actualInvoice.number}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        onClose();
        // NUEVO: Notificar al padre que el flujo terminó
        if (onSaleSuccess) {
          onSaleSuccess();
        }
      }
    } catch (error) {
      console.error('Error en descargar y subir:', error);
    }
  };

  const handlePreview = (format: 'A4' | 'ticket') => {
    setCurrentFormat(format);
    setShowPreview(true);
  };

  const downloadPreview = (format: 'A4' | 'ticket') => {
    const blob = format === 'A4' ? previewBlobs.pdfA4Blob : previewBlobs.pdfTicketBlob;
    if (blob) {
      const actualInvoice = 'invoice' in invoiceData ? invoiceData.invoice : invoiceData;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'A4' 
        ? `preview-factura-${actualInvoice.series}-${actualInvoice.number}-A4.pdf`
        : `preview-ticket-${actualInvoice.series}-${actualInvoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const printPreview = (format: 'A4' | 'ticket') => {
    const blob = format === 'A4' ? previewBlobs.pdfA4Blob : previewBlobs.pdfTicketBlob;
    if (blob) {
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(url);
        };
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal de opciones principales */}
      <Modal
        isOpen={!showPreview}
        onClose={onClose}
        title="Generar Comprobantes PDF"
        maxWidth="md"
      >
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <Spinner />
              <span className="ml-3 text-gray-600">
                {isGenerating ? 'Generando PDFs...' : 'Subiendo al servidor...'}
              </span>
            </div>
          )}

          {!isProcessing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formato A4 */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Formato A4</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Comprobante completo en formato estándar A4
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => handlePrintAndUpload('A4')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir A4
                  </Button>
                  <Button
                    onClick={() => handleDownloadAndUpload('A4')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar A4
                  </Button>
                  <Button
                    onClick={() => handlePreview('A4')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Vista Previa A4
                  </Button>
                </div>
              </div>

              {/* Formato Ticket */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Formato Ticket</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Ticket compacto para impresora térmica
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => handlePrintAndUpload('ticket')}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Ticket
                  </Button>
                  <Button
                    onClick={() => handleDownloadAndUpload('ticket')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Ticket
                  </Button>
                  <Button
                    onClick={() => handlePreview('ticket')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Vista Previa Ticket
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              onClose();
              // NUEVO: Si el usuario cierra sin hacer nada, también notificar al padre
              if (onSaleSuccess) {
                onSaleSuccess();
              }
            }}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de vista previa */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Vista Previa - ${currentFormat === 'A4' ? 'Formato A4' : 'Formato Ticket'}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentFormat('A4')}
                variant={currentFormat === 'A4' ? 'primary' : 'outline'}
                size="sm"
              >
                A4
              </Button>
              <Button
                onClick={() => setCurrentFormat('ticket')}
                variant={currentFormat === 'ticket' ? 'primary' : 'outline'}
                size="sm"
              >
                Ticket
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => downloadPreview(currentFormat)}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button
                onClick={() => printPreview(currentFormat)}
                variant="outline"
                size="sm"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
                <span className="ml-3">Generando vista previa...</span>
              </div>
            ) : (
              <iframe
                src={
                  currentFormat === 'A4' && previewBlobs.pdfA4Blob
                    ? URL.createObjectURL(previewBlobs.pdfA4Blob)
                    : currentFormat === 'ticket' && previewBlobs.pdfTicketBlob
                    ? URL.createObjectURL(previewBlobs.pdfTicketBlob)
                    : ''
                }
                className="w-full h-full"
                title="Vista previa del PDF"
              />
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Volver
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
