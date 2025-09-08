// src/features/fluvial/services/websocketMessageHandler.ts
import { SeatUpdateMessage, SeatSelection } from '../types/websocket.types';

export class WebSocketMessageHandler {
  private userId: string;
  private onSeatMapUpdate: (seatId: number, status: string) => void;
  private onSelectionUpdate: (selection: SeatSelection) => void;
  private onSelectionRemove: (seatId: number) => void;
  private onInitialState: (selections: SeatSelection[]) => void;
  private confirmedSeats: Set<number> = new Set(); // Rastrear asientos vendidos definitivamente

  constructor(
    userId: string,
    callbacks: {
      onSeatMapUpdate: (seatId: number, status: string) => void;
      onSelectionUpdate: (selection: SeatSelection) => void;
      onSelectionRemove: (seatId: number) => void;
      onInitialState: (selections: SeatSelection[]) => void;
    },
    _enableDebugLogs: boolean = false
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

      case 'PONG':
        break;

      default:
        break;
    }
  }

  private handleInitialState(message: SeatUpdateMessage): void {


    // Procesar selecciones temporales (seats)
    if (message.seats) {
      const initialSelections: SeatSelection[] = message.seats
        .filter(selection => selection.userId !== this.userId)
        .map(selection => ({
          seatId: selection.seatId,
          userId: selection.userId!,
          userName: selection.userName!,
          timestamp: message.timestamp,
          type: 'temporary'
        }));



      this.onInitialState(initialSelections);
    }

    // CORRECCIÓN: Procesar asientos ocupados/vendidos (occupiedSeats)
    if ((message as any).occupiedSeats) {
      const occupiedSeats = (message as any).occupiedSeats;
      


      // Actualizar el estado de cada asiento ocupado a CONFIRMED (rojo)
      occupiedSeats.forEach((occupiedSeat: any) => {
        if (occupiedSeat.seatId) {

          // Agregar al conjunto de asientos confirmados
          this.confirmedSeats.add(occupiedSeat.seatId);
          this.onSeatMapUpdate(occupiedSeat.seatId, 'CONFIRMED');
        }
      });
    }


  }

  private handleSeatUpdate(message: SeatUpdateMessage): void {


    if (message.seatId !== undefined && message.status) {
      this.onSeatMapUpdate(message.seatId, message.status);
      this.onSelectionRemove(message.seatId);
    }
  }

  private handleSeatSelection(message: SeatUpdateMessage): void {


    if (message.userId !== this.userId && message.seatId !== undefined) {
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


    if (message.userId !== this.userId && message.seatId !== undefined) {
      // No liberar asientos que han sido vendidos definitivamente
      if (this.confirmedSeats.has(message.seatId)) {
        return;
      }
      
      this.onSelectionRemove(message.seatId);
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

    const shouldAddSelection = isRepresentativeReservation || (message.userId !== this.userId);

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


    if (message.userId !== this.userId && message.seatId !== undefined) {
      this.onSelectionRemove(message.seatId);
    }
  }

  private handleSeatsOccupied(message: SeatUpdateMessage): void {


    // Marcar los asientos como vendidos definitivamente (CONFIRMED)
    if (message.seatIds && Array.isArray(message.seatIds)) {
      message.seatIds.forEach((seatId: number) => {

        // Agregar al conjunto de asientos confirmados
        this.confirmedSeats.add(seatId);
        // Actualizar el estado del asiento a CONFIRMED (rojo)
        this.onSeatMapUpdate(seatId, 'CONFIRMED');
        // Remover cualquier selección temporal de este asiento
        this.onSelectionRemove(seatId);
      });
    }
  }

  private showReserveError(message: SeatUpdateMessage): void {
    const errorMessage = message.error || 'Este asiento ya no está disponible';

    setTimeout(() => {
      import('react-toastify').then(({ toast }) => {
        toast.error(`Asiento ${message.seatId}: ${errorMessage}`, {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }).catch(() => {

      });
    }, 50);
  }
}
