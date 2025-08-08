// src/features/fluvial/components/sales-point/WhatsAppSendModal.tsx

import React, { useState } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { Spinner } from '../../../../components/common/Spinner';
import { MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { whatsappService, WhatsAppSendResponse } from '../../../../services/whatsapp.service';
import jsPDF from 'jspdf';
import { BackendInvoiceData } from './tickets/types/backend.types';
import { generateTicketBlob } from './tickets';

interface WhatsAppSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: BackendInvoiceData;
  customGeneratePDF?: () => Promise<jsPDF>;
  initialPhoneNumber?: string;
  onClearForm?: () => void;
  // Nueva prop para identificar el contexto
  isFromInvoiceList?: boolean;
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  isOpen,
  onClose,
  backendData,
  customGeneratePDF,
  initialPhoneNumber = '',
  onClearForm,
  isFromInvoiceList = false
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<WhatsAppSendResponse | null>(null);

  const defaultMessage = `¡Hola!

Nos alegra mucho que hayas decidido confiar en nosotros.
Adjuntamos a continuación tu comprobante electrónico correspondiente.

Gracias por tu preferencia.
Atentamente,
El equipo de GLOBAL ROMERO S.A.C.`;

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      setSendResult({
        success: false,
        error: 'Por favor ingresa un número de teléfono válido'
      });
      return;
    }

    try {
      setIsSending(true);
      setSendResult(null);

      // Generar el PDF
      let pdfBase64: string;
      let fileName: string;

      if (customGeneratePDF) {
        // Usar lógica custom para empresa
        const doc = await customGeneratePDF();
        pdfBase64 = whatsappService.pdfDocToBase64(doc);
        fileName = `ticket_empresa_${backendData.series}-${backendData.number}.pdf`;
      } else if (isFromInvoiceList) {
        // Para facturas de la lista de contabilidad - usar endpoint directo del backend
        // Detectar qué tipo de PDF está disponible basándose en los campos del backendData
        let pdfType: 'a4' | 'ticket' | 'legacy' = 'ticket'; // Por defecto ticket
        
        // Si backendData tiene información de archivos PDF, usar esa lógica
        const invoiceData = backendData as any;
        if (invoiceData.pdf_ticket_file_path) {
          pdfType = 'ticket';
        } else if (invoiceData.pdf_a4_file_path) {
          pdfType = 'a4';
        } else if (invoiceData.pdf_file_path) {
          pdfType = 'legacy';
        }

        const result = await whatsappService.sendInvoicePdf({
          invoiceId: backendData.id as number,
          phoneNumber,
          customMessage: customMessage.trim() || undefined,
          pdfType: pdfType
        });

        setSendResult(result);
        
        if (result.success) {
          // Limpiar el formulario después del éxito
          setTimeout(() => {
            onClose();
            setPhoneNumber('');
            setCustomMessage('');
            setSendResult(null);
            // Limpiar el formulario principal de venta
            if (onClearForm) {
              onClearForm();
            }
          }, 2000);
        }
        return;
      } else {
        // Usar detección automática para tickets normales
        const pdfBlob = await generateTicketBlob(backendData);
        pdfBase64 = await whatsappService.blobToBase64(pdfBlob);
        fileName = `ticket_${backendData.series}-${backendData.number}.pdf`;
      }

      // Enviar por WhatsApp
      const result = await whatsappService.sendDocument({
        phoneNumber,
        pdfBase64,
        fileName,
        customMessage: customMessage.trim() || undefined
      });

      setSendResult(result);
      
      if (result.success) {
        // Limpiar el formulario después del éxito
        setTimeout(() => {
          onClose();
          setPhoneNumber('');
          setCustomMessage('');
          setSendResult(null);
          // Limpiar el formulario principal de venta
          if (onClearForm) {
            onClearForm();
          }
        }, 2000);
      }

    } catch (error: any) {
      setSendResult({
        success: false,
        error: error.message || 'Error desconocido al procesar el envío'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onClose();
      // Reset form state
      setPhoneNumber(initialPhoneNumber);
      setCustomMessage('');
      setSendResult(null);
    }
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.length >= 9; // Mínimo 9 dígitos
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Enviar Ticket por WhatsApp"
      maxWidth="md"
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <MessageCircle className="h-6 w-6 text-green-600 mr-2" />
          <div>
            <h3 className="font-semibold text-gray-800">
              Envío de Comprobante Electrónico
            </h3>
            <p className="text-sm text-gray-600">
              Documento: {backendData.document_type_code} {backendData.series}-{backendData.number}
            </p>
          </div>
        </div>

        {/* Campo de número de teléfono */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de WhatsApp
          </label>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Ej: +51 987 654 321 o 987654321"
            disabled={isSending}
            className={`${
              phoneNumber && !isValidPhoneNumber(phoneNumber) 
                ? 'border-red-300 focus:border-red-500' 
                : ''
            }`}
          />
          {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
            <p className="text-xs text-red-600 mt-1">
              Ingresa un número válido (mínimo 9 dígitos)
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Se agregará automáticamente el código de país +51 si no se especifica
          </p>
        </div>

        {/* Campo de mensaje personalizado */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje (opcional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={defaultMessage}
            disabled={isSending}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si dejas vacío, se usará el mensaje predeterminado
          </p>
        </div>

        {/* Resultado del envío */}
        {sendResult && (
          <div className={`mb-4 p-3 rounded-lg flex items-center ${
            sendResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {sendResult.success ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <div className="text-green-800">
                  <p className="font-medium">¡Enviado exitosamente!</p>
                  <p className="text-sm">{sendResult.message}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <div className="text-red-800">
                  <p className="font-medium">Error al enviar</p>
                  <p className="text-sm">{sendResult.error}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
            className="flex-1"
          >
            {sendResult?.success ? 'Cerrar' : 'Cancelar'}
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={isSending || !phoneNumber.trim() || !isValidPhoneNumber(phoneNumber)}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar por WhatsApp
              </>
            )}
          </Button>
        </div>

        {/* Nota informativa */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <MessageCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800 text-xs">
              <p className="font-medium mb-1">Importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Verifica que el número tenga WhatsApp activo</li>
                <li>El envío puede tardar unos segundos</li>
                <li>Se usará la instancia "romero_ventas"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
