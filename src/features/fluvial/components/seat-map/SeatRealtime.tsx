// src/features/fluvial/components/seat-map/SeatRealtime.tsx
import React from 'react';
import { SeatMapItem, SeatStatus } from '../../../../types';
import { getSeatTypeName } from '../../utils/seatUtils';

interface SeatSelection {
  seatId: number;
  userId: string;
  userName: string;
  timestamp: string;
  type?: 'temporary' | 'reserved' | 'purchasing' | 'representative' | 'temp_reserved'; // ← ACTUALIZADO: Agregado 'temp_reserved'
  companyName?: string; // ← NUEVO: Para mostrar empresa
  representativeIndex?: number; // ← NUEVO: Índice del representante
  representativeName?: string; // ← NUEVO: Nombre del representante
  ttl?: number; // ← NUEVO: Tiempo de vida de la reserva temporal (en segundos)
  expiresAt?: string; // ← NUEVO: Timestamp de cuando expira la reserva
}

interface SeatRealtimeProps {
  seat: SeatMapItem;
  isSelected: boolean;
  onClick: (seat: SeatMapItem) => void;
  isLocked?: boolean;
  activeSelection?: SeatSelection; // Nueva prop para selección en tiempo real
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
  isWebSocketAvailable?: boolean; // Nueva prop
  isOccupiedByRepresentative?: boolean; // Nueva prop para asientos ocupados por representantes
}

const getSeatStyles = (
  status: SeatStatus, 
  isSelected: boolean, 
  isLocked: boolean, 
  activeSelection?: SeatSelection,
  connectionStatus?: string,
  isWebSocketAvailable?: boolean,
  isOccupiedByRepresentative?: boolean
): string => {
  // Si está ocupado por un representante, mostrar como ocupado
  if (isOccupiedByRepresentative) {
    return 'bg-purple-500 border-purple-600 text-white cursor-not-allowed';
  }
  
  // Si hay una selección activa de otro usuario (solo si WebSocket está disponible)
  if (activeSelection && !isSelected && isWebSocketAvailable) {
    // ← NUEVO: Diferentes estilos según el tipo de selección
    if (activeSelection.type === 'representative') {
      return 'bg-purple-500 border-purple-600 text-white cursor-not-allowed animate-pulse';
    }
    // ← NUEVO: Manejar reservas temporales (SEAT_TEMP_RESERVED del backend)
    if (activeSelection.type === 'temp_reserved') {
      return 'bg-purple-400 border-purple-500 text-white cursor-not-allowed animate-pulse';
    }
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

const getTooltipText = (seat: SeatMapItem, activeSelection?: SeatSelection, isOccupiedByRepresentative?: boolean): string => {
  const seatTypeName = getSeatTypeName(seat.seat_type?.name);
  const baseInfo = `Asiento: ${seat.seat_number} - Tipo: ${seatTypeName} - Estado: ${seat.status}`;
  
  if (isOccupiedByRepresentative) {
    return `${baseInfo} - Ocupado por representante de la empresa`;
  }
  
  if (activeSelection) {
    // ← NUEVO: Diferentes mensajes según el tipo de selección
    if (activeSelection.type === 'representative') {
      const companyInfo = activeSelection.companyName ? ` (${activeSelection.companyName})` : '';
      const repInfo = activeSelection.representativeName ? ` - Rep: ${activeSelection.representativeName}` : '';
      return `${baseInfo} - Reservado para representante${companyInfo}${repInfo}`;
    }
    // ← NUEVO: Manejo de reservas temporales del backend
    if (activeSelection.type === 'temp_reserved') {
      const companyInfo = activeSelection.companyName ? ` (${activeSelection.companyName})` : '';
      const ttlInfo = activeSelection.ttl ? ` - Expira en ${Math.round(activeSelection.ttl / 60)} min` : '';
      return `${baseInfo} - Reserva temporal${companyInfo}${ttlInfo}`;
    }
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
  isWebSocketAvailable = true,
  isOccupiedByRepresentative = false
}) => {
  // Un asiento no es clickeable si está bloqueado, su estado no es 'AVAILABLE', 
  // está ocupado por un representante, o está siendo seleccionado por otro usuario (solo si WebSocket está disponible)
  const isClickable = !isLocked && seat.status === 'AVAILABLE' && 
    !isOccupiedByRepresentative &&
    !(activeSelection && isWebSocketAvailable);

  return (
    <div className="relative">
      <button
        onClick={() => isClickable && onClick(seat)}
        disabled={!isClickable}
        className={`
          w-14 h-14 rounded-lg border-2 transition-all duration-200
          flex items-center justify-center text-sm font-bold relative
          ${getSeatStyles(seat.status, isSelected, isLocked, activeSelection, connectionStatus, isWebSocketAvailable, isOccupiedByRepresentative)}
        `}
        title={getTooltipText(seat, activeSelection, isOccupiedByRepresentative)}
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
            {/* ← NUEVO: Diferentes indicadores según el tipo */}
            {activeSelection.type === 'representative' ? (
              <span className="bg-purple-600 px-1 rounded">
                {activeSelection.companyName ? activeSelection.companyName.substring(0, 8) : 'Empresa'}
              </span>
            ) : activeSelection.type === 'temp_reserved' ? (
              <span className="bg-purple-500 px-1 rounded">
                {activeSelection.companyName ? activeSelection.companyName.substring(0, 6) : 'Temp'}
              </span>
            ) : (
              activeSelection.userName.split(' ')[0]
            )}
          </div>
        )}
      </button>
    </div>
  );
};
