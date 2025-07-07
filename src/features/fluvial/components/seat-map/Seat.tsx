// src/features/fluvial/components/seat-map/Seat.tsx
import React from 'react';
import { SeatMapItem, SeatStatus } from '../../../../types';

interface SeatProps {
  seat: SeatMapItem;
  isSelected: boolean;
  onClick: (seat: SeatMapItem) => void;
}

// Estilos tomados de tu prototipo, ¡mucho más bonitos!
const getSeatStyles = (status: SeatStatus, isSelected: boolean): string => {
  if (isSelected) {
    return 'bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105';
  }
  switch (status) {
    case 'AVAILABLE':
      return 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md';
    case 'CONFIRMED':
      // Usamos el color rojo como en tu leyenda de la imagen
      return 'bg-red-500 border-red-600 text-white cursor-not-allowed';
    case 'RESERVED':
      // Usamos el color amarillo/oro como en tu leyenda
      return 'bg-yellow-500 border-yellow-600 text-white cursor-not-allowed';
    case 'BLOCKED':
      // Usamos el color gris/negro como en tu leyenda
      return 'bg-gray-500 border-gray-600 text-white cursor-not-allowed';
    default:
      // Para estados como CANCELLED o EXPIRED, un gris más claro
      return 'bg-gray-300 border-gray-400 text-white cursor-not-allowed';
  }
};

export const Seat: React.FC<SeatProps> = ({ seat, isSelected, onClick }) => {
  const isClickable = seat.status === 'AVAILABLE';

  return (
    <button
      onClick={() => isClickable && onClick(seat)}
      disabled={!isClickable}
      className={`
        w-14 h-14 rounded-lg border-2 transition-all duration-200
        flex items-center justify-center text-sm font-bold
        ${getSeatStyles(seat.status, isSelected)}
      `}
      title={`Asiento: ${seat.seat_number} - Tipo: ${seat.seat_type.name} - Estado: ${seat.status}`}
    >
      {seat.seat_number}
    </button>
  );
};