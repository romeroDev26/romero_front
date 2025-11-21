// src/features/cargo/components/CargoTripSelector.tsx

import React, { useMemo } from 'react';
import { Spinner } from '../../../components/common/Spinner';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { useTripDetails } from '../../fluvial/hooks/useTripDetails';
import { TripStop } from '../../../types';

interface CargoTripSelectorProps {
  tripId: number;
  selectedOriginId: number | null;
  onOriginChange: (portId: number | null) => void;
  selectedDestinationId: number | null;
  onDestinationChange: (portId: number | null) => void;
}

export const CargoTripSelector: React.FC<CargoTripSelectorProps> = ({
  tripId,
  selectedOriginId,
  onOriginChange,
  selectedDestinationId,
  onDestinationChange,
}) => {
  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(tripId);

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

  if (isLoadingTrip) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner /><span className="ml-2 text-gray-600">Cargando detalles del viaje...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Seleccionar Tramo</h2>
      <p className="text-sm text-gray-600 mb-4">
        Seleccione el punto de origen y destino para la encomienda
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="Punto de Origen"
          value={selectedOriginId}
          onChange={(value) => onOriginChange(value ? Number(value) : null)}
          options={tripDetails?.stops?.slice(0, -1).map(stop => ({
            value: stop.port_id,
            label: stop.port?.name || 'Sin nombre'
          })) || []}
          placeholder="Seleccione origen..."
        />
        <SearchableSelect
          label="Punto de Destino"
          value={selectedDestinationId}
          onChange={(value) => onDestinationChange(value ? Number(value) : null)}
          options={availableStops.map(stop => ({
            value: stop.port_id,
            label: stop.port?.name || 'Sin nombre'
          }))}
          placeholder="Seleccione destino..."
          disabled={!selectedOriginId || availableStops.length === 0}
        />
      </div>

      {selectedOriginId && selectedDestinationId && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Tramo Seleccionado:</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Origen</p>
                <p className="font-semibold text-blue-700">
                  {tripDetails?.stops?.find(s => s.port_id === selectedOriginId)?.port?.name}
                </p>
              </div>
              <div className="text-blue-400">→</div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Destino</p>
                <p className="font-semibold text-blue-700">
                  {tripDetails?.stops?.find(s => s.port_id === selectedDestinationId)?.port?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};