// src/features/fluvial/hooks/useSeatReservations.ts
// MODIFICADO: Este hook ahora usa SOLO WebSocket para reservas temporales
// ya que el endpoint de API REST no existe en el backend

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

interface SeatReservation {
  seatNumber: string;
  seatId: number; // ID del asiento para WebSocket
  reservationId?: string;
  expiresAt?: string;
  representativeIndex: number;
}

export const useSeatReservations = (tripId: number) => {
  const [reservedSeats, setReservedSeats] = useState<SeatReservation[]>([]);
  const [isReserving, setIsReserving] = useState(false);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Referencia para las funciones de WebSocket (se inyectan desde el componente padre)
  const webSocketFunctionsRef = useRef<{
    selectSeatForRepresentative?: (seatId: number, representativeIndex: number, representativeName: string) => boolean;
    releaseSeatForRepresentative?: (seatId: number, representativeIndex?: number) => boolean;
  }>({});

  // Función para inyectar las funciones de WebSocket
  const setWebSocketFunctions = useCallback((functions: {
    selectSeatForRepresentative?: (seatId: number, representativeIndex: number, representativeName: string) => boolean;
    releaseSeatForRepresentative?: (seatId: number, representativeIndex?: number) => boolean;
  }) => {
    webSocketFunctionsRef.current = functions;
  }, []);

  // Reservar asiento temporalmente vía WebSocket
  const reserveSeat = useCallback(async (seatNumber: string, representativeIndex: number, seatId?: number): Promise<boolean> => {
    setIsReserving(true);
    try {
      // Registrar localmente con el seatId si se proporciona
      setReservedSeats(prev => [
        ...prev.filter(r => r.representativeIndex !== representativeIndex), // Remover reserva anterior del mismo representante
        {
          seatNumber,
          seatId: seatId || 0, // Usar el seatId proporcionado o 0 como fallback
          representativeIndex
        }
      ]);

      return true;
    } catch (error: any) {
      toast.error(error.message || 'Error al reservar asiento');
      return false;
    } finally {
      setIsReserving(false);
    }
  }, []);

  // Liberar asiento específico
  const releaseSeat = useCallback(async (representativeIndex: number) => {
    const reservation = reservedSeats.find(r => r.representativeIndex === representativeIndex);
    if (!reservation) return;

    // Si tenemos funciones de WebSocket, liberar vía WebSocket
    if (reservation.seatId && webSocketFunctionsRef.current.releaseSeatForRepresentative) {
      webSocketFunctionsRef.current.releaseSeatForRepresentative(reservation.seatId, representativeIndex);
    }
    
    setReservedSeats(prev => prev.filter(r => r.representativeIndex !== representativeIndex));
  }, [tripId, reservedSeats]);

  // Actualizar seatId de una reserva (se llama desde el padre cuando se conoce el seatId)
  const updateReservationSeatId = useCallback((representativeIndex: number, seatId: number) => {
    setReservedSeats(prev => 
      prev.map(r => 
        r.representativeIndex === representativeIndex 
          ? { ...r, seatId }
          : r
      )
    );
  }, []);

  // Confirmar todas las reservas (al completar venta exitosamente)
  const confirmAllReservations = useCallback(async (): Promise<boolean> => {
    // Ya no es necesario confirmar vía API REST
    // La confirmación se hace vía confirmPurchase en el hook useSeatMapRealtime
    setReservedSeats([]); // Limpiar reservas locales
    return true;
  }, [tripId, reservedSeats]);

  // Liberar todas las reservas (al cancelar o error)
  const releaseAllReservations = useCallback(async () => {
    if (reservedSeats.length === 0) return;

    // Liberar todas las reservas vía WebSocket
    reservedSeats.forEach(reservation => {
      if (reservation.seatId && webSocketFunctionsRef.current.releaseSeatForRepresentative) {
        webSocketFunctionsRef.current.releaseSeatForRepresentative(reservation.seatId, reservation.representativeIndex);
      }
    });
    
    setReservedSeats([]);
  }, [tripId, reservedSeats]);

  // Extender tiempo de reservas - Ya no es necesario sin API REST
  const extendReservations = useCallback(async (_additionalMinutes: number = 5) => {
    // No hay nada que extender sin API REST
    // Las reservas vía WebSocket tienen TTL automático en el backend
    toast.info('Las reservas se mantienen activas mientras la sesión esté abierta');
  }, [tripId, reservedSeats]);

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      // Liberar reservas al salir del componente
      if (reservedSeats.length > 0) {
        reservedSeats.forEach(reservation => {
          if (reservation.seatId && webSocketFunctionsRef.current.releaseSeatForRepresentative) {
            webSocketFunctionsRef.current.releaseSeatForRepresentative(reservation.seatId, reservation.representativeIndex);
          }
        });
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
    sessionId: sessionId.current,
    setWebSocketFunctions, // Nueva función para inyectar funciones de WebSocket
    updateReservationSeatId, // Nueva función para actualizar seatId
  };
};
