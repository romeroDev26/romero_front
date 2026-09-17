import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSeatReservations } from './useSeatReservations';

const mockToastError = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('@/utils/sileo-toast', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('useSeatReservations', () => {
  const tripId = 42;

  beforeEach(() => {
    mockToastError.mockClear();
    mockToastInfo.mockClear();
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useSeatReservations(tripId));
    expect(result.current.reservedSeats).toEqual([]);
    expect(result.current.isReserving).toBe(false);
    expect(result.current.sessionId).toContain('session_');
  });

  it('reserveSeat adds a new reservation', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      const ok = await result.current.reserveSeat('A1', 0, 101);
      expect(ok).toBe(true);
    });

    expect(result.current.reservedSeats).toHaveLength(1);
    expect(result.current.reservedSeats[0]).toMatchObject({
      seatNumber: 'A1',
      seatId: 101,
      representativeIndex: 0,
    });
  });

  it('reserveSeat replaces previous reservation for same representative index', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 101);
    });

    await act(async () => {
      await result.current.reserveSeat('B2', 0, 202);
    });

    expect(result.current.reservedSeats).toHaveLength(1);
    expect(result.current.reservedSeats[0].seatNumber).toBe('B2');
    expect(result.current.reservedSeats[0].seatId).toBe(202);
  });

  it('reserveSeat allows different representatives', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 101);
      await result.current.reserveSeat('B2', 1, 202);
    });

    expect(result.current.reservedSeats).toHaveLength(2);
  });

  it('updateReservationSeatId updates seatId for a representative', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 0);
    });

    act(() => {
      result.current.updateReservationSeatId(0, 999);
    });

    expect(result.current.reservedSeats[0].seatId).toBe(999);
  });

  it('releaseSeat removes reservation and calls WebSocket function', async () => {
    const releaseFn = vi.fn(() => true);
    const { result } = renderHook(() => useSeatReservations(tripId));

    act(() => {
      result.current.setWebSocketFunctions({
        releaseSeatForRepresentative: releaseFn,
      });
    });

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 101);
    });

    await act(async () => {
      await result.current.releaseSeat(0);
    });

    expect(releaseFn).toHaveBeenCalledWith(101, 0);
    expect(result.current.reservedSeats).toHaveLength(0);
  });

  it('releaseSeat does nothing if no reservation exists', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      await result.current.releaseSeat(99);
    });

    expect(result.current.reservedSeats).toHaveLength(0);
  });

  it('releaseAllReservations releases all seats via WebSocket', async () => {
    const releaseFn = vi.fn(() => true);
    const { result } = renderHook(() => useSeatReservations(tripId));

    act(() => {
      result.current.setWebSocketFunctions({
        releaseSeatForRepresentative: releaseFn,
      });
    });

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 101);
      await result.current.reserveSeat('B2', 1, 202);
    });

    await act(async () => {
      await result.current.releaseAllReservations();
    });

    // Verify both seats were released (may be called extra times due to Strict Mode)
    expect(releaseFn).toHaveBeenCalledWith(101, 0);
    expect(releaseFn).toHaveBeenCalledWith(202, 1);
    expect(result.current.reservedSeats).toHaveLength(0);
  });

  it('confirmAllReservations clears local state', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 101);
    });

    await act(async () => {
      const ok = await result.current.confirmAllReservations();
      expect(ok).toBe(true);
    });

    expect(result.current.reservedSeats).toHaveLength(0);
  });

  it('extendReservations shows info toast', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      await result.current.extendReservations(10);
    });

    expect(mockToastInfo).toHaveBeenCalledWith(
      'Las reservas se mantienen activas mientras la sesión esté abierta'
    );
  });

  it('getReservedSeatNumbers returns seat numbers', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 101);
      await result.current.reserveSeat('B2', 1, 202);
    });

    expect(result.current.getReservedSeatNumbers()).toEqual(['A1', 'B2']);
  });

  it('isSeatReservedByUser checks by seat number', async () => {
    const { result } = renderHook(() => useSeatReservations(tripId));

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 101);
    });

    expect(result.current.isSeatReservedByUser('A1')).toBe(true);
    expect(result.current.isSeatReservedByUser('Z99')).toBe(false);
  });

  it('cleans up reservations on unmount', async () => {
    const releaseFn = vi.fn(() => true);
    const { result, unmount } = renderHook(() => useSeatReservations(tripId));

    act(() => {
      result.current.setWebSocketFunctions({
        releaseSeatForRepresentative: releaseFn,
      });
    });

    await act(async () => {
      await result.current.reserveSeat('A1', 0, 101);
    });

    unmount();

    expect(releaseFn).toHaveBeenCalledWith(101, 0);
  });
});
