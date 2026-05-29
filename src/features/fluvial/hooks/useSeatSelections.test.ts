import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSeatSelections } from './useSeatSelections';
import { SeatSelection } from '../types/websocket.types';

describe('useSeatSelections', () => {
  const userId = 'user-123';

  const makeSelection = (overrides: Partial<SeatSelection> = {}): SeatSelection => ({
    seatId: 1,
    userId: 'other-user',
    userName: 'Other',
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useSeatSelections({ userId }));

    expect(result.current.activeSeatSelections.size).toBe(0);
    expect(result.current.myReservedSeats.size).toBe(0);
    expect(result.current.myActiveSelections.size).toBe(0);
  });

  describe('addSelection', () => {
    it('adds selection to activeSeatSelections', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addSelection(makeSelection({ seatId: 10 }));
      });

      expect(result.current.activeSeatSelections.has(10)).toBe(true);
    });

    it('adds own selection to myActiveSelections (including rep suffix)', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addSelection(makeSelection({ seatId: 11, userId: `${userId}-company-session1-rep-0` }));
      });

      expect(result.current.myActiveSelections.has(11)).toBe(true);
    });

    it('does not add other user selection to myActiveSelections', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addSelection(makeSelection({ seatId: 12, userId: 'stranger' }));
      });

      expect(result.current.myActiveSelections.has(12)).toBe(false);
    });
  });

  describe('removeSelection', () => {
    it('removes selection when sourceUserId matches existing userId base', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addSelection(makeSelection({ seatId: 20, userId: 'owner' }));
      });

      act(() => {
        result.current.removeSelection(20, 'owner');
      });

      expect(result.current.activeSeatSelections.has(20)).toBe(false);
    });

    it('does not remove when sourceUserId base does not match existing userId base', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addSelection(makeSelection({ seatId: 21, userId: 'owner' }));
      });

      act(() => {
        result.current.removeSelection(21, 'different-user');
      });

      expect(result.current.activeSeatSelections.has(21)).toBe(true);
    });

    it('removes from myActiveSelections when removing own selection', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addSelection(makeSelection({ seatId: 22, userId }));
      });
      expect(result.current.myActiveSelections.has(22)).toBe(true);

      act(() => {
        result.current.removeSelection(22, userId);
      });
      expect(result.current.myActiveSelections.has(22)).toBe(false);
    });

    it('ignores removal if seatId not in active selections', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.removeSelection(99, 'someone');
      });

      expect(result.current.activeSeatSelections.size).toBe(0);
    });
  });

  describe('addMySelection', () => {
    it('adds seatId directly to myActiveSelections', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addMySelection(30);
      });

      expect(result.current.myActiveSelections.has(30)).toBe(true);
      expect(result.current.activeSeatSelections.has(30)).toBe(false);
    });
  });

  describe('reservations', () => {
    it('addReservation adds to myReservedSeats and updates ref', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addReservation(40);
      });

      expect(result.current.myReservedSeats.has(40)).toBe(true);
      expect(result.current.myReservedSeatsRef.current!.has(40)).toBe(true);
    });

    it('removeReservation removes from myReservedSeats and updates ref', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addReservation(41);
        result.current.addReservation(42);
      });

      act(() => {
        result.current.removeReservation(41);
      });

      expect(result.current.myReservedSeats.has(41)).toBe(false);
      expect(result.current.myReservedSeats.has(42)).toBe(true);
      expect(result.current.myReservedSeatsRef.current!.has(41)).toBe(false);
    });

    it('clearAllReservations empties myReservedSeats and updates ref', () => {
      const { result } = renderHook(() => useSeatSelections({ userId }));

      act(() => {
        result.current.addReservation(50);
        result.current.addReservation(51);
      });

      act(() => {
        result.current.clearAllReservations();
      });

      expect(result.current.myReservedSeats.size).toBe(0);
      expect(result.current.myReservedSeatsRef.current!.size).toBe(0);
    });
  });
});
