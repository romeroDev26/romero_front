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
  selectedSeatId: number | null;
  onSeatSelect: (seatId: number | null, seatNumber: string) => void;
}

export const SeatAndFareSelector: React.FC<SeatAndFareSelectorProps> = ({
  tripId,
  selectedOriginId,
  onOriginChange,
  selectedDestinationId,
  onDestinationChange,
  selectedSeatTypeId,
  onSeatTypeChange,
  selectedSeatId,
  onSeatSelect
}) => {
  const { data: tripDetails, isLoading: isLoadingTrip, error: tripError } = useTripDetails(tripId);
  const { data: allSeatTypes = [], isLoading: isLoadingSeatTypes, error: seatTypesError } = useSeatTypesData();
  const { data: seatMap, isLoading: isLoadingSeatMap, error: seatMapError } = useSeatMap(tripId);

  const {
    availableStops,
    seatTypesWithAvailability,
    availableSeatsForSelectedType
  } = useMemo(() => {
    if (!tripDetails || !allSeatTypes.length || !seatMap || !seatMap.length) {
      return { availableStops: [], seatTypesWithAvailability: [], availableSeatsForSelectedType: [] };
    }

    const originStop = tripDetails.stops.find(s => s.port_id === selectedOriginId);
    const stops = originStop ? tripDetails.stops.filter(s => s.stop_order > originStop.stop_order) : [];

    const seatsGroupedByType = seatMap.reduce((acc, seat) => {
      const typeId = seat.seat_type.id;
      if (!acc[typeId]) {
        acc[typeId] = [];
      }
      acc[typeId].push(seat);
      return acc;
    }, {} as Record<number, typeof seatMap>);

    const seatsForButtons = allSeatTypes
      .map(seatType => {
        const seatsInGroup = seatsGroupedByType[seatType.id] || [];
        const availableCount = seatsInGroup.filter(s => s.status === 'AVAILABLE').length;

        if (seatsInGroup.length === 0) {
          return null;
        }

        return {
          id: seatType.id,
          name: seatType.name,
          available_seats: availableCount,
        };
      })
      .filter(Boolean);

    let seatsForDropdown: { id: number; seat_number: string }[] = [];
    if (selectedSeatTypeId) {
      const seatsInGroup = seatsGroupedByType[selectedSeatTypeId] || [];
      seatsForDropdown = seatsInGroup
        .filter(seat => seat.status === 'AVAILABLE')
        .map(seat => ({ id: seat.id, seat_number: seat.seat_number }))
        .sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number));
    }

    return {
      availableStops: stops,
      seatTypesWithAvailability: seatsForButtons as any[],
      availableSeatsForSelectedType: seatsForDropdown
    };
  }, [tripDetails, allSeatTypes, seatMap, selectedOriginId, selectedSeatTypeId]);

  const handleOriginChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOriginId = Number(e.target.value);
    onOriginChange(newOriginId);
    onDestinationChange(null);
  };

  const handleSeatSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    const selectedSeat = availableSeatsForSelectedType.find(s => s.id === selectedId);
    onSeatSelect(selectedId, selectedSeat?.seat_number || '');
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
          value={selectedSeatId || ''}
          onChange={handleSeatSelectionChange}
          className="w-full p-2 border border-gray-300 rounded-md bg-white"
          disabled={!selectedSeatTypeId || availableSeatsForSelectedType.length === 0}
        >
          <option value="">
            {!selectedSeatTypeId ? "Seleccione un tipo de asiento" : (isLoadingSeatMap ? "Cargando asientos..." : "Seleccione un asiento")}
          </option>
          {availableSeatsForSelectedType.map(seat => (
            <option key={seat.id} value={seat.id}>{seat.seat_number}</option>
          ))}
        </select>
        {selectedSeatTypeId && !isLoadingSeatMap && availableSeatsForSelectedType.length === 0 && (
          <p className="text-xs text-orange-600 mt-1">No hay más asientos de este tipo disponibles.</p>
        )}
      </div>
    </div>
  );
};
