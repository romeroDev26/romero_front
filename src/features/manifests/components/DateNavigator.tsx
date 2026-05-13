import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  format,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface DateNavigatorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  datesWithManifests?: string[];
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onSelectDate,
  datesWithManifests = [],
}) => {
  const weekDays = React.useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: es });
    const end = endOfWeek(selectedDate, { locale: es });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const goToPreviousWeek = () => onSelectDate(subDays(selectedDate, 7));
  const goToNextWeek = () => onSelectDate(addDays(selectedDate, 7));
  const goToToday = () => onSelectDate(getPeruDate());

  const formatDayKey = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8e8] p-4 sm:p-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={goToPreviousWeek}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#e8e8e8] text-[#4d4d4d] hover:bg-[#f5f5f5] transition-colors shrink-0"
          title="Semana anterior"
        >
          <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
        </button>

        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max gap-1 sm:gap-2 px-0.5">
            {weekDays.map((day) => {
              const selected = isSameDay(day, selectedDate);
              const today = isToday(day);
              const dayKey = formatDayKey(day);
              const hasManifests = datesWithManifests.includes(dayKey);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onSelectDate(day)}
                  className={`relative flex flex-col items-center justify-center w-11 h-14 sm:w-14 sm:h-16 rounded-xl transition-all ${
                    selected
                      ? 'bg-[#1F4690] text-white shadow-sm'
                      : 'text-[#4d4d4d] hover:bg-[#f5f5f5]'
                  }`}
                >
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium uppercase tracking-wider ${
                      selected ? 'text-white/80' : 'text-[#828282]'
                    }`}
                  >
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <span
                    className={`text-[15px] sm:text-[17px] font-bold leading-tight ${
                      selected ? 'text-white' : 'text-[#202020]'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasManifests && !selected && (
                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#1F4690]" />
                  )}
                  {today && !selected && !hasManifests && (
                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#c4c4c4]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={goToNextWeek}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#e8e8e8] text-[#4d4d4d] hover:bg-[#f5f5f5] transition-colors shrink-0"
          title="Semana siguiente"
        >
          <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          onClick={goToToday}
          className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors ${
            isToday(selectedDate)
              ? 'bg-[#1F4690]/10 text-[#1F4690]'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isToday(selectedDate) ? 'Hoy' : 'Ir a hoy'}
        </button>
      </div>
    </div>
  );
};

function getPeruDate(date: Date = new Date()): Date {
  const peruStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return new Date(`${peruStr}T05:00:00Z`);
}
