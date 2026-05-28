// src/features/fluvial/components/seat-map/Seat.tsx

import React, { useRef, useState, useCallback } from 'react';
import { SeatMapItem, SeatStatus, SeatOccupantInfo } from '../../../../types';
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
  isPendingBlocked?: boolean;
}> = ({ seat, isPendingBlocked }) => {
  const seatTypeName = getSeatTypeName(seat.seat_type?.name);

  // Si tiene ocupante (CONFIRMED o RESERVED con datos del backend)
  if (seat.occupant && (seat.status === 'CONFIRMED' || seat.status === 'RESERVED')) {
    return <OccupantTooltip occupant={seat.occupant} status={seat.status} />;
  }

  // Tooltip por defecto
  const displayStatus = isPendingBlocked ? 'PENDIENTE (otra asignación)' : seat.status;
  return (
    <div className="text-left">
      <div className="font-semibold text-sm">Asiento {seat.seat_number}</div>
      <div className="text-xs text-gray-300 dark:text-gray-600">Tipo: {seatTypeName}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500">Estado: {displayStatus}</div>
    </div>
  );
};

export const Seat: React.FC<SeatProps> = ({ seat, isSelected, onClick, isLocked = false, isPendingBlocked = false }) => {
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

  const isClickable = !isLocked && !isPendingBlocked && seat.status === 'AVAILABLE';

  return (
    <div className="relative" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      <button
        ref={buttonRef}
        onClick={() => isClickable && onClick(seat)}
        disabled={!isClickable}
        className={`
          w-14 h-14 rounded-lg border-2 transition-all duration-200
          flex items-center justify-center text-sm font-bold
          ${getSeatStyles(seat.status, isSelected, isLocked, isPendingBlocked)}
        `}
      >
        {seat.seat_number}
      </button>

      {/* Tooltip fixed — sale de todos los contenedores para no ser cortado */}
      {tooltipVisible && (
        <div style={tooltipStyle}>
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg py-2 px-3 shadow-2xl border border-gray-700 dark:border-gray-300 min-w-[160px] max-w-[220px]">
            <SeatTooltipContent seat={seat} isPendingBlocked={isPendingBlocked} />
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
