import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, TruckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { BranchOffice } from '../../../types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { useAvailableTrips } from '../../fluvial/hooks/useAvailableTrips';
import { useRemissionGuidesForDate } from '../hooks/useRemissionGuidesByTrip';

interface TripForRemissionGuide extends AvailableTripByPort {
  used_for_remission?: boolean; // Se calculará desde las guías existentes
  remission_guide_count?: number; // Número de guías asociadas a este viaje
}

interface RemissionGuideTripSelectorProps {
  branch: BranchOffice;
  onTripSelect: (trip: TripForRemissionGuide) => void;
  onBack: () => void;
}

const TripCard: React.FC<{ 
  trip: TripForRemissionGuide; 
  onSelect: () => void;
  disabled: boolean;
}> = ({ trip, onSelect, disabled }) => (
  <div className={`
    bg-white rounded-lg border p-4 transition-all
    ${disabled 
      ? 'border-gray-200 bg-gray-50 opacity-60' 
      : 'border-gray-200 hover:shadow-md hover:border-blue-300'
    }
  `}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${disabled ? 'bg-gray-200' : 'bg-blue-100'}`}>
          <TruckIcon className={`h-6 w-6 ${disabled ? 'text-gray-400' : 'text-blue-700'}`} />
        </div>
        <div>
          <h3 className={`font-semibold ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
            {trip.trip_name}
          </h3>
          <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
            {trip.vessel_name}
          </p>
          <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
            Salida: {format(new Date(trip.estimated_departure_time), 'hh:mm a')}
          </p>
          {trip.used_for_remission && (
            <div className="flex items-center gap-1 mt-1">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">
                {trip.remission_guide_count || 1} guía(s) asociada(s)
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        {disabled ? (
          <span className="px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
            Ya utilizado
          </span>
        ) : (
          <Button onClick={onSelect} size="sm">
            Seleccionar
          </Button>
        )}
      </div>
    </div>
  </div>
);

export const RemissionGuideTripSelector: React.FC<RemissionGuideTripSelectorProps> = ({
  branch,
  onTripSelect,
  onBack
}) => {
  // Obtener la fecha actual correctamente (fecha local sin problemas de timezone)
  const todayDate = new Date();
  const currentDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  
  const [currentMonth, setCurrentMonth] = useState(currentDate);
  const [selectedDate, setSelectedDate] = useState(format(currentDate, 'yyyy-MM-dd'));
  
  // Hook para obtener viajes
  const { data: trips = [], isLoading: isLoadingTrips } = useAvailableTrips({
    portId: branch.port_id,
    onDate: selectedDate
  });

  // Hook para obtener guías de remisión existentes para la fecha seleccionada
  const { data: existingGuides = [], isLoading: isLoadingGuides } = useRemissionGuidesForDate(selectedDate);

  // Combinar datos de viajes con información de guías existentes
  const tripsWithRemissionInfo: TripForRemissionGuide[] = trips.map(trip => {
    // Buscar guías existentes para este viaje
    const guidesForTrip = existingGuides.filter(guide => guide.trip_id === trip.id);
    
    return {
      ...trip,
      used_for_remission: guidesForTrip.length > 0,
      remission_guide_count: guidesForTrip.length
    };
  });

  const isLoading = isLoadingTrips || isLoadingGuides;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const todayStart = startOfDay(currentDate);

  const startDayOfWeek = (getDay(monthStart) + 6) % 7;
  const calendarDays = [
    ...Array(startDayOfWeek).fill(null),
    ...days
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (day: Date) => {
    if (isBefore(day, todayStart)) return; // No permitir fechas pasadas (cumpliendo SUNAT)
    
    const dateKey = format(day, 'yyyy-MM-dd');
    setSelectedDate(dateKey);
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Función para obtener los viajes con información de guías para una fecha específica
  const getTripsForDate = (date: string) => {
    // Si es la fecha seleccionada actual, usar los datos ya cargados
    if (date === selectedDate) {
      return tripsWithRemissionInfo;
    }
    
    // Para otras fechas, por ahora retornamos vacío
    // En una implementación completa, esto debería hacer una consulta separada
    return [];
  };

  const availableTrips = tripsWithRemissionInfo.filter(trip => !trip.used_for_remission);
  const usedTrips = tripsWithRemissionInfo.filter(trip => trip.used_for_remission);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={onBack} size="sm">
            ← Cambiar Sucursal
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Seleccionar Viaje - {branch.name}
            </h2>
            <p className="text-sm text-gray-600">
              {branch.port?.city?.name || 'Ciudad'}, {branch.port?.name || 'Puerto'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendario */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {/* Header del calendario */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h3>
            
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="p-2 h-12" />;
              }

              const dateKey = format(day, 'yyyy-MM-dd');
              const dayTrips = getTripsForDate(dateKey);
              const isCurrentDay = isToday(day);
              const isSelected = selectedDate === dateKey;
              const isPastDate = isBefore(day, todayStart);
              const hasTrips = dayTrips.length > 0;
              const hasAvailableTrips = dayTrips.some((trip: TripForRemissionGuide) => !trip.used_for_remission);

              return (
                <div
                  key={dateKey}
                  onClick={() => handleDateClick(day)}
                  className={`
                    relative p-2 h-12 rounded-lg text-center cursor-pointer transition-all
                    ${isPastDate 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'hover:bg-blue-50'
                    }
                    ${isSelected && !isPastDate 
                      ? 'bg-blue-500 text-white' 
                      : ''
                    }
                    ${isCurrentDay && !isSelected && !isPastDate 
                      ? 'ring-2 ring-blue-500 ring-inset' 
                      : ''
                    }
                  `}
                >
                  <span className="text-sm font-medium">
                    {format(day, 'd')}
                  </span>
                  
                  {/* Indicadores de viajes */}
                  {hasTrips && !isPastDate && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {hasAvailableTrips && (
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
                      )}
                      {dayTrips.some((trip: TripForRemissionGuide) => trip.used_for_remission) && (
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-gray-300' : 'bg-gray-500'}`} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Viajes disponibles</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>Ya utilizados</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 ring-2 ring-blue-500 rounded"></div>
              <span>Hoy</span>
            </div>
          </div>
        </div>

        {/* Lista de viajes para la fecha seleccionada */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Viajes para {format(new Date(selectedDate), 'dd \'de\' MMMM', { locale: es })}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isLoading 
                ? 'Cargando viajes...'
                : tripsWithRemissionInfo.length === 0 
                  ? 'No hay viajes programados para esta fecha'
                  : `${availableTrips.length} disponible(s), ${usedTrips.length} ya utilizado(s)`
              }
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Viajes disponibles primero */}
              {availableTrips.map(trip => (
                <TripCard
                  key={`available-${trip.id}`}
                  trip={trip}
                  onSelect={() => onTripSelect(trip)}
                  disabled={false}
                />
              ))}
              
              {/* Luego viajes ya utilizados */}
              {usedTrips.map(trip => (
                <TripCard
                  key={`used-${trip.id}`}
                  trip={trip}
                  onSelect={() => {}} // No hace nada
                  disabled={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
