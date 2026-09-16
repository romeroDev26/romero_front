// src/features/fluvial/services/seatOperations.ts

export interface SeatOperationMessage {
  type: string;
  seatId?: number;
  userId?: string;
  userName?: string;
  selectionType?: string;
  status?: string;
  reservationType?: string;
  companyName?: string;
  representativeName?: string;
  representativeIndex?: number;
  timestamp: string;
  tripId?: number; // ← NUEVO: Agregar tripId para que el backend pueda hacer broadcast
  // NUEVO: Campos adicionales para sesión de empresa
  sessionId?: string;
  maxGroupReservations?: number;
}

/**
 * Mensaje saliente por el WebSocket. Las operaciones de asiento usan
 * SeatOperationMessage; el heartbeat manda un PING con su propio payload. Se
 * exige `type` y se deja el resto abierto en lugar de usar `any`.
 */
export type OutgoingWebSocketMessage =
  | SeatOperationMessage
  | { type: string; [key: string]: unknown };

export class SeatOperations {
  private sendMessage: (message: OutgoingWebSocketMessage) => boolean;
  private userId: string;
  private userName: string;
  private companyName?: string;
  private tripId: number; // NUEVO: Agregar tripId

  constructor(
    sendMessage: (message: OutgoingWebSocketMessage) => boolean,
    userId: string,
    userName: string,
    tripId: number, // NUEVO: Agregar tripId al constructor
    companyName?: string
  ) {
    this.sendMessage = sendMessage;
    this.userId = userId;
    this.userName = userName;
    this.tripId = tripId; // NUEVO: Inicializar tripId
    this.companyName = companyName;
  }

  // Operaciones básicas de asientos
  selectSeat(seatId: number, selectionType: 'temporary' | 'reserved' = 'temporary'): boolean {
    const message: SeatOperationMessage = {
      type: 'SEAT_SELECTION',
      seatId,
      userId: this.userId, //  SOLUCIÓN: Asegurar que el userId se envíe
      userName: this.userName, //  SOLUCIÓN: Asegurar que el userName se envíe
      selectionType,
      tripId: this.tripId, // ← NUEVO: Agregar tripId
      timestamp: new Date().toISOString()
    };
    
    return this.sendMessage(message);
  }

  releaseSeat(seatId: number): boolean {
    const message: SeatOperationMessage = {
      type: 'SEAT_RELEASED',
      seatId,
      userId: this.userId, //  SOLUCIÓN: Asegurar que el userId se envíe
      userName: this.userName,
      tripId: this.tripId, // ← NUEVO: Agregar tripId
      timestamp: new Date().toISOString()
    };
    
    return this.sendMessage(message);
  }

  updateSeatStatus(seatId: number, status: string): boolean {
    const message: SeatOperationMessage = {
      type: 'SEAT_UPDATE',
      seatId,
      status,
      tripId: this.tripId, // ← NUEVO: Agregar tripId
      timestamp: new Date().toISOString()
    };
    
    return this.sendMessage(message);
  }

  // Operaciones para representantes
  selectSeatForRepresentative(
    seatId: number, 
    representativeIndex: number, 
    representativeName: string
  ): boolean {
    // Formato exacto que requiere el backend
    const sessionId = this.getOrCreateCompanySessionId();
    const representativeUserId = `${this.userId}-company-${sessionId}-rep-${representativeIndex}`;
    
    const message = {
      type: 'SEAT_TEMP_RESERVE',
      seatId: seatId,
      userId: representativeUserId,
      userName: `${this.companyName || 'Empresa'} - ${representativeName}`,
      representativeName: representativeName,
      sessionId: sessionId,
      reservationType: 'representative',
      tripId: this.tripId // ← NUEVO: Agregar tripId
    };

    this.trackRepresentativeReservation(seatId, representativeIndex, representativeName);
    return this.sendMessage(message);
  }

  private getOrCreateCompanySessionId(): string {
    const storageKey = `company-session-${this.userId}-${this.tripId}`;
    let sessionId = sessionStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  }

  private trackRepresentativeReservation(seatId: number, representativeIndex: number, representativeName: string) {
    const storageKey = `representative-seats-${this.userId}-${this.tripId}`;
    const reservations = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    
    reservations[representativeIndex] = {
      seatId,
      representativeName,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem(storageKey, JSON.stringify(reservations));
  }

  releaseSeatForRepresentative(seatId: number, representativeIndex?: number): boolean {
    // Si se proporciona el índice, usar la misma lógica que para reservar
    if (representativeIndex !== undefined) {
      const sessionId = this.getOrCreateCompanySessionId();
      const representativeUserId = `${this.userId}-company-${sessionId}-rep-${representativeIndex}`;
      const message = {
        type: 'SEAT_TEMP_RELEASE',
        seatId: seatId,
        userId: representativeUserId,
        sessionId: sessionId,
        reservationType: 'representative',
        tripId: this.tripId,
        timestamp: new Date().toISOString()
      };
      
      return this.sendMessage(message);
    } else {
      const message = {
        type: 'SEAT_TEMP_RELEASE',
        seatId: seatId,
        userId: this.userId,
        reservationType: 'representative',
        tripId: this.tripId,
        timestamp: new Date().toISOString()
      };
      
      return this.sendMessage(message);
    }
  }

  // Operaciones de compra
  confirmPurchase(seatIds: number[]): boolean {
    let allSuccess = true;
    
    seatIds.forEach(seatId => {
      const success = this.updateSeatStatus(seatId, 'SOLD');
      if (!success) allSuccess = false;
    });

    return allSuccess;
  }

  // Liberar todas las reservas temporales del usuario
  releaseAllTemporaryReservations(): boolean {
    const message: SeatOperationMessage = {
      type: 'SEAT_TEMP_RELEASE_ALL',
      userId: this.userId,
      userName: this.userName,
      tripId: this.tripId, // ← NUEVO: Agregar tripId
      timestamp: new Date().toISOString()
    };

    return this.sendMessage(message);
  }
}
