// src/features/fluvial/hooks/usePurchaseTimer.ts
import { useState, useCallback, useRef } from 'react';

interface UsePurchaseTimerOptions {
  purchaseTimeout?: number;
  onPurchaseTimeoutExpired?: () => void;
}

interface UsePurchaseTimerReturn {
  purchaseTimeRemaining: number;
  isPurchaseTimerActive: boolean;
  startPurchaseTimer: () => void;
  stopPurchaseTimer: () => void;
  extendPurchaseTime: (additionalMs: number) => void;
}

export const usePurchaseTimer = ({
  purchaseTimeout = 300000, // 5 minutos por defecto
  onPurchaseTimeoutExpired
}: UsePurchaseTimerOptions): UsePurchaseTimerReturn => {
  const [purchaseStartTime, setPurchaseStartTime] = useState<number | null>(null);
  const [purchaseTimeRemaining, setPurchaseTimeRemaining] = useState<number>(purchaseTimeout);
  const [isPurchaseTimerActive, setIsPurchaseTimerActive] = useState(false);
  
  const purchaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPurchaseTimer = useCallback(() => {
    if (purchaseTimerRef.current) {
      clearInterval(purchaseTimerRef.current);
      purchaseTimerRef.current = null;
    }
    setIsPurchaseTimerActive(false);
    setPurchaseStartTime(null);
    setPurchaseTimeRemaining(purchaseTimeout);
  }, [purchaseTimeout]);

  const startPurchaseTimer = useCallback(() => {
    const startTime = Date.now();
    setPurchaseStartTime(startTime);
    setIsPurchaseTimerActive(true);
    setPurchaseTimeRemaining(purchaseTimeout);

    // Limpiar temporizador existente si existe
    if (purchaseTimerRef.current) {
      clearInterval(purchaseTimerRef.current);
    }

    // Actualizar cada segundo
    purchaseTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, purchaseTimeout - elapsed);
      
      setPurchaseTimeRemaining(remaining);

      if (remaining <= 0) {
        // Tiempo agotado
        clearInterval(purchaseTimerRef.current!);
        purchaseTimerRef.current = null;
        setIsPurchaseTimerActive(false);
        setPurchaseStartTime(null);
        
        // Ejecutar callback si existe
        if (onPurchaseTimeoutExpired) {
          onPurchaseTimeoutExpired();
        }
      }
    }, 1000);
  }, [purchaseTimeout, onPurchaseTimeoutExpired]);

  const extendPurchaseTime = useCallback((additionalMs: number) => {
    if (isPurchaseTimerActive && purchaseStartTime) {
      const newTimeout = purchaseTimeout + additionalMs;
      const startTime = purchaseStartTime;
      
      // Limpiar temporizador actual
      if (purchaseTimerRef.current) {
        clearInterval(purchaseTimerRef.current);
      }

      // Reiniciar con nuevo timeout
      purchaseTimerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, newTimeout - elapsed);
        
        setPurchaseTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(purchaseTimerRef.current!);
          purchaseTimerRef.current = null;
          setIsPurchaseTimerActive(false);
          setPurchaseStartTime(null);
          
          if (onPurchaseTimeoutExpired) {
            onPurchaseTimeoutExpired();
          }
        }
      }, 1000);
    }
  }, [isPurchaseTimerActive, purchaseStartTime, purchaseTimeout, onPurchaseTimeoutExpired]);

  return {
    purchaseTimeRemaining,
    isPurchaseTimerActive,
    startPurchaseTimer,
    stopPurchaseTimer,
    extendPurchaseTime
  };
};
