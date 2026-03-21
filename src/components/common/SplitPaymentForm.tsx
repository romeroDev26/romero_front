// src/components/common/SplitPaymentForm.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SplitIcon, AlertCircle, CreditCard } from 'lucide-react';
import { 
  validateSplitPayment, 
  canEnableSplitPayment,
  requiresOperationCode as checkRequiresOperationCode 
} from '../../utils/splitPaymentValidation';

/**
 * Opciones estandar de metodos de pago
 */
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'EFE', label: 'Efectivo' },
  { value: 'TRF', label: 'Transferencia Bancaria' },
  { value: 'YAP', label: 'Yape' },
  { value: 'PLN', label: 'Plin' },
  { value: 'DEP', label: 'Deposito en Cuenta' },
  { value: 'OTR', label: 'Otros' },
];

/**
 * Datos del pago dividido
 */
export interface SplitPaymentData {
  isSplitPayment: boolean;
  // Pago 1 (principal)
  paymentMethod1: string;
  operationCode1: string;
  amount1: number;
  // Pago 2 (secundario)
  paymentMethod2: string;
  operationCode2: string;
  amount2: number;
}

interface SplitPaymentFormProps {
  totalAmount: number;
  currencySymbol?: string;
  disabled?: boolean;
  onPaymentDataChange: (data: SplitPaymentData) => void;
  // Callback para notificar el estado de validacion al padre
  onValidationChange?: (isValid: boolean) => void;
  // Props para modo controlado (opcional)
  initialData?: Partial<SplitPaymentData>;
  /** UI alineada al mock de billing (POS fluvial) */
  variant?: 'default' | 'billing';
}

/**
 * Componente reutilizable para manejo de pagos divididos
 * Permite seleccionar hasta 2 metodos de pago diferentes
 */
export const SplitPaymentForm: React.FC<SplitPaymentFormProps> = ({
  totalAmount,
  currencySymbol = 'S/',
  disabled = false,
  onPaymentDataChange,
  onValidationChange,
  initialData,
  variant = 'default',
}) => {
  const isBilling = variant === 'billing';

  const selectBillingClass =
    'w-full min-w-0 bg-gray-100 border-0 rounded-lg py-3 pl-4 pr-11 text-sm text-gray-900 appearance-none focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed';
  const selectDefaultClass =
    'w-full p-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100 text-sm';
  const selectClass = isBilling ? selectBillingClass : selectDefaultClass;

  const opInputBillingClass =
    'w-full py-2.5 px-4 bg-gray-100 border-0 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-60';
  const opInputDefaultClass =
    'w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 text-sm';
  const opInputClass = isBilling ? opInputBillingClass : opInputDefaultClass;

  const amountNumClass = isBilling
    ? 'w-full py-2.5 pl-8 pr-4 bg-gray-100 border-0 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-60'
    : 'w-full p-2 pl-8 border border-gray-300 rounded-md disabled:bg-gray-100 text-sm';

  const splitPanel1Class = isBilling
    ? 'p-4 rounded-xl border border-sky-100 bg-sky-50/40'
    : 'p-4 rounded-lg border bg-blue-50 border-blue-200';
  const splitPanel2Class = isBilling
    ? 'p-4 rounded-xl border border-emerald-100 bg-emerald-50/40'
    : 'p-4 rounded-lg border bg-green-50 border-green-200';
  // Estado para activar/desactivar pago dividido
  const [isSplitPayment, setIsSplitPayment] = useState(initialData?.isSplitPayment ?? false);
  
  // Pago 1 (principal)
  const [paymentMethod1, setPaymentMethod1] = useState(initialData?.paymentMethod1 ?? 'EFE');
  const [operationCode1, setOperationCode1] = useState(initialData?.operationCode1 ?? '');
  const [amount1, setAmount1] = useState<number>(initialData?.amount1 ?? totalAmount);
  const [amount1Display, setAmount1Display] = useState<string>(String(initialData?.amount1 ?? totalAmount));
  
  // Pago 2 (secundario)
  const [paymentMethod2, setPaymentMethod2] = useState(initialData?.paymentMethod2 ?? 'YAP');
  const [operationCode2, setOperationCode2] = useState(initialData?.operationCode2 ?? '');
  const [amount2, setAmount2] = useState<number>(initialData?.amount2 ?? 0);
  const [amount2Display, setAmount2Display] = useState<string>(String(initialData?.amount2 ?? 0));

  // Calcular diferencia entre total y suma de pagos
  const totalPaid = amount1 + amount2;
  const difference = totalAmount - totalPaid;
  const isValidTotal = Math.abs(difference) < 0.01; // Tolerancia de 1 centavo

  // Verificar si se puede habilitar el pago dividido (necesita precio valido)
  const canEnable = canEnableSplitPayment(totalAmount);

  // Validar el pago actual
  const validation = useMemo(() => {
    return validateSplitPayment({
      isSplitPayment,
      paymentMethod1,
      operationCode1,
      amount1,
      paymentMethod2,
      operationCode2,
      amount2,
    }, totalAmount);
  }, [isSplitPayment, paymentMethod1, operationCode1, amount1, paymentMethod2, operationCode2, amount2, totalAmount]);

  // Notificar estado de validacion al padre
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation.isValid);
    }
  }, [validation.isValid, onValidationChange]);

  // Notificar cambios al padre
  const notifyChange = useCallback(() => {
    onPaymentDataChange({
      isSplitPayment,
      paymentMethod1,
      operationCode1,
      amount1: isSplitPayment ? amount1 : totalAmount,
      paymentMethod2,
      operationCode2,
      amount2: isSplitPayment ? amount2 : 0,
    });
  }, [isSplitPayment, paymentMethod1, operationCode1, amount1, paymentMethod2, operationCode2, amount2, totalAmount, onPaymentDataChange]);

  useEffect(() => {
    notifyChange();
  }, [notifyChange]);

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
    if (paymentMethod1 === 'EFE') {
      setOperationCode1('');
    }
  }, [paymentMethod1]);

  useEffect(() => {
    if (paymentMethod2 === 'EFE') {
      setOperationCode2('');
    }
  }, [paymentMethod2]);

  // Monto minimo que debe quedar para el otro pago en pago dividido
  const MIN_SPLIT_AMOUNT = 1; // Minimo 1 sol para cada parte

  // Manejar cambio en monto 1 (ajusta automaticamente monto 2)
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

  // Manejar cambio en monto 2 (ajusta automaticamente monto 1)
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

  // Manejar focus en campo de monto (limpiar si es 0)
  const handleAmountFocus = (currentValue: number, setDisplay: (val: string) => void) => {
    if (currentValue === 0) {
      setDisplay('');
    }
  };

  // Prevenir cambio de valor con scroll del mouse en inputs numericos
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  // Manejar blur en campo de monto (restaurar valor si esta vacio)
  const handleAmount1Blur = () => {
    if (amount1Display === '') {
      setAmount1Display(String(amount1));
    }
  };

  const handleAmount2Blur = () => {
    if (amount2Display === '') {
      setAmount2Display(String(amount2));
    }
  };

  // Toggle pago dividido
  const handleToggleSplitPayment = () => {
    // No permitir activar si no hay precio valido
    if (!canEnable) {
      return;
    }
    
    if (!isSplitPayment) {
      // Activar pago dividido: dividir el total en 2
      const halfAmount = Math.floor(totalAmount / 2);
      const otherHalf = totalAmount - halfAmount;
      setAmount1(halfAmount);
      setAmount1Display(String(halfAmount));
      setAmount2(otherHalf);
      setAmount2Display(String(otherHalf));
    } else {
      // Desactivar pago dividido: todo al metodo 1
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
    return checkRequiresOperationCode(method);
  };

  return (
    <div className="space-y-4">
      {/* Alerta si no hay precio valido */}
      {!canEnable && (
        <div
          className={`flex items-center bg-amber-50 border border-amber-200 rounded-lg ${
            isBilling ? 'p-2.5' : 'p-3'
          }`}
        >
          <AlertCircle
            className={`text-amber-600 mr-2 flex-shrink-0 ${isBilling ? 'w-4 h-4' : 'w-5 h-5'}`}
          />
          <p className={isBilling ? 'text-xs text-amber-800' : 'text-sm text-amber-700'}>
            Seleccione un viaje con precio válido para configurar el pago
          </p>
        </div>
      )}

      {/* Pago Completo (solo visible cuando NO es pago dividido) */}
      {!isSplitPayment && (
        <div
          className={
            isBilling ? 'space-y-3' : 'p-4 rounded-lg border bg-gray-50 border-gray-200'
          }
        >
          <div className={isBilling ? 'space-y-3' : 'space-y-3'}>
            {/* Selector de metodo */}
            <div>
              {!isBilling && (
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Método de Pago
                </label>
              )}
              <div className="relative isolate">
                <select
                  value={paymentMethod1}
                  onChange={(e) => setPaymentMethod1(e.target.value)}
                  disabled={disabled || !canEnable}
                  className={selectClass}
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isBilling && (
                  <span
                    className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg border-l border-gray-200/60 bg-gray-100/95"
                    aria-hidden
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-gray-500" />
                  </span>
                )}
              </div>
            </div>

            {/* Codigo de operacion (si aplica) */}
            {paymentMethod1 !== 'EFE' && (
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1 ml-0.5">
                  Código de operación {requiresOperationCode(paymentMethod1) ? '*' : '(opc.)'}
                </label>
                <input
                  type="text"
                  value={operationCode1}
                  onChange={(e) => {
                    if (e.target.value.length <= 20) {
                      setOperationCode1(e.target.value);
                    }
                  }}
                  placeholder="Ingrese el código..."
                  disabled={disabled}
                  className={opInputClass}
                  maxLength={20}
                />
                <div className="text-[10px] text-gray-500 mt-1">
                  {operationCode1.length}/20 caracteres
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle para activar pago dividido */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg ${
          isBilling
            ? !canEnable
              ? 'bg-gray-100/80 opacity-60'
              : isSplitPayment
                ? 'bg-blue-50/80'
                : 'bg-gray-100'
            : `border ${
                !canEnable
                  ? 'bg-gray-100 border-gray-200 opacity-60'
                  : isSplitPayment
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
              }`
        }`}
      >
        <div className={`flex items-center ${isBilling ? 'gap-0' : 'space-x-2'}`}>
          {!isBilling && (
            <SplitIcon className={`w-5 h-5 ${isSplitPayment ? 'text-blue-600' : 'text-gray-600'}`} />
          )}
          <div className="flex flex-col">
            <p
              className={`${isBilling ? 'text-sm font-semibold text-gray-900' : `text-sm font-medium ${isSplitPayment ? 'text-blue-700' : 'text-gray-700'}`}`}
            >
              Pago Dividido
            </p>
            <p
              className={
                isBilling ? 'text-[10px] text-gray-500' : 'text-xs text-gray-500'
              }
            >
              {canEnable
                ? isSplitPayment
                  ? 'Dividiendo el pago en 2 métodos'
                  : 'Permitir múltiples métodos'
                : 'Requiere un precio válido'}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isSplitPayment}
          onClick={handleToggleSplitPayment}
          disabled={disabled || !canEnable}
          className={
            isBilling
              ? `relative shrink-0 h-5 w-10 cursor-pointer rounded-full border-0 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSplitPayment ? 'bg-primary' : 'bg-gray-300'
                }`
              : `relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSplitPayment ? 'bg-blue-600' : 'bg-gray-300'
                }`
          }
        >
          {isBilling ? (
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                isSplitPayment ? 'translate-x-[18px]' : 'translate-x-0'
              }`}
            />
          ) : (
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                isSplitPayment ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          )}
        </button>
      </div>

      {/* Pago 1 (Principal) - Solo visible en pago dividido */}
      {isSplitPayment && (
        <div className={splitPanel1Class}>
          <h4
            className={`mb-3 flex items-center text-sm font-medium ${
              isBilling ? 'text-sky-900' : 'text-blue-700'
            }`}
          >
            <span
              className={`mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${
                isBilling ? 'bg-sky-600' : 'bg-blue-600'
              }`}
            >
              1
            </span>
            Primer Pago
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Selector de metodo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Método
              </label>
              <div className="relative isolate">
                <select
                  value={paymentMethod1}
                  onChange={(e) => setPaymentMethod1(e.target.value)}
                  disabled={disabled}
                  className={selectClass}
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isBilling && (
                  <span
                    className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg border-l border-gray-200/60 bg-gray-100/95"
                    aria-hidden
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-gray-500" />
                  </span>
                )}
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Monto
              </label>
              <div className="relative isolate">
                <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-500">
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
                  className={amountNumClass}
                />
              </div>
            </div>
          </div>

          {/* Codigo de operacion (si aplica) */}
          {paymentMethod1 !== 'EFE' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Código de Operación {requiresOperationCode(paymentMethod1) ? '*' : '(opcional)'}
              </label>
              <input
                type="text"
                value={operationCode1}
                onChange={(e) => {
                  if (e.target.value.length <= 20) {
                    setOperationCode1(e.target.value);
                  }
                }}
                placeholder="Ingrese el código..."
                disabled={disabled}
                className={isBilling ? opInputClass : 'w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 text-sm'}
                maxLength={20}
              />
              <div className="text-xs text-gray-500 mt-1">
                {operationCode1.length}/20 caracteres
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pago 2 (Secundario) - Solo visible en pago dividido */}
      {isSplitPayment && (
        <div className={splitPanel2Class}>
          <h4
            className={`mb-3 flex items-center text-sm font-medium ${
              isBilling ? 'text-emerald-900' : 'text-green-700'
            }`}
          >
            <span
              className={`mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${
                isBilling ? 'bg-emerald-600' : 'bg-green-600'
              }`}
            >
              2
            </span>
            Segundo Pago
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Selector de metodo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Método
              </label>
              <div className="relative isolate">
                <select
                  value={paymentMethod2}
                  onChange={(e) => setPaymentMethod2(e.target.value)}
                  disabled={disabled}
                  className={selectClass}
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isBilling && (
                  <span
                    className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg border-l border-gray-200/60 bg-gray-100/95"
                    aria-hidden
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-gray-500" />
                  </span>
                )}
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Monto
              </label>
              <div className="relative isolate">
                <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-gray-500">
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
                  className={amountNumClass}
                />
              </div>
            </div>
          </div>

          {/* Codigo de operacion (si aplica) */}
          {paymentMethod2 !== 'EFE' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Código de Operación {requiresOperationCode(paymentMethod2) ? '*' : '(opcional)'}
              </label>
              <input
                type="text"
                value={operationCode2}
                onChange={(e) => {
                  if (e.target.value.length <= 20) {
                    setOperationCode2(e.target.value);
                  }
                }}
                placeholder="Ingrese el código..."
                disabled={disabled}
                className={isBilling ? opInputClass : 'w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 text-sm'}
                maxLength={20}
              />
              <div className="text-xs text-gray-500 mt-1">
                {operationCode2.length}/20 caracteres
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumen de totales (solo en pago dividido) */}
      {isSplitPayment && (
        <div
          className={`rounded-lg border p-3 ${
            validation.isValid
              ? isBilling
                ? 'border-gray-200/80 bg-gray-50/80'
                : 'border-gray-200 bg-gray-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total a pagar:</span>
            <span className="font-semibold">{currencySymbol} {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-gray-600">Suma de pagos:</span>
            <span className={`font-semibold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
              {currencySymbol} {totalPaid.toFixed(2)}
            </span>
          </div>
          
          {/* Mostrar errores de validacion */}
          {validation.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {validation.errors.map((error, idx) => (
                <div key={idx} className="flex items-start text-xs text-red-600">
                  <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Mostrar advertencias (solo si no hay errores) */}
          {validation.errors.length === 0 && validation.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {validation.warnings.map((warning, idx) => (
                <div key={idx} className="flex items-start text-xs text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SplitPaymentForm;
