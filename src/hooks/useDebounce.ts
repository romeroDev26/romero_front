// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce de valores
 * @param value - El valor a hacer debounce
 * @param delay - El retraso en milisegundos
 * @returns El valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar el timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timeout si el valor cambia (o el componente se desmonta)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Exportación por defecto para compatibilidad
export default useDebounce;