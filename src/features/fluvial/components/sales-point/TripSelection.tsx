// src/features/fluvial/components/sales-point/TripSelection.tsx
import React, { useState } from 'react';
import { ArrowLeft, Calendar, Ship } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { BranchOffice } from '../../../../types';
import { AvailableTripByPort } from '../../../../services/trips.service';
import { useAvailableTrips } from '../../hooks/useAvailableTrips';

interface TripSelectionProps {
  branch: BranchOffice;
  onTripSelect: (trip: AvailableTripByPort) => void;
  onChangeBranch: () => void;
}

// Componente para una tarjeta de viaje individual
const TripCard: React.FC<{ trip: AvailableTripByPort, onSelect: () => void }> = ({ trip, onSelect }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="bg-blue-100 p-3 rounded-lg">
        <Ship className="h-6 w-6 text-blue-700" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{trip.trip_name}</h3>
        <p className="text-sm text-gray-600">{trip.vessel_name}</p>
        <p className="text-sm text-gray-500">
          Salida estimada: {format(new Date(trip.estimated_departure_time), 'hh:mm a')}
        </p>
      </div>
    </div>
    <Button onClick={onSelect}>Seleccionar</Button>
  </div>
);

export const TripSelection: React.FC<TripSelectionProps> = ({ branch, onTripSelect, onChangeBranch }) => {
  // Estado para manejar la fecha seleccionada, inicia con el día de hoy
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Usamos el hook que creamos para obtener los viajes
  const { data: trips = [], isLoading, error, refetch } = useAvailableTrips({
    portId: branch.port_id,
    onDate: selectedDate,
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header de la sección */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seleccionar Viaje</h1>
          <p className="text-gray-600">Sucursal: <span className="font-semibold">{branch.name}</span></p>
        </div>
        <Button variant="outline" onClick={onChangeBranch}>
          Cambiar Sucursal
        </Button>
      </div>

      {/* Controles y filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex items-center gap-4">
        <label htmlFor="trip-date" className="font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          Fecha de Viaje:
        </label>
        <input
          id="trip-date"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="p-2 border border-gray-300 rounded-md"
        />
        {/* Aquí se podrían añadir más filtros en el futuro (ej. vista de calendario) */}
      </div>

      {/* Lista de Viajes */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Spinner />
            <p className="ml-4 text-gray-600">Buscando viajes...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
            Error al cargar los viajes: {error.message}
          </div>
        )}

        {!isLoading && !error && trips.length === 0 && (
          <div className="text-center text-gray-500 bg-gray-50 p-8 rounded-lg">
            <h3 className="font-semibold text-lg">No hay viajes disponibles</h3>
            <p>No se encontraron viajes programados desde "{branch.port?.name}" para la fecha seleccionada.</p>
          </div>
        )}

        {!isLoading && !error && trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onSelect={() => onTripSelect(trip)} />
        ))}
      </div>
    </div>
  );
};