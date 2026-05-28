// src/features/fluvial/components/seat-map/SeatRealtime.tsx
import React, { useRef, useState, useCallback } from 'react';
import { SeatMapItem, SeatStatus, SeatOccupantInfo } from '../../../../types';
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
        return 'bg-gray-500 border-gray-600 dark:border-gray-400 text-white cursor-not-allowed';
      default:
        return 'bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 dark:border-gray-400 text-dm-text-muted cursor-not-allowed';
    }
  }

  if (isLocked) {
    return 'bg-dm-bg-secondary border-dm-border-primary text-dm-text-muted cursor-not-allowed';
  }

  switch (status) {
    case 'AVAILABLE':
      // Diferentes indicadores según el estado de conexión
      let connectionIndicator = '';
      if (isWebSocketAvailable && connectionStatus === 'connected') {
        connectionIndicator = 'ring-1 ring-green-300 dark:ring-green-700';
      } else if (connectionStatus === 'failed') {
        connectionIndicator = 'ring-1 ring-dm-border-primary'; // Sin tiempo real, pero funcional
      }
      return `bg-dm-bg-primary border-dm-border-primary text-dm-text-secondary hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:shadow-md ${connectionIndicator}`;
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

const OccupantTooltip: React.FC<{ occupant: SeatOccupantInfo; status: SeatStatus }> = ({ occupant, status }) => {
  const statusLabel = status === 'CONFIRMED' ? 'VENDIDO' : 'RESERVADO';
  const statusColor = status === 'CONFIRMED' ? 'text-red-300 dark:text-red-600' : 'text-yellow-300 dark:text-yellow-600';
  const mutedText = 'text-gray-300 dark:text-gray-600';
  const dimText = 'text-gray-400 dark:text-gray-500';

  return (
    <div className="text-left">
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${statusColor}`}>
        {statusLabel}
      </div>
      <div className="font-semibold text-sm mb-0.5 leading-tight">{occupant.passenger_name}</div>
      {occupant.document_number && (
        <div className={`${mutedText} text-[11px] mb-0.5`}>Doc: {occupant.document_number}</div>
      )}
      <div className={`text-[11px] ${mutedText} mb-0.5`}>
        {occupant.origin_stop_name} <span className={dimText}>→</span> {occupant.destination_stop_name}
      </div>
      <div className="text-sm font-bold text-green-400 dark:text-green-600">
        {occupant.currency_code} {occupant.amount_paid.toFixed(2)}
      </div>
      {occupant.status_detail && (
        <div className={`text-[10px] ${dimText} mt-0.5`}>{occupant.status_detail}</div>
      )}
    </div>
  );
};

const SeatTooltipContent: React.FC<{
  seat: SeatMapItem;
  activeSelection?: SeatSelection;
  isOccupiedByRepresentative?: boolean;
}> = ({ seat, activeSelection, isOccupiedByRepresentative }) => {
  const seatTypeName = getSeatTypeName(seat.seat_type?.name);

  // Si tiene ocupante (CONFIRMED o RESERVED con datos del backend)
  if (seat.occupant && (seat.status === 'CONFIRMED' || seat.status === 'RESERVED')) {
    return <OccupantTooltip occupant={seat.occupant} status={seat.status} />;
  }

  // Si está ocupado por representante
  if (isOccupiedByRepresentative) {
    return (
      <div className="text-left">
        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 dark:text-purple-600 mb-1">REPRESENTANTE</div>
        <div className="font-semibold text-sm">Asiento {seat.seat_number}</div>
        <div className="text-xs text-gray-300 dark:text-gray-600">Ocupado por representante de la empresa</div>
      </div>
    );
  }

  // Si hay una selección activa de otro usuario
  if (activeSelection) {
    if (activeSelection.type === 'representative') {
      const companyInfo = activeSelection.companyName || 'Empresa';
      const repInfo = activeSelection.representativeName || '';
      return (
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 dark:text-purple-600 mb-1">SELECCIONANDO</div>
          <div className="font-semibold text-sm">Asiento {seat.seat_number}</div>
          <div className="text-xs text-gray-300 dark:text-gray-600">Reservado para: {companyInfo}</div>
          {repInfo && <div className="text-xs text-gray-400 dark:text-gray-500">Rep: {repInfo}</div>}
        </div>
      );
    }
    if (activeSelection.type === 'temp_reserved') {
      const companyInfo = activeSelection.companyName || 'Empresa';
      const ttlInfo = activeSelection.ttl ? `Expira en ${Math.round(activeSelection.ttl / 60)} min` : '';
      return (
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 dark:text-purple-600 mb-1">RESERVA TEMPORAL</div>
          <div className="font-semibold text-sm">Asiento {seat.seat_number}</div>
          <div className="text-xs text-gray-300 dark:text-gray-600">{companyInfo}</div>
          {ttlInfo && <div className="text-xs text-orange-400 dark:text-orange-600 mt-1">{ttlInfo}</div>}
        </div>
      );
    }
    return (
      <div className="text-left">
        <div className="text-[10px] font-bold uppercase tracking-wider text-orange-300 dark:text-orange-600 mb-1">SELECCIONANDO</div>
        <div className="font-semibold text-sm">Asiento {seat.seat_number}</div>
        <div className="text-xs text-gray-300 dark:text-gray-600">Por: {activeSelection.userName}</div>
      </div>
    );
  }

  // Tooltip por defecto
  return (
    <div className="text-left">
      <div className="font-semibold text-sm">Asiento {seat.seat_number}</div>
      <div className="text-xs text-gray-300 dark:text-gray-600">Tipo: {seatTypeName}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500">Estado: {seat.status}</div>
    </div>
  );
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const showTooltip = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipStyle({
        position: 'fixed',
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none',
      });
      setTooltipVisible(true);
    }
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  // Un asiento no es clickeable si está bloqueado, su estado no es 'AVAILABLE',
  // está ocupado por un representante, o está siendo seleccionado por otro usuario (solo si WebSocket está disponible)
  const isClickable = !isLocked && seat.status === 'AVAILABLE' &&
    !isOccupiedByRepresentative &&
    !(activeSelection && isWebSocketAvailable && !isSelected);

  return (
    <div className="relative" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => isClickable && onClick(seat)}
        disabled={!isClickable}
        className={`
          w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-md sm:rounded-lg border-2 transition-all duration-200
          flex items-center justify-center text-xs sm:text-sm font-bold relative
          ${getSeatStyles(seat.status, isSelected, isLocked, activeSelection, connectionStatus, isWebSocketAvailable, isOccupiedByRepresentative)}
        `}
      >
        {seat.seat_number}

        {/* Indicador de conexión WebSocket */}
        {isWebSocketAvailable && connectionStatus === 'connected' && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        )}

        {/* Indicador de modo sin tiempo real */}
        {connectionStatus === 'failed' && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
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

      {/* Tooltip fixed — sale de todos los contenedores para no ser cortado */}
      {tooltipVisible && (
        <div style={tooltipStyle}>
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg py-2 px-3 shadow-2xl border border-gray-700 dark:border-gray-300 min-w-[160px] max-w-[220px]">
            <SeatTooltipContent
              seat={seat}
              activeSelection={activeSelection}
              isOccupiedByRepresentative={isOccupiedByRepresentative}
            />
            {/* Flecha */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="w-2 h-2 bg-gray-900 dark:bg-gray-100 border-r border-b border-gray-700 dark:border-gray-300 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
