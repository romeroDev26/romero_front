// src/features/fluvial/components/schedule/CalendarView.tsx
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { AvailableTrip } from '../../../../types';

interface Props {
  trips: AvailableTrip[];
  onTripClick: (trip: AvailableTrip) => void;
  onDateClick: (date: Date) => void;
}

export const CalendarView: React.FC<Props> = ({ trips, onTripClick, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Obtener el día de la semana del primer día (0 = Domingo, ajustar a 0 = Lunes)
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;
  
  // Crear array con días vacíos al inicio
  const calendarDays = [
    ...Array(startDayOfWeek).fill(null),
    ...days
  ];

  // Agrupar viajes por fecha
  const tripsByDate = trips.reduce((acc, trip) => {
    const dateKey = format(new Date(trip.departure_datetime), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(trip);
    return acc;
  }, {} as Record<string, AvailableTrip[]>);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const getTripStatusColor = (trip: AvailableTrip) => {
    switch (trip.sales_status) {
      case 'DISPONIBLE':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50';
      case 'URGENTE':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200';
      case 'AGOTADO':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50';
      case 'CERRADO':
        return 'bg-dm-bg-secondary text-dm-text-primary border-dm-border-primary';
      default:
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';
    }
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-dm-bg-primary rounded-lg">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-dm-bg-hover rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        <h3 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-dm-bg-hover rounded-lg transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-px bg-dm-bg-secondary rounded-t-lg overflow-hidden">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-dm-bg-secondary p-2 text-center text-sm font-medium text-dm-text-secondary"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-px bg-dm-bg-secondary rounded-b-lg overflow-hidden">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="bg-dm-bg-secondary p-2 h-24" />;
          }

          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTrips = tripsByDate[dateKey] || [];
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateKey}
              className={`bg-dm-bg-primary p-2 h-24 overflow-hidden hover:bg-dm-bg-hover cursor-pointer transition-colors ${
                isCurrentDay ? 'ring-2 ring-primary ring-inset' : ''
              }`}
              onClick={() => onDateClick(day)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-medium ${
                  isCurrentDay ? 'text-primary' : 'text-dm-text-primary'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayTrips.length > 0 && (
                  <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">
                    {dayTrips.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {dayTrips.slice(0, 2).map((trip, idx) => (
                  <div
                    key={`${trip.trip_id}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTripClick(trip);
                    }}
                    className={`text-xs p-1 rounded border truncate cursor-pointer hover:opacity-80 ${getTripStatusColor(trip)}`}
                    title={`${trip.route_name} - ${format(new Date(trip.departure_datetime), 'HH:mm')}`}
                  >
                    {format(new Date(trip.departure_datetime), 'HH:mm')} - {trip.origin_city}
                  </div>
                ))}
                {dayTrips.length > 2 && (
                  <div className="text-xs text-dm-text-muted text-center">
                    +{dayTrips.length - 2} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/50 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 dark:bg-orange-900/40 border border-orange-200 rounded"></div>
          <span>Urgente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50 rounded"></div>
          <span>Agotado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-dm-bg-secondary border border-dm-border-primary rounded"></div>
          <span>Cerrado</span>
        </div>
      </div>
    </div>
  );
};