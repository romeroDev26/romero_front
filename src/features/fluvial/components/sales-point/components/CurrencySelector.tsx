// src/features/fluvial/components/sales-point/components/CurrencySelector.tsx

import React from 'react';
import { CurrencyCode, CURRENCIES } from '../hooks/useCurrencyManager';

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
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
}) => {
  const isPEN = selectedCurrency === 'PEN';

  const handleToggle = () => {
    if (disabled) return;
    const newCurrency: CurrencyCode = isPEN ? 'USD' : 'PEN';
    onCurrencyChange(newCurrency);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Moneda
      </label>
      
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Etiqueta PEN */}
          <div className={`flex items-center space-x-1.5 transition-colors ${isPEN ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            <span className="text-base">{CURRENCIES.PEN.symbol}</span>
            <span className="text-sm">{CURRENCIES.PEN.name}</span>
          </div>

          {/* Switch Toggle */}
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

          {/* Etiqueta USD */}
          <div className={`flex items-center space-x-1.5 transition-colors ${!isPEN ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
            <span className="text-base">{CURRENCIES.USD.symbol}</span>
            <span className="text-sm">{CURRENCIES.USD.name}</span>
          </div>
        </div>
      </div>

      {/* Mensaje informativo compacto */}
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
