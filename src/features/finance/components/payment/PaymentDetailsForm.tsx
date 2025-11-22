// src/features/finance/components/payment/PaymentDetailsForm.tsx

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { PAYMENT_METHOD_OPTIONS } from '../../types/payment.types';

interface PaymentDetailsFormProps {
  onDataChange: (data: {
    payment_method_code: string;
    payment_operation_code: string;
    payment_date: string;
    notes: string;
  }) => void;
  disabled?: boolean;
}

/**
 * Formulario para capturar detalles del pago
 * Sigue el mismo patrón visual de CargoSalePage.tsx
 */
export const PaymentDetailsForm: React.FC<PaymentDetailsFormProps> = ({
  onDataChange,
  disabled = false
}) => {
  // Estados (mismo patrón que CargoSalePage)
  const [paymentMethod, setPaymentMethod] = useState("EFE");
  const [operationCode, setOperationCode] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [notes, setNotes] = useState("");

  // Notificar cambios al padre
  useEffect(() => {
    onDataChange({
      payment_method_code: paymentMethod,
      payment_operation_code: operationCode,
      payment_date: paymentDate,
      notes: notes
    });
  }, [paymentMethod, operationCode, paymentDate, notes, onDataChange]);

  return (
    <div className="space-y-4">
      {/* Método de Pago y Fecha en una fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector de Método de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de Pago *
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              // Limpiar código de operación si se selecciona efectivo
              if (e.target.value === "EFE") {
                setOperationCode("");
              }
            }}
            disabled={disabled}
            className="w-full p-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100 text-sm"
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha y Hora del Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha y Hora del Pago *
          </label>
          <input
            type="datetime-local"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            disabled={disabled}
            className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 text-sm"
          />
        </div>
      </div>

      {/* Campo de código de operación (solo para métodos diferentes a efectivo) */}
      {paymentMethod !== "EFE" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de Operación {paymentMethod === 'TRF' || paymentMethod === 'YAP' || paymentMethod === 'PLN' ? '*' : '(opcional)'}
          </label>
          <input
            type="text"
            value={operationCode}
            onChange={(e) => {
              if (e.target.value.length <= 20) {
                setOperationCode(e.target.value);
              }
            }}
            placeholder="Ingrese el código de operación..."
            className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 text-sm"
            maxLength={20}
            disabled={disabled}
          />
          <div className="text-xs text-gray-500 mt-1">
            {operationCode.length}/20 caracteres
          </div>
        </div>
      )}

      {/* Observaciones opcionales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => {
            if (e.target.value.length <= 200) {
              setNotes(e.target.value);
            }
          }}
          placeholder="Ingrese observaciones adicionales..."
          className="w-full p-2 border border-gray-300 rounded-md resize-none disabled:bg-gray-100 text-sm"
          rows={2}
          maxLength={200}
          disabled={disabled}
        />
        <div className="text-xs text-gray-500 mt-1">
          {notes.length}/200 caracteres
        </div>
      </div>
    </div>
  );
};
