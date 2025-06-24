import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { useCities } from '../../../../hooks/useCitiesPortsData';

// Nuevas props para el componente
interface TripFiltersProps {
  currentDate: Date; // La fecha ancla para la vista semanal
  onDateChange: (newDate: Date) => void;
  filters: {
    origin_city_id?: number;
    destination_city_id?: number;
  };
  onFiltersChange: (filters: Partial<Omit<TripFiltersProps['filters'], 'start_date'>>) => void;
  viewMode: 'upcoming' | 'week' | 'history'; // Para saber qué mostrar
}

export const TripFilters: React.FC<TripFiltersProps> = ({
  currentDate,
  onDateChange,
  filters,
  onFiltersChange,
  viewMode,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const { data: cities = [], isLoading: isLoadingCities } = useCities();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const handlePrevWeek = () => onDateChange(addDays(currentDate, -7));
  const handleNextWeek = () => onDateChange(addDays(currentDate, 7));

  const handleCityChange = (field: 'origin_city_id' | 'destination_city_id', value: string) => {
    onFiltersChange({ [field]: value ? parseInt(value) : undefined });
  };

  const clearFilters = () => {
    onDateChange(new Date());
    onFiltersChange({ origin_city_id: undefined, destination_city_id: undefined });
  };

  const weekRangeLabel = `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM, yyyy', { locale: es })}`;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* El navegador semanal solo aparece en la vista 'week' */}
        {viewMode === 'week' ? (
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-sm">
            <button onClick={handlePrevWeek} className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-md" title="Semana anterior">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="px-4 py-2 text-sm font-semibold text-gray-800 text-center min-w-[200px]">
              {weekRangeLabel}
            </div>
            <button onClick={handleNextWeek} className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-md" title="Semana siguiente">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="text-sm font-medium text-gray-700">
            {viewMode === 'upcoming' && "Mostrando todos los próximos viajes."}
            {viewMode === 'history' && "Mostrando historial de viajes (último año)."}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4" />
            {showAdvancedFilters ? 'Ocultar Filtros' : 'Más Filtros'}
          </Button>
          <Button variant="secondary" onClick={clearFilters} className="text-sm">
            Limpiar
          </Button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad de Origen</label>
            <select
              value={filters.origin_city_id || ''}
              onChange={(e) => handleCityChange('origin_city_id', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
              disabled={isLoadingCities}
            >
              <option value="">Todas</option>
              {cities.map((city: any) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad de Destino</label>
            <select
              value={filters.destination_city_id || ''}
              onChange={(e) => handleCityChange('destination_city_id', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
              disabled={isLoadingCities}
            >
              <option value="">Todas</option>
              {cities.map((city: any) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
