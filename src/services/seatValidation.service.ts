// src/services/seatValidation.service.ts
import api from '../config/api';
import { asApiError } from '../utils/errorHandler';

export interface SeatValidationResponse {
  isAvailable: boolean;
  reason?: string;
  conflictDetails?: {
    occupiedBy: string;
    occupiedAt: string;
    invoiceNumber?: string;
  };
}

/**
 * Cuerpo que devuelve el backend en un 409 al validar un asiento: ademas del
 * mensaje trae el detalle de quien lo ocupa. Es especifico de este endpoint,
 * asi que no vive en el ApiError compartido.
 */
interface SeatConflictErrorData {
  message?: string;
  conflictDetails?: SeatValidationResponse['conflictDetails'];
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
    } catch (error) {
      const apiError = asApiError(error);
      console.error('Error validando disponibilidad del asiento:', error);
      
      // Si hay error del servidor, interpretamos la respuesta
      if (apiError.response?.status === 409) {
        // Conflicto - asiento ya ocupado
        const conflictData = apiError.response.data as SeatConflictErrorData | undefined;
        return {
          isAvailable: false,
          reason: conflictData?.message || 'El asiento seleccionado ya no está disponible',
          conflictDetails: conflictData?.conflictDetails
        };
      }
      
      throw error;
    }
  }

  /**
   * Reserva temporalmente un asiento por unos minutos durante el proceso de venta
   * NOTA: El backend no tiene endpoint separado para reserva temporal,
   * la validación maneja esto internamente
   */
  async reserveSeatTemporarily(request: ValidateSeatRequest): Promise<{ success: boolean; expiresAt?: string }> {
    try {
      // El backend maneja la reserva temporal durante la validación
      // Por ahora, simplemente validamos nuevamente
      const validation = await this.validateSeatAvailability(request);
      return { 
        success: validation.isAvailable,
        expiresAt: validation.isAvailable ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : undefined
      };
    } catch (error) {
      console.error('Error en reserva temporal (usando validación):', error);
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
        {
          tripId: request.tripId,
          seatId: request.seatId
          // Nota: userId no es requerido por el backend según las instrucciones
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error liberando reserva temporal:', error);
      return { success: false };
    }
  }
}

export const seatValidationService = new SeatValidationService();
