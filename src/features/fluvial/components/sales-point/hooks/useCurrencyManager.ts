// src/features/fluvial/components/sales-point/hooks/useCurrencyManager.ts

import { useState, useCallback, useMemo } from 'react';

export type CurrencyCode = 'PEN' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    name: 'Soles',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólares',
  },
};

/**
 * Hook personalizado para manejar la moneda de venta
 * 
 * Para PEN: Los precios se calculan automáticamente desde las tarifas
 * Para USD: Los precios deben ingresarse manualmente (no hay tarifas automáticas)
 */
export const useCurrencyManager = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('PEN');

  const currentCurrency = useMemo(() => CURRENCIES[selectedCurrency], [selectedCurrency]);

  const isPEN = useMemo(() => selectedCurrency === 'PEN', [selectedCurrency]);
  const isUSD = useMemo(() => selectedCurrency === 'USD', [selectedCurrency]);

  /**
   * Cambiar la moneda seleccionada
   */
  const setCurrency = useCallback((currency: CurrencyCode) => {
    setSelectedCurrency(currency);
  }, []);

  /**
   * Alternar entre PEN y USD
   */
  const toggleCurrency = useCallback(() => {
    setSelectedCurrency(prev => prev === 'PEN' ? 'USD' : 'PEN');
  }, []);

  /**
   * Determinar si debe usarse modo manual para el precio base
   * - PEN: Usa tarifa automática (solo manual si no hay tarifa)
   * - USD: Siempre manual
   */
  const shouldUseManualPrice = useCallback((hasAutomaticFare: boolean) => {
    if (isUSD) return true; // USD siempre manual
    return !hasAutomaticFare; // PEN solo manual si no hay tarifa
  }, [isUSD]);

  /**
   * Obtener símbolo formateado para mostrar en UI
   */
  const getCurrencySymbol = useCallback(() => {
    return currentCurrency.symbol;
  }, [currentCurrency]);

  /**
   * Formatear un monto con el símbolo de moneda
   */
  const formatAmount = useCallback((amount: number, decimals: number = 2): string => {
    return `${currentCurrency.symbol} ${amount.toFixed(decimals)}`;
  }, [currentCurrency]);

  return {
    // Estado
    selectedCurrency,
    currentCurrency,
    isPEN,
    isUSD,
    
    // Acciones
    setCurrency,
    toggleCurrency,
    
    // Utilidades
    shouldUseManualPrice,
    getCurrencySymbol,
    formatAmount,
  };
};
