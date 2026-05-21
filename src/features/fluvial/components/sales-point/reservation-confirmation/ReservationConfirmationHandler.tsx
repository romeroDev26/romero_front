// src/features/fluvial/components/sales-point/reservation-confirmation/ReservationConfirmationHandler.tsx
import React, { useEffect, useMemo } from 'react';
import { Clock, AlertCircle, CheckCircle, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/utils/sileo-toast';
import { SeatReservation, SeatMapItem } from '../../../../../types';
import { PassengerData } from '../core/types';
import { SunatDocType } from '../../../types/sunat.types';

export interface ReservationConfirmationHandlerProps {
  reservation: SeatReservation;
  tripDetails: any; // Trip type
  seatMap: SeatMapItem[];
  onPassengerDataChange: (data: PassengerData) => void;
  onBoardingStopChange: (stopId: number) => void;
  onDisembarkingStopChange: (stopId: number) => void;
  onSelectedSeatChange: (seat: SeatMapItem | null) => void;
  onConfirmingModeChange: (mode: boolean) => void;
  className?: string;
}

/**
 * Componente especializado que maneja toda la lógica de confirmación de reservas.
 * Separa esta funcionalidad del SaleForm principal para reducir la complejidad.
 */
export const ReservationConfirmationHandler: React.FC<ReservationConfirmationHandlerProps> = ({
  reservation,
  tripDetails,
  seatMap,
  onPassengerDataChange,
  onBoardingStopChange,
  onDisembarkingStopChange,
  onSelectedSeatChange,
  onConfirmingModeChange,
  className = ''
}) => {
  
  // Memoizar datos de la reserva para evitar recálculos innecesarios
  const reservationData = useMemo(() => ({
    id: reservation.id,
    customerName: reservation.customer_name,
    customerDocType: reservation.customer_doc_type,
    customerDocNumber: reservation.customer_doc_number,
    customerPhone: reservation.customer_phone || "",
    customerEmail: reservation.customer_email || "",
    totalPrice: reservation.total_price,
    advanceAmount: reservation.advance_amount,
    remainingAmount: reservation.remaining_amount,
    seatNumber: reservation.seat_number,
    reservedAt: reservation.reserved_at,
    status: reservation.status,
    boardingStopId: reservation.boarding_stop_id,
    disembarkingStopId: reservation.disembarking_stop_id,
    tripSeatId: reservation.trip_seat_id
  }), [
    reservation.id,
    reservation.customer_name,
    reservation.customer_doc_type,
    reservation.customer_doc_number,
    reservation.customer_phone,
    reservation.customer_email,
    reservation.total_price,
    reservation.advance_amount,
    reservation.remaining_amount,
    reservation.seat_number,
    reservation.reserved_at,
    reservation.status,
    reservation.boarding_stop_id,
    reservation.disembarking_stop_id,
    reservation.trip_seat_id
  ]);

  // Verificar si la reserva es válida y aún está activa
  const isReservationValid = useMemo(() => {
    if (!reservation) return false;
    
    const now = new Date();
    
    // Si hay fecha de expiración, verificar que no haya expirado
    if (reservation.expires_at) {
      const expiresAt = parseISO(reservation.expires_at);
      if (now > expiresAt) {
        return false;
      }
    }
    
    // Verificar que el estado sea válido para confirmación
    return reservation.status === 'RESERVED';
  }, [reservation?.expires_at, reservation?.reserved_at, reservation?.status]);

  // Encontrar el asiento correspondiente en el mapa de asientos
  const reservedSeat = useMemo(() => {
    if (!seatMap.length || !reservationData.tripSeatId) return null;
    
    return seatMap.find(seat => seat.id === reservationData.tripSeatId) || null;
  }, [seatMap.length, reservationData.tripSeatId]);

  // Detectar tipo de documento y establecer país automáticamente
  const getCountryFromDocType = (docType: string) => {
    const isPeruvianDoc = docType === SunatDocType.DNI || docType === SunatDocType.RUC;
    return {
      countryCode: isPeruvianDoc ? "PE" : "",
      countryName: isPeruvianDoc ? "Peru" : ""
    };
  };

  // Inicializar datos del pasajero basado en la reserva
  useEffect(() => {
    if (!reservation || !tripDetails) return;

    // Verificar si la reserva es válida antes de continuar
    if (!isReservationValid) {
      toast.error("La reserva ha expirado o no es válida para confirmación");
      return;
    }

    const countryInfo = getCountryFromDocType(reservationData.customerDocType);

    // Prellenar datos del pasajero con datos de la reserva
    const newPassengerData: PassengerData = {
      docType: reservationData.customerDocType,
      docNumber: reservationData.customerDocNumber,
      name: reservationData.customerName,
      phone: reservationData.customerPhone,
      email: reservationData.customerEmail,
      address: "", // Las reservas no incluyen dirección, se mantendrá vacía
      countryCode: countryInfo.countryCode,
      countryName: countryInfo.countryName,
    };

    onPassengerDataChange(newPassengerData);

    // Configurar paradas de embarque y desembarque
    onBoardingStopChange(reservationData.boardingStopId);
    onDisembarkingStopChange(reservationData.disembarkingStopId);

    // Configurar asiento seleccionado si está disponible
    if (reservedSeat) {
      onSelectedSeatChange(reservedSeat);
    }

    // Activar modo de confirmación
    onConfirmingModeChange(true);

    toast.success(`Datos prellenados desde la reserva #${reservationData.id}`);

  }, [
    reservation?.id, 
    tripDetails?.id, 
    isReservationValid,
    reservedSeat?.id,
    // Evitar dependencias circulares de los callbacks
  ]);

  // Obtener nombre del puerto de embarque y desembarque
  const getBoardingPortName = () => {
    const stop = tripDetails?.stops?.find((s: any) => s.id === reservationData.boardingStopId);
    return stop?.port?.name || 'Puerto no encontrado';
  };

  const getDisembarkingPortName = () => {
    const stop = tripDetails?.stops?.find((s: any) => s.id === reservationData.disembarkingStopId);
    return stop?.port?.name || 'Puerto no encontrado';
  };

  // Formatear fecha de reserva
  const formatReservedDate = () => {
    try {
      return format(parseISO(reservationData.reservedAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch (error) {
      return reservationData.reservedAt;
    }
  };

  return (
    <div className={`bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg p-4 mb-6 ${className}`}>
      {/* Header de confirmación de reserva */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isReservationValid ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">
            {isReservationValid ? 'Confirmando Reserva' : 'Reserva Inválida'}
          </h3>
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
            #{reservationData.id}
          </span>
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400">
          Estado: <span className="font-semibold">{reservationData.status}</span>
        </div>
      </div>

      {/* Información del cliente y detalles de la reserva */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Datos del cliente */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
            <User className="h-4 w-4" />
            <span>Datos del Cliente</span>
          </div>
          <div className="space-y-1 pl-6">
            <div>
              <span className="font-medium">Nombre:</span> {reservationData.customerName}
            </div>
            <div>
              <span className="font-medium">Documento:</span> {reservationData.customerDocNumber}
            </div>
            <div>
              <span className="font-medium">Teléfono:</span> {reservationData.customerPhone || 'No especificado'}
            </div>
            <div>
              <span className="font-medium">Email:</span> {reservationData.customerEmail || 'No especificado'}
            </div>
          </div>
        </div>

        {/* Detalles del viaje */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
            <Clock className="h-4 w-4" />
            <span>Detalles de la Reserva</span>
          </div>
          <div className="space-y-1 pl-6">
            <div>
              <span className="font-medium">Origen:</span> {getBoardingPortName()}
            </div>
            <div>
              <span className="font-medium">Destino:</span> {getDisembarkingPortName()}
            </div>
            <div>
              <span className="font-medium">Asiento:</span> {reservationData.seatNumber || 'No asignado'}
            </div>
            <div>
              <span className="font-medium">Precio Total:</span> S/ {reservationData.totalPrice.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Adelanto:</span> S/ {reservationData.advanceAmount.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Por Cobrar:</span> S/ {reservationData.remainingAmount.toFixed(2)}
            </div>
            <div className="text-xs text-dm-text-secondary">
              <span className="font-medium">Reservado:</span> {formatReservedDate()}
            </div>
          </div>
        </div>
      </div>

      {/* Alertas y notificaciones */}
      {!isReservationValid && (
        <div className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded p-3 text-sm text-red-800 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Reserva no válida para confirmación</span>
          </div>
          <div className="mt-1">
            Esta reserva no puede ser confirmada. Por favor verifique el estado y la fecha de expiración.
          </div>
        </div>
      )}

      {isReservationValid && reservationData.remainingAmount > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800 dark:text-yellow-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Pago pendiente</span>
          </div>
          <div className="mt-1">
            El cliente debe completar el pago de S/ {reservationData.remainingAmount.toFixed(2)} para confirmar la reserva.
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 p-2 rounded">
        <span className="font-medium">Nota:</span> Los datos del cliente están prellenados y bloqueados para garantizar la consistencia con la reserva original. 
        Solo se puede modificar información de contacto adicional si es necesario.
      </div>
    </div>
  );
};