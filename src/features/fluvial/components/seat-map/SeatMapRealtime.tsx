// src/features/fluvial/components/seat-map/SeatMapRealtime.tsx
import React, { useMemo, useEffect, useRef } from 'react';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatMapRealtime } from '../../hooks/useSeatMapRealtime';
import { Spinner } from '../../../../components/common/Spinner';
import { SeatRealtime } from './SeatRealtime';
import { SeatMapItem } from '../../../../types';
import { useVessel } from '../../hooks/useVesselsData';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { getZoneColor, getZoneTitle } from '../../utils/seatUtils';

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
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'connecting':
        return {
          icon: <Wifi className="h-4 w-4 animate-pulse" />,
          text: 'Conectando...',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'failed':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Sin tiempo real - Modo normal activo',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Sin conexión en tiempo real',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.icon}
      <span className="font-medium">{config.text}</span>
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
          bgColor: getZoneColor(config.seat_type?.name || ''),
        };
      })
      .sort((a, b) => a.level - b.level);
  }, [vesselDetails, seatMap]);

  const isLoading = isLoadingTrip || isLoadingVessel || isLoadingMap;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (!seatLayout.length) {
    return <div className="text-center text-gray-500 p-8">No se pudo cargar la configuración de asientos.</div>;
  }

  const totalActiveSelections = activeSeatSelections.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-lg mx-auto">
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Selección de Asientos</h1>
          <p className="text-gray-600 text-sm mb-3">Sistema de reserva empresarial</p>
          
          {/* Indicadores de estado */}
          <div className="flex justify-center gap-4 mb-4">
            <ConnectionStatusIndicator status={connectionStatus} />
            {canUseRealtime && totalActiveSelections > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border bg-orange-100 text-orange-800 border-orange-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{totalActiveSelections} vendedor{totalActiveSelections > 1 ? 'es' : ''} activo{totalActiveSelections > 1 ? 's' : ''}</span>
              </div>
            )}
            {connectionStatus === 'failed' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border bg-blue-100 text-blue-800 border-blue-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Venta normal habilitada</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
          <div className="relative">
            <div className="border border-dashed border-gray-400 rounded-2xl px-2 py-4 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="w-auto px-4 h-8 border border-dashed border-gray-400 rounded-t-2xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-gray-700 uppercase">{vesselName}</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="space-y-2">
                  {seatLayout.map(section => (
                    <div key={section.id} className={`${section.bgColor} rounded-xl p-4 mb-4`}>
                      <div className="text-center mb-4">
                        <h3 className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm border inline-block">
                          {section.title}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {section.rows.map((row, rowIndex) => (
                          <div key={`${section.id}-row-${rowIndex}`} className="bg-white/40 rounded-lg p-3">
                            <div className="flex justify-center gap-6">
                              <div className="flex gap-3">
                                {row.slice(Math.ceil(row.length / 2)).reverse().map(seat => {
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
                                      isOccupiedByRepresentative={false} // Ya no necesario, se maneja con activeSelection
                                    />
                                  );
                                })}
                              </div>
                              {section.totalColumns > 2 && (
                                <div className="w-16 flex items-center justify-center">
                                  <div className="w-0.5 h-8 bg-gray-300 rounded-full"></div>
                                </div>
                              )}
                              <div className="flex gap-3">
                                {row.slice(0, Math.ceil(row.length / 2)).reverse().map(seat => {
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
                                      isOccupiedByRepresentative={false} // Ya no necesario, se maneja con activeSelection
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-white border border-dashed border-gray-400 rounded-b-xl flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">TRASERA</span>
              </div>
            </div>
          </div>
          
          {/* Leyenda de estados */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Leyenda:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Seleccionado</span>
              </div>
              {canUseRealtime && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded animate-pulse"></div>
                    <span>Otro vendedor</span>
                  </div>
                  {/* Leyenda para reservas temporales de representantes */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-400 rounded animate-pulse"></div>
                    <span>Reserva temporal (30min)</span>
                  </div>
                  {/* Leyenda para representantes de otros vendedores */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded animate-pulse"></div>
                    <span>Rep. otra empresa</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Representante</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Ocupado</span>
              </div>
            </div>
            {connectionStatus === 'failed' && (
              <div className="mt-2 text-xs text-gray-600 italic">
                Modo normal: Las ventas funcionan normalmente, pero sin vista en tiempo real de otros vendedores.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
