// src/features/fluvial/hooks/useSeatReservations.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { seatReservationService } from '../../../services/seatReservation.service';

interface SeatReservation {
  seatNumber: string;
  reservationId?: string;
  expiresAt?: string;
  representativeIndex: number;
}

export const useSeatReservations = (tripId: number) => {
  const [reservedSeats, setReservedSeats] = useState<SeatReservation[]>([]);
  const [isReserving, setIsReserving] = useState(false);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Reservar asiento temporalmente
  const reserveSeat = useCallback(async (seatNumber: string, representativeIndex: number): Promise<boolean> => {
    setIsReserving(true);
    try {
      const result = await seatReservationService.createTempReservation({
        trip_id: tripId,
        seat_number: seatNumber,
        reserved_for: `${sessionId.current}_rep_${representativeIndex}`,
        duration_minutes: 15 // 15 minutos para completar la venta
      });

      if (result.success) {
        setReservedSeats(prev => [
          ...prev.filter(r => r.representativeIndex !== representativeIndex), // Remover reserva anterior del mismo representante
          {
            seatNumber,
            reservationId: result.reservation_id,
            expiresAt: result.expires_at,
            representativeIndex
          }
        ]);
        return true;
      } else {
        toast.error(result.message || 'No se pudo reservar el asiento');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al reservar asiento');
      return false;
    } finally {
      setIsReserving(false);
    }
  }, [tripId]);

  // Liberar asiento específico
  const releaseSeat = useCallback(async (representativeIndex: number) => {
    const reservation = reservedSeats.find(r => r.representativeIndex === representativeIndex);
    if (!reservation) return;

    try {
      await seatReservationService.releaseTempReservation(tripId, reservation.seatNumber);
      setReservedSeats(prev => prev.filter(r => r.representativeIndex !== representativeIndex));
    } catch (error) {
      console.error('Error liberando asiento:', error);
    }
  }, [tripId, reservedSeats]);

  // Confirmar todas las reservas (al completar venta exitosamente)
  const confirmAllReservations = useCallback(async (): Promise<boolean> => {
    if (reservedSeats.length === 0) return true;

    try {
      const seatNumbers = reservedSeats.map(r => r.seatNumber);
      await seatReservationService.confirmTempReservations(tripId, seatNumbers);
      setReservedSeats([]); // Limpiar reservas locales
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Error al confirmar reservas de asientos');
      return false;
    }
  }, [tripId, reservedSeats]);

  // Liberar todas las reservas (al cancelar o error)
  const releaseAllReservations = useCallback(async () => {
    if (reservedSeats.length === 0) return;

    try {
      await seatReservationService.releaseAllTempReservations(tripId, sessionId.current);
      setReservedSeats([]);
    } catch (error) {
      console.error('Error liberando todas las reservas:', error);
    }
  }, [tripId, reservedSeats]);

  // Extender tiempo de reservas
  const extendReservations = useCallback(async (additionalMinutes: number = 5) => {
    try {
      const promises = reservedSeats.map(reservation =>
        seatReservationService.extendTempReservation(tripId, reservation.seatNumber, additionalMinutes)
      );
      await Promise.all(promises);
      toast.success('Tiempo de reserva extendido');
    } catch (error: any) {
      toast.error('Error al extender tiempo de reserva');
    }
  }, [tripId, reservedSeats]);

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      // Liberar reservas al salir del componente
      if (reservedSeats.length > 0) {
        seatReservationService.releaseAllTempReservations(tripId, sessionId.current);
      }
    };
  }, [tripId, reservedSeats]);

  // Obtener asientos ocupados por este usuario
  const getReservedSeatNumbers = useCallback(() => {
    return reservedSeats.map(r => r.seatNumber);
  }, [reservedSeats]);

  // Verificar si un asiento está reservado por este usuario
  const isSeatReservedByUser = useCallback((seatNumber: string) => {
    return reservedSeats.some(r => r.seatNumber === seatNumber);
  }, [reservedSeats]);

  return {
    reservedSeats,
    isReserving,
    reserveSeat,
    releaseSeat,
    confirmAllReservations,
    releaseAllReservations,
    extendReservations,
    getReservedSeatNumbers,
    isSeatReservedByUser,
    sessionId: sessionId.current
  };
};
