import React, { useMemo } from 'react';
import { Spinner } from '../../../../components/common/Spinner';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData';
import { TripStop } from '../../../../types';

interface SeatAndFareSelectorProps {
  tripId: number;
  selectedOriginId: number | null;
  onOriginChange: (portId: number) => void;
  selectedDestinationId: number | null;
  onDestinationChange: (portId: number) => void;
  selectedSeatTypeId: number | null;
  onSeatTypeChange: (seatTypeId: number) => void;
}

export const SeatAndFareSelector: React.FC<SeatAndFareSelectorProps> = ({
  tripId,
  selectedOriginId,
  onOriginChange,
  selectedDestinationId,
  onDestinationChange,
  selectedSeatTypeId,
  onSeatTypeChange
}) => {
  const { data: tripDetails, isLoading: isLoadingTrip, error: tripError } = useTripDetails(tripId);
  const { data: allSeatTypes = [], isLoading: isLoadingSeatTypes, error: seatTypesError } = useSeatTypesData();

  const {
    originStops,
    destinationStops,
    seatTypesWithAvailability
  } = useMemo(() => {
    if (!tripDetails || allSeatTypes.length === 0) {
      return { originStops: [], destinationStops: [], seatTypesWithAvailability: [] };
    }

    const validOriginStops = tripDetails.stops.slice(0, -1);

    let validDestinationStops: TripStop[] = [];
    if (selectedOriginId) {
      const originStop = tripDetails.stops.find(s => s.port_id === selectedOriginId);
      if (originStop) {
        validDestinationStops = tripDetails.stops.filter(s => s.stop_order > originStop.stop_order);
      }
    }

    const availabilityMap = new Map(tripDetails.availability.map(sa => [sa.seat_type_id, sa.available_seats]));
    const seats = tripDetails.availability
      .map(avail => {
        const details = new Map(allSeatTypes.map(st => [st.id, st])).get(avail.seat_type_id);
        if (!details) return null;
        return {
          id: details.id,
          name: details.name,
          price_multiplier: details.price_multiplier,
          available_seats: avail.available_seats,
        };
      })
      .filter(Boolean);

    return {
      originStops: validOriginStops,
      destinationStops: validDestinationStops,
      seatTypesWithAvailability: seats as any[]
    };
  }, [tripDetails, allSeatTypes, selectedOriginId]);

  const handleOriginChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOriginId = Number(e.target.value);
    onOriginChange(newOriginId);
    onDestinationChange(0);
  };

  const isLoading = isLoadingTrip || isLoadingSeatTypes;
  const error = tripError || seatTypesError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner /><span className="ml-2 text-gray-600">Cargando...</span>
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg text-gray-800 mb-2">Tramo y Asiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
            <select
              value={selectedOriginId || ''}
              onChange={handleOriginChange}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="" disabled>Seleccione un origen</option>
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
              <option value="" disabled>Seleccione un destino</option>
              {destinationStops.map(stop => (
                <option key={stop.id} value={stop.port_id}>{stop.port?.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Asiento</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {seatTypesWithAvailability.map(seat => (
            <button
              key={seat.id}
              onClick={() => onSeatTypeChange(seat.id)}
              disabled={seat.available_seats <= 0}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedSeatTypeId === seat.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
              } ${seat.available_seats <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="font-semibold">{seat.name}</div>
              <div className="text-sm text-gray-600">Disponibles: {seat.available_seats}</div>
              {seat.available_seats <= 0 && <div className="text-xs text-red-600 font-medium">Agotado</div>}
            </button>
          ))}
        </div>
        {seatTypesWithAvailability.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">No hay configuración de asientos para esta embarcación.</p>
        )}
      </div>
    </div>
  );
};
