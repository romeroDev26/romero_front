// src/features/fluvial/components/sales-point/TripSelection.tsx
import React, { useState, useMemo } from 'react';
import { Ship } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { BranchOffice } from '../../../../types';
import { AvailableTripByPort } from '../../../../services/trips.service';
import { useAvailableTripsCalendar } from '../../hooks/useAvailableTripsCalendar';
import { TripCalendar } from './TripCalendar';

interface TripSelectionProps {
  branch: BranchOffice;
  onTripSelect: (trip: AvailableTripByPort) => void;
  onChangeBranch: () => void;
  className?: string;
}

// Componente para una tarjeta de viaje individual
const TripCard: React.FC<{ trip: AvailableTripByPort, onSelect: () => void }> = ({ trip, onSelect }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
      <div className="bg-blue-100 p-2.5 sm:p-3 rounded-lg shrink-0">
        <Ship className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{trip.trip_name}</h3>
        <p className="text-xs sm:text-sm text-gray-600 truncate">{trip.vessel_name}</p>
        <p className="text-xs sm:text-sm text-gray-500">
          Salida estimada: {format(parseISO(trip.estimated_departure_time), 'hh:mm a')}
        </p>
      </div>
    </div>
    <Button onClick={onSelect} className="w-full sm:w-auto justify-center">Seleccionar</Button>
  </div>
);

export const TripSelection: React.FC<TripSelectionProps> = ({ branch, onTripSelect, onChangeBranch, className = '' }) => {
  // Estado para manejar la fecha seleccionada, inicia con el día de hoy
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Usamos el hook de calendario para evitar peticiones duplicadas
  const { data: tripsByDate = {}, isLoading, error } = useAvailableTripsCalendar({
    portId: branch.port_id,
    currentMonth,
  });

  const trips = useMemo(() => {
    return tripsByDate[selectedDate] || [];
  }, [tripsByDate, selectedDate]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  
  return (
    <div className={`p-4 lg:p-6 max-w-7xl mx-auto ${className}`}>
      {/* Header de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6 pb-4 border-b">
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Seleccionar Viaje</h1>
          <p className="text-sm lg:text-base text-gray-600">
            Sucursal: <span className="font-semibold">{branch.name}</span>
          </p>
        </div>
        <Button variant="outline" onClick={onChangeBranch} className="w-full sm:w-auto justify-center">
          Cambiar Sucursal
        </Button>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Calendario */}
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">Seleccionar Fecha</h2>
          <TripCalendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            tripsByDate={tripsByDate}
            isLoading={isLoading}
          />
        </div>

        {/* Lista de Viajes */}
        <div>
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-base lg:text-lg font-semibold text-gray-800">
              Viajes para {format(parseISO(selectedDate), 'dd/MM/yyyy')}
            </h2>
            {trips.length > 0 && (
              <span className="text-xs lg:text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                {trips.length} viaje{trips.length !== 1 ? 's' : ''} disponible{trips.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="space-y-3 lg:space-y-4 max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="flex justify-center items-center py-12 lg:py-16">
                <Spinner />
                <p className="ml-4 text-sm lg:text-base text-gray-600">Buscando viajes...</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="text-center text-sm lg:text-base text-red-500 bg-red-50 p-4 rounded-lg">
                Error al cargar los viajes: {error.message}
              </div>
            )}

            {!isLoading && !error && trips.length === 0 && (
              <div className="text-center text-gray-500 bg-gray-50 p-6 lg:p-8 rounded-lg">
                <h3 className="font-semibold text-base lg:text-lg">No hay viajes disponibles</h3>
                <p className="text-sm lg:text-base">No se encontraron viajes programados desde "{branch.port?.name}" para la fecha seleccionada.</p>
              </div>
            )}

            {!isLoading && !error && trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onSelect={() => onTripSelect(trip)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};