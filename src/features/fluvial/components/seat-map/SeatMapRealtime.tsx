// src/features/fluvial/components/seat-map/SeatMapRealtime.tsx
import React, { useMemo, useEffect, useRef } from 'react';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatMapRealtime } from '../../hooks/useSeatMapRealtime';
import { Spinner } from '../../../../components/common/Spinner';
import { SeatRealtime } from './SeatRealtime';
import { SeatMapItem } from '../../../../types';
import { useVessel } from '../../hooks/useVesselsData';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { getZoneTitle } from '../../utils/seatUtils';

interface SeatMapRealtimeProps {
  tripId: number;
  vesselName: string;
  selectedSeats: Set<number>;
  onSeatToggle: (seat: SeatMapItem) => void;
  isLocked?: boolean;
  userId: string;
  userName: string;
  occupiedSeatNumbers?: string[]; // Nueva prop para asientos ocupados por representantes
  isCompanyMode?: boolean; // Nueva prop para indicar si está en modo empresa (RUC)
  reservationSeatId?: number; // Nueva prop para seleccionar asiento de reservación automáticamente
}

type SeatRow = SeatMapItem[];

const ConnectionStatusIndicator: React.FC<{ status: 'connecting' | 'connected' | 'disconnected' | 'failed' }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: 'Tiempo Real Activo',
          bgColor: 'bg-green-100 dark:bg-green-900/40',
          textColor: 'text-green-800 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800/50'
        };
      case 'connecting':
        return {
          icon: <Wifi className="h-4 w-4 animate-pulse" />,
          text: 'Conectando...',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/40',
          textColor: 'text-yellow-800 dark:text-yellow-300',
          borderColor: 'border-yellow-200 dark:border-yellow-800/50'
        };
      case 'failed':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Sin tiempo real - Modo normal activo',
          bgColor: 'bg-dm-bg-secondary',
          textColor: 'text-dm-text-primary',
          borderColor: 'border-dm-border-primary'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Sin conexión en tiempo real',
          bgColor: 'bg-red-100 dark:bg-red-900/40',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800/50'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm border max-w-full ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      <span className="font-medium text-center leading-tight">{config.text}</span>
    </div>
  );
};

export const SeatMapRealtime: React.FC<SeatMapRealtimeProps> = React.memo(({ 
  tripId, 
  vesselName, 
  selectedSeats, 
  onSeatToggle, 
  isLocked = false,
  userId,
  userName,
  isCompanyMode = false, // Nueva prop con valor por defecto
  reservationSeatId // Nueva prop para asiento de reservación
}) => {
  // Referencia estable para las selecciones actuales
  const selectedSeatsRef = useRef<Set<number>>(selectedSeats);
  
  // Actualizar la referencia cuando cambien las selecciones
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(tripId);
  const vesselId = tripDetails?.vessel?.id;
  const { data: vesselDetails, isLoading: isLoadingVessel } = useVessel(vesselId || null);
  
  const {
    seatMap,
    activeSeatSelections, 
    connectionStatus, 
    isLoading: isLoadingMap,
    selectSeat,
    releaseSeat,
    isWebSocketAvailable,
    canUseRealtime
  } = useSeatMapRealtime({
    tripId,
    userId,
    userName,
    enabled: !isLocked, // Solo habilitar WebSocket si no está bloqueado
    // Configuración mejorada para empresa
    companyName: undefined, // No es modo empresa en este componente
    isCompanyMode // Pasar el modo empresa al hook
  });

  // Log de los datos del mapa de asientos
  React.useEffect(() => {
    if (seatMap && seatMap.length > 0) {
      const nonAvailableSeats = seatMap.filter(seat => seat.status !== 'AVAILABLE');
      if (nonAvailableSeats.length > 0) {
        // Logging removed for production
      }
      
      // Log completo del estado del mapa
      // Logging removed for production
    }
  }, [seatMap?.length, connectionStatus, isWebSocketAvailable, canUseRealtime]);

  // Seleccionar automáticamente el asiento de la reservación
  React.useEffect(() => {
    if (reservationSeatId && seatMap && seatMap.length > 0 && !isLocked) {
      const reservationSeat = seatMap.find(seat => seat.id === reservationSeatId);
      if (reservationSeat && !selectedSeats.has(reservationSeatId)) {
        // Logging removed for production
        // Seleccionar el asiento automáticamente
        onSeatToggle(reservationSeat);
      } else if (reservationSeat && selectedSeats.has(reservationSeatId)) {
        // Logging removed for production
      } else if (!reservationSeat) {
        // Logging removed for production
      }
    }
  }, [reservationSeatId, seatMap, selectedSeats, onSeatToggle, isLocked]);

  // Manejar selección/deselección de asientos con notificación WebSocket
  const handleSeatToggle = (seat: SeatMapItem) => {
    if (isLocked) return;

    //  SOLUCIÓN: Verificar que el asiento no esté siendo usado por otro vendedor
    const existingSelection = activeSeatSelections?.get(seat.id);
    if (existingSelection && existingSelection.userId !== userId) {
      // El asiento está siendo usado por otro vendedor, no permitir interacción
      console.warn(`Asiento ${seat.seat_number} está siendo usado por ${existingSelection.userName}`);
      return;
    }

    // En modo empresa, NO hacer selección automática vía WebSocket
    // En modo empresa, la selección la maneja el SaleForm directamente
    if (!isCompanyMode) {
      const isCurrentlySelected = selectedSeats.has(seat.id);
      
      if (isCurrentlySelected) {
        // Liberar asiento
        releaseSeat(seat.id);
      } else {
        // Seleccionar asiento
        selectSeat(seat.id);
      }
    }
    
    // Llamar al handler original (siempre necesario para actualizar UI)
    onSeatToggle(seat);
  };

  // Liberar selección solo cuando el componente se desmonta
  const releaseSeatRef = useRef(releaseSeat);
  
  // Actualizar la referencia sin crear dependencia
  useEffect(() => {
    releaseSeatRef.current = releaseSeat;
  });
  
  useEffect(() => {
    return () => {
      // Usar la referencia actual para evitar dependencias circulares
      const currentSelectedSeats = Array.from(selectedSeatsRef.current);
      currentSelectedSeats.forEach(seatId => {
        releaseSeatRef.current(seatId);
      });
    };
  }, []); // Sin dependencias para evitar recreación infinita

  const seatLayout = useMemo(() => {
    if (!vesselDetails?.seat_configurations || !(seatMap ?? []).length) {
      return [];
    }
    
    const seatsByConfigId = (seatMap ?? []).reduce((acc, seat) => {
      const configId = seat.vessel_seat_config_id;
      if (!acc[configId]) acc[configId] = [];
      acc[configId].push(seat);
      return acc;
    }, {} as Record<number, SeatMapItem[]>);

    return vesselDetails.seat_configurations
      .map(config => {
        const configSeats = seatsByConfigId[config.id] || [];
        const totalColumns = vesselDetails.total_columns || 4;
        const rows: SeatRow[] = [];
        
        configSeats.forEach(seat => {
          const sortedSectionSeats = [...configSeats].sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number));
          const seatIndexInSection = sortedSectionSeats.findIndex(s => s.id === seat.id);
          const rowIndex = Math.floor(seatIndexInSection / totalColumns);
          if (!rows[rowIndex]) {
            rows[rowIndex] = [];
          }
          rows[rowIndex].push(seat);
        });

        rows.forEach(row => {
          row.sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number));
        });

        return {
          id: config.id,
          title: getZoneTitle(config.seat_type?.name || ''),
          level: config.deck_level,
          rows: rows,
          totalColumns: totalColumns,
        };
      })
      .sort((a, b) => a.level - b.level);
  }, [vesselDetails, seatMap]);

  const isLoading = isLoadingTrip || isLoadingVessel || isLoadingMap;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (!seatLayout.length) {
    return <div className="text-center text-dm-text-muted p-8">No se pudo cargar la configuración de asientos.</div>;
  }

  //  CORRECCIÓN: Contar vendedores únicos en lugar de asientos
  // Agrupar por userId base (quitando sufijos de representantes)
  const uniqueSellers = new Set<string>();
  activeSeatSelections.forEach((selection) => {
    // Extraer userId base removiendo sufijos como -company-session-rep-X
    const baseUserId = selection.userId.split('-company-')[0];
    uniqueSellers.add(baseUserId);
  });
  const totalActiveSelections = uniqueSellers.size;

  return (
    <div className="w-full min-h-0">
      <div className="relative z-10 mb-3 sm:mb-4 overflow-hidden rounded-md bg-dm-bg-primary text-center">
        <div className="relative">
          <h2 className="text-base sm:text-lg font-bold text-dm-text-primary tracking-tight">
            Mapa de asientos
          </h2>
          <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-2">
            <ConnectionStatusIndicator status={connectionStatus} />
            {canUseRealtime && totalActiveSelections > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/50">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium leading-tight">
                  {totalActiveSelections} vendedor{totalActiveSelections > 1 ? 'es' : ''} activo{totalActiveSelections > 1 ? 's' : ''}
                </span>
              </div>
            )}
            {connectionStatus === 'failed' && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border bg-dm-bg-secondary text-dm-text-secondary border-dm-border-primary">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium leading-tight">Venta normal habilitada</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-20 -mt-4 w-full min-h-0">
        <div className="relative flex w-full justify-center overflow-x-auto overflow-y-visible touch-pan-x pb-1 pt-4">
        <div className="relative w-max max-w-full mx-auto min-w-0">
          <div className="overflow-visible rounded-lg border border-dashed border-dm-border-primary bg-dm-bg-primary shadow-sm ring-1 ring-slate-200/40 dark:ring-slate-700/40">
            <div className="relative px-5 py-2 sm:px-8 sm:py-3 bg-dm-bg-secondary">
              <div className="text-center pb-2 mb-1 border-b border-dashed border-dm-border-primary/80">
              <span className="text-[10px] sm:text-xs font-bold text-dm-text-secondary uppercase tracking-wide line-clamp-2">
                {vesselName}
              </span>
              <span className="block text-[9px] text-dm-text-muted mt-0.5">Proa</span>
              </div>

              <div className="space-y-3 sm:space-y-4">
              {seatLayout.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  className={sectionIndex > 0 ? 'pt-3 border-t border-dm-border-primary/90' : ''}
                >
                  <p className="text-center text-[10px] sm:text-xs font-semibold text-dm-text-muted uppercase tracking-wider mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-1.5 sm:space-y-2">
                    {section.rows.map((row, rowIndex) => (
                      <div
                        key={`${section.id}-row-${rowIndex}`}
                        className="flex justify-center items-center gap-1.5 sm:gap-2 md:gap-3"
                      >
                        <div className="flex gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                          {row.slice(Math.ceil(row.length / 2)).reverse().map((seat) => {
                            const isSelected = selectedSeats.has(seat.id);
                            return (
                              <SeatRealtime
                                key={seat.id}
                                seat={seat}
                                isSelected={isSelected}
                                onClick={handleSeatToggle}
                                isLocked={isLocked}
                                activeSelection={activeSeatSelections.get(seat.id)}
                                connectionStatus={connectionStatus}
                                isWebSocketAvailable={isWebSocketAvailable}
                                isOccupiedByRepresentative={false}
                              />
                            );
                          })}
                        </div>
                        {section.totalColumns > 2 && (
                          <div className="w-4 sm:w-6 md:w-8 shrink-0 flex items-center justify-center">
                            <div className="w-px h-5 sm:h-6 md:h-7 bg-gray-300 dark:bg-gray-700" aria-hidden />
                          </div>
                        )}
                        <div className="flex gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                          {row.slice(0, Math.ceil(row.length / 2)).reverse().map((seat) => {
                            const isSelected = selectedSeats.has(seat.id);
                            return (
                              <SeatRealtime
                                key={seat.id}
                                seat={seat}
                                isSelected={isSelected}
                                onClick={handleSeatToggle}
                                isLocked={isLocked}
                                activeSelection={activeSeatSelections.get(seat.id)}
                                connectionStatus={connectionStatus}
                                isWebSocketAvailable={isWebSocketAvailable}
                                isOccupiedByRepresentative={false}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              </div>

              <div className="text-center pt-2 mt-2 border-t border-dashed border-dm-border-primary/80">
                <span className="text-[9px] text-dm-text-muted">Trasera</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});
