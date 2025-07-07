// src/features/fluvial/components/sales-point/SeatAndFareSelector.tsx
import React, { useMemo, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { Spinner } from '../../../../components/common/Spinner';
import { Button } from '../../../../components/common/Button';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData';
import { useSeatMap } from '../../hooks/useSeatMap';
import { SeatMapItem, TripStop } from '../../../../types';
import { SeatSelectionVisualizer } from '../seat-map/SeatSelectionVisualizer';

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
  const [showSeatMap, setShowSeatMap] = useState(false);
  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(tripId);
  const { data: allSeatTypes = [], isLoading: isLoadingSeatTypes } = useSeatTypesData();
  const { data: seatMap = [], isLoading: isLoadingSeatMap } = useSeatMap(tripId);

  const { availableStops, seatTypesWithAvailability, availableSeatsForSelectedType } = useMemo(() => {
    if (!tripDetails || !allSeatTypes.length || !seatMap?.length) {
      return { availableStops: [], seatTypesWithAvailability: [], availableSeatsForSelectedType: [] };
    }

    const originStopOrder = tripDetails.stops.find(s => s.port_id === selectedOriginId)?.stop_order ?? -1;
    const stops = tripDetails.stops.filter(s => s.stop_order > originStopOrder);

    const seatsGroupedByType = seatMap.reduce((acc, seat) => {
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
          const numA = parseInt(a.seat_number.substring(1), 10);
          const numB = parseInt(b.seat_number.substring(1), 10);
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

  const handleOriginChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onOriginChange(Number(e.target.value));
    onDestinationChange(null);
    onSeatTypeChange(null);
  };

  const handleSeatTypeButtonClick = (typeId: number) => {
    onSeatTypeChange(typeId);
    if (selectedSeat && selectedSeat.seat_type.id !== typeId) {
      onSeatSelect(null);
    }
  };
  
  const handleSeatDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const seatId = Number(e.target.value);
      const seatObject = availableSeatsForSelectedType.find(s => s.id === seatId) || null;
      onSeatSelect(seatObject);
  }

  const handleSeatToggleFromMap = (toggledSeat: SeatMapItem) => {
      if (selectedSeat && selectedSeat.id === toggledSeat.id) {
          onSeatSelect(null); // Deseleccionar si se hace clic en el mismo asiento
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
            onChange={handleOriginChange}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Asiento</label>
        <div className="grid grid-cols-2 gap-3">
          {seatTypesWithAvailability.map(seatType => (
            <button
              key={seatType.id}
              onClick={() => handleSeatTypeButtonClick(seatType.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedSeatTypeId === seatType.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
              }`}
            >
              <div className="font-semibold">{seatType.name}</div>
              <div className="text-sm text-gray-600">Disponibles: {seatType.available_seats}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Asiento</label>
        <div className="flex items-center gap-2">
            <select
              value={selectedSeat?.id || ''}
              onChange={handleSeatDropdownChange}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              disabled={!selectedSeatTypeId || availableSeatsForSelectedType.length === 0}
            >
              <option value="">
                {!selectedSeatTypeId ? "Seleccione tipo" : "Seleccione asiento"}
              </option>
              {availableSeatsForSelectedType.map(seat => (
                <option key={seat.id} value={seat.id}>{seat.seat_number}</option>
              ))}
            </select>
            <Button
                variant="outline"
                onClick={() => setShowSeatMap(!showSeatMap)}
                className="flex-shrink-0"
              >
                <MapIcon className="h-5 w-5" />
            </Button>
        </div>
      </div>
      
      {showSeatMap && (
          <SeatSelectionVisualizer
            tripId={tripId}
            selectedSeats={selectedSeat ? new Set([selectedSeat.id]) : new Set()}
            onSeatToggle={handleSeatToggleFromMap}
          />
      )}
    </div>
  );
};