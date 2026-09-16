// src/features/finance/components/payment/PaidTicketModal.tsx

import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  MessageCircle,
  X,
  FileText,
  Receipt,
  CreditCard,
  Calendar,
  Hash,
} from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';
import { Spinner } from '../../../../components/common/Spinner';
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
 * Estilo TailAdmin: limpio, compacto, con jerarquía visual clara
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

  const basePdfUrl = paymentData.pdf_ticket_file_path || paymentData.pdf_ticket58_file_path;
  const ticketType = paymentData.pdf_ticket_file_path ? '80mm' : '58mm';
  const cacheBuster = new Date().getTime();
  const pdfUrl = basePdfUrl ? `${basePdfUrl}?v=${cacheBuster}` : null;

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
      setInvoiceError(error?.message || 'No se pudo cargar la factura');
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
      <div className="flex flex-col gap-5 lg:flex-row" style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}>
        {/* Panel Izquierdo - Info + Acciones */}
        <div className="flex w-full flex-col gap-4 lg:w-80">
          {/* Mensaje de éxito */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Pago Confirmado</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Encomienda pagada exitosamente</p>
            </div>
          </div>

          {/* Detalles del comprobante */}
          <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-dm-border-primary bg-dm-bg-primary p-4 shadow-sm">
            {/* Número de comprobante */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-dm-text-muted">Comprobante</p>
                <p className="text-base font-bold tabular-nums text-dm-text-primary">
                  {paymentData.series}-{String(paymentData.number).padStart(8, '0')}
                </p>
              </div>
            </div>

            {/* Monto Total destacado */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Monto Total</p>
              <p className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                S/ {parseFloat(paymentData.total_payable).toFixed(2)}
              </p>
            </div>

            {/* Método de pago */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dm-bg-secondary">
                <CreditCard className="h-4 w-4 text-dm-text-muted" />
              </div>
              <div>
                <p className="text-xs font-medium text-dm-text-muted">Método de Pago</p>
                <p className="text-sm font-semibold text-dm-text-primary">
                  {paymentData.payment_method_code}
                </p>
                {paymentData.payment_operation_code && (
                  <p className="text-xs tabular-nums text-dm-text-muted">
                    {paymentData.payment_operation_code}
                  </p>
                )}
              </div>
            </div>

            {/* Fecha */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dm-bg-secondary">
                <Calendar className="h-4 w-4 text-dm-text-muted" />
              </div>
              <div>
                <p className="text-xs font-medium text-dm-text-muted">Fecha y Hora</p>
                <p className="text-sm font-medium tabular-nums text-dm-text-primary">
                  {new Date(paymentData.confirmed_at).toLocaleString('es-PE', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>

            {/* Pago dividido */}
            {paymentData.payment_method_code_2 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3">
                <p className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Pago Dividido</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-dm-text-secondary">{paymentData.payment_method_code}</span>
                    <span className="font-semibold tabular-nums text-dm-text-primary">
                      S/ {parseFloat(paymentData.payment_amount_1 || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dm-text-secondary">{paymentData.payment_method_code_2}</span>
                    <span className="font-semibold tabular-nums text-dm-text-primary">
                      S/ {parseFloat(paymentData.payment_amount_2 || '0').toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="space-y-2">
            {/* WhatsApp */}
            <button
              onClick={handleOpenWhatsApp}
              disabled={isLoadingInvoice}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoadingInvoice ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Cargando...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </>
              )}
            </button>

            {invoiceError && (
              <p className="text-center text-xs text-red-500 dark:text-red-400">{invoiceError}</p>
            )}

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </div>
        </div>

        {/* Panel Derecho - Ticket PDF */}
        <div className="flex min-w-0 flex-1 flex-col">
          {pdfUrl ? (
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-dm-border-primary bg-dm-bg-primary shadow-sm">
              <div className="flex items-center justify-between border-b border-dm-border-primary bg-dm-bg-secondary px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-dm-text-muted" />
                  <span className="text-sm font-semibold text-dm-text-secondary">
                    Ticket de Pago
                  </span>
                  <span className="rounded-full bg-dm-bg-secondary px-2 py-0.5 text-[10px] font-bold text-dm-text-secondary">
                    {ticketType}
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-dm-bg-secondary">
                <iframe
                  src={pdfUrl}
                  className="h-full w-full border-0"
                  title="Ticket de Pago"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-dm-border-primary bg-dm-bg-secondary">
              <FileText className="mb-3 h-14 w-14 text-dm-text-muted" />
              <p className="text-sm font-medium text-dm-text-muted">Ticket no disponible</p>
              <p className="text-xs text-dm-text-muted">El comprobante no se pudo generar</p>
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
