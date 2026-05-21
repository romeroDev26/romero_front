// src/features/manifests/components/DateNavigator.tsx
import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import {
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  format,
  isToday,
  startOfMonth,
  endOfMonth,
  getDay,
  isSameMonth,
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(selectedDate);
  const calendarRef = useRef<HTMLDivElement>(null);

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: es });
    const end = endOfWeek(selectedDate, { locale: es });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  // Sincronizar mes del calendario con la fecha seleccionada
  useEffect(() => {
    if (!isSameMonth(selectedDate, calendarMonth)) {
      setCalendarMonth(selectedDate);
    }
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

  // ---------- Mini calendario mensual ----------
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;
  const calendarDays = [...Array(startDayOfWeek).fill(null), ...daysInMonth];

  const handlePrevMonth = () => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  const handleNextMonth = () => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));

  const handleDaySelect = (day: Date) => {
    onSelectDate(getPeruDate(day));
    setShowCalendar(false);
  };

  const weekDayLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  return (
    <div className="bg-dm-bg-primary rounded-2xl border border-dm-border-primary p-4 sm:p-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={goToPreviousWeek}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-dm-border-primary text-dm-text-secondary hover:bg-dm-bg-secondary transition-colors shrink-0"
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
                      : 'text-dm-text-secondary hover:bg-dm-bg-secondary'
                  }`}
                >
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium uppercase tracking-wider ${
                      selected ? 'text-white/80' : 'text-dm-text-muted'
                    }`}
                  >
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <span
                    className={`text-[15px] sm:text-[17px] font-bold leading-tight ${
                      selected ? 'text-white' : 'text-dm-text-primary'
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
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-dm-border-primary text-dm-text-secondary hover:bg-dm-bg-secondary transition-colors shrink-0"
          title="Semana siguiente"
        >
          <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={goToToday}
          className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors ${
            isToday(selectedDate)
              ? 'bg-[#1F4690]/10 text-[#1F4690]'
              : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
          }`}
        >
          {isToday(selectedDate) ? 'Hoy' : 'Ir a hoy'}
        </button>

        {/* Botón de calendario + popover */}
        <div className="relative">
          <button
            onClick={() => setShowCalendar((s) => !s)}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors shrink-0 ${
              showCalendar
                ? 'bg-[#1F4690] border-[#1F4690] text-white'
                : 'border-dm-border-primary text-dm-text-secondary hover:bg-dm-bg-secondary hover:text-[#1F4690]'
            }`}
            title="Elegir fecha"
          >
            <CalendarIcon className="w-4 h-4" strokeWidth={2} />
          </button>

          {showCalendar && (
            <div
              ref={calendarRef}
              className="absolute left-1/2 -translate-x-1/2 mt-2 bg-dm-bg-primary rounded-2xl border border-dm-border-primary shadow-xl p-4 w-[280px] z-50"
            >
              {/* Header del mini calendario */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-dm-bg-hover rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-dm-text-secondary" strokeWidth={2} />
                </button>
                <span className="text-sm font-semibold text-dm-text-primary capitalize">
                  {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-dm-bg-hover rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4 text-dm-text-secondary" strokeWidth={2} />
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDayLabels.map((label) => (
                  <div
                    key={label}
                    className="text-center text-[10px] font-medium text-dm-text-muted uppercase tracking-wider py-1"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="h-8" />;
                  }
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const dayKey = formatDayKey(day);
                  const hasManifests = datesWithManifests.includes(dayKey);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDaySelect(day)}
                      className={`relative h-8 w-8 mx-auto rounded-lg text-[13px] font-medium transition-all ${
                        isSelected
                          ? 'bg-[#1F4690] text-white shadow-sm'
                          : isTodayDate
                            ? 'ring-1 ring-[#1F4690] text-[#1F4690] hover:bg-[#1F4690]/5'
                            : 'text-dm-text-secondary hover:bg-dm-bg-hover'
                      }`}
                    >
                      {format(day, 'd')}
                      {hasManifests && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1F4690]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
