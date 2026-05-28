// src/features/fluvial/components/sales-point/WhatsAppSendModal.tsx
// ACTUALIZADO: Ahora usa la instancia de WhatsApp de la sucursal correspondiente
// con fallback automático a otra sucursal conectada si la principal no está disponible

import React, { useState } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { Spinner } from '../../../../components/common/Spinner';
import { MessageCircle, Send, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { whatsappService, WhatsAppSendResponse } from '../../../../services/whatsapp.service';
import { BackendInvoiceData } from './tickets/types/backend.types';
import { Invoice } from '../../../../types';
import { useWhatsAppInstanceWithFallback } from '../../../../hooks/useWhatsAppInstance';

type WhatsAppSendModalInvoice = BackendInvoiceData | Invoice;

interface WhatsAppSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: WhatsAppSendModalInvoice;
  initialPhoneNumber?: string;
  onClearForm?: () => void;
  // Nueva prop para identificar el contexto
  isFromInvoiceList?: boolean;
  // Tipo de PDF preferido para enviar (a4 o ticket)
  preferredPdfType?: 'a4' | 'ticket' | 'legacy';
}

export const WhatsAppSendModal: React.FC<WhatsAppSendModalProps> = ({
  isOpen,
  onClose,
  backendData,
  initialPhoneNumber = '',
  onClearForm,
  isFromInvoiceList = false,
  preferredPdfType = 'ticket'
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<WhatsAppSendResponse | null>(null);

  // Obtener la instancia de WhatsApp con verificación de conexión y fallback automático
  const whatsAppInstance = useWhatsAppInstanceWithFallback(backendData.branch_office_name || null);
  const businessName = backendData.branch_office_name || 'Nuestra Empresa';

  const defaultMessage = `¡Hola!

Nos alegra mucho que hayas decidido confiar en nosotros.
Adjuntamos a continuación tu comprobante electrónico correspondiente.

Gracias por tu preferencia.
Atentamente,
El equipo de ${businessName}`;

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      setSendResult({
        success: false,
        error: 'Por favor ingresa un número de teléfono válido'
      });
      return;
    }

    // Verificar que haya una instancia disponible (la original o el fallback)
    if (!whatsAppInstance.effectiveInstanceName) {
      setSendResult({
        success: false,
        error: whatsAppInstance.error || 'No hay ninguna instancia de WhatsApp disponible para enviar'
      });
      return;
    }

    try {
      setIsSending(true);
      setSendResult(null);

      // Detectar qué tipo de PDF está disponible basándose en los campos del backendData
      let pdfType: 'a4' | 'ticket' | 'legacy' = preferredPdfType;
      
      // Si backendData tiene información de archivos PDF, validar disponibilidad
      const invoiceData = backendData as any;
      
      // Si el tipo preferido no está disponible, hacer fallback
      if (pdfType === 'ticket' && !invoiceData.pdf_ticket_file_path) {
        if (invoiceData.pdf_a4_file_path) {
          pdfType = 'a4';
        } else if (invoiceData.pdf_file_path) {
          pdfType = 'legacy';
        }
      } else if (pdfType === 'a4' && !invoiceData.pdf_a4_file_path) {
        if (invoiceData.pdf_ticket_file_path) {
          pdfType = 'ticket';
        } else if (invoiceData.pdf_file_path) {
          pdfType = 'legacy';
        }
      }

      // Usar la instancia efectiva (original si está conectada, o fallback)
      const result = await whatsappService.sendInvoicePdf({
        invoiceId: backendData.id as number,
        phoneNumber,
        customMessage: customMessage.trim() || undefined,
        pdfType: pdfType,
        instanceName: whatsAppInstance.effectiveInstanceName,
        businessName: businessName
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
          <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
          <div>
            <h3 className="font-semibold text-dm-text-primary">
              Envío de Comprobante Electrónico
            </h3>
            <p className="text-sm text-dm-text-secondary">
              Documento: {backendData.document_type_code} {backendData.series}-{backendData.number}
            </p>
            {isFromInvoiceList && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Formato: {preferredPdfType === 'a4' ? 'A4 (Corporativo)' : preferredPdfType === 'ticket' ? 'Ticket 80mm (Térmico)' : 'PDF Estándar'}
              </p>
            )}
            {/* Indicador de sucursal del comprobante */}
            {whatsAppInstance.branchOfficeName && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
               {whatsAppInstance.branchOfficeName}
              </p>
            )}
          </div>
        </div>

        {/* Campo de número de teléfono */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-dm-text-secondary mb-2">
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
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Ingresa un número válido (mínimo 9 dígitos)
            </p>
          )}
          <p className="text-xs text-dm-text-muted mt-1">
            Se agregará automáticamente el código de país +51 si no se especifica
          </p>
        </div>

        {/* Campo de mensaje personalizado */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-dm-text-secondary mb-2">
            Mensaje (opcional)
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={defaultMessage}
            disabled={isSending}
            rows={8}
            className="w-full px-3 py-2 border border-dm-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <p className="text-xs text-dm-text-muted mt-1">
            Si dejas vacío, se usará el mensaje predeterminado
          </p>
        </div>

        {/* Resultado del envío */}
        {sendResult && (
          <div className={`mb-4 p-3 rounded-lg flex items-center ${
            sendResult.success 
              ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50' 
              : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50'
          }`}>
            {sendResult.success ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                <div className="text-green-800 dark:text-green-300">
                  <p className="font-medium">¡Enviado exitosamente!</p>
                  <p className="text-sm">{sendResult.message}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                <div className="text-red-800 dark:text-red-300">
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
            disabled={isSending || !phoneNumber.trim() || !isValidPhoneNumber(phoneNumber) || !whatsAppInstance.effectiveInstanceName}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-dm-text-muted disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Enviando...
              </>
            ) : whatsAppInstance.isCheckingConnection ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Verificando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar por WhatsApp
              </>
            )}
          </Button>
        </div>

        {/* Aviso: Usando sucursal alternativa (fallback) */}
        {whatsAppInstance.usingFallback && whatsAppInstance.effectiveInstanceName && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-amber-800 dark:text-amber-300 text-xs">
                <p className="font-medium mb-1">Usando sucursal alternativa</p>
                <p>
                  La sucursal <strong>"{whatsAppInstance.branchOfficeName}"</strong> no tiene WhatsApp 
                  {whatsAppInstance.hasInstance && !whatsAppInstance.isConnected ? ' conectado' : ' configurado'}.
                </p>
                <p className="mt-1">
                  Se enviará desde: <strong className="text-amber-900 dark:text-amber-200">{whatsAppInstance.effectiveBranchOfficeName}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Advertencia si no hay WhatsApp disponible en ninguna sucursal */}
        {!whatsAppInstance.effectiveInstanceName && !whatsAppInstance.isLoading && !whatsAppInstance.isCheckingConnection && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-red-800 dark:text-red-300 text-xs">
                <p className="font-medium mb-1">WhatsApp no disponible</p>
                <p>
                  {whatsAppInstance.error || `No hay ninguna instancia de WhatsApp conectada disponible.`}
                </p>
                <p className="mt-1">
                  Contacta al administrador para verificar la configuración de WhatsApp.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verificando conexión */}
        {whatsAppInstance.isCheckingConnection && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
            <div className="flex items-center">
              <Spinner size="sm" className="mr-2 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-300 text-xs">Verificando estado de conexión de WhatsApp...</span>
            </div>
          </div>
        )}

        {/* Nota informativa - Solo mostrar si hay WhatsApp disponible y está conectado directamente */}
        {whatsAppInstance.effectiveInstanceName && !whatsAppInstance.usingFallback && !whatsAppInstance.isCheckingConnection && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg">
            <div className="flex items-start">
              <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-green-800 dark:text-green-300 text-xs">
                <p className="font-medium mb-1">WhatsApp conectado</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sucursal: <strong>{whatsAppInstance.branchOfficeName}</strong></li>
                  <li>Verifica que el número tenga WhatsApp activo</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
