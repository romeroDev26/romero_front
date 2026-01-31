// src/features/fluvial/components/sales-point/TicketPreviewModal.tsx
// NUEVO: Ahora usa PDFs generados por el backend en lugar de generarlos en frontend

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { Download, Eye, MessageCircle, RefreshCw } from 'lucide-react';
import { BackendInvoiceData, BackendCompanyInvoiceData } from './tickets/types/backend.types';
import { WhatsAppSendModal } from './WhatsAppSendModal';
import { invoicesService } from '../../../../services/invoices.service';
import { toast } from 'react-toastify';

interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: BackendInvoiceData | BackendCompanyInvoiceData;
  onSuccess: () => void;
  // Número de teléfono inicial para WhatsApp
  initialPhoneNumber?: string;
  // Función para limpiar el formulario cuando se cierre el modal
  onClearForm?: () => void;
  // Mostrar solo el ticket de 80mm (ocultar A4)
  showOnly80mm?: boolean;
}

type TicketFormat = 'ticket80mm' | 'a4';

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  isOpen,
  onClose,
  backendData,
  onSuccess,
  initialPhoneNumber = '',
  onClearForm,
  showOnly80mm = false,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeFormat, setActiveFormat] = useState<TicketFormat>('ticket80mm');
  const [previewUrl80mm, setPreviewUrl80mm] = useState<string>('');
  const [previewUrlA4, setPreviewUrlA4] = useState<string>('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Extraer invoice ID
  const invoiceId = 'invoice' in backendData ? backendData.invoice.id : backendData.id;
  const invoiceData = 'invoice' in backendData ? backendData.invoice : backendData;

  // Generar PDFs en el backend cuando se abre el modal
  useEffect(() => {
    if (isOpen && !previewUrl80mm) {
      if (showOnly80mm) {
        generateOnly80mmPdfFromBackend();
      } else {
        generateBothPdfsFromBackend();
      }
    }
  }, [isOpen, showOnly80mm]);

  // Limpiar URLs cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      // Solo limpiar los estados, no hay que revocar URLs porque son URLs remotas
      setPreviewUrl80mm('');
      setPreviewUrlA4('');
      setGenerationSuccess(false);
    }
  }, [isOpen]);

  /**
   * Genera solo el PDF de 80mm (para equipaje extra)
   */
  const generateOnly80mmPdfFromBackend = async () => {
    try {
      setIsGenerating(true);
      setGenerationSuccess(false);

      // Llamar al backend para generar solo el PDF de 80mm
      await invoicesService.generatePdf(invoiceId, '80mm');

      // Obtener la invoice actualizada para extraer la URL del PDF
      const updatedInvoice = await invoicesService.getById(invoiceId);

      // Extraer URL directa del CDN
      const url80mm = updatedInvoice.pdf_ticket_file_path;

      if (!url80mm) {
        throw new Error('PDF generado pero URL no disponible');
      }

      // Usar URL directa en el iframe
      setPreviewUrl80mm(url80mm);
      setGenerationSuccess(true);

      toast.success('Ticket generado exitosamente');
    } catch (error) {
      console.error('Error generando ticket desde el backend:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Error al generar el ticket. Por favor, intente nuevamente.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Genera ambos PDFs (80mm y A4) llamando al backend
   */
  const generateBothPdfsFromBackend = async () => {
    try {
      setIsGenerating(true);
      setGenerationSuccess(false);

      // Llamar al backend para generar ambos PDFs en paralelo
      await invoicesService.generateBothPdfs(invoiceId);

      // Obtener la invoice actualizada para extraer las URLs de los PDFs
      const updatedInvoice = await invoicesService.getById(invoiceId);

      // Extraer URLs directas del CDN para usar en iframes (evita problemas de CORS en iframes)
      const url80mm = updatedInvoice.pdf_ticket_file_path;
      const urlA4 = updatedInvoice.pdf_a4_file_path;

      if (!url80mm || !urlA4) {
        throw new Error('PDFs generados pero URLs no disponibles');
      }

      // Usar URLs directas en los iframes (los iframes no tienen restricción CORS para visualización)
      setPreviewUrl80mm(url80mm);
      setPreviewUrlA4(urlA4);
      setGenerationSuccess(true);

      toast.success('Tickets generados exitosamente');
    } catch (error) {
      console.error('Error generando tickets desde el backend:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Error al generar los tickets. Por favor, intente nuevamente.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Regenerar PDFs (útil si hubo error o se quiere actualizar)
   */
  const handleRegeneratePdfs = async () => {
    // Limpiar URLs existentes
    setPreviewUrl80mm('');
    setPreviewUrlA4('');

    // Regenerar según configuración
    if (showOnly80mm) {
      await generateOnly80mmPdfFromBackend();
    } else {
      await generateBothPdfsFromBackend();
    }
  };

  /**
   * Descargar el ticket activo
   */
  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true);

      const size = activeFormat === 'ticket80mm' ? '80mm' : 'a4';
      
      // Obtener la URL directa del PDF desde la invoice
      const invoice = await invoicesService.getById(invoiceId);
      const pdfUrl = size === '80mm' ? invoice.pdf_ticket_file_path : invoice.pdf_a4_file_path;
      
      if (!pdfUrl) {
        throw new Error('PDF no disponible');
      }

      // Descargar usando un enlace temporal
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `ticket_${size}_${invoiceData.series}-${invoiceData.number}.pdf`;
      a.target = '_blank'; // Abrir en nueva pestaña si la descarga falla
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Ticket descargado exitosamente');
    } catch (error) {
      console.error('Error descargando ticket:', error);
      toast.error('Error al descargar el ticket');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
      onSuccess(); // Forzar recarga del viaje para actualizar estado de asientos
      if (onClearForm) {
        onClearForm();
      }
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
        {/* Mostrar numero de Encomienda si existe */}
        {invoiceData.items && 
         invoiceData.items.length > 0 && 
         invoiceData.items[0].parcel_number && 
         (invoiceData.items[0].product_name?.toLowerCase().includes('encomienda') || 
          invoiceData.items[0].item_description?.toLowerCase().includes('encomienda')) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Numero de Encomienda: <span className="font-bold">
                {invoiceData.items[0].parcel_number}
              </span>
            </p>
          </div>
        )}

        {/* Tabs para seleccionar formato */}
        {!showOnly80mm && (
          <div className="mb-4">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveFormat('ticket80mm')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeFormat === 'ticket80mm'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Ticket 80mm (Termico)
              </button>
              <button
                onClick={() => setActiveFormat('a4')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeFormat === 'a4'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Ticket A4 (Corporativo)
              </button>
            </div>
          </div>
        )}

        {/* Vista previa del PDF */}
        <div className="mb-4">
          <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: '500px' }}>
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-gray-600">
                    Generando tickets en el backend...
                  </p>
                  <p className="text-sm text-gray-500">
                    El backend está creando los PDFs (80mm y A4) y almacenándolos en la nube
                  </p>
                </div>
              </div>
            ) : (activeFormat === 'ticket80mm' && previewUrl80mm) ? (
              <iframe
                src={previewUrl80mm}
                className="w-full h-full"
                title="Vista previa del ticket 80mm"
              />
            ) : (activeFormat === 'a4' && previewUrlA4) ? (
              <iframe
                src={previewUrlA4}
                className="w-full h-full"
                title="Vista previa del ticket A4"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No se pudo cargar la vista previa</p>
                  <Button
                    onClick={handleRegeneratePdfs}
                    variant="outline"
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de accion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Button
            onClick={() => {
              handleDownloadTicket().then(() => {
                handleClose();
              });
            }}
            disabled={isGenerating || isDownloading || !generationSuccess}
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
                Descargar y Finalizar
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowWhatsAppModal(true)}
            disabled={isGenerating || isDownloading || !generationSuccess}
            className="bg-green-500 hover:bg-green-600 py-3"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar por WhatsApp
          </Button>

          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating || isDownloading}
            className="py-3"
          >
            Cerrar
          </Button>
        </div>

        {/* Boton de regenerar (solo si hay error) */}
        {!generationSuccess && !isGenerating && (
          <div className="mb-4">
            <Button
              onClick={handleRegeneratePdfs}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerar Tickets
            </Button>
          </div>
        )}

        {/* Modal de WhatsApp */}
        <WhatsAppSendModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          backendData={invoiceData}
          initialPhoneNumber={initialPhoneNumber || invoiceData.client?.phone || ''}
          onClearForm={onClearForm}
          isFromInvoiceList={true}
          preferredPdfType={activeFormat === 'a4' ? 'a4' : 'ticket'}
        />
      </div>
    </Modal>
  );
};
