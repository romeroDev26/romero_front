// src/features/fluvial/types/reservation.types.ts
import { SeatReservation } from '../../../types';

/**
 * Enhanced reservation interface for WebSocket synchronization
 * Extends the base SeatReservation with additional fields needed for real-time sync
 */
export interface ReservationToConfirm extends SeatReservation {
    // WebSocket synchronization fields
    seatId?: number; // ID del asiento en el mapa de asientos
    seatNumber: string; // Número del asiento (requerido para confirmación)
    tripId: number; // ID del viaje (requerido para WebSocket)

    // Estado de sincronización
    requiresWebSocketSync?: boolean; // Si requiere sincronización con WebSocket
    syncAttempts?: number; // Número de intentos de sincronización
    lastSyncAttempt?: Date; // Último intento de sincronización
}

/**
 * Result of reservation synchronization with WebSocket
 */
export interface ReservationSyncResult {
    success: boolean;
    seatId?: number;
    conflictDetails?: {
        currentUserId: string;
        currentUserName: string;
        conflictType: 'occupied' | 'reserved' | 'processing' | 'expired';
        message: string;
    };
    error?: string;
}

/**
 * Validation result for reservation state
 */
export interface ReservationValidationResult {
    isValid: boolean;
    canProceed: boolean;
    issues: Array<{
        type: 'warning' | 'error';
        code: 'SEAT_OCCUPIED' | 'RESERVATION_EXPIRED' | 'SEAT_NOT_FOUND' | 'TRIP_MISMATCH';
        message: string;
        suggestedAction?: string;
    }>;
}

/**
 * Enhanced reservation status including sync states
 */
export type EnhancedReservationStatus =
    | 'RESERVED'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'SYNCING'      // En proceso de sincronización con WebSocket
    | 'SYNC_FAILED'  // Falló la sincronización
    | 'PROCESSING';  // Siendo procesado por otro usuario