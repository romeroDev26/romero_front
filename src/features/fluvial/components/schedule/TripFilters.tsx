import React from 'react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';
import { useCities } from '../../../../hooks/useCitiesPortsData';

export interface TripAdvancedFilters {
  origin_city_id?: number;
  destination_city_id?: number;
  status?: string;
  search?: string;
}

interface TripFiltersProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  filters: TripAdvancedFilters;
  onFiltersChange: (filters: Partial<TripAdvancedFilters>) => void;
  viewMode: 'upcoming' | 'week' | 'history';
}

const TRIP_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Programado' },
  { value: 'BOARDING', label: 'Embarcando' },
  { value: 'DEPARTED', label: 'En Ruta' },
  { value: 'ARRIVED', label: 'Arribado' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export const TripFilters: React.FC<TripFiltersProps> = ({
  currentDate,
  onDateChange,
  filters,
  onFiltersChange,
  viewMode,
}) => {
  const { data: cities = [], isLoading: isLoadingCities } = useCities();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const handlePrevWeek = () => onDateChange(addDays(currentDate, -7));
  const handleNextWeek = () => onDateChange(addDays(currentDate, 7));

  const clearFilters = () => {
    onDateChange(new Date());
    onFiltersChange({
      origin_city_id: undefined,
      destination_city_id: undefined,
      status: undefined,
      search: undefined,
    });
  };

  // Verificacion robusta: string vacio no cuenta como filtro activo
  const hasActiveFilters =
    !!filters.origin_city_id ||
    !!filters.destination_city_id ||
    !!filters.status ||
    (typeof filters.search === 'string' && filters.search.trim().length > 0);

  const weekRangeLabel = `${format(weekStart, "d 'de' MMMM", { locale: es })} — ${format(weekEnd, "d 'de' MMMM, yyyy", { locale: es })}`;

  const cityOptions = cities.map((city) => ({ value: city.id, label: city.name }));

  const inputBaseClass =
    'w-full px-3 py-2.5 border border-dm-border-primary rounded-lg bg-dm-bg-secondary focus:bg-dm-bg-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm text-dm-text-secondary placeholder-gray-400 dark:placeholder-gray-500';

  return (
    <div className="space-y-4">
      {/* Fila superior: navegador semanal o descripcion + boton limpiar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Navegador semanal (solo en modo semana) */}
        {viewMode === 'week' ? (
          <div className="flex items-center gap-1 bg-dm-bg-secondary border border-dm-border-primary rounded-lg self-start">
            <button
              onClick={handlePrevWeek}
              className="p-2 text-dm-text-muted hover:bg-dm-bg-hover rounded-l-lg transition-colors"
              title="Semana anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-3 py-2 text-sm font-semibold text-dm-text-secondary min-w-[220px] sm:min-w-[240px] text-center">
              {weekRangeLabel}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 text-dm-text-muted hover:bg-dm-bg-hover rounded-r-lg transition-colors"
              title="Semana siguiente"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-dm-text-muted">
            {viewMode === 'upcoming' && 'Mostrando todos los proximos viajes programados.'}
            {viewMode === 'history' && 'Mostrando historial de viajes del ultimo ano.'}
          </p>
        )}

        {/* Boton limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-dm-text-muted bg-dm-bg-primary hover:bg-dm-bg-hover border-dm-border-primary shadow-sm flex items-center gap-1.5 self-start sm:self-auto w-fit"
          >
            <XMarkIcon className="w-4 h-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-dm-border-secondary">

        {/* Busqueda libre */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
            Busqueda
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-dm-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
              placeholder="Nombre o embarcacion..."
              className={`${inputBaseClass} pl-9`}
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-xs font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
            Estado
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFiltersChange({ status: e.target.value || undefined })}
            className={inputBaseClass}
          >
            <option value="">Todos los estados</option>
            {TRIP_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ciudad Origen */}
        <div>
          <label className="block text-xs font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
            Ciudad Origen
          </label>
          {isLoadingCities ? (
            <div className="w-full h-10 bg-dm-bg-secondary rounded-lg animate-pulse" />
          ) : (
            <SearchableSelect
              value={filters.origin_city_id ?? null}
              onChange={(val) =>
                onFiltersChange({ origin_city_id: val != null ? Number(val) : undefined })
              }
              options={cityOptions}
              placeholder="Buscar ciudad..."
              disabled={isLoadingCities}
            />
          )}
        </div>

        {/* Ciudad Destino */}
        <div>
          <label className="block text-xs font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
            Ciudad Destino
          </label>
          {isLoadingCities ? (
            <div className="w-full h-10 bg-dm-bg-secondary rounded-lg animate-pulse" />
          ) : (
            <SearchableSelect
              value={filters.destination_city_id ?? null}
              onChange={(val) =>
                onFiltersChange({ destination_city_id: val != null ? Number(val) : undefined })
              }
              options={cityOptions}
              placeholder="Buscar ciudad..."
              disabled={isLoadingCities}
            />
          )}
        </div>
      </div>
    </div>
  );
};
