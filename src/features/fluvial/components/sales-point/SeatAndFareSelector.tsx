// src/features/fluvial/components/sales-point/SeatAndFareSelector.tsx

import React, { useMemo, useEffect, useCallback } from 'react';
import { Spinner } from '../../../../components/common/Spinner';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData';
import { useVessel } from '../../hooks/useVesselsData';
import { useSeatMapRealtime } from '../../hooks/useSeatMapRealtime';
import { SeatMapItem, TripStop, SeatReservation } from '../../../../types';
import { SeatMapRealtime } from '../seat-map/SeatMapRealtime';
import { getSeatZoneName } from '../../utils/seatUtils';
import type { SeatSelection } from '../../types/websocket.types';

interface SeatAndFareSelectorProps {
  tripId: number;
  // Usar stop IDs en lugar de port IDs
  selectedBoardingStopId: number | null;
  onBoardingStopChange: (stopId: number | null) => void;
  selectedDisembarkingStopId: number | null;
  onDisembarkingStopChange: (stopId: number | null) => void;
  selectedSeat: SeatMapItem | null;
  onSeatSelect: (seat: SeatMapItem | null) => void;
  isConfirmingMode?: boolean;
  reservationToConfirm?: SeatReservation;
  // Nuevas props para WebSocket
  userId?: string;
  userName?: string;
  // Nueva prop para asientos ocupados por representantes
  occupiedSeatNumbers?: string[];
  // prop para indicar modo empresa
  isCompanyMode?: boolean;
  // prop para asientos seleccionados de representantes (modo empresa)
  representativeSelectedSeatIds?: number[];
  // Callbacks para exponer funciones del hook useSeatMapRealtime
  onWebSocketReady?: (functions: {
    selectSeatForRepresentative: (seatId: number, representativeIndex: number, representativeName: string) => boolean;
    releaseSeatForRepresentative: (seatId: number, representativeIndex?: number) => boolean;
    confirmPurchase: (seatIds?: number[]) => boolean;
    activeSeatSelections: Map<number, SeatSelection>;
    seatMap: SeatMapItem[];
    isWebSocketConnected: boolean;
  }) => void;
  // NUEVO: Función para reservar asiento inmediatamente cuando se selecciona en modo representante
  onSeatReserveForRepresentative?: (seatNumber: string, representativeIndex: number) => Promise<boolean>;
  // NUEVO: Función para liberar asiento de representante
  onSeatReleaseForRepresentative?: (representativeIndex: number) => Promise<void>;
  // NUEVO: Índice del representante actual (cuántos representantes ya existen)
  currentRepresentativeIndex?: number;
}

export const SeatAndFareSelector: React.FC<SeatAndFareSelectorProps> = ({
  tripId,
  selectedBoardingStopId,
  onBoardingStopChange,
  selectedDisembarkingStopId,
  onDisembarkingStopChange,
  selectedSeat,
  onSeatSelect,
  isConfirmingMode = false,
  reservationToConfirm,
  userId = 'default-user',
  userName = 'Usuario',
  occupiedSeatNumbers = [],
  isCompanyMode = false,
  representativeSelectedSeatIds = [],
  onWebSocketReady,
  onSeatReserveForRepresentative,
  onSeatReleaseForRepresentative,
  currentRepresentativeIndex = 0,
}) => {
  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(tripId);
  const { isLoading: isLoadingSeatTypes } = useSeatTypesData();
  
  // Usar el hook useSeatMapRealtime para obtener las funciones necesarias
  const {
    seatMap,
    selectSeatForRepresentative,
    releaseSeatForRepresentative,
    confirmPurchase,
    activeSeatSelections,
    isConnected: isWebSocketConnected,
  } = useSeatMapRealtime({
    tripId,
    userId,
    userName,
    enabled: !isConfirmingMode, // Solo habilitar WebSocket si no está en modo confirmación
    companyName: undefined, // No es modo empresa en este componente
    isCompanyMode, // Pasar el modo empresa
    enableDebugLogs: true, // Habilitar logs de debug para investigar mensajes WebSocket
  });

  // Exponer las funciones del hook al componente padre - Optimizado
  useEffect(() => {
    if (onWebSocketReady && seatMap) {
      onWebSocketReady({
        selectSeatForRepresentative,
        releaseSeatForRepresentative,
        confirmPurchase,
        activeSeatSelections,
        seatMap,
        isWebSocketConnected,
      });
    }
  }, [
    onWebSocketReady,
    seatMap?.length, // Solo la longitud para evitar recreaciones constantes
    isWebSocketConnected,
    // Remover activeSeatSelections y las funciones individuales que cambian frecuentemente
  ]);

  // Obtener información de la embarcación para las configuraciones de asientos
  const vesselId = tripDetails?.vessel?.id;
  const { data: vesselDetails } = useVessel(vesselId || null);

  // Función utilitaria para enriquecer asientos con información de seat_type - Memoizada
  // Esta función compensa la falta de seat_type en la respuesta del backend /seat-map
  // utilizando las configuraciones de embarcación que ya están disponibles
  const enrichSeatWithType = useMemo(() => {
    return (seat: SeatMapItem): SeatMapItem => {
      if (!vesselDetails?.seat_configurations || !seat.vessel_seat_config_id) {
        return seat;
      }

      const seatConfig = vesselDetails.seat_configurations.find(
        config => config.id === seat.vessel_seat_config_id
      );

      if (seatConfig && seatConfig.seat_type) {
        return {
          ...seat,
          seat_type: seatConfig.seat_type
        };
      }

      return seat;
    };
  }, [vesselDetails?.seat_configurations]); // Solo dependencias estables

  // Este efecto se encarga de pre-seleccionar el asiento
  // cuando el formulario está en modo de confirmación de reserva.
  useEffect(() => {
    // 1. Salir temprano si no estamos en modo de confirmación
    if (!isConfirmingMode || !reservationToConfirm) {
      return;
    }

    // 2. Si ya hay un asiento seleccionado con el ID correcto, no es necesario volver a buscarlo.
    if (selectedSeat && selectedSeat.id === reservationToConfirm.trip_seat_id) {
      return;
    }

    // 3. Para el modo de confirmación, necesitaremos buscar el asiento desde el backend
    // ya que el mapa de asientos ahora se maneja en el componente SeatMapRealtime
    // Por ahora, el efecto queda documentado pero la lógica se maneja en el componente hijo
  }, [isConfirmingMode, reservationToConfirm?.id, selectedSeat?.id]); // Ya optimizado

  // Calcular selectedSeats dependiendo del modo empresa
  const selectedSeatsForMap = useMemo((): Set<number> => {
    if (isCompanyMode) {
      // En modo empresa, incluir todos los asientos de representantes + el actual
      const allSelectedIds = [...representativeSelectedSeatIds];
      if (selectedSeat) {
        allSelectedIds.push(selectedSeat.id);
      }
      return new Set(allSelectedIds);
    } else {
      // En modo individual, solo el asiento seleccionado
      return selectedSeat ? new Set([selectedSeat.id]) : new Set();
    }
  }, [isCompanyMode, representativeSelectedSeatIds.length, selectedSeat?.id]); // Ya optimizado

  // Paradas ordenadas por stop_order para garantizar coherencia
  // independientemente del orden en que el backend las devuelva.
  // Esto es crítico cuando se agregan paradas intermedias a una ruta,
  // ya que pueden aparecer al final del arreglo aunque su stop_order sea menor.
  const sortedStops = useMemo((): TripStop[] => {
    if (!tripDetails?.stops) return [];
    return [...tripDetails.stops].sort((a, b) => a.stop_order - b.stop_order);
  }, [tripDetails?.id, tripDetails?.stops?.length]);

  // Calcular stops disponibles para destino basado en el stop de embarque seleccionado
  const { availableStops } = useMemo(() => {
    if (!selectedBoardingStopId || sortedStops.length === 0) {
      return { availableStops: [] };
    }
    const boardingStop = sortedStops.find(s => s.id === selectedBoardingStopId);
    const boardingStopOrder = boardingStop?.stop_order ?? -1;
    const stops = sortedStops.filter(s => s.stop_order > boardingStopOrder);
    return {
      availableStops: stops,
    };
  }, [sortedStops, selectedBoardingStopId]);

  const handleSeatToggleFromMap = useCallback(async (toggledSeat: SeatMapItem) => {
    // Si estamos en modo de confirmación, no se permite ninguna interacción con el mapa.
    if (isConfirmingMode) return;

    // Enriquecer el asiento con información de seat_type
    const enrichedSeat = enrichSeatWithType(toggledSeat);

    //  SOLUCIÓN: Verificar que el asiento no esté siendo usado por otro vendedor
    const existingSelection = activeSeatSelections?.get(enrichedSeat.id);
    if (existingSelection && existingSelection.userId !== userId) {
      // El asiento está siendo usado por otro vendedor, mostrar mensaje y no permitir selección
      console.warn(`Asiento ${enrichedSeat.seat_number} está siendo usado por ${existingSelection.userName}`);
      return;
    }

    const shouldUseRepresentativeFlow = isCompanyMode;

    if (selectedSeat && selectedSeat.id === enrichedSeat.id) {
      // Deseleccionando asiento
      onSeatSelect(null);

      // Solo en modo empresa liberar reserva temporal de representante
      if (shouldUseRepresentativeFlow && onSeatReleaseForRepresentative) {
        await onSeatReleaseForRepresentative(currentRepresentativeIndex);
      }
    } else {
      // Solo en modo empresa, al cambiar asiento, liberar la reserva anterior
      if (shouldUseRepresentativeFlow && selectedSeat && onSeatReleaseForRepresentative) {
        await onSeatReleaseForRepresentative(currentRepresentativeIndex);
      }

      // Solo en modo empresa reservar inmediatamente para representantes
      if (shouldUseRepresentativeFlow && onSeatReserveForRepresentative) {
        const reserved = await onSeatReserveForRepresentative(
          enrichedSeat.seat_number,
          currentRepresentativeIndex
        );

        if (!reserved) {
          // No se pudo reservar, no seleccionar el asiento
          return;
        }
      }

      // Seleccionar asiento
      onSeatSelect(enrichedSeat);
    }
  }, [isConfirmingMode, enrichSeatWithType, selectedSeat?.id, selectedSeat, onSeatSelect, activeSeatSelections, userId, onSeatReserveForRepresentative, onSeatReleaseForRepresentative, currentRepresentativeIndex]);

  // Función para obtener información de zona del asiento seleccionado - Memoizada
  const getSeatZoneInfo = useMemo(() => {
    return (seat: SeatMapItem) => {
      const enrichedSeat = enrichSeatWithType(seat);
      const seatConfig = vesselDetails?.seat_configurations?.find(
        config => config.id === seat.vessel_seat_config_id
      );
      const seatTypeName = seatConfig?.seat_type?.name || enrichedSeat.seat_type?.name;
      
      // Obtener colores de fondo y texto que contrasten
      const getZoneColorWithText = (typeName?: string | null): { bgColor: string; textColor: string } => {
        if (!typeName) return { bgColor: 'bg-dm-bg-secondary/80 border border-dm-border-primary', textColor: 'text-dm-text-secondary' };
        
        const name = typeName.toLowerCase();
        if (name.includes('reclinable')) return { bgColor: 'bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800', textColor: 'text-green-800 dark:text-green-300' };
        if (name.includes('estático')) return { bgColor: 'bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800', textColor: 'text-yellow-800 dark:text-yellow-300' };
        if (name.includes('premium')) return { bgColor: 'bg-purple-100/80 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800', textColor: 'text-purple-800 dark:text-purple-300' };
        if (name.includes('vip')) return { bgColor: 'bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800', textColor: 'text-indigo-800 dark:text-indigo-300' };
        if (name.includes('económico') || name.includes('economico')) return { bgColor: 'bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800', textColor: 'text-blue-800 dark:text-blue-300' };
        
        return { bgColor: 'bg-dm-bg-secondary/80 border border-dm-border-primary', textColor: 'text-dm-text-secondary' };
      };
      
      const { bgColor, textColor } = getZoneColorWithText(seatTypeName);
      
      return {
        zoneName: getSeatZoneName(enrichedSeat, vesselDetails?.seat_configurations),
        zoneColor: `${bgColor} ${textColor}`,
        seatTypeName
      };
    };
  }, [enrichSeatWithType, vesselDetails?.seat_configurations]); // Dependencias estables

  const isLoading = isLoadingTrip || isLoadingSeatTypes;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner /><span className="ml-2 text-dm-text-secondary">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dm-text-primary">Tramo y Asiento</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <SearchableSelect
          label="Origen (Embarque)"
          value={selectedBoardingStopId}
          onChange={(value) => onBoardingStopChange(value ? Number(value) : null)}
          options={sortedStops.slice(0, -1).map(stop => ({
            value: stop.id,
            label: stop.port?.name || 'Sin nombre'
          }))}
          placeholder="Seleccione embarque..."
          disabled={isConfirmingMode}
        />
        <SearchableSelect
          label="Destino (Desembarque)"
          value={selectedDisembarkingStopId}
          onChange={(value) => onDisembarkingStopChange(value ? Number(value) : null)}
          options={availableStops.map(stop => ({
            value: stop.id,
            label: stop.port?.name || 'Sin nombre'
          }))}
          placeholder="Seleccione desembarque..."
          disabled={!selectedBoardingStopId || availableStops.length === 0 || isConfirmingMode}
        />
      </div>

      {selectedSeat && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-4 rounded-lg">
          <p className="text-sm text-dm-text-secondary text-center mb-3">Asiento Seleccionado</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <div className="text-center">
              <p className="font-bold text-2xl text-blue-700 dark:text-blue-300">
                N° {selectedSeat.seat_number}
              </p>
              <p className="text-xs text-dm-text-muted mt-1">Número</p>
            </div>
            <div className="text-center">
              <div className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${getSeatZoneInfo(selectedSeat).zoneColor}`}>
                {getSeatZoneInfo(selectedSeat).zoneName}
              </div>
              <p className="text-xs text-dm-text-muted mt-1">Zona</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 border-t pt-4">
        <SeatMapRealtime
          tripId={tripId}
          vesselName={tripDetails?.vessel?.name || 'Embarcación'}
          selectedSeats={selectedSeatsForMap}
          onSeatToggle={handleSeatToggleFromMap}
          isLocked={isConfirmingMode}
          userId={userId}
          userName={userName}
          occupiedSeatNumbers={occupiedSeatNumbers}
          isCompanyMode={isCompanyMode}
          reservationSeatId={isConfirmingMode && reservationToConfirm ? reservationToConfirm.trip_seat_id : undefined}
        />
      </div>
    </div>
  );
};