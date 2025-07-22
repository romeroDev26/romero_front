// src/services/seatValidation.service.ts
import api from '../config/api';

export interface SeatValidationResponse {
  isAvailable: boolean;
  reason?: string;
  conflictDetails?: {
    occupiedBy: string;
    occupiedAt: string;
    invoiceNumber?: string;
  };
}

export interface ValidateSeatRequest {
  tripId: number;
  seatId: number;
  userId: string;
}

class SeatValidationService {
  private basePath = '/seat-validation';

  /**
   * Valida si un asiento está disponible antes de proceder con la venta
   */
  async validateSeatAvailability(request: ValidateSeatRequest): Promise<SeatValidationResponse> {
    try {
      const response = await api.post<SeatValidationResponse>(
        `${this.basePath}/validate`,
        request
      );
      return response.data;
    } catch (error: any) {
      console.error('Error validando disponibilidad del asiento:', error);
      
      // Si hay error del servidor, interpretamos la respuesta
      if (error.response?.status === 409) {
        // Conflicto - asiento ya ocupado
        return {
          isAvailable: false,
          reason: error.response.data?.message || 'El asiento seleccionado ya no está disponible',
          conflictDetails: error.response.data?.conflictDetails
        };
      }
      
      throw error;
    }
  }

  /**
   * Reserva temporalmente un asiento por unos minutos durante el proceso de venta
   */
  async reserveSeatTemporarily(request: ValidateSeatRequest): Promise<{ success: boolean; expiresAt?: string }> {
    try {
      const response = await api.post<{ success: boolean; expiresAt: string }>(
        `${this.basePath}/reserve-temporarily`,
        { ...request, durationMinutes: 5 } // Reserva por 5 minutos
      );
      return response.data;
    } catch (error: any) {
      console.error('Error reservando asiento temporalmente:', error);
      return { success: false };
    }
  }

  /**
   * Libera una reserva temporal de asiento
   */
  async releaseSeatReservation(request: ValidateSeatRequest): Promise<{ success: boolean }> {
    try {
      const response = await api.post<{ success: boolean }>(
        `${this.basePath}/release-reservation`,
        request
      );
      return response.data;
    } catch (error: any) {
      console.error('Error liberando reserva temporal:', error);
      return { success: false };
    }
  }
}

export const seatValidationService = new SeatValidationService();
