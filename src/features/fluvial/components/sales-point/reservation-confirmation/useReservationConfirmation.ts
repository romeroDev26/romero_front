// src/features/fluvial/components/sales-point/reservation-confirmation/useReservationConfirmation.ts
import { useCallback } from 'react';
import { toast } from '@/utils/sileo-toast';
import { SeatReservation, SeatMapItem } from '../../../../../types';
import { PassengerData } from '../core/types';
import { SunatDocType } from '../../../types/sunat.types';

/**
 * Hook especializado para manejar la lógica de confirmación de reservas.
 * Centraliza toda la lógica relacionada con el prellenado y validación de datos de reservas.
 */
export const useReservationConfirmation = () => {
  
  /**
   * Prepara los datos del pasajero basado en una reserva
   */
  const preparePassengerDataFromReservation = useCallback((reservation: SeatReservation): PassengerData => {
    // Detectar país basado en el tipo de documento
    const isPeruvianDoc = reservation.customer_doc_type === SunatDocType.DNI || 
                          reservation.customer_doc_type === SunatDocType.RUC;
    
    return {
      docType: reservation.customer_doc_type,
      docNumber: reservation.customer_doc_number,
      name: reservation.customer_name,
      phone: reservation.customer_phone || "",
      email: reservation.customer_email || "",
      address: "", // Las reservas no incluyen dirección fiscal, se mantendrá vacía
      countryCode: isPeruvianDoc ? "PE" : "",
      countryName: isPeruvianDoc ? "Peru" : "",
    };
  }, []);

  /**
   * Valida si una reserva es elegible para confirmación
   */
  const validateReservationForConfirmation = useCallback((reservation: SeatReservation): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar estado de la reserva
    if (reservation.status !== 'RESERVED') {
      errors.push(`La reserva está en estado "${reservation.status}" y no puede ser confirmada`);
    }

    // Verificar fecha de expiración si existe
    if (reservation.expires_at) {
      const now = new Date();
      const expiresAt = new Date(reservation.expires_at);
      
      if (now > expiresAt) {
        errors.push('La reserva ha expirado y no puede ser confirmada');
      } else {
        // Advertencia si expira pronto (en menos de 30 minutos)
        const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
        if (minutesUntilExpiry <= 30 && minutesUntilExpiry > 0) {
          warnings.push(`La reserva expira en ${Math.floor(minutesUntilExpiry)} minutos`);
        }
      }
    }

    // Verificar datos esenciales del cliente
    if (!reservation.customer_name?.trim()) {
      errors.push('El nombre del cliente es requerido');
    }

    if (!reservation.customer_doc_number?.trim()) {
      errors.push('El número de documento es requerido');
    }

    // Advertencia si faltan datos de contacto
    if (!reservation.customer_phone && !reservation.customer_email) {
      warnings.push('No hay información de contacto (teléfono o email) en la reserva');
    }

    // Verificar paradas de embarque y desembarque
    if (!reservation.boarding_stop_id) {
      errors.push('Falta información de parada de embarque');
    }

    if (!reservation.disembarking_stop_id) {
      errors.push('Falta información de parada de desembarque');
    }

    // Verificar asiento si está especificado
    if (!reservation.trip_seat_id && reservation.seat_number) {
      warnings.push('No se puede asociar el número de asiento con el mapa de asientos');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  /**
   * Encuentra el asiento correspondiente en el mapa de asientos
   */
  const findReservedSeatInMap = useCallback((
    reservation: SeatReservation, 
    seatMap: SeatMapItem[]
  ): SeatMapItem | null => {
    if (!seatMap?.length) return null;
    
    // Buscar por trip_seat_id (más preciso)
    if (reservation.trip_seat_id) {
      const seatById = seatMap.find(seat => seat.id === reservation.trip_seat_id);
      if (seatById) return seatById;
    }
    
    // Buscar por número de asiento como respaldo
    if (reservation.seat_number) {
      const seatByNumber = seatMap.find(seat => 
        seat.seat_number === reservation.seat_number && 
        seat.trip_id === reservation.trip_id
      );
      if (seatByNumber) return seatByNumber;
    }
    
    return null;
  }, []);

  /**
   * Procesa una reserva para confirmación y retorna todos los datos necesarios
   */
  const processReservationForConfirmation = useCallback((
    reservation: SeatReservation,
    seatMap: SeatMapItem[]
  ) => {
    // Validar reserva
    const validation = validateReservationForConfirmation(reservation);
    
    if (!validation.isValid) {
      const errorMessage = `No se puede confirmar la reserva: ${validation.errors.join(', ')}`;
      toast.error(errorMessage);
      return null;
    }

    // Mostrar advertencias si las hay
    validation.warnings.forEach(warning => {
      toast.warning(warning);
    });

    // Preparar datos del pasajero
    const passengerData = preparePassengerDataFromReservation(reservation);
    
    // Encontrar asiento en el mapa
    const reservedSeat = findReservedSeatInMap(reservation, seatMap);
    
    if (reservation.seat_number && !reservedSeat) {
      toast.warning('No se pudo encontrar el asiento en el mapa. Puede seleccionar uno manualmente.');
    }

    return {
      passengerData,
      reservedSeat,
      boardingStopId: reservation.boarding_stop_id,
      disembarkingStopId: reservation.disembarking_stop_id,
      validation,
      remainingAmount: reservation.remaining_amount || 0,
      totalPrice: reservation.total_price || 0,
      advanceAmount: reservation.advance_amount || 0
    };
  }, [
    validateReservationForConfirmation,
    preparePassengerDataFromReservation,
    findReservedSeatInMap
  ]);

  return {
    preparePassengerDataFromReservation,
    validateReservationForConfirmation,
    findReservedSeatInMap,
    processReservationForConfirmation
  };
};