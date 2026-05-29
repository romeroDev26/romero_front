import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SeatOperations } from './seatOperations';

describe('SeatOperations', () => {
  const sendMessage = vi.fn((_msg?: any) => true);
  const userId = 'user-123';
  const userName = 'Test User';
  const tripId = 42;
  const companyName = 'Acme Corp';

  beforeEach(() => {
    sendMessage.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getLastCall = () => (sendMessage.mock.calls as any[][])[sendMessage.mock.calls.length - 1][0];

  describe('basic operations', () => {
    it('selectSeat sends SEAT_SELECTION with all required fields', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId);
      const result = ops.selectSeat(10, 'temporary');

      expect(result).toBe(true);
      expect(sendMessage).toHaveBeenCalledTimes(1);
      const msg = getLastCall();
      expect(msg).toMatchObject({
        type: 'SEAT_SELECTION',
        seatId: 10,
        userId,
        userName,
        selectionType: 'temporary',
        tripId,
      });
      expect(msg.timestamp).toBeDefined();
    });

    it('releaseSeat sends SEAT_RELEASED', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId);
      ops.releaseSeat(11);

      expect(sendMessage).toHaveBeenCalledTimes(1);
      const msg = getLastCall();
      expect(msg).toMatchObject({
        type: 'SEAT_RELEASED',
        seatId: 11,
        userId,
        userName,
        tripId,
      });
    });

    it('updateSeatStatus sends SEAT_UPDATE', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId);
      ops.updateSeatStatus(12, 'RESERVED');

      const msg = getLastCall();
      expect(msg).toMatchObject({
        type: 'SEAT_UPDATE',
        seatId: 12,
        status: 'RESERVED',
        tripId,
      });
    });
  });

  describe('representative operations', () => {
    it('selectSeatForRepresentative generates synthetic userId and sends SEAT_TEMP_RESERVE', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId, companyName);
      ops.selectSeatForRepresentative(20, 0, 'Rep One');

      const msg = getLastCall();
      expect(msg.type).toBe('SEAT_TEMP_RESERVE');
      expect(msg.seatId).toBe(20);
      expect(msg.userId).toMatch(new RegExp(`^${userId}-company-.*-rep-0$`));
      expect(msg.userName).toBe('Acme Corp - Rep One');
      expect(msg.representativeName).toBe('Rep One');
      expect(msg.reservationType).toBe('representative');
      expect(msg.tripId).toBe(tripId);
      expect(msg.sessionId).toBeDefined();
    });

    it('reuses the same sessionId across multiple representative selections', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId, companyName);
      ops.selectSeatForRepresentative(21, 0, 'Rep One');
      const sessionId1 = getLastCall().sessionId;

      ops.selectSeatForRepresentative(22, 1, 'Rep Two');
      const sessionId2 = getLastCall().sessionId;

      expect(sessionId1).toBe(sessionId2);
    });

    it('stores representative reservation in sessionStorage', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId, companyName);
      ops.selectSeatForRepresentative(23, 2, 'Rep Three');

      const key = `representative-seats-${userId}-${tripId}`;
      const stored = JSON.parse(sessionStorage.getItem(key) || '{}');
      expect(stored[2]).toMatchObject({
        seatId: 23,
        representativeName: 'Rep Three',
      });
    });

    it('releaseSeatForRepresentative with index uses synthetic userId', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId, companyName);
      // First create a session
      ops.selectSeatForRepresentative(24, 0, 'Rep');
      const sessionId = getLastCall().sessionId;

      sendMessage.mockClear();
      ops.releaseSeatForRepresentative(24, 0);

      const msg = getLastCall();
      expect(msg.type).toBe('SEAT_TEMP_RELEASE');
      expect(msg.userId).toBe(`${userId}-company-${sessionId}-rep-0`);
      expect(msg.reservationType).toBe('representative');
      expect(msg.tripId).toBe(tripId);
    });

    it('releaseSeatForRepresentative without index uses base userId', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId, companyName);
      ops.releaseSeatForRepresentative(25);

      const msg = getLastCall();
      expect(msg.type).toBe('SEAT_TEMP_RELEASE');
      expect(msg.userId).toBe(userId);
      expect(msg.reservationType).toBe('representative');
    });
  });

  describe('purchase operations', () => {
    it('confirmPurchase sends SOLD update for each seat', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId);
      ops.confirmPurchase([30, 31, 32]);

      expect(sendMessage).toHaveBeenCalledTimes(3);
      const calls = (sendMessage.mock.calls as any[][]).map(c => c[0]);
      expect(calls[0]).toMatchObject({ type: 'SEAT_UPDATE', seatId: 30, status: 'SOLD' });
      expect(calls[1]).toMatchObject({ type: 'SEAT_UPDATE', seatId: 31, status: 'SOLD' });
      expect(calls[2]).toMatchObject({ type: 'SEAT_UPDATE', seatId: 32, status: 'SOLD' });
    });

    it('returns false if any confirmPurchase send fails', () => {
      const failingSend = vi.fn(() => false);
      const ops = new SeatOperations(failingSend, userId, userName, tripId);
      const result = ops.confirmPurchase([40]);

      expect(result).toBe(false);
    });
  });

  describe('bulk operations', () => {
    it('releaseAllTemporaryReservations sends SEAT_TEMP_RELEASE_ALL', () => {
      const ops = new SeatOperations(sendMessage, userId, userName, tripId);
      ops.releaseAllTemporaryReservations();

      const msg = getLastCall();
      expect(msg).toMatchObject({
        type: 'SEAT_TEMP_RELEASE_ALL',
        userId,
        userName,
        tripId,
      });
    });
  });
});
