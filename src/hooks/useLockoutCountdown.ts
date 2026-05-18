import { useState, useEffect, useCallback, useRef } from 'react';

const LOCKOUT_KEY = 'tr_login_lockout_until';

interface UseLockoutCountdownReturn {
  /** Si la cuenta está bloqueada */
  isLocked: boolean;
  /** Segundos restantes */
  secondsRemaining: number;
  /** Tiempo formateado HH:MM:SS o MM:SS */
  formattedTime: string;
  /** Activa el bloqueo por N segundos (usado cuando el backend envía retry_after_seconds) */
  lockFromSeconds: (seconds: number) => void;
  /** Fuerza el desbloqueo (útil para testing o login exitoso) */
  clearLock: () => void;
}

function getLockoutTimestamp(): number | null {
  const raw = localStorage.getItem(LOCKOUT_KEY);
  if (!raw) return null;
  const ts = parseInt(raw, 10);
  if (isNaN(ts)) return null;
  return ts;
}

/**
 * Formatea segundos a HH:MM:SS o MM:SS.
 * - Si hay horas: "01:30:05"
 * - Si no hay horas: "30:05"
 */
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(String(hours).padStart(2, '0'));
  parts.push(String(minutes).padStart(2, '0'));
  parts.push(String(seconds).padStart(2, '0'));

  return parts.join(':');
}

export function useLockoutCountdown(): UseLockoutCountdownReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateState = useCallback(() => {
    const until = getLockoutTimestamp();
    if (!until) {
      setIsLocked(false);
      setSecondsRemaining(0);
      clearTimer();
      return;
    }

    const now = Date.now();
    const remainingMs = until - now;

    if (remainingMs <= 0) {
      localStorage.removeItem(LOCKOUT_KEY);
      setIsLocked(false);
      setSecondsRemaining(0);
      clearTimer();
      return;
    }

    setIsLocked(true);
    setSecondsRemaining(Math.ceil(remainingMs / 1000));
  }, [clearTimer]);

  const lockFromSeconds = useCallback(
    (seconds: number) => {
      const until = Date.now() + seconds * 1000;
      localStorage.setItem(LOCKOUT_KEY, String(until));
      updateState();
    },
    [updateState]
  );

  const clearLock = useCallback(() => {
    localStorage.removeItem(LOCKOUT_KEY);
    updateState();
  }, [updateState]);

  // Al montar, verificar si hay un bloqueo activo en localStorage
  useEffect(() => {
    updateState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejar el intervalo de cuenta regresiva
  useEffect(() => {
    if (!isLocked) return;

    intervalRef.current = setInterval(() => {
      updateState();
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [isLocked, updateState, clearTimer]);

  return {
    isLocked,
    secondsRemaining,
    formattedTime: formatTime(secondsRemaining),
    lockFromSeconds,
    clearLock,
  };
}
