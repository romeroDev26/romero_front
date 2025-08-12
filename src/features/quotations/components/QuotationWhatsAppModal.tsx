// src/features/quotations/components/QuotationWhatsAppModal.tsx

import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Spinner } from '../../../components/common/Spinner';
import { MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { whatsappService, WhatsAppSendResponse } from '../../../services/whatsapp.service';
import { Quotation } from '../types';

interface QuotationWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  pdfUrl: string | null;
}

export const QuotationWhatsAppModal: React.FC<QuotationWhatsAppModalProps> = ({
  isOpen,
  onClose,
  quotation,
  pdfUrl
}) => {
  const [phoneNumber, setPhoneNumber] = useState(quotation.client?.phone || '');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<WhatsAppSendResponse | null>(null);

  const defaultMessage = `¡Hola!

Nos complace enviarle su cotización correspondiente.
Adjuntamos el documento PDF para su revisión.

*Cotización N°:* ${quotation.series}-${quotation.number.toString().padStart(6, '0')}
*Total:* ${quotation.currency_code} ${parseFloat(quotation.total_payable).toFixed(2)}
*Válida hasta:* ${new Date(quotation.valid_until).toLocaleDateString('es-PE')}

Gracias por su confianza.
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

    if (!pdfUrl) {
      setSendResult({
        success: false,
        error: 'PDF no disponible para enviar'
      });
      return;
    }

    try {
      setIsSending(true);
      setSendResult(null);

      // Obtener el blob del PDF desde la URL
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      
      // Convertir a base64
      const pdfBase64 = await whatsappService.blobToBase64(blob);
      
      // Enviar por WhatsApp
      const fileName = `cotizacion-${quotation.series}-${quotation.number.toString().padStart(6, '0')}.pdf`;
      
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
          setPhoneNumber(quotation.client?.phone || '');
          setCustomMessage('');
          setSendResult(null);
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
      setPhoneNumber(quotation.client?.phone || '');
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
      title="Enviar Cotización por WhatsApp"
      maxWidth="md"
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <MessageCircle className="h-6 w-6 text-green-600 mr-2" />
          <div>
            <h3 className="font-semibold text-gray-800">
              Envío de Cotización
            </h3>
            <p className="text-sm text-gray-600">
              Cotización: {quotation.series}-{quotation.number.toString().padStart(6, '0')}
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
