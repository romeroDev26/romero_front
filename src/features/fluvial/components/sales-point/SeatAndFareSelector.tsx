// src/features/fluvial/components/sales-point/SeatAndFareSelector.tsx
import React, { useMemo } from 'react';
import { Spinner } from '../../../../components/common/Spinner';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData';
import { useSeatMap } from '../../hooks/useSeatMap';
import { SeatMapItem, TripStop } from '../../../../types';
import { SeatMap } from '../seat-map/SeatMap';

interface SeatAndFareSelectorProps {
  tripId: number;
  selectedOriginId: number | null;
  onOriginChange: (portId: number | null) => void;
  selectedDestinationId: number | null;
  onDestinationChange: (portId: number | null) => void;
  selectedSeatTypeId: number | null;
  onSeatTypeChange: (seatTypeId: number | null) => void;
  selectedSeat: SeatMapItem | null;
  onSeatSelect: (seat: SeatMapItem | null) => void;
}

export const SeatAndFareSelector: React.FC<SeatAndFareSelectorProps> = ({
  tripId,
  selectedOriginId,
  onOriginChange,
  selectedDestinationId,
  onDestinationChange,
  selectedSeatTypeId,
  onSeatTypeChange,
  selectedSeat,
  onSeatSelect,
}) => {
  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(tripId);
  const { data: allSeatTypes = [], isLoading: isLoadingSeatTypes } = useSeatTypesData();
  const { data: seatMap = [], isLoading: isLoadingSeatMap } = useSeatMap(tripId);

  const { availableStops, seatTypesWithAvailability, availableSeatsForSelectedType } = useMemo(() => {
    if (!tripDetails || !allSeatTypes.length || !(seatMap ?? []).length) {
      return { availableStops: [], seatTypesWithAvailability: [], availableSeatsForSelectedType: [] };
    }
    const originStopOrder = tripDetails.stops.find(s => s.port_id === selectedOriginId)?.stop_order ?? -1;
    const stops = tripDetails.stops.filter(s => s.stop_order > originStopOrder);
    const seatsGroupedByType = (seatMap ?? []).reduce((acc, seat) => {
      const typeId = seat.seat_type.id;
      if (!acc[typeId]) acc[typeId] = [];
      acc[typeId].push(seat);
      return acc;
    }, {} as Record<number, SeatMapItem[]>);

    const seatsForButtons = allSeatTypes.map(seatType => {
      const seatsInGroup = seatsGroupedByType[seatType.id] || [];
      if (seatsInGroup.length === 0) return null;
      return {
        id: seatType.id,
        name: seatType.name,
        available_seats: seatsInGroup.filter(s => s.status === 'AVAILABLE').length,
      };
    }).filter(Boolean);

    let seatsForDropdown: SeatMapItem[] = [];
    if (selectedSeatTypeId) {
      seatsForDropdown = (seatsGroupedByType[selectedSeatTypeId] || [])
        .filter(seat => seat.status === 'AVAILABLE')
        .sort((a, b) => {
          const numA = parseInt(a.seat_number, 10);
          const numB = parseInt(b.seat_number, 10);
          if (numA !== numB) return numA - numB;
          return a.seat_number.localeCompare(b.seat_number);
        });
    }
    return {
      availableStops: stops as TripStop[],
      seatTypesWithAvailability: seatsForButtons as any[],
      availableSeatsForSelectedType: seatsForDropdown,
    };
  }, [tripDetails, allSeatTypes, seatMap, selectedOriginId, selectedSeatTypeId]);

  const handleSeatToggleFromMap = (toggledSeat: SeatMapItem) => {
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

      {/* Selector de tramo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
          <select
            value={selectedOriginId || ''}
            onChange={(e) => onOriginChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
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
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
            disabled={!selectedOriginId || availableStops.length === 0}
          >
            <option value="" disabled>Seleccione...</option>
            {availableStops.map(stop => (
              <option key={stop.id} value={stop.port_id}>{stop.port?.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Asiento seleccionado */}
      {selectedSeat && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Asiento Seleccionado:</p>
          <p className="font-bold text-lg text-blue-700">N° {selectedSeat.seat_number} <span className="font-normal text-base">({selectedSeat.seat_type.name})</span></p>
        </div>
      )}

      {/* Mapa de asientos visible por defecto */}
      <div className="mt-4 border-t pt-4">
        <SeatMap
          tripId={tripId}
          vesselName={tripDetails?.vessel?.name || 'Embarcación'}
          selectedSeats={selectedSeat ? new Set([selectedSeat.id]) : new Set()}
          onSeatToggle={handleSeatToggleFromMap}
        />
      </div>
    </div>
  );
};
