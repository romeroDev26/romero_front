// src/features/fluvial/components/sales-point/ReservationModal.tsx
import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/sileo-toast';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { useCreateReservation } from '../../hooks/useReservations';
import { SeatMapItem, Trip, TripStop } from '../../../../types';
import { ReservationCreateData } from '../../../../services/reservations.service';

interface PassengerAndSeatData {
    trip: Trip;
    tripStops: TripStop[];
    selectedSeat: SeatMapItem;
    passengerData: { name: string; docType: string; docNumber: string; phone?: string; email?: string; };
    // NUEVO: Usar stop IDs en lugar de port IDs
    boardingStopId: number;
    disembarkingStopId: number;
    totalPrice: number;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationData: PassengerAndSeatData;
  onSuccess: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  reservationData,
  onSuccess,
}) => {
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const { mutateAsync: createReservation, isPending } = useCreateReservation();

  useEffect(() => {
    if (isOpen) {
      setAdvanceAmount('');
      setExpiresAt('');
      setCustomerPhone(reservationData.passengerData.phone || '');
      setCustomerEmail(reservationData.passengerData.email || '');
      setSpecialNotes('');
    }
  }, [isOpen, reservationData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const advanceAmountNumber = advanceAmount.trim() === '' ? 0 : parseFloat(advanceAmount);

    if (advanceAmountNumber < 0) {
      toast.error("El monto de adelanto no puede ser negativo.");
      return;
    }

    if (!customerPhone.trim()) {
      toast.error("El teléfono de contacto es requerido para la reserva.");
      return;
    }

    const { trip, selectedSeat, passengerData, boardingStopId, disembarkingStopId, totalPrice } = reservationData;
    
    // NUEVO: Ya tenemos los stop IDs directamente, no necesitamos buscarlos
    if (!boardingStopId || !disembarkingStopId) {
      toast.error("Error interno: No se encontraron las paradas.");
      return;
    }

    try {
      const reservationPayload: ReservationCreateData = {
        trip_id: trip.id,
        seat_type_id: selectedSeat.seat_type?.id || 1, // Default seat type ID si es null
        trip_seat_id: selectedSeat.id,
        boarding_stop_id: boardingStopId,
        disembarking_stop_id: disembarkingStopId,
        customer_name: passengerData.name,
        customer_doc_type: passengerData.docType,
        customer_doc_number: passengerData.docNumber,
        customer_phone: customerPhone,
        total_price: totalPrice,
        advance_amount: advanceAmountNumber,
        currency_code: 'PEN',
        seat_number: selectedSeat.seat_number,
      };

      if (customerEmail.trim()) {
        reservationPayload.customer_email = customerEmail;
      }

      if (expiresAt) {
        reservationPayload.expires_at = new Date(expiresAt).toISOString();
      }

      if (specialNotes.trim()) {
        reservationPayload.special_notes = specialNotes;
      }

      await createReservation(reservationPayload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Fallo al crear la reserva", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reservar Asiento ${reservationData.selectedSeat.seat_number}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p><strong>Pasajero:</strong> {reservationData.passengerData.name}</p>
          <p><strong>Precio Total:</strong> S/ {reservationData.totalPrice.toFixed(2)}</p>
        </div>
        <hr/>
        <Input label="Monto de Adelanto (S/)" type="number" step="0.01" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="Dejar vacío para S/ 0.00" />
        <Input label="Teléfono de Contacto" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
        <Input label="Email (Opcional)" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        <Input label="Fecha de Expiración (Opcional)" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        <Input label="Notas Especiales (Opcional)" type="text" value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isPending}>Confirmar Reserva</Button>
        </div>
      </form>
    </Modal>
  );
};
