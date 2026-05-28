// src/features/fluvial/types/websocket.types.ts
import { SeatOccupantInfo } from '../../../types';

// Interfaces específicas para el INITIAL_STATE mejorado
export interface SelectionSeat {
  seatId: number;
  userId: string;
  userName: string;
  timestamp: string;
  status: 'SEAT_SELECTION';
}

export interface OccupiedSeat {
  seatId: number;
  userId: string;
  userName: string;
  timestamp: string;
  status: 'OCCUPIED';
  invoiceId: number;
}

export interface SeatUpdateMessage {
  type: 'SEAT_UPDATE' | 'SEAT_SELECTION' | 'SEAT_RELEASED' | 'INITIAL_STATE' | 'PONG'
        | 'SEAT_TEMP_RESERVE' | 'SEAT_TEMP_RELEASE' | 'SEAT_TEMP_RESERVE_RESPONSE'
        | 'SEAT_TEMP_RESERVED' | 'SEAT_TEMP_RELEASED' | 'SEAT_TEMP_RELEASE_ALL'
        | 'SEATS_OCCUPIED' | 'SEAT_MAP_UPDATE' | 'SEAT_RESERVED';
  tripId: number;
  seatId?: number;
  seatIds?: number[];
  seats?: Array<{ seatId: number; userId: string; userName: string; status?: string }>;
  // Nuevos campos para INITIAL_STATE mejorado
  selecctionSeats?: SelectionSeat[];
  occupiedSeats?: OccupiedSeat[];
  status?: string;
  userId?: string;
  userName?: string;
  companyName?: string;
  representativeIndex?: number;
  representativeName?: string;
  timestamp: string;
  reservationType?: 'user' | 'representative' | 'REPRESENTATIVE_TEMP_RESERVATION';
  reservationCategory?: string; // NUEVO: Campo adicional del backend
  expiresAt?: string; // NUEVO: Timestamp de expiración
  sessionId?: string; // NUEVO: ID de sesión de empresa
  ttl?: number;
  success?: boolean;
  error?: string;
  // NUEVO: Diccionario de occupants indexado por seatId (string) para SEATS_OCCUPIED
  occupants?: Record<string, SeatOccupantInfo>;
}

export interface SeatSelection {
  seatId: number;
  userId: string;
  userName: string;
  timestamp: string;
  type?: 'temporary' | 'reserved' | 'purchasing' | 'representative' | 'temp_reserved';
  companyName?: string;
  representativeIndex?: number;
  representativeName?: string;
  ttl?: number;
  expiresAt?: string;
}

export interface WebSocketConfig {
  tripId: number;
  userId: string;
  userName: string;
  enabled?: boolean;
  maxReconnectAttempts?: number;
  companyName?: string;
  isCompanyMode?: boolean;
}

export interface SeatMapRealtimeOptions extends WebSocketConfig {
  seatSelectionTimeout?: number;
  cleanupInterval?: number;
  enableDebugLogs?: boolean;
  purchaseTimeout?: number;
  onPurchaseTimeoutExpired?: () => void;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';
