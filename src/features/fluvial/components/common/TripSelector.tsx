// src/features/fluvial/components/common/TripSelector.tsx
import React, { useState } from 'react';
import { useTrips } from '../../hooks/useTrips'; // Asumo que tienes un hook para buscar viajes
import { Trip } from '../../../../types';

interface TripSelectorProps {
  onTripSelect: (tripId: number | null) => void;
}

export const TripSelector: React.FC<TripSelectorProps> = ({ onTripSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: trips = [], isLoading } = useTrips({ tripName: searchTerm, status: ['SCHEDULED', 'BOARDING'] });

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tripId = e.target.value ? Number(e.target.value) : null;
    onTripSelect(tripId);
  };
  
  return (
    <div className="bg-dm-bg-primary p-4 rounded-lg shadow-sm border mb-6">
        <label htmlFor="trip-selector" className="block text-sm font-medium text-dm-text-secondary mb-2">
            Seleccionar un Viaje para ver sus Reservas
        </label>
        <div className="flex gap-4">
             <input 
                type="text"
                placeholder="Buscar por nombre de viaje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-dm-border-primary rounded-md"
             />
             <select
                id="trip-selector"
                onChange={handleSelect}
                className="w-full p-2 border border-dm-border-primary rounded-md bg-dm-bg-primary"
                disabled={isLoading}
             >
                <option value="">{isLoading ? 'Cargando viajes...' : 'Seleccione un viaje'}</option>
                {trips.map((trip: Trip) => (
                    <option key={trip.id} value={trip.id}>
                        {trip.trip_name} - {new Date(trip.departure_datetime).toLocaleDateString()}
                    </option>
                ))}
             </select>
        </div>
    </div>
  );
};

// Nota: Necesitarás un hook `useTrips` que acepte filtros. Si no lo tienes,
// puedes usar `useAvailableTrips` o adaptarlo. Un ejemplo de `useTrips`:
/*
// En src/features/fluvial/hooks/useTrips.ts
export const useTrips = (filters: { tripName?: string, status?: string[] }) => {
  return useQuery({
    queryKey: ['trips', filters],
    queryFn: () => tripsService.search({ // asumiendo que tienes un método search
      company_id: 1, // o el id de la compañía actual
      trip_name_like: filters.tripName,
      status: filters.status
    })
  });
}
*/