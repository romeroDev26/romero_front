import { describe, it, expect, vi, beforeEach, afterEach, MockedFunction } from 'vitest';
import { WebSocketMessageHandler } from './websocketMessageHandler';
import { SeatUpdateMessage, SeatSelection } from '../types/websocket.types';
import { SeatOccupantInfo } from '../../../types';

describe('WebSocketMessageHandler', () => {
  const userId = 'user-123';
  let onSeatMapUpdate: MockedFunction<(seatId: number, status: string, occupant?: SeatOccupantInfo) => void>;
  let onSelectionUpdate: MockedFunction<(selection: SeatSelection) => void>;
  let onSelectionRemove: MockedFunction<(seatId: number, sourceUserId?: string) => void>;
  let onInitialState: MockedFunction<(selections: SeatSelection[]) => void>;
  let handler: WebSocketMessageHandler;

  beforeEach(() => {
    onSeatMapUpdate = vi.fn();
    onSelectionUpdate = vi.fn();
    onSelectionRemove = vi.fn();
    onInitialState = vi.fn();

    handler = new WebSocketMessageHandler(userId, {
      onSeatMapUpdate,
      onSelectionUpdate,
      onSelectionRemove,
      onInitialState,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseMessage = (overrides: Partial<SeatUpdateMessage> = {}): SeatUpdateMessage => ({
    type: 'SEAT_UPDATE',
    tripId: 1,
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  describe('INITIAL_STATE', () => {
    it('processes seatMap from backend official format', () => {
      const msg = baseMessage({
        type: 'INITIAL_STATE',
        seatMap: [
          { id: 153893, seat_number: '1', status: 'AVAILABLE' },
          { id: 153894, seat_number: '2', status: 'RESERVED' },
          { id: 153895, seat_number: '3', status: 'CONFIRMED' },
          { id: 153896, seat_number: '4', status: 'SOLD' },
        ],
      });

      handler.handleMessage(msg);

      // Todos los asientos del seatMap deben actualizarse
      expect(onSeatMapUpdate).toHaveBeenCalledWith(153893, 'AVAILABLE', undefined);
      expect(onSeatMapUpdate).toHaveBeenCalledWith(153894, 'RESERVED', undefined);
      expect(onSeatMapUpdate).toHaveBeenCalledWith(153895, 'CONFIRMED', undefined);
      expect(onSeatMapUpdate).toHaveBeenCalledWith(153896, 'SOLD', undefined);
    });

    it('processes seatMap with occupants and marks confirmedSeats', () => {
      const occupant: SeatOccupantInfo = {
        passenger_name: 'John',
        origin_stop_name: 'A',
        destination_stop_name: 'B',
        amount_paid: 100,
        currency_code: 'PEN',
      };
      const msg = baseMessage({
        type: 'INITIAL_STATE',
        seatMap: [
          { id: 153895, seat_number: '3', status: 'CONFIRMED', occupant },
        ],
      });

      handler.handleMessage(msg);

      expect(onSeatMapUpdate).toHaveBeenCalledWith(153895, 'CONFIRMED', occupant);

      // Tras confirmar, SEAT_RELEASED debe ignorar este asiento
      onSelectionRemove.mockClear();
      handler.handleMessage(baseMessage({ type: 'SEAT_RELEASED', seatId: 153895, userId: 'other' }));
      expect(onSelectionRemove).not.toHaveBeenCalled();
    });

    it('processes selecctionSeats from other users and occupiedSeats', () => {
      const msg = baseMessage({
        type: 'INITIAL_STATE',
        selecctionSeats: [
          { seatId: 1, userId: 'other-user', userName: 'Other', timestamp: new Date().toISOString(), status: 'SEAT_SELECTION' },
          { seatId: 2, userId: `${userId}-company-session1-rep-0`, userName: 'Me Rep', timestamp: new Date().toISOString(), status: 'SEAT_SELECTION' },
        ],
        occupiedSeats: [
          { seatId: 3, userId: 'seller', userName: 'Seller', timestamp: new Date().toISOString(), status: 'OCCUPIED', invoiceId: 101 },
        ],
      });

      handler.handleMessage(msg);

      // selecctionSeats: filtra la del mismo user base
      expect(onInitialState).toHaveBeenCalledTimes(1);
      const selections = onInitialState.mock.calls[0][0] as SeatSelection[];
      expect(selections).toHaveLength(1);
      expect(selections[0].seatId).toBe(1);
      expect(selections[0].type).toBe('temporary');

      // occupiedSeats → CONFIRMED
      expect(onSeatMapUpdate).toHaveBeenCalledWith(3, 'CONFIRMED', undefined);
    });

    it('extracts occupant from occupants map for occupied seats', () => {
      const occupant: SeatOccupantInfo = {
        passenger_name: 'John',
        origin_stop_name: 'A',
        destination_stop_name: 'B',
        amount_paid: 100,
        currency_code: 'PEN',
      };
      const msg = baseMessage({
        type: 'INITIAL_STATE',
        occupiedSeats: [
          { seatId: 5, userId: 'seller', userName: 'Seller', timestamp: new Date().toISOString(), status: 'OCCUPIED', invoiceId: 102 },
        ],
        occupants: { '5': occupant },
      });

      handler.handleMessage(msg);
      expect(onSeatMapUpdate).toHaveBeenCalledWith(5, 'CONFIRMED', occupant);
    });

    it('falls back to legacy seats field when selecctionSeats is absent', () => {
      const msg = baseMessage({
        type: 'INITIAL_STATE',
        seats: [
          { seatId: 10, userId: 'legacy-user', userName: 'Legacy' },
          { seatId: 11, userId: userId, userName: 'Me' },
        ],
      });

      handler.handleMessage(msg);

      expect(onInitialState).toHaveBeenCalledTimes(1);
      const selections = onInitialState.mock.calls[0][0] as SeatSelection[];
      expect(selections).toHaveLength(1);
      expect(selections[0].seatId).toBe(10);
    });
  });

  describe('SEAT_UPDATE', () => {
    it('updates seat and adds to confirmedSeats for SOLD', () => {
      const msg = baseMessage({ type: 'SEAT_UPDATE', seatId: 7, status: 'SOLD' });
      handler.handleMessage(msg);

      expect(onSeatMapUpdate).toHaveBeenCalledWith(7, 'SOLD');
      expect(onSelectionRemove).toHaveBeenCalledWith(7);
    });

    it('adds CONFIRMED and OCCUPIED to confirmedSeats', () => {
      handler.handleMessage(baseMessage({ type: 'SEAT_UPDATE', seatId: 8, status: 'CONFIRMED' }));
      handler.handleMessage(baseMessage({ type: 'SEAT_UPDATE', seatId: 9, status: 'occupied' }));

      // Tras confirmar, SEAT_RELEASED debe ignorar estos asientos
      onSelectionRemove.mockClear();
      handler.handleMessage(baseMessage({ type: 'SEAT_RELEASED', seatId: 8, userId: 'other' }));
      handler.handleMessage(baseMessage({ type: 'SEAT_RELEASED', seatId: 9, userId: 'other' }));
      expect(onSelectionRemove).not.toHaveBeenCalled();
    });
  });

  describe('SEAT_SELECTION', () => {
    it('adds selection from different user', () => {
      const msg = baseMessage({
        type: 'SEAT_SELECTION',
        seatId: 20,
        userId: 'other-user',
        userName: 'Other',
      });
      handler.handleMessage(msg);

      expect(onSelectionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          seatId: 20,
          userId: 'other-user',
          type: 'temporary',
        })
      );
    });

    it('ignores selection from same base user (including representative suffix)', () => {
      const msg = baseMessage({
        type: 'SEAT_SELECTION',
        seatId: 21,
        userId: `${userId}-company-session1-rep-0`,
        userName: 'Rep',
      });
      handler.handleMessage(msg);
      expect(onSelectionUpdate).not.toHaveBeenCalled();
    });
  });

  describe('SEAT_RELEASED', () => {
    it('removes selection for non-confirmed seats', () => {
      handler.handleMessage(baseMessage({ type: 'SEAT_RELEASED', seatId: 30, userId: 'other' }));
      expect(onSelectionRemove).toHaveBeenCalledWith(30, 'other');
    });

    it('ignores release for confirmed seats', () => {
      // Marcar como vendido primero
      handler.handleMessage(baseMessage({ type: 'SEAT_UPDATE', seatId: 31, status: 'SOLD' }));
      onSelectionRemove.mockClear();

      handler.handleMessage(baseMessage({ type: 'SEAT_RELEASED', seatId: 31, userId: 'other' }));
      expect(onSelectionRemove).not.toHaveBeenCalled();
    });
  });

  describe('SEAT_RESERVED', () => {
    it('updates seat to RESERVED and removes selection', () => {
      handler.handleMessage(baseMessage({ type: 'SEAT_RESERVED', seatId: 40 }));

      expect(onSeatMapUpdate).toHaveBeenCalledWith(40, 'RESERVED');
      expect(onSelectionRemove).toHaveBeenCalledWith(40);
    });

    it('handles full backend payload with seatTypeId, reservationId, etc.', () => {
      const msg = baseMessage({
        type: 'SEAT_RESERVED',
        seatId: 153908,
        seatNumber: '16',
        seatTypeId: 2,
        reservationId: 1971,
        customerId: 0,
        quantity: 1,
      });

      handler.handleMessage(msg);

      expect(onSeatMapUpdate).toHaveBeenCalledWith(153908, 'RESERVED');
      expect(onSelectionRemove).toHaveBeenCalledWith(153908);
    });
  });

  describe('SEATS_RELEASED', () => {
    it('marks multiple seats as AVAILABLE and removes selections', () => {
      // Primero marcar como confirmado para probar que se libera
      handler.handleMessage(baseMessage({ type: 'SEAT_UPDATE', seatId: 100, status: 'SOLD' }));
      handler.handleMessage(baseMessage({ type: 'SEAT_UPDATE', seatId: 101, status: 'CONFIRMED' }));
      onSelectionRemove.mockClear();

      const msg = baseMessage({
        type: 'SEATS_RELEASED',
        seatIds: [100, 101],
        reason: 'CANCELLED_RESERVATION',
      });

      handler.handleMessage(msg);

      expect(onSeatMapUpdate).toHaveBeenCalledWith(100, 'AVAILABLE');
      expect(onSeatMapUpdate).toHaveBeenCalledWith(101, 'AVAILABLE');
      expect(onSelectionRemove).toHaveBeenCalledWith(100);
      expect(onSelectionRemove).toHaveBeenCalledWith(101);
    });

    it('handles single seat release', () => {
      const msg = baseMessage({
        type: 'SEATS_RELEASED',
        seatIds: [102],
        reason: 'TIMEOUT',
      });

      handler.handleMessage(msg);

      expect(onSeatMapUpdate).toHaveBeenCalledWith(102, 'AVAILABLE');
      expect(onSelectionRemove).toHaveBeenCalledWith(102);
    });

    it('ignores empty seatIds array', () => {
      const msg = baseMessage({
        type: 'SEATS_RELEASED',
        seatIds: [],
        reason: 'TIMEOUT',
      });

      handler.handleMessage(msg);

      expect(onSeatMapUpdate).not.toHaveBeenCalled();
      expect(onSelectionRemove).not.toHaveBeenCalled();
    });
  });

  describe('SEATS_OCCUPIED', () => {
    it('marks multiple seats as CONFIRMED with occupants', () => {
      const occupant: SeatOccupantInfo = {
        passenger_name: 'Jane',
        origin_stop_name: 'X',
        destination_stop_name: 'Y',
        amount_paid: 100,
        currency_code: 'PEN',
      };
      const msg = baseMessage({
        type: 'SEATS_OCCUPIED',
        seatIds: [50, 51],
        occupants: { '50': occupant },
      });

      handler.handleMessage(msg);

      expect(onSeatMapUpdate).toHaveBeenCalledWith(50, 'CONFIRMED', occupant);
      expect(onSeatMapUpdate).toHaveBeenCalledWith(51, 'CONFIRMED', undefined);
      expect(onSelectionRemove).toHaveBeenCalledWith(50);
      expect(onSelectionRemove).toHaveBeenCalledWith(51);
    });
  });

  describe('SEAT_MAP_UPDATE', () => {
    it('processes batch seat updates', () => {
      const msg = baseMessage({
        type: 'SEAT_MAP_UPDATE',
        seats: [
          { seatId: 60, userId: 'seller', userName: 'Seller', status: 'SOLD' },
          { seatId: 61, userId: 'seller', userName: 'Seller', status: 'AVAILABLE' },
        ],
      });

      handler.handleMessage(msg);

      expect(onSeatMapUpdate).toHaveBeenCalledWith(60, 'SOLD');
      expect(onSeatMapUpdate).toHaveBeenCalledWith(61, 'AVAILABLE');
    });

    it('processes single seatId update', () => {
      const msg = baseMessage({ type: 'SEAT_MAP_UPDATE', seatId: 62, status: 'CONFIRMED' });
      handler.handleMessage(msg);
      expect(onSeatMapUpdate).toHaveBeenCalledWith(62, 'CONFIRMED');
    });
  });

  describe('SEAT_TEMP_RESERVED', () => {
    it('adds representative reservation from different user', () => {
      const msg = baseMessage({
        type: 'SEAT_TEMP_RESERVED',
        seatId: 70,
        userId: 'other-user',
        userName: 'Other',
        reservationType: 'representative',
        ttl: 1800,
        companyName: 'Acme',
        representativeName: 'Rep1',
        representativeIndex: 0,
      });

      handler.handleMessage(msg);

      expect(onSelectionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          seatId: 70,
          type: 'representative',
          companyName: 'Acme',
          representativeName: 'Rep1',
          ttl: 1800,
        })
      );
    });

    it('ignores temp reserved from same base user', () => {
      const msg = baseMessage({
        type: 'SEAT_TEMP_RESERVED',
        seatId: 71,
        userId: userId,
        userName: 'Me',
      });
      handler.handleMessage(msg);
      expect(onSelectionUpdate).not.toHaveBeenCalled();
    });
  });

  describe('SEAT_TEMP_RELEASED', () => {
    it('removes temp reservation for non-confirmed seats', () => {
      handler.handleMessage(baseMessage({ type: 'SEAT_TEMP_RELEASED', seatId: 80, userId: 'other' }));
      expect(onSelectionRemove).toHaveBeenCalledWith(80, 'other');
    });

    it('ignores temp release for confirmed seats', () => {
      handler.handleMessage(baseMessage({ type: 'SEAT_UPDATE', seatId: 81, status: 'SOLD' }));
      onSelectionRemove.mockClear();

      handler.handleMessage(baseMessage({ type: 'SEAT_TEMP_RELEASED', seatId: 81 }));
      expect(onSelectionRemove).not.toHaveBeenCalled();
    });
  });

  describe('SEAT_TEMP_RESERVE_RESPONSE', () => {
    it('shows toast error on failed reservation', () => {
      vi.useFakeTimers();
      const msg = baseMessage({
        type: 'SEAT_TEMP_RESERVE_RESPONSE',
        seatId: 90,
        success: false,
        error: 'Asiento ocupado',
      });

      handler.handleMessage(msg);

      // showReserveError usa setTimeout(..., 50)
      vi.advanceTimersByTime(100);

      vi.useRealTimers();
    });

    it('does nothing on successful reservation response', () => {
      const msg = baseMessage({
        type: 'SEAT_TEMP_RESERVE_RESPONSE',
        seatId: 91,
        success: true,
      });
      handler.handleMessage(msg);
      expect(onSeatMapUpdate).not.toHaveBeenCalled();
      expect(onSelectionUpdate).not.toHaveBeenCalled();
    });
  });

  describe('PONG', () => {
    it('does nothing', () => {
      handler.handleMessage(baseMessage({ type: 'PONG' }));
      expect(onSeatMapUpdate).not.toHaveBeenCalled();
      expect(onSelectionUpdate).not.toHaveBeenCalled();
      expect(onSelectionRemove).not.toHaveBeenCalled();
      expect(onInitialState).not.toHaveBeenCalled();
    });
  });

  describe('unknown message type', () => {
    it('does nothing for unhandled types', () => {
      handler.handleMessage(// Tipo fuera del protocolo a proposito: se verifica que se ignore.
        baseMessage({ type: 'UNKNOWN_TYPE' as SeatUpdateMessage['type'] }));
      expect(onSeatMapUpdate).not.toHaveBeenCalled();
    });
  });
});
