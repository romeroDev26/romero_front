// src/features/fluvial/components/sales-point/SeatAndFareSelector.tsx
import React, { useMemo } from 'react';
import { Spinner } from '../../../../components/common/Spinner';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData';
import { useSeatMap } from '../../hooks/useSeatMap';
import { TripStop } from '../../../../types';

interface SeatAndFareSelectorProps {
  tripId: number;
  selectedOriginId: number | null;
  onOriginChange: (portId: number | null) => void;
  selectedDestinationId: number | null;
  onDestinationChange: (portId: number | null) => void;
  selectedSeatTypeId: number | null;
  onSeatTypeChange: (seatTypeId: number) => void;
  selectedSeatNumber: string;
  onSeatNumberChange: (seatNumber: string) => void;
}

export const SeatAndFareSelector: React.FC<SeatAndFareSelectorProps> = ({
  tripId,
  selectedOriginId,
  onOriginChange,
  selectedDestinationId,
  onDestinationChange,
  selectedSeatTypeId,
  onSeatTypeChange,
  selectedSeatNumber,
  onSeatNumberChange
}) => {
  const { data: tripDetails, isLoading: isLoadingTrip, error: tripError } = useTripDetails(tripId);
  const { data: allSeatTypes = [], isLoading: isLoadingSeatTypes, error: seatTypesError } = useSeatTypesData();
  const { data: seatMap = [], isLoading: isLoadingSeatMap, error: seatMapError } = useSeatMap(tripId);

  const {
    originStops,
    destinationStops,
    seatTypesWithAvailability,
    availableSeatsForSelectedType
  } = useMemo(() => {
    if (!tripDetails || !allSeatTypes.length) {
      return { originStops: [], destinationStops: [], seatTypesWithAvailability: [], availableSeatsForSelectedType: [] };
    }

    // Logic for origin stops
    const validOriginStops = tripDetails.stops.slice(0, -1);

    // Logic for destination stops (depends on origin)
    let validDestinationStops: TripStop[] = [];
    if (selectedOriginId) {
      const originStop = tripDetails.stops.find(s => s.port_id === selectedOriginId);
      if (originStop) {
        validDestinationStops = tripDetails.stops.filter(s => s.stop_order > originStop.stop_order);
      }
    }

    const seatTypeDetailsMap = new Map(allSeatTypes.map(st => [st.id, st]));
    const seatsWithAvailability = tripDetails.availability
      .map(avail => {
        const details = seatTypeDetailsMap.get(avail.seat_type_id);
        if (!details) return null;
        return {
          id: details.id,
          name: details.name,
          available_seats: avail.available_seats,
        };
      })
      .filter(Boolean);

    let seatsForDropdown: string[] = [];
    if (selectedSeatTypeId && (seatMap?.length ?? 0) > 0) {
      seatsForDropdown = (seatMap ?? [])
        .filter(seat =>
          seat.seat_type.id === selectedSeatTypeId && seat.status === 'AVAILABLE'
        )
        .map(seat => seat.seat_number)
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)![0]);
          const numB = parseInt(b.match(/\d+/)![0]);
          if (numA !== numB) return numA - numB;
          const strA = a.match(/[a-zA-Z]+/)![0];
          const strB = b.match(/[a-zA-Z]+/)![0];
          return strA.localeCompare(strB);
        });
    }

    return {
      originStops: validOriginStops,
      destinationStops: validDestinationStops,
      seatTypesWithAvailability: seatsWithAvailability as any[],
      availableSeatsForSelectedType: seatsForDropdown
    };
  }, [tripDetails, allSeatTypes, selectedOriginId, selectedSeatTypeId, seatMap]);

  const handleOriginChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOriginId = Number(e.target.value);
    onOriginChange(newOriginId);
    onDestinationChange(null); // Reset destination to force a new selection
  };

  const isLoading = isLoadingTrip || isLoadingSeatTypes || isLoadingSeatMap;
  const error = tripError || seatTypesError || seatMapError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner /><span className="ml-2 text-gray-600">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 rounded">Error: {error.message}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Tramo y Asiento</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
          <select
            value={selectedOriginId || ''}
            onChange={handleOriginChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="" disabled>Seleccione...</option>
            {originStops.map(stop => (
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
            disabled={!selectedOriginId || destinationStops.length === 0}
          >
            <option value="" disabled>Seleccione...</option>
            {destinationStops.map(stop => (
              <option key={stop.id} value={stop.port_id}>{stop.port?.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Asiento</label>
        <div className="grid grid-cols-2 gap-3">
          {seatTypesWithAvailability.map(seat => (
            <button
              key={seat.id}
              onClick={() => onSeatTypeChange(seat.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedSeatTypeId === seat.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
              }`}
            >
              <div className="font-semibold">{seat.name}</div>
              <div className="text-sm text-gray-600">Disponibles: {seat.available_seats}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Asiento</label>
        <select
          value={selectedSeatNumber}
          onChange={(e) => onSeatNumberChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md bg-white"
          disabled={!selectedSeatTypeId || availableSeatsForSelectedType.length === 0}
        >
          <option value="">
            {
              !selectedSeatTypeId
                ? "Seleccione un tipo de asiento"
                : (isLoadingSeatMap ? "Cargando asientos..." : "Seleccione un asiento")
            }
          </option>
          {availableSeatsForSelectedType.map(seatNum => (
            <option key={seatNum} value={seatNum}>{seatNum}</option>
          ))}
        </select>
        {selectedSeatTypeId && !isLoadingSeatMap && availableSeatsForSelectedType.length === 0 && (
          <p className="text-xs text-orange-600 mt-1">No hay más asientos de este tipo disponibles.</p>
        )}
      </div>
    </div>
  );
};
