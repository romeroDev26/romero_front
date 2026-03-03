// src/features/fluvial/components/sales-point/TripCalendar.tsx
import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../../components/common/Spinner';
import { AvailableTripByPort } from '../../../../services/trips.service';

interface TripCalendarProps {
  selectedDate: string;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: string) => void;
  tripsByDate: Record<string, AvailableTripByPort[]>;
  isLoading: boolean;
}

export const TripCalendar: React.FC<TripCalendarProps> = ({
  selectedDate,
  currentMonth,
  onMonthChange,
  onDateSelect,
  tripsByDate,
  isLoading
}) => {

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = startOfDay(new Date());

  // Obtener el día de la semana del primer día (0 = Domingo, ajustar a 0 = Lunes)
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;
  
  // Crear array con días vacíos al inicio
  const calendarDays = [
    ...Array(startDayOfWeek).fill(null),
    ...days
  ];

  const handlePrevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day: Date) => {
    if (isBefore(day, today)) return; // No permitir fechas pasadas
    
    const dateKey = format(day, 'yyyy-MM-dd');
    onDateSelect(dateKey);
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
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
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-600"
          >
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
          const dayTrips = tripsByDate[dateKey] || [];
          const isCurrentDay = isToday(day);
          const isSelected = selectedDate === dateKey;
          const isPastDate = isBefore(day, today);
          const hasTrips = dayTrips.length > 0;

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
              
              {/* Indicador de viajes disponibles */}
              {hasTrips && !isPastDate && (
                <div className={`
                  absolute bottom-1 left-1/2 transform -translate-x-1/2 
                  w-2 h-2 rounded-full
                  ${isSelected ? 'bg-white' : 'bg-blue-500'}
                `} />
              )}
              
              {/* Indicador de loading */}
              {isLoading && !isPastDate && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3">
                    <Spinner size="sm" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Viajes disponibles</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 ring-2 ring-blue-500 rounded"></div>
          <span>Hoy</span>
        </div>
      </div>
    </div>
  );
};
