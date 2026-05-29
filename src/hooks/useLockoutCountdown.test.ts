import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLockoutCountdown } from './useLockoutCountdown';

const LOCKOUT_KEY = 'tr_login_lockout_until';

describe('useLockoutCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start unlocked when localStorage is empty', () => {
    const { result } = renderHook(() => useLockoutCountdown());

    expect(result.current.isLocked).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
    expect(result.current.formattedTime).toBe('00:00');
  });

  it('should lock and format time correctly', () => {
    const { result } = renderHook(() => useLockoutCountdown());

    act(() => {
      result.current.lockFromSeconds(125); // 2 min 5 sec
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.secondsRemaining).toBe(125);
    expect(result.current.formattedTime).toBe('02:05');
  });

  it('should format hours when needed', () => {
    const { result } = renderHook(() => useLockoutCountdown());

    act(() => {
      result.current.lockFromSeconds(3665); // 1h 1min 5sec
    });

    expect(result.current.formattedTime).toBe('01:01:05');
  });

  it('should countdown every second', () => {
    const { result } = renderHook(() => useLockoutCountdown());

    act(() => {
      result.current.lockFromSeconds(5);
    });

    expect(result.current.secondsRemaining).toBe(5);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondsRemaining).toBe(4);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.isLocked).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
  });

  it('should clear lock manually', () => {
    const { result } = renderHook(() => useLockoutCountdown());

    act(() => {
      result.current.lockFromSeconds(300);
    });
    expect(result.current.isLocked).toBe(true);

    act(() => {
      result.current.clearLock();
    });
    expect(result.current.isLocked).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);
    expect(localStorage.getItem(LOCKOUT_KEY)).toBeNull();
  });

  it('should auto-unlock when time expires', () => {
    const { result } = renderHook(() => useLockoutCountdown());

    act(() => {
      result.current.lockFromSeconds(2);
    });
    expect(result.current.isLocked).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isLocked).toBe(false);
    expect(localStorage.getItem(LOCKOUT_KEY)).toBeNull();
  });

  it('should restore lock state from localStorage on mount', () => {
    const future = Date.now() + 60000; // 1 min en el futuro
    localStorage.setItem(LOCKOUT_KEY, String(future));

    const { result } = renderHook(() => useLockoutCountdown());

    expect(result.current.isLocked).toBe(true);
    expect(result.current.secondsRemaining).toBeGreaterThan(0);
    expect(result.current.secondsRemaining).toBeLessThanOrEqual(60);
  });
});
