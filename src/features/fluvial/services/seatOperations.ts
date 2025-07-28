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
}

export class SeatOperations {
  private sendMessage: (message: any) => boolean;
  private userId: string;
  private userName: string;
  private companyName?: string;

  constructor(
    sendMessage: (message: any) => boolean,
    userId: string,
    userName: string,
    companyName?: string
  ) {
    this.sendMessage = sendMessage;
    this.userId = userId;
    this.userName = userName;
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
      timestamp: new Date().toISOString()
    };
    
    return this.sendMessage(message);
  }

  releaseSeat(seatId: number): boolean {
    const message: SeatOperationMessage = {
      type: 'SEAT_RELEASED',
      seatId,
      userId: this.userId, //  SOLUCIÓN: Asegurar que el userId se envíe
      userName: this.userName, // SOLUCIÓN: Asegurar que el userName se envíe
      timestamp: new Date().toISOString()
    };
    
    return this.sendMessage(message);
  }

  updateSeatStatus(seatId: number, status: string): boolean {
    const message: SeatOperationMessage = {
      type: 'SEAT_UPDATE',
      seatId,
      status,
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
    // Primero liberar cualquier reserva temporal previa
    const releaseMessage: SeatOperationMessage = {
      type: 'SEAT_TEMP_RELEASE_ALL',
      userId: this.userId,
      userName: this.userName,
      timestamp: new Date().toISOString()
    };

    this.sendMessage(releaseMessage);

    // Pequeño delay para asegurar que el backend procese la liberación
    setTimeout(() => {
      const message: SeatOperationMessage = {
        type: 'SEAT_TEMP_RESERVE',
        seatId,
        reservationType: 'representative',
        companyName: this.companyName || 'Empresa',
        representativeName: representativeName,
        representativeIndex: representativeIndex,
        userId: this.userId,
        userName: `${this.companyName || 'Empresa'} - ${representativeName}`,
        timestamp: new Date().toISOString()
      };

      this.sendMessage(message);
    }, 100);

    return true;
  }

  releaseSeatForRepresentative(seatId: number): boolean {
    const message: SeatOperationMessage = {
      type: 'SEAT_TEMP_RELEASE',
      seatId,
      reservationType: 'representative',
      userId: this.userId,
      userName: this.userName,
      timestamp: new Date().toISOString()
    };

    const success = this.sendMessage(message);
    return success;
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
      timestamp: new Date().toISOString()
    };

    return this.sendMessage(message);
  }
}
