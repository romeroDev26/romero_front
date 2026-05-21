// src/features/dashboard/components/DateRangeFilter.tsx
import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import { CalendarDaysIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import "react-datepicker/dist/react-datepicker.css";

export type DateFilterOption = 'today' | 'last7days' | 'lastMonth' | 'custom';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  selectedOption: DateFilterOption;
  onOptionChange: (option: DateFilterOption) => void;
}

const filterOptions: { value: DateFilterOption; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'lastMonth', label: 'Último mes' },
  { value: 'custom', label: 'Rango personalizado' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onDateChange,
  selectedOption,
  onOptionChange,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Cerrar el calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar las fechas temporales cuando cambian las props
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  const handleOptionClick = (option: DateFilterOption) => {
    onOptionChange(option);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (option) {
      case 'today':
        onDateChange(today, today);
        setShowCalendar(false);
        break;
      case 'last7days': {
        const start = new Date(today);
        start.setDate(today.getDate() - 6);
        onDateChange(start, today);
        setShowCalendar(false);
        break;
      }
      case 'lastMonth': {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 1);
        onDateChange(start, today);
        setShowCalendar(false);
        break;
      }
      case 'custom':
        setTempStartDate(null);
        setTempEndDate(null);
        onDateChange(null, null);
        setShowCalendar(true);
        break;
    }
  };

  const handleDateSelect = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setTempStartDate(start);
    setTempEndDate(end);
    
    // Si ambas fechas están seleccionadas, aplicar el rango
    if (start && end) {
      onDateChange(start, end);
      setShowCalendar(false);
    }
  };

  const formatDateRange = () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    };

    if (!startDate || !endDate) {
      return 'Selecciona un rango de fechas';
    }

    if (selectedOption === 'today') {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="relative" ref={calendarRef}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Botones de opciones rápidas */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedOption === option.value
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Indicador de rango seleccionado */}
        {selectedOption === 'custom' ? (
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="inline-flex items-center px-4 py-2 bg-dm-bg-primary border border-dm-border-primary rounded-lg text-sm font-medium text-dm-text-secondary hover:bg-dm-bg-hover transition-colors shadow-sm cursor-pointer"
          >
            <CalendarDaysIcon className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            <span>{formatDateRange()}</span>
            <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <div className="inline-flex items-center px-4 py-2 bg-dm-bg-secondary border border-dm-border-primary rounded-lg text-sm font-medium text-dm-text-secondary">
            <CalendarDaysIcon className="w-5 h-5 mr-2 text-dm-text-muted" />
            <span>{formatDateRange()}</span>
          </div>
        )}
      </div>

      {/* Calendario desplegable */}
      {showCalendar && (
        <div className="mt-4 w-full max-w-3xl mx-auto bg-dm-bg-primary rounded-xl shadow-2xl border border-dm-border-primary p-4 overflow-x-auto">
          <div className="custom-datepicker-wrapper">
            <DatePicker
              selected={tempStartDate}
              onChange={handleDateSelect}
              startDate={tempStartDate}
              endDate={tempEndDate}
              selectsRange
              inline
              monthsShown={2}
              locale={es}
              minDate={new Date(2020, 0, 1)}
              maxDate={new Date()}
              calendarClassName="custom-datepicker"
              dayClassName={(date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = 
                  (tempStartDate && date.toDateString() === tempStartDate.toDateString()) ||
                  (tempEndDate && date.toDateString() === tempEndDate.toDateString());
                const isInRange = 
                  tempStartDate && 
                  tempEndDate && 
                  date > tempStartDate && 
                  date < tempEndDate;

                if (isSelected) return 'bg-indigo-600 text-white rounded-full';
                if (isInRange) return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300';
                if (isToday) return 'border-2 border-indigo-600 rounded-full';
                return '';
              }}
            />
          </div>
          
          {/* Acciones del calendario */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-dm-border-primary">
            <button
              onClick={() => {
                setTempStartDate(startDate);
                setTempEndDate(endDate);
                setShowCalendar(false);
              }}
              className="px-4 py-2 text-sm text-dm-text-secondary hover:text-dm-text-primary"
            >
              Cancelar
            </button>
            <div className="text-sm text-dm-text-muted">
              {tempStartDate && tempEndDate ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {Math.ceil((tempEndDate.getTime() - tempStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} días seleccionados
                </span>
              ) : (
                <span>Selecciona un rango de fechas</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
