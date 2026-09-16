// src/services/seatReservation.service.ts
import api from '../config/api';
import { asApiError } from '../utils/errorHandler';

export interface TempSeatReservation {
  trip_id: number;
  seat_number: string;
  reserved_for: string; // Identificador temporal (ej: "temp_representative_1")
  duration_minutes?: number; // Duración de la reserva temporal (default: 10 min)
}

export interface SeatReservationResponse {
  success: boolean;
  reservation_id?: string;
  expires_at?: string;
  message?: string;
}

class SeatReservationService {
  // Crear reserva temporal para un asiento
  async createTempReservation(data: TempSeatReservation): Promise<SeatReservationResponse> {
    try {
      const response = await api.post('/operations/seats/temp-reserve', {
        ...data,
        duration_minutes: data.duration_minutes || 10 // 10 minutos por defecto
      });
      return response.data;
    } catch (error) {
      const apiError = asApiError(error);
      console.error('Error creando reserva temporal:', error);
      throw new Error(apiError.response?.data?.message || 'Error al reservar asiento temporalmente');
    }
  }

  // Liberar reserva temporal
  async releaseTempReservation(tripId: number, seatNumber: string): Promise<void> {
    try {
      await api.delete(`/operations/seats/temp-reserve/${tripId}/${seatNumber}`);
    } catch (error) {
      console.error('Error liberando reserva temporal:', error);
      // No lanzamos error aquí para no interrumpir el flujo
    }
  }

  // Confirmar reservas temporales (convertir a definitivas)
  async confirmTempReservations(tripId: number, seatNumbers: string[]): Promise<void> {
    try {
      await api.post(`/operations/seats/confirm-temp-reservations`, {
        trip_id: tripId,
        seat_numbers: seatNumbers
      });
    } catch (error) {
      const apiError = asApiError(error);
      console.error('Error confirmando reservas:', error);
      throw new Error(apiError.response?.data?.message || 'Error al confirmar reservas de asientos');
    }
  }

  // Liberar todas las reservas temporales de un viaje para un usuario
  async releaseAllTempReservations(tripId: number, reservedFor: string): Promise<void> {
    try {
      await api.delete(`/operations/seats/temp-reserve-all/${tripId}/${reservedFor}`);
    } catch (error) {
      console.error('Error liberando todas las reservas temporales:', error);
    }
  }

  // Extender tiempo de reserva temporal
  async extendTempReservation(tripId: number, seatNumber: string, additionalMinutes: number = 5): Promise<void> {
    try {
      await api.patch(`/operations/seats/temp-reserve/${tripId}/${seatNumber}/extend`, {
        additional_minutes: additionalMinutes
      });
    } catch (error) {
      console.error('Error extendiendo reserva temporal:', error);
      throw new Error('Error al extender tiempo de reserva');
    }
  }
}

export const seatReservationService = new SeatReservationService();
