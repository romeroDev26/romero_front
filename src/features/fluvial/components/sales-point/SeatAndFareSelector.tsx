// src/features/fluvial/components/sales-point/SeatAndFareSelector.tsx
import React, { useMemo } from 'react';
import { Spinner } from '../../../../components/common/Spinner';
import { useTripDetails } from '../../hooks/useTripDetails';
import { useSeatTypesData } from '../../hooks/useSeatTypesData'; // ¡Ahora esta importación funcionará!

interface SeatAndFareSelectorProps {
  tripId: number;
  originPortId: number;
  selectedDestinationId: number | null;
  onDestinationChange: (portId: number) => void;
  selectedSeatTypeId: number | null;
  onSeatTypeChange: (seatTypeId: number) => void;
}

export const SeatAndFareSelector: React.FC<SeatAndFareSelectorProps> = ({
  tripId,
  originPortId,
  selectedDestinationId,
  onDestinationChange,
  selectedSeatTypeId,
  onSeatTypeChange
}) => {
  // Hook 1: Obtiene detalles del viaje (paradas, disponibilidad por ID)
  const { data: tripDetails, isLoading: isLoadingTrip, error: tripError } = useTripDetails(tripId);
  // Hook 2: Obtiene TODOS los tipos de asiento (ID, nombre, multiplicador)
  const { data: allSeatTypes = [], isLoading: isLoadingSeatTypes, error: seatTypesError } = useSeatTypesData();

  const { availableStops, seatTypesWithAvailability } = useMemo(() => {
    // Esperamos a que ambos hooks tengan datos
    if (!tripDetails || allSeatTypes.length === 0) {
      return { availableStops: [], seatTypesWithAvailability: [] };
    }

    // Lógica de paradas (ya es correcta)
    const originStop = tripDetails.stops.find(s => s.port_id === originPortId);
    const stops = originStop
      ? tripDetails.stops.filter(s => s.stop_order > originStop.stop_order)
      : [];
      
    // Lógica corregida para asientos:
    // 1. Creamos un mapa de los detalles de los tipos de asiento para una búsqueda rápida.
    const seatTypeDetailsMap = new Map(allSeatTypes.map(st => [st.id, st]));
    
    // 2. Mapeamos la lista de 'availability' del viaje.
    const seats = tripDetails.availability
      .map(avail => {
        // 3. Por cada asiento disponible en el viaje, buscamos sus detalles en el mapa.
        const details = seatTypeDetailsMap.get(avail.seat_type_id);
        
        // Si no encontramos detalles (raro, pero posible), lo ignoramos.
        if (!details) return null;

        // 4. Combinamos la información en un nuevo objeto.
        return {
          id: details.id,
          name: details.name,
          price_multiplier: details.price_multiplier,
          available_seats: avail.available_seats,
        };
      })
      .filter(Boolean); // 5. Eliminamos cualquier resultado nulo.

    return { availableStops: stops, seatTypesWithAvailability: seats as any[] };

  }, [tripDetails, allSeatTypes, originPortId]);

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
        <select
          value={selectedDestinationId || ''}
          onChange={(e) => onDestinationChange(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md bg-white"
          disabled={availableStops.length === 0}
        >
          <option value="" disabled>Seleccione un destino</option>
          {availableStops.map(stop => (
            <option key={stop.id} value={stop.port_id}>{stop.port?.name}</option>
          ))}
        </select>
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