// src/features/fluvial/components/seat-map/Seat.tsx

import React from 'react';
import { SeatMapItem, SeatStatus } from '../../../../types';

interface SeatProps {
  seat: SeatMapItem;
  isSelected: boolean;
  onClick: (seat: SeatMapItem) => void;
  isLocked?: boolean; // <-- CORRECCIÓN: Añadir la prop isLocked
}

const getSeatStyles = (status: SeatStatus, isSelected: boolean, isLocked: boolean): string => {
  if (isSelected) {
    // Si está seleccionado, siempre se verá como seleccionado, pero el cursor cambiará si está bloqueado
    const cursorStyle = isLocked ? 'cursor-not-allowed' : '';
    return `bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105 ${cursorStyle}`;
  }
  
  // Si está bloqueado pero no es el seleccionado, se ve gris y deshabilitado
  if (isLocked) {
    return 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed';
  }

  switch (status) {
    case 'AVAILABLE':
      return 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md';
    case 'CONFIRMED':
      return 'bg-red-500 border-red-600 text-white cursor-not-allowed';
    case 'RESERVED':
      return 'bg-yellow-500 border-yellow-600 text-white cursor-not-allowed';
    case 'BLOCKED':
      return 'bg-gray-500 border-gray-600 text-white cursor-not-allowed';
    default:
      return 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed';
  }
};

export const Seat: React.FC<SeatProps> = ({ seat, isSelected, onClick, isLocked = false }) => {
  // <-- CORRECCIÓN: Recibir y usar isLocked

  // Un asiento no es clickeable si está bloqueado o su estado no es 'AVAILABLE'
  const isClickable = !isLocked && seat.status === 'AVAILABLE';

  return (
    <button
      onClick={() => isClickable && onClick(seat)}
      // Deshabilitamos el botón si no es clickeable, para temas de accesibilidad.
      disabled={!isClickable}
      className={`
        w-14 h-14 rounded-lg border-2 transition-all duration-200
        flex items-center justify-center text-sm font-bold
        ${getSeatStyles(seat.status, isSelected, isLocked)}
      `}
      title={`Asiento: ${seat.seat_number} - Tipo: ${seat.seat_type.name} - Estado: ${seat.status}`}
    >
      {seat.seat_number}
    </button>
  );
};