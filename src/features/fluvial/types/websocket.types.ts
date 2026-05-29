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

// Representación mínima de un asiento del mapa tal como viene del backend en INITIAL_STATE
export interface SeatMapWsItem {
  id: number;
  seat_number: string;
  status: string;
  // Campos opcionales que puede traer el backend
  trip_id?: number;
  vessel_seat_config_id?: number;
  notes?: string;
  seat_type?: {
    id: number;
    name: string;
    code: string;
    price_multiplier: number;
  };
  occupant?: SeatOccupantInfo;
}

export interface SeatUpdateMessage {
  type: 'SEAT_UPDATE' | 'SEAT_SELECTION' | 'SEAT_RELEASED' | 'INITIAL_STATE' | 'PONG'
        | 'SEAT_TEMP_RESERVE' | 'SEAT_TEMP_RELEASE' | 'SEAT_TEMP_RESERVE_RESPONSE'
        | 'SEAT_TEMP_RESERVED' | 'SEAT_TEMP_RELEASED' | 'SEAT_TEMP_RELEASE_ALL'
        | 'SEATS_OCCUPIED' | 'SEATS_RELEASED' | 'SEAT_MAP_UPDATE' | 'SEAT_RESERVED';
  tripId: number;
  seatId?: number;
  seatIds?: number[];
  seats?: Array<{ seatId: number; userId: string; userName: string; status?: string }>;
  // Nuevos campos para INITIAL_STATE mejorado
  selecctionSeats?: SelectionSeat[];
  occupiedSeats?: OccupiedSeat[];
  // NUEVO: Formato oficial del backend para INITIAL_STATE (array completo de asientos)
  seatMap?: SeatMapWsItem[];
  status?: string;
  userId?: string;
  userName?: string;
  companyName?: string;
  representativeIndex?: number;
  representativeName?: string;
  timestamp: string;
  reservationType?: 'user' | 'representative' | 'REPRESENTATIVE_TEMP_RESERVATION';
  reservationCategory?: string;
  expiresAt?: string;
  sessionId?: string;
  ttl?: number;
  success?: boolean;
  error?: string;
  reason?: string; // NUEVO: Para SEATS_RELEASED (ej. "CANCELLED_RESERVATION", "TIMEOUT")
  // Campos adicionales para SEAT_RESERVED según backend
  seatTypeId?: number;
  reservationId?: number;
  customerId?: number;
  quantity?: number;
  seatNumber?: string;
  // Diccionario de occupants indexado por seatId (string) para SEATS_OCCUPIED
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
