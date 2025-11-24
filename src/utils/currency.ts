/**
 * Obtiene el símbolo de la moneda según el código ISO
 * @param currency Código de moneda (PEN, USD, EUR, etc.)
 * @returns Símbolo de la moneda (S/, $, €, etc.)
 */
export const getCurrencySymbol = (currency: string): string => {
  const currencyMap: Record<string, string> = {
    PEN: 'S/',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    BRL: 'R$',
    COP: '$',
    MXN: '$',
  };

  return currencyMap[currency.toUpperCase()] || currency;
};

/**
 * Formatea un monto con su símbolo de moneda
 * @param amount Monto a formatear
 * @param currency Código de moneda
 * @param decimals Número de decimales (por defecto 2)
 * @returns Monto formateado con símbolo (ej: "S/ 150.00")
 */
export const formatCurrency = (
  amount: number,
  currency: string,
  decimals: number = 2
): string => {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = amount.toFixed(decimals);
  return `${symbol} ${formattedAmount}`;
};
