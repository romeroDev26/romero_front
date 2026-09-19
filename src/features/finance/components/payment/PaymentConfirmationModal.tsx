// src/features/finance/components/payment/PaymentConfirmationModal.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  MapPin,
  Ship,
  Calendar,
  Receipt,
} from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { PaymentDetailsForm } from './PaymentDetailsForm';
import { ReceivablesItem } from '../../types/receivables.types';
import { PaymentFormData } from '../../types/payment.types';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivableItem: ReceivablesItem | null;
  onConfirm: (paymentData: PaymentFormData) => Promise<boolean>;
  isLoading?: boolean;
}

/**
 * Modal para confirmar el pago de una encomienda
 * Estilo TailAdmin: compacto, limpio, con jerarquía visual clara
 */
export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  receivableItem,
  onConfirm,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    payment_method_code: 'EFE',
    payment_operation_code: '',
    payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    is_split_payment: false,
    payment_amount_1: 0,
    payment_method_code_2: 'YAP',
    payment_operation_code_2: '',
    payment_amount_2: 0,
  });

  const [validationError, setValidationError] = useState<string>('');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfType, setSelectedPdfType] = useState<'80mm' | '58mm' | null>(null);

  const totalAmount = receivableItem ? parseFloat(receivableItem.amount) : 0;

  const handleSelectPDF = useCallback((url: string, type: '80mm' | '58mm') => {
    if (!url) return;
    setSelectedPdfUrl(url);
    setSelectedPdfType(type);
  }, []);

  const handleFormDataChange = useCallback((data: PaymentFormData) => {
    setFormData(data);
    setValidationError('');
  }, []);

  useEffect(() => {
    if (isOpen && receivableItem && !selectedPdfUrl) {
      if (receivableItem.pdf_ticket_file_path) {
        setSelectedPdfUrl(receivableItem.pdf_ticket_file_path);
        setSelectedPdfType('80mm');
      } else if (receivableItem.pdf_ticket58_file_path) {
        setSelectedPdfUrl(receivableItem.pdf_ticket58_file_path);
        setSelectedPdfType('58mm');
      }
    }
    if (!isOpen) {
      setSelectedPdfUrl(null);
      setSelectedPdfType(null);
    }
  }, [isOpen, receivableItem, selectedPdfUrl]);

  const validateForm = (): boolean => {
    if (!formData.payment_method_code) {
      setValidationError('El método de pago es obligatorio');
      return false;
    }
    if (
      (formData.payment_method_code === 'TRF' ||
       formData.payment_method_code === 'YAP' ||
       formData.payment_method_code === 'PLN') &&
      !formData.payment_operation_code.trim()
    ) {
      setValidationError('El código de operación es obligatorio para este método de pago');
      return false;
    }
    if (formData.is_split_payment) {
      if (
        (formData.payment_method_code_2 === 'TRF' ||
         formData.payment_method_code_2 === 'YAP' ||
         formData.payment_method_code_2 === 'PLN') &&
        !formData.payment_operation_code_2.trim()
      ) {
        setValidationError('El código de operación es obligatorio para el segundo método');
        return false;
      }
      const totalPaid = formData.payment_amount_1 + formData.payment_amount_2;
      if (Math.abs(totalPaid - totalAmount) > 0.01) {
        setValidationError('La suma de los pagos debe ser igual al monto total');
        return false;
      }
    }
    if (!formData.payment_date) {
      setValidationError('La fecha de pago es obligatoria');
      return false;
    }
    const selectedDate = new Date(formData.payment_date);
    if (selectedDate > new Date()) {
      setValidationError('La fecha de pago no puede ser futura');
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    const success = await onConfirm(formData);
    if (success) {
      setFormData({
        payment_method_code: 'EFE',
        payment_operation_code: '',
        payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: '',
        is_split_payment: false,
        payment_amount_1: 0,
        payment_method_code_2: 'YAP',
        payment_operation_code_2: '',
        payment_amount_2: 0,
      });
      setValidationError('');
    }
  };

  if (!receivableItem) return null;

  const hasPdfFiles = receivableItem.pdf_ticket_file_path || receivableItem.pdf_ticket58_file_path;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Pago"
      maxWidth={hasPdfFiles ? '6xl' : '3xl'}
    >
      <div className={`flex flex-col ${hasPdfFiles ? 'lg:flex-row' : ''} gap-6`}>
        {/* Panel Formulario */}
        <div className={`${hasPdfFiles ? 'lg:w-3/5' : 'w-full'} space-y-5`}>
          {/* Header compacto con número de encomienda */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                <Ship className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-dm-text-muted">Encomienda</p>
                <p className="text-lg font-bold tabular-nums text-dm-text-primary">
                  #{receivableItem.invoice_item_id}
                </p>
              </div>
            </div>
            {/* Badge de monto destacado */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-right">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Monto a cobrar</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                S/ {totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Datos clave en lista compacta */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-dm-border-secondary bg-dm-bg-secondary/50 p-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-dm-text-muted" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-dm-text-muted">Remitente</p>
                <p className="truncate text-sm font-semibold text-dm-text-primary">{receivableItem.sender_name}</p>
                <p className="text-xs text-dm-text-muted">{receivableItem.sender_document}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-dm-border-secondary bg-dm-bg-secondary/50 p-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-dm-text-muted" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-dm-text-muted">Destinatario</p>
                <p className="truncate text-sm font-semibold text-dm-text-primary">{receivableItem.recipient_name}</p>
                <p className="text-xs text-dm-text-muted">{receivableItem.recipient_document}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-dm-border-secondary bg-dm-bg-secondary/50 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-dm-text-muted" />
              <div>
                <p className="text-xs font-medium text-dm-text-muted">Ruta</p>
                <p className="text-sm font-semibold text-dm-text-primary">
                  {receivableItem.origin_port} → {receivableItem.destination_port}
                </p>
                <p className="text-xs text-dm-text-muted">Viaje #{receivableItem.trip_id}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-dm-border-secondary bg-dm-bg-secondary/50 p-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-dm-text-muted" />
              <div>
                <p className="text-xs font-medium text-dm-text-muted">Fecha de emisión</p>
                <p className="text-sm font-semibold text-dm-text-primary">
                  {format(new Date(receivableItem.issue_date), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {receivableItem.cargo_description && (
            <div className="rounded-lg border border-dm-border-secondary bg-dm-bg-secondary/50 p-3">
              <p className="text-xs font-medium text-dm-text-muted">Descripción</p>
              <p className="mt-0.5 text-sm text-dm-text-secondary">{receivableItem.cargo_description}</p>
            </div>
          )}

          {/* Selector de comprobantes */}
          {hasPdfFiles && (
            <div className="flex flex-wrap items-center gap-2">
              <Receipt className="h-4 w-4 text-dm-text-muted" />
              <span className="text-xs font-medium text-dm-text-muted">Comprobante:</span>
              {receivableItem.pdf_ticket_file_path && (
                <button
                  onClick={() => handleSelectPDF(receivableItem.pdf_ticket_file_path!, '80mm')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    selectedPdfType === '80mm'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
                  }`}
                >
                  Ticket 80mm
                </button>
              )}
              {receivableItem.pdf_ticket58_file_path && (
                <button
                  onClick={() => handleSelectPDF(receivableItem.pdf_ticket58_file_path!, '58mm')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    selectedPdfType === '58mm'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
                  }`}
                >
                  Ticket 58mm
                </button>
              )}
            </div>
          )}

          {/* Formulario de pago */}
          <div className="border-t border-dm-border-secondary pt-5">
            <h3 className="mb-3 text-sm font-semibold text-dm-text-primary">Información de Pago</h3>
            <PaymentDetailsForm
              onDataChange={handleFormDataChange}
              disabled={isLoading}
              totalAmount={totalAmount}
              currencySymbol="S/"
              customerName={receivableItem.recipient_name || receivableItem.sender_name}
            />
          </div>

          {/* Error de validación */}
          {validationError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{validationError}</p>
            </div>
          )}

          {/* Nota sutil de confirmación */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Al confirmar, se marcará esta encomienda como pagada y se registrará el pago en el sistema.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 border-t border-dm-border-secondary pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Panel PDF */}
        {hasPdfFiles && (
          <div className="lg:w-2/5">
            <div className="sticky top-4 space-y-3">
              <h3 className="text-sm font-semibold text-dm-text-primary">Vista Previa</h3>
              {selectedPdfUrl ? (
                <div className="h-[600px] overflow-hidden rounded-xl border border-dm-border-primary bg-dm-bg-primary shadow-sm lg:h-[680px]">
                  <iframe
                    src={selectedPdfUrl}
                    className="h-full w-full"
                    title={`Comprobante ${selectedPdfType}`}
                  />
                </div>
              ) : (
                <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-dm-border-primary bg-dm-bg-secondary">
                  <FileText className="mb-3 h-12 w-12 text-dm-text-muted" />
                  <p className="text-sm font-medium text-dm-text-muted">Selecciona un comprobante</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
