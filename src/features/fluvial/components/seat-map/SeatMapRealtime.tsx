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

const NOISE_TILE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Fondo tipo mesh / aurora: azul corporativo y teal un poco más presentes,
 * más cobertura en márgenes y zonas blancas (z-0, detrás del mapa).
 */
const SeatMapAuroraBackdrop: React.FC = () => (
  <div
    className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
    aria-hidden
  >
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(to bottom, #ffffff 0%, rgba(255, 255, 255, 0.9) 10%, rgba(241, 245, 249, 0.35) 32%, rgba(240, 249, 255, 0.45) 58%, rgba(241, 245, 249, 0.8) 100%)',
      }}
    />

    <div
      className="absolute -left-[38%] top-[-12%] h-[min(40rem,95vh)] w-[min(34rem,100vw)] rounded-full blur-3xl"
      style={{
        background:
          'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(56, 189, 248, 0.38) 0%, rgba(186, 230, 253, 0.55) 28%, rgba(0, 68, 113, 0.2) 55%, rgba(0, 68, 113, 0.06) 72%, transparent 88%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 100%)',
      }}
    />
    <div
      className="absolute -right-[32%] top-[8%] h-[min(34rem,82vh)] w-[min(30rem,90vw)] rounded-full blur-3xl"
      style={{
        background:
          'radial-gradient(ellipse 64% 54% at 40% 50%, rgba(34, 211, 238, 0.32) 0%, rgba(207, 250, 254, 0.5) 30%, rgba(0, 106, 104, 0.16) 52%, rgba(0, 106, 104, 0.05) 70%, transparent 86%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 100%)',
      }}
    />
    <div
      className="absolute left-[5%] -bottom-[26%] h-[min(36rem,72vh)] w-[min(40rem,96vw)] rounded-full blur-3xl"
      style={{
        background:
          'radial-gradient(ellipse 74% 52% at 48% 36%, rgba(226, 232, 240, 0.95) 0%, rgba(148, 163, 184, 0.28) 42%, rgba(0, 68, 113, 0.12) 58%, transparent 84%)',
      }}
    />

    <div
      className="absolute left-1/2 top-[28%] h-[min(28rem,55vh)] w-[min(88%,42rem)] -translate-x-1/2 rounded-full blur-3xl opacity-80"
      style={{
        background:
          'radial-gradient(ellipse 55% 70% at 50% 50%, rgba(241, 245, 249, 0.55) 0%, rgba(125, 211, 252, 0.22) 45%, rgba(0, 68, 113, 0.07) 65%, transparent 82%)',
      }}
    />

    <div
      className="absolute inset-[-50%] opacity-[0.62]"
      style={{
        background:
          'linear-gradient(118deg, transparent 0%, transparent 32%, rgba(255, 255, 255, 0.75) 44%, rgba(186, 230, 253, 0.55) 50%, rgba(224, 242, 254, 0.4) 54%, transparent 64%, transparent 100%)',
        transform: 'rotate(32deg)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 100%)',
      }}
    />

    <div
      className="absolute inset-0 opacity-[0.14] mix-blend-soft-light"
      style={{
        backgroundImage: NOISE_TILE,
        backgroundSize: '100px 100px',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
      }}
    />
  </div>
);

const ConnectionStatusIndicator: React.FC<{ status: 'connecting' | 'connected' | 'disconnected' | 'failed' }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: 'Tiempo Real Activo',
          bgColor: 'bg-green-100 dark:bg-green-900/40',
          textColor: 'text-green-800 dark:text-green-300',
          borderColor: 'border-green-200'
        };
      case 'connecting':
        return {
          icon: <Wifi className="h-4 w-4 animate-pulse" />,
          text: 'Conectando...',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/40',
          textColor: 'text-yellow-800 dark:text-yellow-300',
          borderColor: 'border-yellow-200'
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
          borderColor: 'border-red-200'
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
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-bl from-sky-200/30 via-sky-100/15 to-transparent blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <h2 className="text-base sm:text-lg font-bold text-primary-dark tracking-tight">
            Mapa de asientos
          </h2>
          <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-2">
            <ConnectionStatusIndicator status={connectionStatus} />
            {canUseRealtime && totalActiveSelections > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 border-orange-200/80">
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

      <div className="relative isolate -mt-4 w-full min-h-0">
        <SeatMapAuroraBackdrop />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 sm:h-40"
          style={{
            background:
              'linear-gradient(to bottom, #ffffff 0%, rgba(255, 255, 255, 0.75) 22%, rgba(255, 255, 255, 0.35) 48%, transparent 100%)',
          }}
          aria-hidden
        />
        <div className="relative z-10 flex w-full justify-center overflow-x-auto overflow-y-visible touch-pan-x pb-1 pt-4">
        <div className="relative w-max max-w-full mx-auto min-w-0">
          <div className="overflow-hidden rounded-lg border border-dashed border-dm-border-primary bg-dm-bg-primary shadow-sm ring-1 ring-slate-200/40">
            <div className="relative px-2 py-2 sm:px-3 sm:py-3 bg-dm-bg-secondary">
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
