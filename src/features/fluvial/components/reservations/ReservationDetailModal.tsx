// src/features/fluvial/components/reservations/ReservationDetailModal.tsx
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Ban, Check, Clock, CreditCard, MapPin, StickyNote, User } from 'lucide-react';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/common/Button';
import { SeatReservation } from '../../../../types';
import { ReservationStatusBadge } from './ReservationStatusBadge';

interface ReservationDetailModalProps {
  reservation: SeatReservation | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSale: (reservation: SeatReservation) => void;
  onCancelReservation: (reservation: SeatReservation) => void;
}

const formatMoney = (amount: number | undefined, currencyCode: string | undefined) => {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currencyCode || 'PEN',
  }).format(value);
};

const formatDate = (value?: string) => {
  if (!value) return null;
  try {
    return format(new Date(value), "dd 'de' MMMM 'de' yyyy, hh:mm a", { locale: es });
  } catch {
    return value;
  }
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-[10px] font-medium uppercase tracking-wider text-dm-text-muted">{label}</div>
    <div className="mt-0.5 text-sm text-dm-text-primary">{children}</div>
  </div>
);

/**
 * Detalle completo de una reserva. Existe sobre todo para que la nota especial se lea
 * entera (puede ser larga) antes de confirmar la venta o cancelar la reserva.
 */
export const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onConfirmSale,
  onCancelReservation,
}) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // Reiniciar el paso de confirmación al abrir o al cambiar de reserva
  useEffect(() => {
    setIsConfirmingCancel(false);
  }, [isOpen, reservation?.id]);

  if (!reservation) return null;

  const remainingAmount = Number.isFinite(Number(reservation.remaining_amount))
    ? Number(reservation.remaining_amount)
    : Number(reservation.total_price || 0) - Number(reservation.advance_amount || 0);

  const notes = reservation.special_notes?.trim();
  const isReserved = reservation.status === 'RESERVED';
  const reservedAt = formatDate(reservation.reserved_at);
  const expiresAt = formatDate(reservation.expires_at);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reserva #${reservation.id}`} maxWidth="lg">
      <div className="space-y-5">
        {/* Viaje y estado */}
        <div className="flex items-start justify-between gap-3 border-b border-dm-border-secondary pb-4">
          <div>
            <div className="text-sm font-bold text-primary">
              {reservation.trip_name || `Viaje #${reservation.trip_id}`}
            </div>
            <div className="text-[13px] font-medium text-dm-text-primary">
              Asiento {reservation.seat_number || 'No asignado'}
            </div>
          </div>
          <ReservationStatusBadge status={reservation.status} />
        </div>

        {/* Cliente */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-dm-text-muted">
            <User className="h-3.5 w-3.5" />
            Cliente
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre">{reservation.customer_name}</Field>
            <Field label="Documento">
              {reservation.customer_doc_type} {reservation.customer_doc_number}
            </Field>
            <Field label="Teléfono">{reservation.customer_phone || 'No especificado'}</Field>
            <Field label="Email">{reservation.customer_email || 'No especificado'}</Field>
          </div>
        </div>

        {/* Tramo */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-dm-text-muted">
            <MapPin className="h-3.5 w-3.5" />
            Tramo
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Embarque">{reservation.boarding_stop?.port?.name || 'N/A'}</Field>
            <Field label="Desembarque">{reservation.disembarking_stop?.port?.name || 'N/A'}</Field>
          </div>
        </div>

        {/* Montos */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-dm-text-muted">
            <CreditCard className="h-3.5 w-3.5" />
            Montos
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Precio total">{formatMoney(reservation.total_price, reservation.currency_code)}</Field>
            <Field label="Adelanto">{formatMoney(reservation.advance_amount, reservation.currency_code)}</Field>
            <Field label="Por cobrar">
              <span className={remainingAmount > 0 ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>
                {formatMoney(remainingAmount, reservation.currency_code)}
              </span>
            </Field>
          </div>
        </div>

        {/* Fechas */}
        {(reservedAt || expiresAt) && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-dm-text-muted">
              <Clock className="h-3.5 w-3.5" />
              Fechas
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {reservedAt && <Field label="Reservado">{reservedAt}</Field>}
              {expiresAt && <Field label="Expira">{expiresAt}</Field>}
            </div>
          </div>
        )}

        {/* Notas especiales: el motivo principal de este modal */}
        <div>
          {notes ? (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <StickyNote className="h-3.5 w-3.5" />
                Notas especiales
              </div>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-amber-900 dark:text-amber-200">
                {notes}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dm-border-primary bg-dm-bg-secondary p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-dm-text-muted">
                <StickyNote className="h-3.5 w-3.5" />
                Notas especiales
              </div>
              <p className="mt-1.5 text-sm text-dm-text-muted">Sin notas</p>
            </div>
          )}
        </div>

        {/* Acciones */}
        {isReserved && !isConfirmingCancel && (
          <div className="flex flex-col gap-2 border-t border-dm-border-secondary pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsConfirmingCancel(true)} className="sm:w-auto">
              <Ban className="mr-2 h-4 w-4" />
              Cancelar reserva
            </Button>
            <Button onClick={() => onConfirmSale(reservation)} className="sm:w-auto">
              <Check className="mr-2 h-4 w-4" />
              Confirmar venta
            </Button>
          </div>
        )}

        {isReserved && isConfirmingCancel && (
          <div className="space-y-3 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              ¿Cancelar la reserva del asiento {reservation.seat_number} de {reservation.customer_name}?
            </div>
            <p className="text-[13px] text-red-700/80 dark:text-red-300/80">
              El asiento quedará libre y esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsConfirmingCancel(false)} className="sm:w-auto">
                Volver
              </Button>
              <Button variant="danger" onClick={() => onCancelReservation(reservation)} className="sm:w-auto">
                <Ban className="mr-2 h-4 w-4" />
                Sí, cancelar reserva
              </Button>
            </div>
          </div>
        )}

        {!isReserved && (
          <div className="flex justify-end border-t border-dm-border-secondary pt-4">
            <Button variant="outline" onClick={onClose} className="sm:w-auto">
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
