import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useReprogrammedTicketPolling } from './useReprogrammedTicketPolling';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('consulta mientras faltan PDFs, termina al estar listos y limita la espera', () => {
  vi.useFakeTimers();
  const refetch = vi.fn().mockResolvedValue({});
  const { result, rerender } = renderHook(({ missing }) => useReprogrammedTicketPolling(76170, missing, refetch), { initialProps: { missing: true } });
  expect(result.current).toBe(true);
  act(() => vi.advanceTimersByTime(4000));
  expect(refetch).toHaveBeenCalledTimes(2);
  rerender({ missing: false });
  act(() => vi.advanceTimersByTime(4000));
  expect(refetch).toHaveBeenCalledTimes(2);
  expect(result.current).toBe(false);
  rerender({ missing: true });
  act(() => vi.advanceTimersByTime(60000));
  expect(result.current).toBe(false);
  const calls = refetch.mock.calls.length;
  act(() => vi.advanceTimersByTime(10000));
  expect(refetch).toHaveBeenCalledTimes(calls);
});
