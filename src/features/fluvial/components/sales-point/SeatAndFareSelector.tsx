// src/features/fluvial/components/sales-point/SeatAndFareSelector.tsx

import React, { useMemo, useEffect, useCallback } from 'react';
import { Spinner } from '../../../../components/common/Spinner';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData';
import { useVessel } from '../../hooks/useVesselsData';
import { useSeatMapRealtime } from '../../hooks/useSeatMapRealtime';
import { SeatMapItem, TripStop, SeatReservation } from '../../../../types';
import { SeatMapRealtime } from '../seat-map/SeatMapRealtime';
import { getSeatZoneName } from '../../utils/seatUtils';

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
    activeSeatSelections: Map<number, any>;
    seatMap: SeatMapItem[];
    isWebSocketConnected: boolean;
  }) => void;
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

  // Calcular stops disponibles para destino basado en el stop de embarque seleccionado
  const { availableStops } = useMemo(() => {
    if (!tripDetails || !selectedBoardingStopId) {
      return { availableStops: [] };
    }
    const boardingStop = tripDetails.stops.find(s => s.id === selectedBoardingStopId);
    const boardingStopOrder = boardingStop?.stop_order ?? -1;
    const stops = tripDetails.stops.filter(s => s.stop_order > boardingStopOrder);
    return {
      availableStops: stops as TripStop[],
    };
  }, [tripDetails?.id, selectedBoardingStopId]); // Ya optimizado

  const handleSeatToggleFromMap = useCallback((toggledSeat: SeatMapItem) => {
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

    if (selectedSeat && selectedSeat.id === enrichedSeat.id) {
      onSeatSelect(null);
    } else {
      onSeatSelect(enrichedSeat);
    }
  }, [isConfirmingMode, enrichSeatWithType, selectedSeat?.id, onSeatSelect, activeSeatSelections, userId]); // Dependencias estables

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
        if (!typeName) return { bgColor: 'bg-gray-100/80 border border-gray-200', textColor: 'text-gray-700' };
        
        const name = typeName.toLowerCase();
        if (name.includes('reclinable')) return { bgColor: 'bg-green-100/80 border border-green-200', textColor: 'text-green-800' };
        if (name.includes('estático')) return { bgColor: 'bg-yellow-100/80 border border-yellow-200', textColor: 'text-yellow-800' };
        if (name.includes('premium')) return { bgColor: 'bg-purple-100/80 border border-purple-200', textColor: 'text-purple-800' };
        if (name.includes('vip')) return { bgColor: 'bg-indigo-100/80 border border-indigo-200', textColor: 'text-indigo-800' };
        if (name.includes('económico') || name.includes('economico')) return { bgColor: 'bg-blue-100/80 border border-blue-200', textColor: 'text-blue-800' };
        
        return { bgColor: 'bg-gray-100/80 border border-gray-200', textColor: 'text-gray-700' };
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
        <Spinner /><span className="ml-2 text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Tramo y Asiento</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Origen (Embarque)</label>
          <select
            value={selectedBoardingStopId || ''}
            onChange={(e) => onBoardingStopChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isConfirmingMode}
          >
            <option value="" disabled>Seleccione embarque...</option>
            {tripDetails?.stops?.slice(0, -1).map(stop => (
              <option key={stop.id} value={stop.id}>
                {stop.port?.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destino (Desembarque)</label>
          <select
            value={selectedDisembarkingStopId || ''}
            onChange={(e) => onDisembarkingStopChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={!selectedBoardingStopId || availableStops.length === 0 || isConfirmingMode}
          >
            <option value="" disabled>Seleccione desembarque...</option>
            {availableStops.map(stop => (
              <option key={stop.id} value={stop.id}>
                {stop.port?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSeat && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-gray-600 text-center mb-3">Asiento Seleccionado</p>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="font-bold text-2xl text-blue-700">
                N° {selectedSeat.seat_number}
              </p>
              <p className="text-xs text-gray-500 mt-1">Número</p>
            </div>
            <div className="text-center">
              <div className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${getSeatZoneInfo(selectedSeat).zoneColor}`}>
                {getSeatZoneInfo(selectedSeat).zoneName}
              </div>
              <p className="text-xs text-gray-500 mt-1">Zona</p>
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