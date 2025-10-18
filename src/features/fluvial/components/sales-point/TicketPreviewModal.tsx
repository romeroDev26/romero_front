// src/features/fluvial/components/sales-point/TicketPreviewModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { Download, Eye, Cloud, MessageCircle } from 'lucide-react';
import { 
  downloadTicket, 
  generateTicketBlob 
} from './tickets';
import jsPDF from 'jspdf';
import { BackendInvoiceData } from './tickets/types/backend.types';
import { useTicketUpload } from '../../../../hooks/useTicketUpload';
import { WhatsAppSendModal } from './WhatsAppSendModal';

interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: BackendInvoiceData;
  onSuccess: () => void;
  // Props para tickets de empresa (RUC)
  customGeneratePDF?: () => Promise<jsPDF>;
  // Número de teléfono inicial para WhatsApp
  initialPhoneNumber?: string;
  // Función para limpiar el formulario cuando se cierre el modal
  onClearForm?: () => void;
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  isOpen,
  onClose,
  backendData,
  onSuccess,
  customGeneratePDF,
  initialPhoneNumber = '',
  onClearForm
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  
  // Hook para manejar el upload de tickets
  const { isUploading, error: uploadError, uploadTicketPdf, uploadTicketBlob } = useTicketUpload();
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);


  // Generar el PDF inmediatamente cuando se abre el modal
  useEffect(() => {
    if (isOpen && !previewUrl) {
      generatePreview();
    }
  }, [isOpen]);

  // Limpiar URL cuando se cierra el modal
  useEffect(() => {
    if (!isOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      // Limpiar también los estados de upload
      setUploadSuccess(null);
    }
  }, [isOpen, previewUrl]);

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      let pdfBlob;
      let pdfDoc: jsPDF | null = null;
      
      if (customGeneratePDF) {
        // Usar lógica custom para empresa
        pdfDoc = await customGeneratePDF();
        pdfBlob = pdfDoc.output('blob');
      } else {
        // Usar detección automática para tickets normales y sin asientos
        pdfBlob = await generateTicketBlob(backendData);
      }
      
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      
      // UPLOAD AUTOMÁTICO AL BACKEND
      try {
        let uploadResult: string | null = null;
        
        if (pdfDoc) {
          // Si tenemos el documento jsPDF (custom), usar ese método
          uploadResult = await uploadTicketPdf(pdfDoc, backendData.id, 'pdf_ticket');
        } else {
          // Si solo tenemos el blob, usar ese método
          uploadResult = await uploadTicketBlob(pdfBlob, backendData.id, 'pdf_ticket');
        }
        
        if (uploadResult) {
          setUploadSuccess(uploadResult);
        }
      } catch (uploadErr) {
        // No se pudo subir el ticket automáticamente, pero la generación fue exitosa
      }
      
      // Eliminado console.log de depuración
    } catch (error) {
      // Eliminado console.error de depuración
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true);
      if (customGeneratePDF) {
        // Descargar ticket resumen de empresa
        const doc = await customGeneratePDF();
        doc.save('ticket_empresa_resumen.pdf');
      } else {
        // Descargar ticket con detección automática
        await downloadTicket(backendData);
      }
      // Eliminado console.log de depuración
    } catch (error) {
      // Eliminado console.error de depuración
    } finally {
      setIsDownloading(false);
    }
  };



  const handleClose = () => {
    if (!isGenerating) {
      onClose();
      onSuccess(); // Forzar recarga del viaje para actualizar estado de asientos
      // Limpiar el formulario cuando se cierre el modal
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
        {/* Mostrar número de Encomienda si existe y es una encomienda */}
        {backendData.items && backendData.items.length > 0 && 
         backendData.items[0].parcel_number && 
         (backendData.items[0].product_name?.toLowerCase().includes('encomienda') || 
          backendData.items[0].item_description?.toLowerCase().includes('encomienda')) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              Número de Encomienda: <span className="font-bold">{backendData.items[0].parcel_number}</span>
            </p>
          </div>
        )}
        {/* Indicador de estado de upload */}
        {uploadSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <Cloud className="h-4 w-4 mr-2" />
              <p className="text-sm">
                Ticket almacenado en el servidor correctamente
                <span className="ml-1 font-mono text-xs block mt-1">{uploadSuccess}</span>
              </p>
            </div>
          </div>
        )}
        
        {uploadError && !uploadSuccess && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center text-yellow-800">
              <Cloud className="h-4 w-4 mr-2" />
              <p className="text-sm">
                No se pudo almacenar automáticamente: {uploadError}
              </p>
            </div>
          </div>
        )}
        
        {/* Vista previa del PDF real */}
        <div className="mb-6">
          <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: '600px' }}>
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-gray-600">
                    {isUploading ? 'Generando y subiendo ticket...' : 'Generando vista previa del ticket...'}
                  </p>
                  <p className="text-sm text-gray-500">Sistema de 8 bloques con QR</p>
                  
                  {/* Barra de progreso para upload */}
                  {isUploading && (
                    <div className="mt-4 w-64 mx-auto">
                      <div className="flex justify-between text-xs text-blue-600 mb-1">
                        <span>Almacenando en el backend</span>
                        <span>Subiendo...</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                      </div>
                    </div>
                  )}
                  
                  {uploadSuccess && (
                    <div className="mt-4 w-64 mx-auto">
                      <div className="flex justify-between text-xs text-green-600 mb-1">
                        <span>Almacenamiento completado</span>
                        <span>100%</span>
                      </div>
                      <div className="w-full bg-green-100 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '100%'}}></div>
                      </div>
                    </div>
                  )}
                  
                  {uploadError && (
                    <div className="mt-4 w-64 mx-auto">
                      <div className="flex justify-between text-xs text-red-600 mb-1">
                        <span>Error en almacenamiento</span>
                        <span>Continuando...</span>
                      </div>
                      <div className="w-full bg-red-100 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{width: '100%'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Vista previa del ticket"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No se pudo generar la vista previa</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Button
            onClick={handleDownloadTicket}
            disabled={isGenerating || isDownloading}
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
                Descargar
              </>
            )}
          </Button>
          
          <Button
            onClick={() => setShowWhatsAppModal(true)}
            disabled={isGenerating || isDownloading}
            className="bg-green-500 hover:bg-green-600 py-3"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>

          <Button
            onClick={() => { 
              handleDownloadTicket().then(() => {
                onClose();
                onSuccess(); // Forzar recarga del viaje para actualizar estado de asientos
                // Limpiar el formulario también cuando se descarga y finaliza
                if (onClearForm) {
                  onClearForm();
                }
              });
            }}
            disabled={isGenerating || isDownloading}
            className="bg-emerald-600 hover:bg-emerald-700 py-3"
          >
            Descargar y Finalizar
          </Button>
        </div>

        {/* Botón de navegación */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating || isDownloading}
          >
            Cerrar
          </Button>
        </div>

        {/* Modal de WhatsApp */}
        <WhatsAppSendModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          backendData={backendData}
          customGeneratePDF={customGeneratePDF}
          initialPhoneNumber={initialPhoneNumber || backendData.client?.phone || ''}
          onClearForm={onClearForm}
        />
      </div>
    </Modal>
  );
};
