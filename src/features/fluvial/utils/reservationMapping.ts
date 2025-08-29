// src/features/fluvial/utils/reservationMapping.ts
import { SeatReservation, SeatMapItem } from '../../../types';
import { ReservationToConfirm } from '../types/reservation.types';

/**
 * Utility functions for mapping between reservation types and seat map items
 */
export class ReservationMappingUtils {
  /**
   * Convert a SeatReservation to ReservationToConfirm with WebSocket sync fields
   */
  static toReservationToConfirm(
    reservation: SeatReservation,
    seatMap?: SeatMapItem[]
  ): ReservationToConfirm {
    // Find the corresponding seat in the seat map if available
    const seatId = seatMap?.find(seat =>
      seat.seat_number === reservation.seat_number &&
      seat.trip_id === reservation.trip_id
    )?.id;

    return {
      ...reservation,
      seatId,
      seatNumber: reservation.seat_number || '', // Ensure seatNumber is always defined
      tripId: reservation.trip_id,
      requiresWebSocketSync: true,
      syncAttempts: 0,
      lastSyncAttempt: undefined
    };
  }

  /**
   * Find a seat in the seat map by reservation data
   */
  static findSeatByReservation(
    reservation: ReservationToConfirm,
    seatMap: SeatMapItem[]
  ): SeatMapItem | null {
    // First try to find by seatId if available
    if (reservation.seatId) {
      const seatById = seatMap.find(seat => seat.id === reservation.seatId);
      if (seatById) return seatById;
    }

    // Fallback to finding by seat number and trip
    return seatMap.find(seat =>
      seat.seat_number === reservation.seatNumber &&
      seat.trip_id === reservation.tripId
    ) || null;
  }

  /**
   * Check if a reservation matches a seat map item
   */
  static doesReservationMatchSeat(
    reservation: ReservationToConfirm,
    seat: SeatMapItem
  ): boolean {
    return (
      seat.trip_id === reservation.tripId &&
      seat.seat_number === reservation.seatNumber &&
      (reservation.seatId === undefined || seat.id === reservation.seatId)
    );
  }

  /**
   * Update reservation with seat mapping information
   */
  static updateReservationWithSeatInfo(
    reservation: ReservationToConfirm,
    seat: SeatMapItem
  ): ReservationToConfirm {
    return {
      ...reservation,
      seatId: seat.id,
      seatNumber: seat.seat_number,
      tripId: seat.trip_id
    };
  }

  /**
   * Check if reservation needs WebSocket synchronization
   */
  static needsWebSocketSync(reservation: ReservationToConfirm): boolean {
    return (
      reservation.requiresWebSocketSync === true &&
      reservation.status === 'RESERVED' &&
      !!reservation.seatNumber &&
      !!reservation.tripId
    );
  }

  /**
   * Mark reservation as sync completed
   */
  static markSyncCompleted(
    reservation: ReservationToConfirm,
    success: boolean
  ): ReservationToConfirm {
    return {
      ...reservation,
      requiresWebSocketSync: success ? false : true,
      syncAttempts: (reservation.syncAttempts || 0) + 1,
      lastSyncAttempt: new Date()
    };
  }
}