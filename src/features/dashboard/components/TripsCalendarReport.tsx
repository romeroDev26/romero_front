// src/features/dashboard/components/TripsCalendarReport.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  XMarkIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  MapPinIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { reportsService } from '../../../services/reports.service';
import { TripListItem } from '../../../types/tripSalesReport';
import { TripSalesDetailReport } from './TripSalesDetailReport';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Colores para ocupación
const getOccupancyColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getOccupancyBgColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-50 dark:bg-green-950/30 border-green-200';
  if (percentage >= 50) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 dark:bg-red-950/30 border-red-200';
};

interface DayTrips {
  date: string;
  trips: TripListItem[];
  totalRevenue: number;
  avgOccupancy: number;
}

export const TripsCalendarReport: React.FC = () => {
  // Estado del mes actual (por defecto el mes actual)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Calcular el rango de fechas basado en el mes actual
  const dateRange = useMemo(() => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return {
      start_date: startOfMonth.toISOString().split('T')[0],
      end_date: endOfMonth.toISOString().split('T')[0],
    };
  }, [currentMonth]);

  // Estado de selección
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  // Consultar viajes del mes actual
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['trips-list', dateRange.start_date, dateRange.end_date],
    queryFn: () => reportsService.getTripsList(dateRange),
    enabled: true,
    staleTime: 1000 * 60 * 2, // Cache por 2 minutos
    gcTime: 1000 * 60 * 5, // Mantener en caché por 5 minutos (antes cacheTime)
  });

  // Agrupar viajes por día
  const tripsByDay = useMemo<Map<string, DayTrips>>(() => {
    const map = new Map<string, DayTrips>();
    
    if (!tripsData?.items) return map;

    tripsData.items.forEach((item) => {
      // Normalizar fecha: extraer solo YYYY-MM-DD independientemente del formato
      const dateKey = item.trip.departure_datetime.split(' ')[0].split('T')[0];
      
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: dateKey,
          trips: [],
          totalRevenue: 0,
          avgOccupancy: 0,
        });
      }
      
      const dayData = map.get(dateKey)!;
      dayData.trips.push(item);
      dayData.totalRevenue += item.sales.total_revenue;
    });

    // Calcular promedio de ocupación
    map.forEach((dayData) => {
      if (dayData.trips.length > 0) {
        dayData.avgOccupancy = dayData.trips.reduce(
          (sum, t) => sum + t.sales.occupancy_percentage, 0
        ) / dayData.trips.length;
      }
    });

    return map;
  }, [tripsData]);

  // Obtener viajes del día seleccionado
  const selectedDayTrips = selectedDate ? tripsByDay.get(selectedDate)?.trips || [] : [];

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Días vacíos al inicio (para alinear con el día de la semana)
    const startDayOfWeek = firstDay.getDay();
    const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Lunes = 0
    for (let i = 0; i < emptyDays; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
    setSelectedTripId(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
    setSelectedTripId(null);
  };

  const handleDayClick = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const dayData = tripsByDay.get(dateKey);
    
    if (dayData && dayData.trips.length > 0) {
      setSelectedDate(dateKey);
      setSelectedTripId(null);
    }
  };

  const handleTripSelect = (tripId: number) => {
    setSelectedTripId(tripId);
  };

  const handleBackToCalendar = () => {
    setSelectedTripId(null);
  };

  const handleBackToTrips = () => {
    setSelectedDate(null);
    setSelectedTripId(null);
  };

  // Si hay un viaje seleccionado, mostrar el reporte detallado
  if (selectedTripId) {
    return (
      <TripSalesDetailReport 
        tripId={selectedTripId} 
        onBack={handleBackToCalendar}
      />
    );
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-dm-bg-primary rounded-xl shadow-lg border border-dm-border-primary overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l3-9h12l3 9m-9-9v9m-6 0h12m-6 0v3m-6-3l-1 3h14l-1-3" />
            </svg>
            Reporte de Ventas por Viaje
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            Selecciona un día para ver los viajes y sus estadísticas
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2 bg-dm-bg-primary rounded-xl shadow-lg border border-dm-border-primary overflow-hidden">
          {/* Navegación del mes */}
          <div className="flex items-center justify-between px-6 py-4 bg-dm-bg-secondary border-b border-dm-border-primary">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-dm-bg-hover rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-dm-text-secondary" />
            </button>
            <h3 className="text-lg font-semibold text-dm-text-primary">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-dm-bg-hover rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-dm-text-secondary" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 bg-dm-bg-secondary border-b border-dm-border-primary">
            {dayNames.map((day) => (
              <div key={day} className="py-3 text-center text-sm font-medium text-dm-text-secondary">
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-24 bg-dm-bg-secondary border-b border-r border-dm-border-secondary" />;
              }

              const dateKey = date.toISOString().split('T')[0];
              const dayData = tripsByDay.get(dateKey);
              const hasTrips = dayData && dayData.trips.length > 0;
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate === dateKey;

              return (
                <div
                  key={dateKey}
                  onClick={() => hasTrips && handleDayClick(date)}
                  className={`h-24 p-2 border-b border-r border-dm-border-secondary transition-all ${
                    hasTrips ? 'cursor-pointer hover:bg-indigo-50 dark:bg-indigo-950/30' : ''
                  } ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-medium ${
                      isToday ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center' :
                      'text-dm-text-secondary'
                    }`}>
                      {date.getDate()}
                    </span>
                    {hasTrips && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${getOccupancyBgColor(dayData.avgOccupancy)}`}>
                        {dayData.trips.length}
                      </span>
                    )}
                  </div>
                  
                  {hasTrips && (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center text-xs text-dm-text-secondary">
                        <CurrencyDollarIcon className="w-3 h-3 mr-1" />
                        <span className="truncate">{formatCurrency(dayData.totalRevenue)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-dm-bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getOccupancyColor(dayData.avgOccupancy)}`}
                          style={{ width: `${dayData.avgOccupancy}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="px-6 py-4 bg-dm-bg-secondary border-t border-dm-border-primary">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-dm-text-secondary">Alta ocupación (≥80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-dm-text-secondary">Media (50-79%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-dm-text-secondary">Baja (&lt;50%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral - Lista de viajes del día */}
        <div className="bg-dm-bg-primary rounded-xl shadow-lg border border-dm-border-primary overflow-hidden">
          <div className="px-6 py-4 bg-dm-bg-secondary border-b border-dm-border-primary flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dm-text-primary">
              {selectedDate ? (
                <>Viajes del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PE', { 
                  day: 'numeric', 
                  month: 'long' 
                })}</>
              ) : (
                'Selecciona un día'
              )}
            </h3>
            {selectedDate && (
              <button
                onClick={handleBackToTrips}
                className="p-1 hover:bg-dm-bg-hover rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-dm-text-muted" />
              </button>
            )}
          </div>

          <div className="p-4 max-h-[600px] overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {!selectedDate && !isLoading && (
              <div className="text-center py-12 text-dm-text-muted">
                <svg className="w-12 h-12 mx-auto text-dm-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15l3-9h12l3 9m-9-9v9m-6 0h12m-6 0v3m-6-3l-1 3h14l-1-3" />
                </svg>
                <p>Haz clic en un día con viajes para ver los detalles</p>
              </div>
            )}

            {selectedDate && selectedDayTrips.length === 0 && !isLoading && (
              <div className="text-center py-12 text-dm-text-muted">
                <p>No hay viajes para este día</p>
              </div>
            )}

            {selectedDate && selectedDayTrips.length > 0 && (
              <div className="space-y-3">
                {selectedDayTrips.map((item) => (
                  <button
                    key={item.trip.trip_id}
                    onClick={() => handleTripSelect(item.trip.trip_id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-indigo-400 hover:shadow-md ${
                      getOccupancyBgColor(item.sales.occupancy_percentage)
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-dm-text-muted" />
                        <span className="font-semibold text-dm-text-primary">
                          {formatTime(item.trip.departure_datetime)}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.trip.status === 'PROGRAMADO' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                        item.trip.status === 'EN_CURSO' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' :
                        item.trip.status === 'COMPLETADO' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                        'bg-dm-bg-secondary text-dm-text-secondary'
                      }`}>
                        {item.trip.status}
                      </span>
                    </div>

                    {/* Nombre del viaje */}
                    {item.trip.trip_name && (
                      <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 truncate">
                        {item.trip.trip_name}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-sm text-dm-text-secondary mb-2">
                      <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.trip.route.origin_port}</span>
                      <ArrowRightIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{item.trip.route.destination_port}</span>
                    </div>

                    <div className="text-xs text-dm-text-muted mb-3">
                      {item.trip.vessel.actual.vessel_name || item.trip.vessel.scheduled.vessel_name}
                      {item.trip.vessel.changed && (
                        <span className="ml-2 text-orange-600 dark:text-orange-400">(cambio de embarcación)</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dm-border-primary">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <UserGroupIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          <span className="font-semibold text-dm-text-primary">
                            {item.sales.occupancy_percentage.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-dm-text-muted">Ocupación</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-dm-text-primary">
                          {item.sales.sold_seats}/{item.trip.capacity.total_seats}
                        </p>
                        <p className="text-xs text-dm-text-muted">Asientos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(item.sales.total_revenue)}
                        </p>
                        <p className="text-xs text-dm-text-muted">Ingresos</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
