// src/features/fluvial/services/websocketMessageHandler.ts
import { SeatUpdateMessage, SeatSelection } from '../types/websocket.types';

export class WebSocketMessageHandler {
  private userId: string;
  private onSeatMapUpdate: (seatId: number, status: string) => void;
  private onSelectionUpdate: (selection: SeatSelection) => void;
  private onSelectionRemove: (seatId: number) => void;
  private onInitialState: (selections: SeatSelection[]) => void;
  private enableDebugLogs: boolean;

  constructor(
    userId: string,
    callbacks: {
      onSeatMapUpdate: (seatId: number, status: string) => void;
      onSelectionUpdate: (selection: SeatSelection) => void;
      onSelectionRemove: (seatId: number) => void;
      onInitialState: (selections: SeatSelection[]) => void;
    },
    enableDebugLogs: boolean = false
  ) {
    this.userId = userId;
    this.onSeatMapUpdate = callbacks.onSeatMapUpdate;
    this.onSelectionUpdate = callbacks.onSelectionUpdate;
    this.onSelectionRemove = callbacks.onSelectionRemove;
    this.onInitialState = callbacks.onInitialState;
    this.enableDebugLogs = enableDebugLogs;
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

      case 'PONG':
        // Confirmación de conexión activa
        break;

      default:
        // Tipo de mensaje no manejado - silencioso en producción
        break;
    }
  }

  private handleInitialState(message: SeatUpdateMessage): void {
    if (message.seats) {
      const initialSelections: SeatSelection[] = message.seats
        .filter(selection => selection.userId !== this.userId)
        .map(selection => ({
          seatId: selection.seatId,
          userId: selection.userId,
          userName: selection.userName,
          timestamp: message.timestamp,
          type: 'temporary'
        }));

      this.onInitialState(initialSelections);
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
      this.onSelectionRemove(message.seatId);
    }
  }

  private handleTempReserveResponse(message: SeatUpdateMessage): void {
    if (message.seatId !== undefined) {
      if (!message.success) {
        // Solo mostrar error al usuario, log detallado opcional
        this.showReserveError(message);
      }
      // Success case: no necesitamos log, la UI se actualiza automáticamente
    }
  }

  private handleTempReserved(message: SeatUpdateMessage): void {
    // Para reservas de representantes, siempre agregar a selecciones
    // incluso si el userId base es el mismo, porque es para mostrar a otros vendedores
    const isRepresentativeReservation = message.reservationType === 'REPRESENTATIVE_TEMP_RESERVATION' || 
                                       message.reservationType === 'representative' ||
                                       (message as any).reservationCategory === 'representative';
    
    // Para representantes, SIEMPRE mostrar en el mapa (propios y ajenos)
    // Para otras selecciones, solo mostrar las de otros usuarios
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

  private showReserveError(message: SeatUpdateMessage): void {
    const errorMessage = message.error || 'Este asiento ya no está disponible';
    
    // Mostrar notificación al usuario
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
        // Fallback silencioso
        if (this.enableDebugLogs) {
          console.error(`Asiento ${message.seatId}: ${errorMessage}`);
        }
      });
    }, 50);
  }
}
