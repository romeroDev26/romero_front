// src/features/finance/components/payment/PaymentConfirmationModal.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircleIcon, AlertTriangleIcon, FileTextIcon } from 'lucide-react';
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
  onConfirm: (paymentData: Omit<PaymentFormData, 'notes'> & { notes?: string }) => Promise<boolean>;
  isLoading?: boolean;
}

/**
 * Modal para confirmar el pago de una encomienda
 * Muestra detalles de la encomienda y formulario de pago
 */
export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  receivableItem,
  onConfirm,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    payment_method_code: 'EFE',
    payment_operation_code: '',
    payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });

  const [validationError, setValidationError] = useState<string>('');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfType, setSelectedPdfType] = useState<'80mm' | '58mm' | null>(null);

  // Seleccionar PDF para preview
  const handleSelectPDF = useCallback((url: string, type: '80mm' | '58mm') => {
    if (!url) {
      console.warn(`No hay URL disponible para el comprobante ${type}`);
      return;
    }
    setSelectedPdfUrl(url);
    setSelectedPdfType(type);
  }, []);

  // Manejar cambios en el formulario
  const handleFormDataChange = useCallback((data: PaymentFormData) => {
    setFormData(data);
    setValidationError(''); // Limpiar errores al cambiar datos
  }, []);

  // Seleccionar automáticamente el primer PDF disponible cuando se abre el modal
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
    // Limpiar selección cuando se cierra el modal
    if (!isOpen) {
      setSelectedPdfUrl(null);
      setSelectedPdfType(null);
    }
  }, [isOpen, receivableItem, selectedPdfUrl]);

  // Validar formulario antes de confirmar
  const validateForm = (): boolean => {
    // Método de pago es obligatorio (siempre tiene valor por defecto)
    if (!formData.payment_method_code) {
      setValidationError('El método de pago es obligatorio');
      return false;
    }

    // Código de operación obligatorio para ciertos métodos
    if (
      (formData.payment_method_code === 'TRF' || 
       formData.payment_method_code === 'YAP' || 
       formData.payment_method_code === 'PLN') &&
      !formData.payment_operation_code.trim()
    ) {
      setValidationError('El código de operación es obligatorio para este método de pago');
      return false;
    }

    // Fecha es obligatoria
    if (!formData.payment_date) {
      setValidationError('La fecha de pago es obligatoria');
      return false;
    }

    // Fecha no puede ser futura
    const selectedDate = new Date(formData.payment_date);
    const now = new Date();
    if (selectedDate > now) {
      setValidationError('La fecha de pago no puede ser futura');
      return false;
    }

    return true;
  };

  // Manejar confirmación
  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

    const success = await onConfirm({
      payment_method_code: formData.payment_method_code,
      payment_operation_code: formData.payment_operation_code,
      payment_date: formData.payment_date,
      notes: formData.notes || undefined
    });

    if (success) {
      // Resetear formulario
      setFormData({
        payment_method_code: 'EFE',
        payment_operation_code: '',
        payment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        notes: ''
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
      title="Confirmar Pago de Encomienda"
      maxWidth={hasPdfFiles ? "6xl" : "2xl"}
    >
      <div className={`flex flex-col ${hasPdfFiles ? 'lg:flex-row' : ''} gap-6`}>
        {/* Panel izquierdo - Formulario de confirmación */}
        <div className={`${hasPdfFiles ? 'lg:w-1/2' : 'w-full'} space-y-6`}>
        {/* Detalles de la encomienda */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detalles de la Encomienda #{receivableItem.invoice_item_id}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Remitente */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Remitente</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">{receivableItem.sender_name}</p>
                <p>DNI/RUC: {receivableItem.sender_document}</p>
              </div>
            </div>
            
            {/* Destinatario */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Destinatario</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">{receivableItem.recipient_name}</p>
                <p>DNI/RUC: {receivableItem.recipient_document}</p>
              </div>
            </div>
            
            {/* Viaje */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Viaje</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Viaje #{receivableItem.trip_id}</p>
                <p>{receivableItem.origin_port} → {receivableItem.destination_port}</p>
              </div>
            </div>
            
            {/* Monto */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Monto a Cobrar</h4>
              <div className="text-2xl font-bold text-green-600">
                S/ {parseFloat(receivableItem.amount).toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Descripción */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Descripción</h4>
            <p className="text-sm text-gray-600">{receivableItem.cargo_description}</p>
          </div>

          {/* Fecha de emisión */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Fecha de Emisión</h4>
            <p className="text-sm text-gray-600">
              {format(new Date(receivableItem.issue_date), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>

          {/* Preview de Comprobantes */}
          {(receivableItem.pdf_ticket_file_path || receivableItem.pdf_ticket58_file_path) && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-3">Seleccionar Comprobante</h4>
              <div className="flex flex-wrap gap-3">
                {receivableItem.pdf_ticket_file_path && (
                  <Button
                    variant={selectedPdfType === '80mm' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectPDF(receivableItem.pdf_ticket_file_path!, '80mm')}
                    className="flex items-center"
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Ticket 80mm
                  </Button>
                )}
                {receivableItem.pdf_ticket58_file_path && (
                  <Button
                    variant={selectedPdfType === '58mm' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectPDF(receivableItem.pdf_ticket58_file_path!, '58mm')}
                    className="flex items-center"
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Ticket 58mm
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Selecciona un formato para ver la vista previa
              </p>
            </div>
          )}
        </div>

        {/* Formulario de pago */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Información de Pago
          </h3>
          <PaymentDetailsForm
            onDataChange={handleFormDataChange}
            disabled={isLoading}
          />
        </div>

        {/* Mensaje de validación */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangleIcon className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          </div>
        )}

        {/* Mensaje de advertencia */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Confirmar Pago
              </h4>
              <p className="text-sm text-yellow-700">
                ¿Está seguro de que desea marcar esta encomienda como pagada? 
                Esta acción confirmará que el cliente ha pagado el monto de{' '}
                <span className="font-semibold">S/ {parseFloat(receivableItem.amount).toFixed(2)}</span>
                {' '}y que la encomienda ha sido entregada correctamente.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Confirmar Pago
              </>
            )}
          </Button>
        </div>
        </div>

        {/* Panel derecho - Vista previa del PDF */}
        {hasPdfFiles && (
          <div className="lg:w-1/2 flex flex-col">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vista Previa del Comprobante
              </h3>
              
              {selectedPdfUrl ? (
                <div className="h-[600px] lg:h-[700px] border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={selectedPdfUrl}
                    className="w-full h-full"
                    title={`Comprobante ${selectedPdfType}`}
                  />
                </div>
              ) : (
                <div className="h-[600px] lg:h-[700px] border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Sin vista previa</p>
                    <p className="text-sm">
                      Selecciona un formato de comprobante<br />
                      para ver la vista previa
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
