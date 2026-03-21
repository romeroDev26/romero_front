// src/features/fluvial/components/sales-point/components/CurrencySelector.tsx

import React from 'react';
import { CurrencyCode, CURRENCIES } from '../hooks/useCurrencyManager';

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
  /** Modo compacto: muestra solo el toggle con etiquetas pequeñas, sin label ni nota */
  compact?: boolean;
  /** Píldoras tipo mock billing (Soles / Dólares) */
  variant?: 'default' | 'pills';
}

/**
 * Componente para seleccionar la moneda de venta (PEN o USD)
 *
 * - PEN: Precios automáticos desde tarifas
 * - USD: Precios manuales
 */
export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  disabled = false,
  compact = false,
  variant = 'default',
}) => {
  const isPEN = selectedCurrency === 'PEN';

  const handleToggle = () => {
    if (disabled) return;
    const newCurrency: CurrencyCode = isPEN ? 'USD' : 'PEN';
    onCurrencyChange(newCurrency);
  };

  if (variant === 'pills') {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
        <span className="text-sm font-medium text-gray-900">Moneda de Pago</span>
        <div className="inline-flex w-fit max-w-full bg-gray-100 p-1 rounded-full gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onCurrencyChange('PEN')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all ${
              selectedCurrency === 'PEN'
                ? 'bg-white text-primary font-bold shadow-sm'
                : 'text-gray-500 font-medium hover:text-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Soles
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onCurrencyChange('USD')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all ${
              selectedCurrency === 'USD'
                ? 'bg-white text-primary font-bold shadow-sm'
                : 'text-gray-500 font-medium hover:text-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Dólares
          </button>
        </div>
      </div>
    );
  }

  const toggle = (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${isPEN ? 'bg-blue-600' : 'bg-green-600'}
      `}
      role="switch"
      aria-checked={!isPEN}
      aria-label="Cambiar moneda"
    >
      <span
        className={`
          inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
          ${isPEN ? 'translate-x-0.5' : 'translate-x-[18px]'}
        `}
      />
    </button>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-semibold transition-colors ${isPEN ? 'text-blue-600' : 'text-gray-400'}`}>
          {CURRENCIES.PEN.symbol} PEN
        </span>
        {toggle}
        <span className={`text-xs font-semibold transition-colors ${!isPEN ? 'text-green-600' : 'text-gray-400'}`}>
          {CURRENCIES.USD.symbol} USD
        </span>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Moneda
      </label>

      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-1.5 transition-colors ${isPEN ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            <span className="text-base">{CURRENCIES.PEN.symbol}</span>
            <span className="text-sm">{CURRENCIES.PEN.name}</span>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`
              relative inline-flex h-7 w-12 items-center rounded-full transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${isPEN ? 'bg-blue-600' : 'bg-green-600'}
            `}
            role="switch"
            aria-checked={!isPEN}
            aria-label="Cambiar moneda"
          >
            <span
              className={`
                inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform
                ${isPEN ? 'translate-x-1' : 'translate-x-6'}
              `}
            />
          </button>

          <div className={`flex items-center space-x-1.5 transition-colors ${!isPEN ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
            <span className="text-base">{CURRENCIES.USD.symbol}</span>
            <span className="text-sm">{CURRENCIES.USD.name}</span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <p className="text-xs text-gray-600">
          {isPEN ? (
            <>
              <span className="font-medium text-blue-600">Soles:</span> Precios automáticos desde tarifas
            </>
          ) : (
            <>
              <span className="font-medium text-green-600">Dólares:</span> Ingreso manual de precios
            </>
          )}
        </p>
      </div>
    </div>
  );
};
