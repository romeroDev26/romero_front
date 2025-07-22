// src/features/fluvial/components/seat-map/SeatRealtime.tsx
import React from 'react';
import { SeatMapItem, SeatStatus } from '../../../../types';
import { getSeatTypeName } from '../../utils/seatUtils';

interface SeatSelection {
  seatId: number;
  userId: string;
  userName: string;
  timestamp: string;
}

interface SeatRealtimeProps {
  seat: SeatMapItem;
  isSelected: boolean;
  onClick: (seat: SeatMapItem) => void;
  isLocked?: boolean;
  activeSelection?: SeatSelection; // Nueva prop para selección en tiempo real
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
  isWebSocketAvailable?: boolean; // Nueva prop
}

const getSeatStyles = (
  status: SeatStatus, 
  isSelected: boolean, 
  isLocked: boolean, 
  activeSelection?: SeatSelection,
  connectionStatus?: string,
  isWebSocketAvailable?: boolean
): string => {
  // Si hay una selección activa de otro usuario (solo si WebSocket está disponible)
  if (activeSelection && !isSelected && isWebSocketAvailable) {
    return 'bg-orange-400 border-orange-500 text-white cursor-not-allowed animate-pulse';
  }
  
  if (isSelected) {
    const cursorStyle = isLocked ? 'cursor-not-allowed' : '';
    return `bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105 ${cursorStyle}`;
  }
  
  if (isLocked) {
    return 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed';
  }

  switch (status) {
    case 'AVAILABLE':
      // Diferentes indicadores según el estado de conexión
      let connectionIndicator = '';
      if (isWebSocketAvailable && connectionStatus === 'connected') {
        connectionIndicator = 'ring-1 ring-green-300';
      } else if (connectionStatus === 'failed') {
        connectionIndicator = 'ring-1 ring-gray-300'; // Sin tiempo real, pero funcional
      }
      return `bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md ${connectionIndicator}`;
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

const getTooltipText = (seat: SeatMapItem, activeSelection?: SeatSelection): string => {
  const seatTypeName = getSeatTypeName(seat.seat_type?.name);
  const baseInfo = `Asiento: ${seat.seat_number} - Tipo: ${seatTypeName} - Estado: ${seat.status}`;
  
  if (activeSelection) {
    return `${baseInfo} - Siendo seleccionado por: ${activeSelection.userName}`;
  }
  
  return baseInfo;
};

export const SeatRealtime: React.FC<SeatRealtimeProps> = ({ 
  seat, 
  isSelected, 
  onClick, 
  isLocked = false,
  activeSelection,
  connectionStatus,
  isWebSocketAvailable = true
}) => {
  // Un asiento no es clickeable si está bloqueado, su estado no es 'AVAILABLE', 
  // o está siendo seleccionado por otro usuario (solo si WebSocket está disponible)
  const isClickable = !isLocked && seat.status === 'AVAILABLE' && 
    !(activeSelection && isWebSocketAvailable);

  return (
    <div className="relative">
      <button
        onClick={() => isClickable && onClick(seat)}
        disabled={!isClickable}
        className={`
          w-14 h-14 rounded-lg border-2 transition-all duration-200
          flex items-center justify-center text-sm font-bold relative
          ${getSeatStyles(seat.status, isSelected, isLocked, activeSelection, connectionStatus, isWebSocketAvailable)}
        `}
        title={getTooltipText(seat, activeSelection)}
      >
        {seat.seat_number}
        
        {/* Indicador de conexión WebSocket */}
        {isWebSocketAvailable && connectionStatus === 'connected' && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        )}
        
        {/* Indicador de modo sin tiempo real */}
        {connectionStatus === 'failed' && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-400 rounded-full"></div>
        )}
        
        {/* Indicador de selección por otro usuario (solo si WebSocket está disponible) */}
        {activeSelection && isWebSocketAvailable && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-1 rounded text-center whitespace-nowrap">
            {activeSelection.userName.split(' ')[0]}
          </div>
        )}
      </button>
    </div>
  );
};
