// src/features/fluvial/components/sales-point/TicketPreviewModal.tsx
// NUEVO: Ahora usa PDFs generados por el backend en lugar de generarlos en frontend

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { Download, Eye, MessageCircle, RefreshCw, Tag } from 'lucide-react';
import { BackendInvoiceData, BackendCompanyInvoiceData } from './tickets/types/backend.types';
import { WhatsAppSendModal } from './WhatsAppSendModal';
import { invoicesService } from '../../../../services/invoices.service';
import { toast } from '@/utils/sileo-toast';
import { getSaleKind } from '../../../../utils/getSaleKind';
import { SaleInfoPanel } from '../../../accounting/components/SaleInfoPanel';
import { EditPaymentMethodsModal } from '../../../accounting/components/EditPaymentMethodsModal';
import { Invoice } from '../../../../types';
import { usePermissions } from '../../../../hooks/usePermissions';
import { invoiceToSplitPaymentData } from '../../../../utils/invoicePaymentMapper';

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

type TicketFormat = 'ticket80mm' | 'a4' | 'sticker100x100';

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
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeFormat, setActiveFormat] = useState<TicketFormat>('ticket80mm');
  const [previewUrl80mm, setPreviewUrl80mm] = useState<string>('');
  const [previewUrlA4, setPreviewUrlA4] = useState<string>('');
  const [previewUrlSticker100x100, setPreviewUrlSticker100x100] = useState<string>('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Extraer invoice ID
  const invoiceId = 'invoice' in backendData ? backendData.invoice.id : backendData.id;
  const invoiceData = 'invoice' in backendData ? backendData.invoice : backendData;

  // Detectar si es una factura de encomienda (cargo) — heurística centralizada
  // en getSaleKind; el chequeo de sticker PDF se mantiene para conservar el
  // mismo resultado que la heurística original.
  const isCargoInvoice =
    getSaleKind(invoiceData) === 'encomienda' ||
    Boolean(invoiceData.pdf_sticker_100x100_file_path);

  // Datos vivos para el panel de resumen: se sincronizan con backendData al
  // abrir y se refrescan tras editar el método de pago (control interno).
  const [panelInvoice, setPanelInvoice] = useState<Invoice>(invoiceData as unknown as Invoice);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (isOpen) {
      setPanelInvoice(invoiceData as unknown as Invoice);
    }
  }, [isOpen, invoiceData]);

  // Tras guardar la edición de pago: refrescar el detalle para el panel sin
  // cerrar el TicketPreviewModal. El toast de éxito lo emite el modal de edición.
  const handlePaymentUpdated = async () => {
    try {
      const refreshed = await invoicesService.getById(invoiceId);
      setPanelInvoice(refreshed);
    } catch (error) {
      console.error('[TicketPreview] No se pudo refrescar el detalle tras editar el pago.', error);
    }
  };

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
      setPreviewUrlSticker100x100('');
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

      // generatePdf ya maneja la espera inteligente y retorna la URL directamente
      const url80mm = await invoicesService.generatePdf(invoiceId, '80mm');

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

      // generateBothPdfs llama a generatePdf x2, que ya maneja polling internamente
      const { url80mm, urlA4 } = await invoicesService.generateBothPdfs(invoiceId);

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
   * Genera el sticker de 100x100mm (solo para encomiendas)
   * Se ejecuta de forma lazy cuando el usuario selecciona el tab
   */
  const generateSticker100x100FromBackend = async () => {
    if (previewUrlSticker100x100) return; // Ya generado
    try {
      setIsGeneratingSticker(true);

      // Primero verificar si ya existe la URL en la invoice actual
      const existingUrl = (invoiceData as any).pdf_sticker_100x100_file_path;
      if (existingUrl) {
        setPreviewUrlSticker100x100(existingUrl);
        return;
      }

      // Generar el sticker via backend
      const url = await invoicesService.generateSticker100x100(invoiceId);

      if (!url) {
        throw new Error('Sticker generado pero URL no disponible');
      }

      setPreviewUrlSticker100x100(url);
      toast.success('Sticker 100x100 generado exitosamente');
    } catch (error) {
      console.error('Error generando sticker 100x100:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al generar el sticker. Por favor, intente nuevamente.'
      );
    } finally {
      setIsGeneratingSticker(false);
    }
  };

  /**
   * Manejar el cambio de tab — si es el sticker y no está generado, generarlo
   */
  const handleFormatChange = (format: TicketFormat) => {
    setActiveFormat(format);
    if (format === 'sticker100x100' && !previewUrlSticker100x100) {
      generateSticker100x100FromBackend();
    }
  };

  /**
   * Regenerar PDFs (util si hubo error o se quiere actualizar)
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

      let pdfUrl: string | null | undefined;
      let fileName: string;

      if (activeFormat === 'sticker100x100') {
        pdfUrl = previewUrlSticker100x100;
        fileName = `sticker_100x100_${invoiceData.series}-${invoiceData.number}.pdf`;
      } else {
        const size = activeFormat === 'ticket80mm' ? '80mm' : 'a4';
        // Obtener la URL directa del PDF desde la invoice
        const invoice = await invoicesService.getById(invoiceId);
        pdfUrl = size === '80mm' ? invoice.pdf_ticket_file_path : invoice.pdf_a4_file_path;
        fileName = `ticket_${size}_${invoiceData.series}-${invoiceData.number}.pdf`;
      }
      
      if (!pdfUrl) {
        throw new Error('PDF no disponible');
      }

      // Descargar usando un enlace temporal
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = fileName;
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
    if (!isGenerating && !isGeneratingSticker) {
      onClose();
      onSuccess(); // Forzar recarga del viaje para actualizar estado de asientos
      if (onClearForm) {
        onClearForm();
      }
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Previsualización del Ticket"
      maxWidth="5xl"
    >
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Columna izquierda: resumen de la venta (control interno).
              Scroll propio si es muy largo; el preview queda siempre visible. */}
          <div className="lg:max-h-[80vh] lg:overflow-y-auto lg:pr-1">
            <SaleInfoPanel
              invoice={panelInvoice}
              onEditPayment={() => setShowEditPaymentModal(true)}
              canEditPayment={hasPermission('accounting', 'invoices', 'sales')}
              showEmission={false}
            />
          </div>

          {/* Columna derecha: preview del ticket (siempre visible) */}
          <div>
        {/* Mostrar numero de Encomienda si existe */}
        {invoiceData.items && 
         invoiceData.items.length > 0 && 
         invoiceData.items[0].parcel_number && 
         (invoiceData.items[0].product_name?.toLowerCase().includes('encomienda') || 
          invoiceData.items[0].item_description?.toLowerCase().includes('encomienda')) && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Numero de Encomienda: <span className="font-bold">
                {invoiceData.items[0].parcel_number}
              </span>
            </p>
          </div>
        )}

        {/* Tabs para seleccionar formato */}
        {(!showOnly80mm || isCargoInvoice) && (
          <div className="mb-4">
            <div className="flex border-b border-dm-border-primary">
              <button
                onClick={() => handleFormatChange('ticket80mm')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeFormat === 'ticket80mm'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'text-dm-text-muted hover:text-dm-text-secondary'
                }`}
              >
                Ticket 80mm (Termico)
              </button>
              {!showOnly80mm && (
                <button
                  onClick={() => handleFormatChange('a4')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeFormat === 'a4'
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'text-dm-text-muted hover:text-dm-text-secondary'
                  }`}
                >
                  Ticket A4 (Corporativo)
                </button>
              )}
              {isCargoInvoice && (
                <button
                  onClick={() => handleFormatChange('sticker100x100')}
                  className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                    activeFormat === 'sticker100x100'
                      ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'text-dm-text-muted hover:text-dm-text-secondary'
                  }`}
                >
                  <Tag className="h-3.5 w-3.5" />
                  Sticker 100x100
                </button>
              )}
            </div>
          </div>
        )}

        {/* Vista previa del PDF */}
        <div className="mb-4">
          <div className="border border-dm-border-primary rounded-lg overflow-hidden bg-dm-bg-secondary h-[500px] lg:h-[63vh]">
            {(isGenerating || (activeFormat === 'sticker100x100' && isGeneratingSticker)) ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-dm-text-secondary">
                    {activeFormat === 'sticker100x100'
                      ? 'Generando sticker 100x100...'
                      : 'Generando tickets...'}
                  </p>
                  <p className="text-sm text-dm-text-muted">
                    {activeFormat === 'sticker100x100'
                      ? 'Creando el sticker y subiendo a la nube...'
                      : 'Generando PDFs (80mm y A4) y subiendo a la nube. Esto puede tomar unos segundos...'}
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
            ) : (activeFormat === 'sticker100x100' && previewUrlSticker100x100) ? (
              <iframe
                src={previewUrlSticker100x100}
                className="w-full h-full"
                title="Vista previa del sticker 100x100mm"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-dm-text-muted">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No se pudo cargar la vista previa</p>
                  <Button
                    onClick={activeFormat === 'sticker100x100' ? generateSticker100x100FromBackend : handleRegeneratePdfs}
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

        {/* Boton de regenerar (solo si hay error) */}
        {((!generationSuccess && !isGenerating) ||
          (activeFormat === 'sticker100x100' && !previewUrlSticker100x100 && !isGeneratingSticker)) && (
          <div className="mb-4">
            <Button
              onClick={activeFormat === 'sticker100x100' ? generateSticker100x100FromBackend : handleRegeneratePdfs}
              variant="outline"
              className="w-full"
              disabled={isGeneratingSticker}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {activeFormat === 'sticker100x100' ? 'Generar Sticker 100x100' : 'Regenerar Tickets'}
            </Button>
          </div>
        )}
          </div>
        </div>

        {/* Botones de accion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Button
            onClick={() => {
              handleDownloadTicket().then(() => {
                handleClose();
              });
            }}
            disabled={
              isGenerating ||
              isDownloading ||
              (activeFormat !== 'sticker100x100' && !generationSuccess) ||
              (activeFormat === 'sticker100x100' && !previewUrlSticker100x100)
            }
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

        {/* Modal de edición de métodos de pago (control interno).
            Anidado dentro del Dialog de preview para que Headless UI v2 lo
            reconozca como dialogo anidado y gestione correctamente el foco,
            el inert y el cierre con Escape sin cerrar el preview. */}
        {showEditPaymentModal && (
          <EditPaymentMethodsModal
            isOpen={showEditPaymentModal}
            onClose={() => setShowEditPaymentModal(false)}
            onSuccess={() => { void handlePaymentUpdated(); }}
            invoiceId={invoiceId}
            invoiceSeries={panelInvoice.series}
            invoiceNumber={panelInvoice.number}
            totalPayable={Number(panelInvoice.total_payable)}
            currencyCode={panelInvoice.currency_code}
            initialPaymentData={invoiceToSplitPaymentData(panelInvoice)}
          />
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
    </>
  );
};
