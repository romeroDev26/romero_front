// src/features/finance/components/payment/PaidTicketModal.tsx

import React, { useEffect, useState } from 'react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { CheckCircleIcon, MessageCircle, XIcon, FileTextIcon } from 'lucide-react';
import { PaymentTicketData } from '../../types/payment.types';
import { invoicesService } from '../../../../services/invoices.service';
import { WhatsAppSendModal } from '../../../fluvial/components/sales-point/WhatsAppSendModal';
import { Invoice } from '../../../../types';

interface PaidTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentTicketData | null;
}

/**
 * Modal para mostrar el ticket de pago confirmado
 * Se muestra después de confirmar el pago de una encomienda
 */
export const PaidTicketModal: React.FC<PaidTicketModalProps> = ({
  isOpen,
  onClose,
  paymentData,
}) => {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowWhatsAppModal(false);
      setInvoiceData(null);
      setInvoiceError(null);
      setIsLoadingInvoice(false);
    }
  }, [isOpen]);

  if (!paymentData) return null;

  // Determinar qué PDF mostrar (preferir ticket de 80mm)
  const basePdfUrl = paymentData.pdf_ticket_file_path || paymentData.pdf_ticket58_file_path;
  const ticketType = paymentData.pdf_ticket_file_path ? '80mm' : '58mm';
  
  // Agregar timestamp para evitar caché del navegador
  const cacheBuster = new Date().getTime();
  const pdfUrl = basePdfUrl ? `${basePdfUrl}?v=${cacheBuster}` : null;

  const handlePrint = () => {
    if (!basePdfUrl) return;
    
    // Usar URL con cache buster también para imprimir
    const printUrl = `${basePdfUrl}?v=${new Date().getTime()}`;
    const printWindow = window.open(printUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    if (!basePdfUrl) return;

    // Usar URL con cache buster para descargar
    const downloadUrl = `${basePdfUrl}?v=${new Date().getTime()}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${paymentData.series}-${String(paymentData.number).padStart(8, '0')}_ticket.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenWhatsApp = async () => {
    if (isLoadingInvoice) return;

    setInvoiceError(null);

    if (invoiceData) {
      setShowWhatsAppModal(true);
      return;
    }

    try {
      setIsLoadingInvoice(true);
      const invoice = await invoicesService.getById(paymentData.invoice_id);
      setInvoiceData(invoice);
      setShowWhatsAppModal(true);
    } catch (error: any) {
      setInvoiceError(error?.message || 'No se pudo cargar la factura para enviar por WhatsApp');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de Pago"
      maxWidth="6xl"
    >
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 180px)', minHeight: '750px' }}>
        {/* Panel Izquierdo - Información */}
        <div className="lg:w-72 flex-shrink-0 flex flex-col space-y-3">
          {/* Mensaje de éxito compacto */}
          <div className="bg-green-50 border border-green-200 p-2.5 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Pago Confirmado
                </p>
                <p className="text-xs text-green-700">
                  Encomienda pagada exitosamente
                </p>
              </div>
            </div>
          </div>

          {/* Detalles del comprobante */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-800 mb-2.5 flex items-center">
              <FileTextIcon className="w-4 h-4 mr-1.5 text-blue-600" />
              Detalles
            </h3>
            <div className="space-y-2.5 text-sm">
              <div>
                <span className="text-xs text-gray-600 block">Comprobante</span>
                <p className="font-bold text-gray-900 text-base">
                  {paymentData.series}-{String(paymentData.number).padStart(8, '0')}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-600 block">Monto Total</span>
                <p className="font-bold text-green-600 text-xl">
                  S/ {parseFloat(paymentData.total_payable).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-600 block">Método de Pago</span>
                <p className="font-semibold text-gray-900">
                  {paymentData.payment_method_code}
                </p>
                {paymentData.payment_operation_code && (
                  <span className="text-xs text-gray-600 block mt-0.5">
                    {paymentData.payment_operation_code}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-600 block">Fecha</span>
                <p className="font-medium text-gray-900 text-xs">
                  {new Date(paymentData.confirmed_at).toLocaleString('es-PE', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </p>
              </div>

              {/* Pago dividido si existe */}
              {paymentData.payment_method_code_2 && (
                <div className="pt-2 border-t border-blue-200">
                  <span className="text-xs font-medium text-amber-700 block mb-1">Pago Dividido</span>
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-900">
                      S/ {parseFloat(paymentData.payment_amount_1 || '0').toFixed(2)} - {paymentData.payment_method_code}
                    </p>
                    <p className="text-gray-900">
                      S/ {parseFloat(paymentData.payment_amount_2 || '0').toFixed(2)} - {paymentData.payment_method_code_2}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-auto space-y-2">
            <Button
              onClick={handleOpenWhatsApp}
              disabled={isLoadingInvoice}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5"
            >
              {isLoadingInvoice ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Cargando...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar por WhatsApp
                </>
              )}
            </Button>

            {invoiceError && (
              <p className="text-xs text-red-600 text-center">
                {invoiceError}
              </p>
            )}

            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
            >
              Cerrar
            </Button>
          </div>
        </div>

        {/* Panel Derecho - Ticket PDF */}
        <div className="flex-1 flex flex-col min-w-0">
          {pdfUrl ? (
            <div className="h-full flex flex-col border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-600 flex items-center flex-shrink-0">
                <FileTextIcon className="w-4 h-4 text-white mr-2" />
                <span className="text-sm font-semibold text-white">
                  Ticket de Pago ({ticketType})
                </span>
              </div>
              <div className="flex-1 bg-gray-50 overflow-hidden">
                <iframe
                  src={pdfUrl || ''}
                  className="w-full h-full border-0"
                  title="Ticket de Pago"
                  onError={(e) => console.error('Error al cargar PDF:', e)}
                />
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <XIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-700 font-semibold mb-1">
                  Ticket no disponible
                </p>
                <p className="text-sm text-gray-500">
                  El comprobante no se pudo generar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {invoiceData && (
        <WhatsAppSendModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          backendData={invoiceData}
          initialPhoneNumber={invoiceData.client?.phone || invoiceData.items?.[0]?.recipient_phone || ''}
          isFromInvoiceList={true}
          preferredPdfType="ticket"
        />
      )}
    </Modal>
  );
};
