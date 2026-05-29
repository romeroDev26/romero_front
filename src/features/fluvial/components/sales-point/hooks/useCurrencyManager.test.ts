import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCurrencyManager } from './useCurrencyManager';

describe('useCurrencyManager', () => {
  it('starts with PEN', () => {
    const { result } = renderHook(() => useCurrencyManager());
    expect(result.current.selectedCurrency).toBe('PEN');
    expect(result.current.isPEN).toBe(true);
    expect(result.current.isUSD).toBe(false);
    expect(result.current.currentCurrency.symbol).toBe('S/');
  });

  it('sets currency to USD', () => {
    const { result } = renderHook(() => useCurrencyManager());
    act(() => result.current.setCurrency('USD'));
    expect(result.current.selectedCurrency).toBe('USD');
    expect(result.current.isUSD).toBe(true);
    expect(result.current.currentCurrency.symbol).toBe('$');
  });

  it('toggles between PEN and USD', () => {
    const { result } = renderHook(() => useCurrencyManager());
    act(() => result.current.toggleCurrency());
    expect(result.current.selectedCurrency).toBe('USD');
    act(() => result.current.toggleCurrency());
    expect(result.current.selectedCurrency).toBe('PEN');
  });

  it('shouldUseManualPrice returns true for USD regardless of fare', () => {
    const { result } = renderHook(() => useCurrencyManager());
    act(() => result.current.setCurrency('USD'));
    expect(result.current.shouldUseManualPrice(true)).toBe(true);
    expect(result.current.shouldUseManualPrice(false)).toBe(true);
  });

  it('shouldUseManualPrice returns false for PEN with automatic fare', () => {
    const { result } = renderHook(() => useCurrencyManager());
    expect(result.current.shouldUseManualPrice(true)).toBe(false);
    expect(result.current.shouldUseManualPrice(false)).toBe(true);
  });

  it('getCurrencySymbol returns correct symbol', () => {
    const { result } = renderHook(() => useCurrencyManager());
    expect(result.current.getCurrencySymbol()).toBe('S/');
    act(() => result.current.setCurrency('USD'));
    expect(result.current.getCurrencySymbol()).toBe('$');
  });

  it('formatAmount formats with symbol and decimals', () => {
    const { result } = renderHook(() => useCurrencyManager());
    expect(result.current.formatAmount(150.5)).toBe('S/ 150.50');
    act(() => result.current.setCurrency('USD'));
    expect(result.current.formatAmount(99.99, 1)).toBe('$ 100.0');
  });
});
