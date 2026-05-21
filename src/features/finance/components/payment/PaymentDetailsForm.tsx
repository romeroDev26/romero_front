// src/features/finance/components/payment/PaymentDetailsForm.tsx

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { SplitIcon } from 'lucide-react';
import { PAYMENT_METHOD_OPTIONS, PaymentFormData } from '../../types/payment.types';

interface PaymentDetailsFormProps {
  onDataChange: (data: PaymentFormData) => void;
  disabled?: boolean;
  totalAmount?: number; // Monto total para validar pago dividido
  currencySymbol?: string;
}

/**
 * Formulario para capturar detalles del pago
 * Soporta hasta 2 metodos de pago (pago dividido)
 */
export const PaymentDetailsForm: React.FC<PaymentDetailsFormProps> = ({
  onDataChange,
  disabled = false,
  totalAmount = 0,
  currencySymbol = 'S/'
}) => {
  // Estado para activar/desactivar pago dividido
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  
  // Pago 1 (principal)
  const [paymentMethod, setPaymentMethod] = useState("EFE");
  const [operationCode, setOperationCode] = useState("");
  const [amount1, setAmount1] = useState<number>(totalAmount);
  const [amount1Display, setAmount1Display] = useState<string>(String(totalAmount));
  
  // Pago 2 (secundario)
  const [paymentMethod2, setPaymentMethod2] = useState("YAP");
  const [operationCode2, setOperationCode2] = useState("");
  const [amount2, setAmount2] = useState<number>(0);
  const [amount2Display, setAmount2Display] = useState<string>('0');
  
  // Fecha fija del sistema
  const paymentDate = format(new Date(), "yyyy-MM-dd");
  const [notes, setNotes] = useState("");

  // Monto minimo que debe tener cada parte del pago dividido
  const MIN_SPLIT_AMOUNT = 1;

  // Calcular diferencia entre total y suma de pagos
  const totalPaid = amount1 + amount2;
  const difference = totalAmount - totalPaid;
  const isValidTotal = Math.abs(difference) < 0.01;

  // Notificar cambios al padre
  useEffect(() => {
    onDataChange({
      payment_method_code: paymentMethod,
      payment_operation_code: operationCode,
      payment_date: paymentDate,
      notes: notes,
      is_split_payment: isSplitPayment,
      payment_amount_1: isSplitPayment ? amount1 : totalAmount,
      payment_method_code_2: paymentMethod2,
      payment_operation_code_2: operationCode2,
      payment_amount_2: isSplitPayment ? amount2 : 0,
    });
  }, [paymentMethod, operationCode, paymentDate, notes, isSplitPayment, amount1, amount2, paymentMethod2, operationCode2, totalAmount, onDataChange]);

  // Actualizar amount1 cuando cambia el total y no es pago dividido
  useEffect(() => {
    if (!isSplitPayment) {
      setAmount1(totalAmount);
      setAmount1Display(String(totalAmount));
      setAmount2(0);
      setAmount2Display('0');
    }
  }, [totalAmount, isSplitPayment]);

  // Limpiar codigo de operacion cuando se cambia a efectivo
  useEffect(() => {
    if (paymentMethod === 'EFE') {
      setOperationCode('');
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (paymentMethod2 === 'EFE') {
      setOperationCode2('');
    }
  }, [paymentMethod2]);

  // Manejar cambio en monto 1
  const handleAmount1Change = (value: string) => {
    setAmount1Display(value);
    const numValue = parseFloat(value) || 0;
    // En pago dividido, el maximo es totalAmount - MIN_SPLIT_AMOUNT para dejar espacio al otro pago
    const maxValue = isSplitPayment ? totalAmount - MIN_SPLIT_AMOUNT : totalAmount;
    const clampedValue = Math.min(Math.max(0, numValue), Math.max(0, maxValue));
    setAmount1(clampedValue);
    const newAmount2 = Math.max(0, totalAmount - clampedValue);
    setAmount2(newAmount2);
    setAmount2Display(String(newAmount2));
    
    // Si el valor ingresado supera el maximo permitido, corregir el display
    if (numValue > maxValue && maxValue >= 0) {
      setAmount1Display(String(clampedValue));
    }
  };

  // Manejar cambio en monto 2
  const handleAmount2Change = (value: string) => {
    setAmount2Display(value);
    const numValue = parseFloat(value) || 0;
    // En pago dividido, el maximo es totalAmount - MIN_SPLIT_AMOUNT para dejar espacio al otro pago
    const maxValue = isSplitPayment ? totalAmount - MIN_SPLIT_AMOUNT : totalAmount;
    const clampedValue = Math.min(Math.max(0, numValue), Math.max(0, maxValue));
    setAmount2(clampedValue);
    const newAmount1 = Math.max(0, totalAmount - clampedValue);
    setAmount1(newAmount1);
    setAmount1Display(String(newAmount1));
    
    // Si el valor ingresado supera el maximo permitido, corregir el display
    if (numValue > maxValue && maxValue >= 0) {
      setAmount2Display(String(clampedValue));
    }
  };

  // Manejar focus en campo de monto (limpiar para edicion)
  const handleAmountFocus = (currentValue: number, setDisplay: (val: string) => void) => {
    // Limpiar el campo para permitir edicion directa
    if (currentValue <= MIN_SPLIT_AMOUNT) {
      setDisplay('');
    }
  };

  // Prevenir cambio de valor con scroll del mouse en inputs numericos
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
    e.preventDefault();
  };

  // Manejar blur en campo de monto (asegurar minimo de 1 en pago dividido)
  const handleAmount1Blur = () => {
    if (amount1Display === '' || parseFloat(amount1Display) < MIN_SPLIT_AMOUNT) {
      // En pago dividido, asegurar minimo de 1
      if (isSplitPayment) {
        setAmount1(MIN_SPLIT_AMOUNT);
        setAmount1Display(String(MIN_SPLIT_AMOUNT));
        const newAmount2 = Math.max(MIN_SPLIT_AMOUNT, totalAmount - MIN_SPLIT_AMOUNT);
        setAmount2(newAmount2);
        setAmount2Display(String(newAmount2));
      } else {
        setAmount1Display(String(amount1));
      }
    }
  };

  const handleAmount2Blur = () => {
    if (amount2Display === '' || parseFloat(amount2Display) < MIN_SPLIT_AMOUNT) {
      // En pago dividido, asegurar minimo de 1
      if (isSplitPayment) {
        setAmount2(MIN_SPLIT_AMOUNT);
        setAmount2Display(String(MIN_SPLIT_AMOUNT));
        const newAmount1 = Math.max(MIN_SPLIT_AMOUNT, totalAmount - MIN_SPLIT_AMOUNT);
        setAmount1(newAmount1);
        setAmount1Display(String(newAmount1));
      } else {
        setAmount2Display(String(amount2));
      }
    }
  };

  // Toggle pago dividido
  const handleToggleSplitPayment = () => {
    if (!isSplitPayment) {
      const halfAmount = Math.floor(totalAmount / 2);
      const otherHalf = totalAmount - halfAmount;
      setAmount1(halfAmount);
      setAmount1Display(String(halfAmount));
      setAmount2(otherHalf);
      setAmount2Display(String(otherHalf));
    } else {
      setAmount1(totalAmount);
      setAmount1Display(String(totalAmount));
      setAmount2(0);
      setAmount2Display('0');
      setPaymentMethod2('YAP');
      setOperationCode2('');
    }
    setIsSplitPayment(!isSplitPayment);
  };

  // Verificar si un metodo requiere codigo de operacion
  const requiresOperationCode = (method: string) => {
    return method === 'TRF' || method === 'YAP' || method === 'PLN';
  };

  return (
    <div className="space-y-4">
      {/* Toggle para activar pago dividido */}
      {totalAmount > 0 && (
        <div className="flex items-center justify-between p-3 bg-dm-bg-secondary rounded-lg border border-dm-border-primary">
          <div className="flex items-center space-x-2">
            <SplitIcon className="w-5 h-5 text-dm-text-secondary" />
            <div>
              <p className="text-sm font-medium text-dm-text-secondary">Pago Dividido</p>
              <p className="text-xs text-dm-text-muted">Dividir el pago en 2 metodos</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isSplitPayment}
            onClick={handleToggleSplitPayment}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSplitPayment ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-dm-bg-primary shadow-md transition-transform duration-200 ease-in-out ${
                isSplitPayment ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {/* Pago 1 (Principal) */}
      <div className={`p-4 rounded-lg border ${isSplitPayment ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200' : 'bg-dm-bg-secondary border-dm-border-primary'}`}>
        <h4 className="text-sm font-medium text-dm-text-secondary mb-3">
          {isSplitPayment ? 'Pago 1 (Principal)' : 'Metodo de Pago'}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Selector de metodo */}
          <div>
            <label className="block text-xs font-medium text-dm-text-secondary mb-1">
              Metodo *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={disabled}
              className="w-full p-2 border border-dm-border-primary rounded-md bg-dm-bg-primary disabled:bg-dm-bg-secondary text-sm"
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Monto (solo visible en pago dividido) */}
          {isSplitPayment && (
            <div>
              <label className="block text-xs font-medium text-dm-text-secondary mb-1">
                Monto
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dm-text-muted text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={amount1Display}
                  onChange={(e) => handleAmount1Change(e.target.value)}
                  onFocus={() => handleAmountFocus(amount1, setAmount1Display)}
                  onBlur={handleAmount1Blur}
                  onWheel={handleWheel}
                  disabled={disabled}
                  className="w-full p-2 pl-8 border border-dm-border-primary rounded-md disabled:bg-dm-bg-secondary text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Codigo de operacion (si aplica) */}
        {paymentMethod !== 'EFE' && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-dm-text-secondary mb-1">
              Codigo de Operacion {requiresOperationCode(paymentMethod) ? '*' : '(opcional)'}
            </label>
            <input
              type="text"
              value={operationCode}
              onChange={(e) => {
                if (e.target.value.length <= 20) {
                  setOperationCode(e.target.value);
                }
              }}
              placeholder="Ingrese el codigo..."
              disabled={disabled}
              className="w-full p-2 border border-dm-border-primary rounded-md disabled:bg-dm-bg-secondary text-sm"
              maxLength={20}
            />
            <div className="text-xs text-dm-text-muted mt-1">
              {operationCode.length}/20 caracteres
            </div>
          </div>
        )}
      </div>

      {/* Pago 2 (Secundario) - Solo visible en pago dividido */}
      {isSplitPayment && (
        <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200">
          <h4 className="text-sm font-medium text-dm-text-secondary mb-3">
            Pago 2 (Secundario)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Selector de metodo */}
            <div>
              <label className="block text-xs font-medium text-dm-text-secondary mb-1">
                Metodo
              </label>
              <select
                value={paymentMethod2}
                onChange={(e) => setPaymentMethod2(e.target.value)}
                disabled={disabled}
                className="w-full p-2 border border-dm-border-primary rounded-md bg-dm-bg-primary disabled:bg-dm-bg-secondary text-sm"
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs font-medium text-dm-text-secondary mb-1">
                Monto
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dm-text-muted text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={amount2Display}
                  onChange={(e) => handleAmount2Change(e.target.value)}
                  onFocus={() => handleAmountFocus(amount2, setAmount2Display)}
                  onBlur={handleAmount2Blur}
                  onWheel={handleWheel}
                  disabled={disabled}
                  className="w-full p-2 pl-8 border border-dm-border-primary rounded-md disabled:bg-dm-bg-secondary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Codigo de operacion (si aplica) */}
          {paymentMethod2 !== 'EFE' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-dm-text-secondary mb-1">
                Codigo de Operacion {requiresOperationCode(paymentMethod2) ? '*' : '(opcional)'}
              </label>
              <input
                type="text"
                value={operationCode2}
                onChange={(e) => {
                  if (e.target.value.length <= 20) {
                    setOperationCode2(e.target.value);
                  }
                }}
                placeholder="Ingrese el codigo..."
                disabled={disabled}
                className="w-full p-2 border border-dm-border-primary rounded-md disabled:bg-dm-bg-secondary text-sm"
                maxLength={20}
              />
              <div className="text-xs text-dm-text-muted mt-1">
                {operationCode2.length}/20 caracteres
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumen de totales (solo en pago dividido) */}
      {isSplitPayment && totalAmount > 0 && (
        <div className={`p-3 rounded-lg border ${isValidTotal ? 'bg-dm-bg-secondary border-dm-border-primary' : 'bg-red-50 dark:bg-red-950/30 border-red-200'}`}>
          <div className="flex justify-between items-center text-sm">
            <span className="text-dm-text-secondary">Total a pagar:</span>
            <span className="font-semibold">{currencySymbol} {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-dm-text-secondary">Suma de pagos:</span>
            <span className={`font-semibold ${isValidTotal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {currencySymbol} {totalPaid.toFixed(2)}
            </span>
          </div>
          {!isValidTotal && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              {difference > 0 
                ? `Faltan ${currencySymbol} ${difference.toFixed(2)} por asignar`
                : `Excede en ${currencySymbol} ${Math.abs(difference).toFixed(2)}`
              }
            </div>
          )}
        </div>
      )}

      {/* Fecha del Pago */}
      <div>
        <label className="block text-sm font-medium text-dm-text-secondary mb-1">
          Fecha del Pago
        </label>
        <input
          type="date"
          value={paymentDate}
          disabled
          readOnly
          className="w-full p-2 border border-dm-border-primary rounded-md bg-dm-bg-secondary cursor-not-allowed text-sm"
        />
        <p className="text-xs text-dm-text-muted mt-1">
          Fecha actual del sistema
        </p>
      </div>

      {/* Observaciones opcionales */}
      <div>
        <label className="block text-sm font-medium text-dm-text-secondary mb-1">
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
          className="w-full p-2 border border-dm-border-primary rounded-md resize-none disabled:bg-dm-bg-secondary text-sm"
          rows={2}
          maxLength={200}
          disabled={disabled}
        />
        <div className="text-xs text-dm-text-muted mt-1">
          {notes.length}/200 caracteres
        </div>
      </div>
    </div>
  );
};