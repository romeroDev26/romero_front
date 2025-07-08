// src/features/fluvial/components/sales-point/SeatAndFareSelector.tsx

import React, { useMemo, useEffect } from 'react';
import { Spinner } from '../../../../components/common/Spinner';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData';
import { useSeatMap } from '../../hooks/useSeatMap';
import { SeatMapItem, TripStop, SeatReservation } from '../../../../types';
import { SeatMap } from '../seat-map/SeatMap';

interface SeatAndFareSelectorProps {
  tripId: number;
  selectedOriginId: number | null;
  onOriginChange: (portId: number | null) => void;
  selectedDestinationId: number | null;
  onDestinationChange: (portId: number | null) => void;
  selectedSeat: SeatMapItem | null;
  onSeatSelect: (seat: SeatMapItem | null) => void;
  isConfirmingMode?: boolean;
  reservationToConfirm?: SeatReservation;
}

export const SeatAndFareSelector: React.FC<SeatAndFareSelectorProps> = ({
  tripId,
  selectedOriginId,
  onOriginChange,
  selectedDestinationId,
  onDestinationChange,
  selectedSeat,
  onSeatSelect,
  isConfirmingMode = false,
  reservationToConfirm,
}) => {
  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(tripId);
  const { data: allSeatTypes = [], isLoading: isLoadingSeatTypes } = useSeatTypesData();
  const { data: seatMap = [], isLoading: isLoadingSeatMap } = useSeatMap(tripId);

  // Este efecto se encarga de pre-seleccionar el asiento
  // cuando el formulario está en modo de confirmación de reserva.
  useEffect(() => {
    // 1. Salir temprano si no estamos en modo de confirmación o si los datos necesarios no están listos.
    if (!isConfirmingMode || !reservationToConfirm || !seatMap || seatMap.length === 0) {
      return;
    }

    // 2. Si ya hay un asiento seleccionado con el ID correcto, no es necesario volver a buscarlo.
    //    Esto evita ejecuciones innecesarias si el componente se vuelve a renderizar por otra razón.
    if (selectedSeat && selectedSeat.id === reservationToConfirm.trip_seat_id) {
      return;
    }

    // 3. Buscar el asiento correspondiente a la reserva en el mapa de asientos cargado.
    const seatToSelect = seatMap.find(
      (seat) => seat.id === reservationToConfirm.trip_seat_id
    );

    // 4. Si se encuentra el asiento, se lo pasamos al componente padre para que lo seleccione.
    if (seatToSelect) {
      onSeatSelect(seatToSelect);
    }
  }, [isConfirmingMode, reservationToConfirm, seatMap, onSeatSelect, selectedSeat]);


  const { availableStops } = useMemo(() => {
    if (!tripDetails) {
      return { availableStops: [] };
    }
    const originStopOrder = tripDetails.stops.find(s => s.port_id === selectedOriginId)?.stop_order ?? -1;
    const stops = tripDetails.stops.filter(s => s.stop_order > originStopOrder);
    return {
      availableStops: stops as TripStop[],
    };
  }, [tripDetails, selectedOriginId]);

  const handleSeatToggleFromMap = (toggledSeat: SeatMapItem) => {
    // Si estamos en modo de confirmación, no se permite ninguna interacción con el mapa.
    if (isConfirmingMode) return;

    if (selectedSeat && selectedSeat.id === toggledSeat.id) {
      onSeatSelect(null);
    } else {
      onSeatSelect(toggledSeat);
    }
  };

  const isLoading = isLoadingTrip || isLoadingSeatTypes || isLoadingSeatMap;

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
          <select
            value={selectedOriginId || ''}
            onChange={(e) => onOriginChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isConfirmingMode}
          >
            {tripDetails?.stops?.slice(0, -1).map(stop => (
              <option key={stop.id} value={stop.port_id}>{stop.port?.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
          <select
            value={selectedDestinationId || ''}
            onChange={(e) => onDestinationChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={!selectedOriginId || availableStops.length === 0 || isConfirmingMode}
          >
            <option value="" disabled>Seleccione...</option>
            {availableStops.map(stop => (
              <option key={stop.id} value={stop.port_id}>{stop.port?.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedSeat && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Asiento Seleccionado:</p>
          <p className="font-bold text-lg text-blue-700">N° {selectedSeat.seat_number} <span className="font-normal text-base">({selectedSeat.seat_type.name})</span></p>
        </div>
      )}

      <div className="mt-4 border-t pt-4">
        <SeatMap
          tripId={tripId}
          vesselName={tripDetails?.vessel?.name || 'Embarcación'}
          selectedSeats={selectedSeat ? new Set([selectedSeat.id]) : new Set()}
          onSeatToggle={handleSeatToggleFromMap}
          isLocked={isConfirmingMode}
        />
      </div>
    </div>
  );
};