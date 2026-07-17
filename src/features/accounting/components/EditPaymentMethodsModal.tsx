// src/features/accounting/components/EditPaymentMethodsModal.tsx

import React, { useState, useEffect } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/common/Modal';
import { invoicesService } from '../../../services/invoices.service';
import { SplitPaymentForm, SplitPaymentData } from '../../../components/common/SplitPaymentForm';
import { splitPaymentDataToPaymentMethods } from '../../../utils/invoicePaymentMapper';
import { getCurrencySymbol } from '../../../utils/currency';
import { Spinner } from '../../../components/common/Spinner';

interface EditPaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: number;
  invoiceSeries: string;
  invoiceNumber: number;
  totalPayable: number;
  currencyCode: string;
  initialPaymentData: SplitPaymentData;
}

export const EditPaymentMethodsModal: React.FC<EditPaymentMethodsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  invoiceSeries,
  invoiceNumber,
  totalPayable,
  currencyCode,
  initialPaymentData,
}) => {
  const queryClient = useQueryClient();
  const [paymentData, setPaymentData] = useState<SplitPaymentData>(initialPaymentData);
  const [isValid, setIsValid] = useState(false);

  // Sincronizar estado interno cuando se abre el modal con nuevos datos
  useEffect(() => {
    if (isOpen) {
      setPaymentData(initialPaymentData);
    }
  }, [isOpen, initialPaymentData]);

  const updateMutation = useMutation({
    mutationFn: (data: SplitPaymentData) =>
      invoicesService.updatePaymentMethods(invoiceId, {
        payment_methods: splitPaymentDataToPaymentMethods(data),
      }),
    onSuccess: () => {
      toast.success('Métodos de pago actualizados correctamente');
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = axiosError?.response?.data?.detail || axiosError?.message || 'Error al actualizar los métodos de pago';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = () => {
    if (!isValid) {
      toast.warn('La suma de los pagos debe ser igual al total de la venta');
      return;
    }
    updateMutation.mutate(paymentData);
  };

  // No permitir cerrar mientras se está guardando
  const handleClose = () => {
    if (updateMutation.isPending) return;
    onClose();
  };

  const currencySymbol = getCurrencySymbol(currencyCode);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Métodos de Pago"
      maxWidth="lg"
    >
      {/* Datos del comprobante */}
      <div className="flex items-center gap-3 mb-4">
        <CreditCardIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
        <p className="text-sm text-dm-text-muted">
          {invoiceSeries}-{String(invoiceNumber).padStart(8, '0')} • Total: {currencySymbol} {totalPayable.toFixed(2)}
        </p>
      </div>

      {/* Aviso: solo control interno */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Este cambio es solo para control interno. No modifica el comprobante emitido ni afecta SUNAT.
        </p>
      </div>

      <SplitPaymentForm
        key={JSON.stringify(initialPaymentData)}
        totalAmount={totalPayable}
        currencySymbol={currencySymbol}
        disabled={updateMutation.isPending}
        onPaymentDataChange={setPaymentData}
        onValidationChange={setIsValid}
        initialData={initialPaymentData}
      />

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-dm-border-primary">
        <button
          onClick={handleClose}
          className="px-5 py-2.5 text-dm-text-secondary bg-dm-bg-primary border border-dm-border-primary rounded-lg hover:bg-dm-bg-hover transition-colors font-medium"
          disabled={updateMutation.isPending}
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={!isValid || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Spinner size="sm" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar cambios</span>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default EditPaymentMethodsModal;
