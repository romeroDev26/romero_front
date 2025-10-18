// src/features/fluvial/components/sales-point/TicketPreviewModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { Download, Eye, Cloud, MessageCircle, FileText, Printer } from 'lucide-react';
import { BackendInvoiceData } from './tickets/types/backend.types';
import { TicketGenerator } from './tickets/TicketGenerator';
import { useTicketUpload } from '../../../../hooks/useTicketUpload';
import { WhatsAppSendModal } from './WhatsAppSendModal';

type TabType = 'ticket80mm' | 'a4';

interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: BackendInvoiceData;
  onSuccess: () => void;
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
  initialPhoneNumber = '',
  onClearForm
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ticket80mm');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl80mm, setPreviewUrl80mm] = useState<string>('');
  const [previewUrlA4, setPreviewUrlA4] = useState<string>('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  
  // Hook para manejar el upload de tickets
  const { isUploading, error: uploadError, uploadBothTickets } = useTicketUpload();
  const [uploadSuccess, setUploadSuccess] = useState<{ ticket80mm?: string; a4?: string }>({});

  // Generar ambos PDFs inmediatamente cuando se abre el modal
  useEffect(() => {
    if (isOpen && !previewUrl80mm && !previewUrlA4) {
      generateBothPreviews();
    }
  }, [isOpen]);

  // Limpiar URLs cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl80mm) {
        URL.revokeObjectURL(previewUrl80mm);
        setPreviewUrl80mm('');
      }
      if (previewUrlA4) {
        URL.revokeObjectURL(previewUrlA4);
        setPreviewUrlA4('');
      }
      // Limpiar también los estados de upload
      setUploadSuccess({});
    }
  }, [isOpen]);

  const generateBothPreviews = async () => {
    try {
      setIsGenerating(true);
      
      // Generar ambos tickets
      const generator = new TicketGenerator();
      const { ticket80mm, ticketA4 } = await generator.generateBothTickets(backendData);
      
      // Crear URLs de preview para ambos
      const url80mm = URL.createObjectURL(ticket80mm);
      const urlA4 = URL.createObjectURL(ticketA4);
      
      setPreviewUrl80mm(url80mm);
      setPreviewUrlA4(urlA4);
      
      // UPLOAD AUTOMÁTICO AL BACKEND DE AMBOS TICKETS
      try {
        const { ticket80mmUrl, ticketA4Url } = await uploadBothTickets(
          ticket80mm,
          ticketA4,
          backendData.id
        );
        
        if (ticket80mmUrl || ticketA4Url) {
          setUploadSuccess({
            ticket80mm: ticket80mmUrl || undefined,
            a4: ticketA4Url || undefined
          });
        }
      } catch (uploadErr) {
        console.error('Error uploading tickets:', uploadErr);
        // No se pudieron subir los tickets automáticamente, pero la generación fue exitosa
      }
      
    } catch (error) {
      console.error('Error generating tickets:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true);
      
      // Generar ambos tickets
      const generator = new TicketGenerator();
      const { ticket80mmDoc, ticketA4Doc } = await generator.generateBothTickets(backendData);
      
      // Descargar el ticket correspondiente al tab activo
      if (activeTab === 'ticket80mm') {
        ticket80mmDoc.save(`ticket_80mm_${backendData.series}-${String(backendData.number).padStart(8, '0')}.pdf`);
      } else {
        ticketA4Doc.save(`factura_a4_${backendData.series}-${String(backendData.number).padStart(8, '0')}.pdf`);
      }
      
    } catch (error) {
      console.error('Error downloading ticket:', error);
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

  const currentPreviewUrl = activeTab === 'ticket80mm' ? previewUrl80mm : previewUrlA4;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Previsualización de Documentos"
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
        {(uploadSuccess.ticket80mm || uploadSuccess.a4) && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <Cloud className="h-4 w-4 mr-2" />
              <div className="text-sm">
                <p className="font-medium">Documentos almacenados en el servidor:</p>
                {uploadSuccess.ticket80mm && (
                  <p className="font-mono text-xs mt-1">✓ Ticket 80mm: {uploadSuccess.ticket80mm}</p>
                )}
                {uploadSuccess.a4 && (
                  <p className="font-mono text-xs mt-1">✓ Formato A4: {uploadSuccess.a4}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {uploadError && !uploadSuccess.ticket80mm && !uploadSuccess.a4 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center text-yellow-800">
              <Cloud className="h-4 w-4 mr-2" />
              <p className="text-sm">
                No se pudo almacenar automáticamente: {uploadError}
              </p>
            </div>
          </div>
        )}
        
        {/* Tabs para seleccionar entre 80mm y A4 */}
        <div className="mb-4 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('ticket80mm')}
              className={`flex items-center px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'ticket80mm'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Printer className="h-4 w-4 mr-2" />
              Ticket 80mm
            </button>
            <button
              onClick={() => setActiveTab('a4')}
              className={`flex items-center px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'a4'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Formato A4
            </button>
          </div>
        </div>
        
        {/* Vista previa del PDF */}
        <div className="mb-6">
          <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: '600px' }}>
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-gray-600">
                    {isUploading ? 'Generando y subiendo documentos...' : 'Generando documentos...'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activeTab === 'ticket80mm' ? 'Ticket térmico 80mm' : 'Formato A4 corporativo'}
                  </p>
                  
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
                  
                  {(uploadSuccess.ticket80mm || uploadSuccess.a4) && (
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
            ) : currentPreviewUrl ? (
              <iframe
                src={currentPreviewUrl}
                className="w-full h-full"
                title={`Vista previa del ${activeTab === 'ticket80mm' ? 'ticket 80mm' : 'formato A4'}`}
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
                Descargar {activeTab === 'ticket80mm' ? '80mm' : 'A4'}
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
          initialPhoneNumber={initialPhoneNumber || backendData.client?.phone || ''}
          onClearForm={onClearForm}
        />
      </div>
    </Modal>
  );
};

