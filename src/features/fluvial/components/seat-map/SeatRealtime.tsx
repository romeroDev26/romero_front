// src/features/fluvial/components/seat-map/SeatRealtime.tsx
import React from 'react';
import { SeatMapItem, SeatStatus } from '../../../../types';
import { getSeatTypeName } from '../../utils/seatUtils';

interface SeatSelection {
  seatId: number;
  userId: string;
  userName: string;
  timestamp: string;
  type?: 'temporary' | 'reserved' | 'purchasing' | 'representative' | 'temp_reserved';
  companyName?: string;
  representativeIndex?: number;
  representativeName?: string;
  ttl?: number;
  expiresAt?: string;
}

interface SeatRealtimeProps {
  seat: SeatMapItem;
  isSelected: boolean;
  onClick: (seat: SeatMapItem) => void;
  isLocked?: boolean;
  activeSelection?: SeatSelection;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
  isWebSocketAvailable?: boolean;
  isOccupiedByRepresentative?: boolean;
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
  // Si hay una selección activa de representante de otro usuario, mostrar como ocupado
  if (activeSelection && !isSelected && isWebSocketAvailable && activeSelection.type === 'representative') {
    return 'bg-purple-500 border-purple-600 text-white cursor-not-allowed animate-pulse';
  }

  // Si está ocupado por un representante (para compatibilidad)
  if (isOccupiedByRepresentative) {
    return 'bg-purple-500 border-purple-600 text-white cursor-not-allowed';
  }

  // Si hay una selección activa de otro usuario (solo si WebSocket está disponible)
  if (activeSelection && !isSelected && isWebSocketAvailable) {
    // Diferentes estilos según el tipo de selección
    if (activeSelection.type === 'representative') {
      return 'bg-purple-500 border-purple-600 text-white cursor-not-allowed animate-pulse';
    }
    // Manejar reservas temporales (SEAT_TEMP_RESERVED del backend)
    if (activeSelection.type === 'temp_reserved') {
      return 'bg-purple-400 border-purple-500 text-white cursor-not-allowed animate-pulse';
    }
    return 'bg-orange-400 border-orange-500 text-white cursor-not-allowed animate-pulse';
  }

  if (isSelected) {
    const cursorStyle = isLocked ? 'cursor-not-allowed' : '';
    return `bg-blue-500 border-blue-600 text-white shadow-lg transform scale-105 ${cursorStyle}`;
  }

  // Si está bloqueado pero el asiento NO está disponible, mostrar el estado real
  if (isLocked && status !== 'AVAILABLE') {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-red-500 border-red-600 text-white cursor-not-allowed';
      case 'RESERVED':
        return 'bg-yellow-500 border-yellow-600 text-white cursor-not-allowed';
      case 'BLOCKED':
        return 'bg-gray-500 border-gray-600 text-white cursor-not-allowed';
      default:
        return 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed';
    }
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
    // Diferentes mensajes según el tipo de selección
    if (activeSelection.type === 'representative') {
      const companyInfo = activeSelection.companyName ? ` (${activeSelection.companyName})` : '';
      const repInfo = activeSelection.representativeName ? ` - Rep: ${activeSelection.representativeName}` : '';
      return `${baseInfo} - Reservado para representante${companyInfo}${repInfo}`;
    }
    // Manejo de reservas temporales del backend
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
  // Log del estado del asiento
  React.useEffect(() => {
    if (seat.status !== 'AVAILABLE') {
      // Logging removed for production
    }
  }, [seat.status, seat.seat_number, isSelected, isLocked, activeSelection, isOccupiedByRepresentative, connectionStatus, isWebSocketAvailable]);

  // Log de estilos aplicados
  const appliedStyles = getSeatStyles(seat.status, isSelected, isLocked, activeSelection, connectionStatus, isWebSocketAvailable, isOccupiedByRepresentative);
  React.useEffect(() => {
    if (seat.status === 'RESERVED') {
      // Logging removed for production
    }
  }, [seat.status, seat.seat_number, appliedStyles, isSelected, isLocked, activeSelection, connectionStatus, isWebSocketAvailable]);

  // Un asiento no es clickeable si está bloqueado, su estado no es 'AVAILABLE',
  // está ocupado por un representante, o está siendo seleccionado por otro usuario (solo si WebSocket está disponible)
  const isClickable = !isLocked && seat.status === 'AVAILABLE' &&
    !isOccupiedByRepresentative &&
    !(activeSelection && isWebSocketAvailable && !isSelected);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => isClickable && onClick(seat)}
        disabled={!isClickable}
        className={`
          w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-md sm:rounded-lg border-2 transition-all duration-200
          flex items-center justify-center text-xs sm:text-sm font-bold relative
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
            {/* Diferentes indicadores según el tipo */}
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
