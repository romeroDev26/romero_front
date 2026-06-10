import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PencilIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { AvailableTrip } from '../../../../types';
import { Button } from '../../../../components/common/Button';

interface Props {
  trips: AvailableTrip[];
  onTripClick: (trip: AvailableTrip) => void;
  onDateClick: (date: Date) => void;
}

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
    BOARDING: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    DEPARTED: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
    ARRIVED: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    COMPLETED: 'bg-dm-bg-secondary text-dm-text-primary',
    CANCELLED: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
  };
  const labels: Record<string, string> = {
    SCHEDULED: 'Programado',
    BOARDING: 'Embarcando',
    DEPARTED: 'En Ruta',
    ARRIVED: 'Arribado',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${config[status] || config.SCHEDULED}`}>
      {labels[status] || status}
    </span>
  );
};

const TripDetailPopover: React.FC<{
  trip: AvailableTrip | null;
  onClose: () => void;
  onEdit: (trip: AvailableTrip) => void;
}> = ({ trip, onClose, onEdit }) => {
  if (!trip) return null;

  const departure = new Date(trip.departure_datetime);
  const arrival = trip.estimated_arrival_datetime
    ? new Date(trip.estimated_arrival_datetime)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dm-bg-primary rounded-xl border border-dm-border-secondary shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-dm-border-secondary">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-dm-text-primary truncate">
              {trip.trip_name || `Viaje #${trip.trip_id}`}
            </h3>
            <p className="text-xs text-dm-text-muted mt-0.5 truncate">{trip.route_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dm-text-muted hover:text-dm-text-secondary hover:bg-dm-bg-hover transition-colors flex-shrink-0"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Embarcacion */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <GlobeAltIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-dm-text-muted">Embarcacion</p>
              <p className="text-sm font-medium text-dm-text-primary">{trip.vessel_name}</p>
            </div>
          </div>

          {/* Ruta */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <MapPinIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-dm-text-muted">Ruta</p>
              <p className="text-sm font-medium text-dm-text-primary">
                {trip.origin_city || 'N/A'} <span className="text-dm-text-muted mx-1">→</span> {trip.destination_city || 'N/A'}
              </p>
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ClockIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-dm-text-muted">Salida</p>
              <p className="text-sm font-medium text-dm-text-primary">
                {format(departure, 'dd MMM yyyy, HH:mm', { locale: es })}
              </p>
              {arrival && (
                <p className="text-xs text-dm-text-muted mt-0.5">
                  Llegada estimada: {format(arrival, 'dd MMM yyyy, HH:mm', { locale: es })}
                </p>
              )}
            </div>
          </div>

          {/* Asientos */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <UsersIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-dm-text-muted">Asientos</p>
              <p className="text-sm font-medium text-dm-text-primary">
                {trip.total_available_seats} disponibles
                <span className="text-dm-text-muted font-normal">
                  {' '}({trip.total_confirmed_seats} confirmados, {trip.total_reserved_seats} reservados)
                </span>
              </p>
            </div>
          </div>

          {/* Estado */}
          <div className="pt-2">
            <StatusBadge status={trip.status} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-dm-border-secondary bg-dm-bg-secondary/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onEdit(trip)}
            className="flex items-center gap-1.5"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Editar viaje
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CalendarView: React.FC<Props> = ({ trips, onTripClick, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTrip, setSelectedTrip] = useState<AvailableTrip | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = (getDay(monthStart) + 6) % 7;

  const calendarDays = [
    ...Array(startDayOfWeek).fill(null),
    ...days
  ];

  const tripsByDate = trips.reduce((acc, trip) => {
    const dateKey = format(new Date(trip.departure_datetime), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(trip);
    return acc;
  }, {} as Record<string, AvailableTrip[]>);

  const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));

  const getTripStatusColor = (trip: AvailableTrip) => {
    switch (trip.sales_status) {
      case 'DISPONIBLE':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50';
      case 'URGENTE':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/50';
      case 'AGOTADO':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50';
      case 'CERRADO':
        return 'bg-dm-bg-secondary text-dm-text-primary border-dm-border-primary';
      default:
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';
    }
  };

  const handleTripSelect = (trip: AvailableTrip) => {
    setSelectedTrip(trip);
  };

  const handleEditTrip = (trip: AvailableTrip) => {
    setSelectedTrip(null);
    onTripClick(trip);
  };

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

        <h3 className="text-lg font-semibold capitalize text-dm-text-primary">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-dm-bg-hover rounded-lg transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Dias de la semana */}
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

      {/* Dias del mes */}
      <div className="grid grid-cols-7 gap-px bg-dm-bg-secondary rounded-b-lg overflow-hidden">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="bg-dm-bg-secondary p-2 h-auto min-h-[140px]" />;
          }

          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTrips = tripsByDate[dateKey] || [];
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateKey}
              className={`bg-dm-bg-primary p-2 h-auto min-h-[140px] hover:bg-dm-bg-hover cursor-pointer transition-colors ${
                isCurrentDay ? 'ring-2 ring-primary ring-inset' : ''
              }`}
              onClick={() => onDateClick(day)}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className={`text-sm font-medium ${
                  isCurrentDay ? 'text-primary' : 'text-dm-text-primary'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayTrips.length > 0 && (
                  <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-semibold">
                    {dayTrips.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
                {dayTrips.map((trip, idx) => (
                  <div
                    key={`${trip.trip_id}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTripSelect(trip);
                    }}
                    className={`text-[10px] leading-tight py-1 px-1.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${getTripStatusColor(trip)}`}
                    title={`${trip.vessel_name} — ${trip.route_name}`}
                  >
                    <div className="font-semibold truncate flex items-center gap-1">
                      <span className="tabular-nums">{format(new Date(trip.departure_datetime), 'HH:mm')}</span>
                      <span className="opacity-60">|</span>
                      <span className="truncate">{trip.vessel_name}</span>
                    </div>
                    <div className="opacity-80 truncate mt-0.5">
                      {trip.origin_city || 'N/A'} → {trip.destination_city || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/50 rounded" />
          <span className="text-dm-text-secondary">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800/50 rounded" />
          <span className="text-dm-text-secondary">Urgente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50 rounded" />
          <span className="text-dm-text-secondary">Agotado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-dm-bg-secondary border border-dm-border-primary rounded" />
          <span className="text-dm-text-secondary">Cerrado</span>
        </div>
      </div>

      {/* Popover de detalle del viaje */}
      {selectedTrip && (
        <TripDetailPopover
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onEdit={handleEditTrip}
        />
      )}
    </div>
  );
};
