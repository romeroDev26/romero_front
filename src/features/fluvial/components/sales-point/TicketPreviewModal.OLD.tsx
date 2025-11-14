// src/features/fluvial/components/sales-point/TicketPreviewModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { Download, Eye, Cloud, MessageCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { BackendInvoiceData, BackendCompanyInvoiceData } from './tickets/types/backend.types';
import { useTicketUpload } from '../../../../hooks/useTicketUpload';
import { WhatsAppSendModal } from './WhatsAppSendModal';
import { TicketGenerator } from './tickets/TicketGenerator';

interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: BackendInvoiceData | BackendCompanyInvoiceData;
  onSuccess: () => void;
  // Props para tickets de empresa (RUC)
  customGeneratePDF?: () => Promise<jsPDF>;
  // Número de teléfono inicial para WhatsApp
  initialPhoneNumber?: string;
  // Función para limpiar el formulario cuando se cierre el modal
  onClearForm?: () => void;
  // Flag para mostrar representantes en A4 (ventas empresariales)
  showRepresentativesInA4?: boolean;
}

type TicketFormat = 'ticket80mm' | 'a4';

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  isOpen,
  onClose,
  backendData,
  onSuccess,
  customGeneratePDF,
  initialPhoneNumber = '',
  onClearForm,
  showRepresentativesInA4 = true
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeFormat, setActiveFormat] = useState<TicketFormat>('ticket80mm');
  const [previewUrl80mm, setPreviewUrl80mm] = useState<string>('');
  const [previewUrlA4, setPreviewUrlA4] = useState<string>('');
  const [ticket80mmDoc, setTicket80mmDoc] = useState<any>(null);
  const [ticketA4Doc, setTicketA4Doc] = useState<any>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  
  // Hook para manejar el upload de tickets
  const { isUploading, error: uploadError, uploadBothTickets } = useTicketUpload();
  const [uploadSuccess, setUploadSuccess] = useState<{ url80mm: string | null; urlA4: string | null } | null>(null);


  // Generar el PDF inmediatamente cuando se abre el modal
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
      setUploadSuccess(null);
      setTicket80mmDoc(null);
      setTicketA4Doc(null);
    }
  }, [isOpen, previewUrl80mm, previewUrlA4]);

  const generateBothPreviews = async () => {
    try {
      setIsGenerating(true);
      
      // Si hay customGeneratePDF (ventas empresariales), usar esa lógica para 80mm
      // y generar el A4 por separado
      if (customGeneratePDF) {
        // Generar ticket 80mm usando la lógica personalizada
        const doc80mm = await customGeneratePDF();
        const blob80mm = doc80mm.output('blob');
        
        // Generar SOLO el A4 usando el generador, pasando los datos completos
        const generator = new TicketGenerator();
        
        // Importante: generateBothTickets genera ambos, pero aquí solo necesitamos el A4
        // Los datos completos (con representatives) ya están en backendData
        const resultBoth = await generator.generateBothTickets(backendData, showRepresentativesInA4);
        
        // Generar URLs de vista previa
        const url80mm = URL.createObjectURL(blob80mm);
        const urlA4 = URL.createObjectURL(resultBoth.ticketA4);
        
        setPreviewUrl80mm(url80mm);
        setPreviewUrlA4(urlA4);
        setTicket80mmDoc(doc80mm);
        setTicketA4Doc(resultBoth.ticketA4Doc);
        
        // UPLOAD AUTOMÁTICO DE AMBOS TICKETS EN PARALELO
        try {
          // Extraer ID del invoice si es BackendCompanyInvoiceData
          const invoiceId = 'invoice' in backendData ? backendData.invoice.id : backendData.id;
          
          const uploadResult = await uploadBothTickets(
            blob80mm,
            resultBoth.ticketA4,
            invoiceId
          );
          
          setUploadSuccess(uploadResult);
        } catch (uploadErr) {
          // No se pudieron subir los tickets, pero la generación fue exitosa
          console.error('Error subiendo tickets:', uploadErr);
        }
      } else {
        // Lógica normal: generar ambos con el generador estándar
        const generator = new TicketGenerator();
        const result = await generator.generateBothTickets(backendData, showRepresentativesInA4);
        
        // Generar URLs de vista previa
        const url80mm = URL.createObjectURL(result.ticket80mm);
        const urlA4 = URL.createObjectURL(result.ticketA4);
        
        setPreviewUrl80mm(url80mm);
        setPreviewUrlA4(urlA4);
        setTicket80mmDoc(result.ticket80mmDoc);
        setTicketA4Doc(result.ticketA4Doc);
        
        // UPLOAD AUTOMÁTICO DE AMBOS TICKETS EN PARALELO
        try {
          // Extraer ID del invoice si es BackendCompanyInvoiceData
          const invoiceId = 'invoice' in backendData ? backendData.invoice.id : backendData.id;
          
          const uploadResult = await uploadBothTickets(
            result.ticket80mm,
            result.ticketA4,
            invoiceId
          );
          
          setUploadSuccess(uploadResult);
        } catch (uploadErr) {
          // No se pudieron subir los tickets, pero la generación fue exitosa
          console.error('Error subiendo tickets:', uploadErr);
        }
      }
      
    } catch (error) {
      console.error('Error generando ambos tickets:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true);
      
      // Descargar según el formato activo
      if (activeFormat === 'ticket80mm' && ticket80mmDoc) {
        ticket80mmDoc.save('ticket_80mm.pdf');
      } else if (activeFormat === 'a4' && ticketA4Doc) {
        ticketA4Doc.save('ticket_a4.pdf');
      }
      
    } catch (error) {
      console.error('Error descargando ticket:', error);
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
        {(() => {
          const invoiceData = 'invoice' in backendData ? backendData.invoice : backendData;
          return invoiceData.items && invoiceData.items.length > 0 && 
           invoiceData.items[0].parcel_number && 
           (invoiceData.items[0].product_name?.toLowerCase().includes('encomienda') || 
            invoiceData.items[0].item_description?.toLowerCase().includes('encomienda'));
        })() && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Número de Encomienda: <span className="font-bold">{
                ('invoice' in backendData ? backendData.invoice.items[0] : backendData.items[0]).parcel_number
              }</span>
            </p>
          </div>
        )}
        {/* Indicador de estado de upload */}
        {uploadSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <Cloud className="h-4 w-4 mr-2" />
              <p className="text-sm font-medium">
                Documentos almacenados correctamente
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
        
        {/* Tabs para seleccionar formato */}
        <div className="mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveFormat('ticket80mm')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeFormat === 'ticket80mm'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ticket 80mm (Térmico)
            </button>
            <button
              onClick={() => setActiveFormat('a4')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeFormat === 'a4'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ticket A4 (Corporativo)
            </button>
          </div>
        </div>
        
        {/* Vista previa del PDF real */}
        <div className="mb-6">
          <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: '600px' }}>
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Spinner size="lg" className="mb-4" />
                  <p className="text-gray-600">
                    {isUploading ? 'Generando y subiendo ambos tickets...' : 'Generando tickets 80mm y A4...'}
                  </p>
                  <p className="text-sm text-gray-500">Generación en paralelo</p>
                  
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
          backendData={'invoice' in backendData ? backendData.invoice : backendData}
          customGeneratePDF={customGeneratePDF}
          initialPhoneNumber={initialPhoneNumber || ('invoice' in backendData ? backendData.invoice.client?.phone : backendData.client?.phone) || ''}
          onClearForm={onClearForm}
          isFromInvoiceList={true}
          preferredPdfType={activeFormat === 'a4' ? 'a4' : 'ticket'}
        />
      </div>
    </Modal>
  );
};
