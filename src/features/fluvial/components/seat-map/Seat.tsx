// src/features/fluvial/components/seat-map/Seat.tsx

import React from 'react';
import { SeatMapItem, SeatStatus } from '../../../../types';
import { getSeatTypeName } from '../../utils/seatUtils';

interface SeatProps {
  seat: SeatMapItem;
  isSelected: boolean;
  onClick: (seat: SeatMapItem) => void;
  isLocked?: boolean;
  // Asiento ya elegido como cambio pendiente por OTRA asignación en la misma sesión
  isPendingBlocked?: boolean;
}

const getSeatStyles = (
  status: SeatStatus,
  isSelected: boolean,
  isLocked: boolean,
  isPendingBlocked: boolean,
): string => {
  if (isSelected) {
    const cursorStyle = isLocked ? 'cursor-not-allowed' : '';
    return `bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105 ${cursorStyle}`;
  }

  // Ocupado como destino pendiente de otra asignación: naranja, no clickable
  if (isPendingBlocked) {
    return 'bg-orange-400 border-orange-500 text-white cursor-not-allowed opacity-90';
  }

  if (isLocked) {
    return 'bg-dm-bg-secondary border-dm-border-primary text-dm-text-muted cursor-not-allowed';
  }

  switch (status) {
    case 'AVAILABLE':
      return 'bg-dm-bg-primary border-dm-border-primary text-dm-text-secondary hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:shadow-md';
    case 'CONFIRMED':
      return 'bg-red-500 border-red-600 text-white cursor-not-allowed';
    case 'RESERVED':
      return 'bg-yellow-500 border-yellow-600 text-white cursor-not-allowed';
    case 'BLOCKED':
      return 'bg-gray-500 border-gray-600 dark:border-gray-400 text-white cursor-not-allowed';
    default:
      return 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 dark:border-gray-400 text-dm-text-muted cursor-not-allowed';
  }
};

export const Seat: React.FC<SeatProps> = ({ seat, isSelected, onClick, isLocked = false, isPendingBlocked = false }) => {
  const isClickable = !isLocked && !isPendingBlocked && seat.status === 'AVAILABLE';

  return (
    <button
      onClick={() => isClickable && onClick(seat)}
      disabled={!isClickable}
      className={`
        w-14 h-14 rounded-lg border-2 transition-all duration-200
        flex items-center justify-center text-sm font-bold
        ${getSeatStyles(seat.status, isSelected, isLocked, isPendingBlocked)}
      `}
      title={`Asiento: ${seat.seat_number} - Tipo: ${getSeatTypeName(seat.seat_type?.name)} - Estado: ${
        isPendingBlocked ? 'PENDIENTE (otra asignación)' : seat.status
      }`}
    >
      {seat.seat_number}
    </button>
  );
};