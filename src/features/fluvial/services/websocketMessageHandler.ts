// src/features/fluvial/services/websocketMessageHandler.ts
import { SeatUpdateMessage, SeatSelection, SelectionSeat, OccupiedSeat } from '../types/websocket.types';
import { SeatOccupantInfo } from '../../../types';

export class WebSocketMessageHandler {
  private userId: string;
  private onSeatMapUpdate: (seatId: number, status: string, occupant?: SeatOccupantInfo) => void;
  private onSelectionUpdate: (selection: SeatSelection) => void;
  private onSelectionRemove: (seatId: number, sourceUserId?: string) => void;
  private onInitialState: (selections: SeatSelection[]) => void;
  private confirmedSeats: Set<number> = new Set(); // Rastrear asientos vendidos definitivamente

  constructor(
    userId: string,
    callbacks: {
      onSeatMapUpdate: (seatId: number, status: string, occupant?: SeatOccupantInfo) => void;
      onSelectionUpdate: (selection: SeatSelection) => void;
      onSelectionRemove: (seatId: number, sourceUserId?: string) => void;
      onInitialState: (selections: SeatSelection[]) => void;
    }
  ) {
    this.userId = userId;
    this.onSeatMapUpdate = callbacks.onSeatMapUpdate;
    this.onSelectionUpdate = callbacks.onSelectionUpdate;
    this.onSelectionRemove = callbacks.onSelectionRemove;
    this.onInitialState = callbacks.onInitialState;
  }

  handleMessage(message: SeatUpdateMessage): void {
    switch (message.type) {
      case 'INITIAL_STATE':
        this.handleInitialState(message);
        break;

      case 'SEAT_UPDATE':
        this.handleSeatUpdate(message);
        break;

      case 'SEAT_SELECTION':
        this.handleSeatSelection(message);
        break;

      case 'SEAT_RELEASED':
        this.handleSeatReleased(message);
        break;

      case 'SEAT_TEMP_RESERVE_RESPONSE':
        this.handleTempReserveResponse(message);
        break;

      case 'SEAT_TEMP_RESERVED':
        this.handleTempReserved(message);
        break;

      case 'SEAT_TEMP_RELEASED':
        this.handleTempReleased(message);
        break;

      case 'SEATS_OCCUPIED':
        this.handleSeatsOccupied(message);
        break;

      case 'SEAT_MAP_UPDATE':
        this.handleSeatMapUpdate(message);
        break;

      case 'SEAT_RESERVED':
        this.handleSeatReserved(message);
        break;

      case 'PONG':
        break;

      default:
        break;
    }
  }

  private handleInitialState(message: SeatUpdateMessage): void {
    // Procesar selecciones temporales usando el nuevo formato selecctionSeats
    if (message.selecctionSeats && message.selecctionSeats.length > 0) {
      const initialSelections: SeatSelection[] = message.selecctionSeats
        .filter((selection: SelectionSeat) => {
          //  CORRECCIÓN: Filtrar por userId base
          const selectionBaseUserId = selection.userId.split('-company-')[0];
          return selectionBaseUserId !== this.userId;
        })
        .map((selection: SelectionSeat) => ({
          seatId: selection.seatId,
          userId: selection.userId,
          userName: selection.userName,
          timestamp: selection.timestamp,
          type: 'temporary'
        }));

      if (initialSelections.length > 0) {
        this.onInitialState(initialSelections);
      }
    }

    // Procesar asientos ocupados/vendidos usando el nuevo formato occupiedSeats
    if (message.occupiedSeats && message.occupiedSeats.length > 0) {
      message.occupiedSeats.forEach((occupiedSeat: OccupiedSeat) => {
        if (occupiedSeat.seatId) {
          // Agregar al conjunto de asientos confirmados
          this.confirmedSeats.add(occupiedSeat.seatId);
          // Extraer occupant si existe en el payload
          const occupant = message.occupants?.[String(occupiedSeat.seatId)];
          // Actualizar el estado del asiento a CONFIRMED (rojo) para asientos vendidos
          this.onSeatMapUpdate(occupiedSeat.seatId, 'CONFIRMED', occupant);
        }
      });
    }

    // Mantener compatibilidad con el formato anterior (seats) por si acaso
    if (message.seats && (!message.selecctionSeats || message.selecctionSeats.length === 0)) {
      const initialSelections: SeatSelection[] = message.seats
        .filter(selection => {
          // CORRECCIÓN: Filtrar por userId base
          const selectionBaseUserId = selection.userId?.split('-company-')[0] || '';
          return selectionBaseUserId !== this.userId;
        })
        .map(selection => ({
          seatId: selection.seatId,
          userId: selection.userId!,
          userName: selection.userName!,
          timestamp: message.timestamp,
          type: 'temporary'
        }));

      if (initialSelections.length > 0) {
        this.onInitialState(initialSelections);
      }
    }
  }

  private handleSeatUpdate(message: SeatUpdateMessage): void {
    if (message.seatId !== undefined && message.status) {
      // Si el asiento esta vendido/confirmado, agregarlo a confirmedSeats
      // para protegerlo de ser liberado accidentalmente por otros eventos
      const confirmedStatuses = ['SOLD', 'CONFIRMED', 'OCCUPIED'];
      if (confirmedStatuses.includes(message.status.toUpperCase())) {
        this.confirmedSeats.add(message.seatId);
      }
      
      this.onSeatMapUpdate(message.seatId, message.status);
      this.onSelectionRemove(message.seatId);
    }
  }

  private handleSeatSelection(message: SeatUpdateMessage): void {
    // Comparar userId base
    const messageBaseUserId = message.userId?.split('-company-')[0] || '';
    const isFromDifferentUser = messageBaseUserId !== this.userId;
    
    if (isFromDifferentUser && message.seatId !== undefined) {
      const selection: SeatSelection = {
        seatId: message.seatId,
        userId: message.userId!,
        userName: message.userName!,
        timestamp: message.timestamp,
        type: 'temporary'
      };

      this.onSelectionUpdate(selection);
    }
  }

  private handleSeatReleased(message: SeatUpdateMessage): void {
    if (message.seatId !== undefined) {
      // No liberar asientos que han sido vendidos definitivamente
      if (this.confirmedSeats.has(message.seatId)) {
        return;
      }
      
      // Procesar liberaciones, pasando el sourceUserId para validación
      this.onSelectionRemove(message.seatId, message.userId);
    }
  }

  private handleTempReserveResponse(message: SeatUpdateMessage): void {
    if (message.seatId !== undefined) {
      if (!message.success) {
        this.showReserveError(message);
      }
    }
  }

  private handleTempReserved(message: SeatUpdateMessage): void {
    const isRepresentativeReservation = message.reservationType === 'REPRESENTATIVE_TEMP_RESERVATION' ||
                                       message.reservationType === 'representative' ||
                                       (message as any).reservationCategory === 'representative';

    // Extraer userId base para comparar correctamente
    // Los representantes tienen userId como "user123-company-session-rep-0", 
    // necesitamos comparar solo el userId base "user123"
    const messageBaseUserId = message.userId?.split('-company-')[0] || '';
    const isFromDifferentUser = messageBaseUserId !== this.userId;
    
    // Solo agregar si es de un usuario diferente
    const shouldAddSelection = isFromDifferentUser;

    if (shouldAddSelection && message.seatId !== undefined) {
      const expiresAt = new Date(Date.now() + (message.ttl || 1800) * 1000).toISOString();

      const selection: SeatSelection = {
        seatId: message.seatId,
        userId: message.userId!,
        userName: message.userName!,
        timestamp: message.timestamp,
        type: isRepresentativeReservation ? 'representative' : 'temp_reserved',
        ttl: message.ttl,
        expiresAt: expiresAt,
        companyName: message.companyName,
        representativeName: message.representativeName,
        representativeIndex: message.representativeIndex
      };

      this.onSelectionUpdate(selection);
    }
  }

  private handleTempReleased(message: SeatUpdateMessage): void {
    // Procesar liberaciones temporales
    if (message.seatId !== undefined) {
      // No liberar asientos que han sido vendidos definitivamente
      if (this.confirmedSeats.has(message.seatId)) {
        return;
      }
      
      // Procesar liberación pasando el sourceUserId para validación
      this.onSelectionRemove(message.seatId, message.userId);
    }
  }

  private handleSeatsOccupied(message: SeatUpdateMessage): void {
    // Marcar los asientos como vendidos definitivamente (CONFIRMED)
    if (message.seatIds && Array.isArray(message.seatIds)) {
      message.seatIds.forEach((seatId: number) => {
        // Agregar al conjunto de asientos confirmados
        this.confirmedSeats.add(seatId);
        // Extraer occupant del payload si existe (indexado por seatId como string)
        const occupant = message.occupants?.[String(seatId)];
        // Actualizar el estado del asiento a CONFIRMED (rojo) + datos del pasajero
        this.onSeatMapUpdate(seatId, 'CONFIRMED', occupant);
        // Remover cualquier seleccion temporal de este asiento
        this.onSelectionRemove(seatId);
      });
    }
  }

  private handleSeatMapUpdate(message: SeatUpdateMessage): void {
    // Procesar actualizacion masiva del mapa de asientos
    // El backend envia esto despues de una venta para sincronizar el estado
    if (message.seats && Array.isArray(message.seats)) {
      message.seats.forEach((seat) => {
        if (seat.seatId && seat.status) {
          // Si el asiento esta vendido/ocupado, agregarlo a confirmedSeats
          const confirmedStatuses = ['SOLD', 'CONFIRMED', 'OCCUPIED'];
          if (confirmedStatuses.includes(seat.status.toUpperCase())) {
            this.confirmedSeats.add(seat.seatId);
          }
          this.onSeatMapUpdate(seat.seatId, seat.status);
          this.onSelectionRemove(seat.seatId);
        }
      });
    }
    
    // Tambien puede venir con seatId individual
    if (message.seatId !== undefined && message.status) {
      const confirmedStatuses = ['SOLD', 'CONFIRMED', 'OCCUPIED'];
      if (confirmedStatuses.includes(message.status.toUpperCase())) {
        this.confirmedSeats.add(message.seatId);
      }
      this.onSeatMapUpdate(message.seatId, message.status);
      this.onSelectionRemove(message.seatId);
    }
  }

  private handleSeatReserved(message: SeatUpdateMessage): void {
    // Procesar reserva confirmada en tiempo real
    // Payload: { type: 'SEAT_RESERVED', tripId, seatId, seatNumber, reservationId, customerId, quantity, seatTypeId, timestamp }
    if (message.seatId !== undefined) {
      this.onSeatMapUpdate(message.seatId, 'RESERVED');
      this.onSelectionRemove(message.seatId);
    }
  }

  private showReserveError(message: SeatUpdateMessage): void {
    const errorMessage = message.error || 'Este asiento ya no está disponible';

    setTimeout(() => {
      import('@/utils/sileo-toast').then(({ toast }) => {
        toast.error(`Asiento ${message.seatId}: ${errorMessage}`, {
          position: 'top-right',
          autoClose: 4000,
        });
      }).catch(() => {
        // Silenciar error de importación
      });
    }, 50);
  }
}
