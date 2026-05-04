// src/features/fluvial/hooks/useTripsView.tsx
import { useQuery } from '@tanstack/react-query';
import { tripsService, SearchTripsParams } from '../../../services/trips.service';
import { format, startOfWeek, subYears, addDays } from 'date-fns';

// Interfaz de visualización estándar para cualquier tipo de viaje
export interface UnifiedTripViewItem {
  trip_id: number;
  trip_name: string | null;
  vessel_name: string | null;
  origin_port_name: string | null;
  destination_port_name: string | null;
  departure_datetime: string;
  status: string;
  total_seats: number | null;
  available_seats: number | null;
  manifest_generated: boolean;
  original_data: any;
}

interface UseTripsViewParams {
  viewMode: 'upcoming' | 'week' | 'history';
  weekDate: Date;
  companyId: number;
  filters: {
    origin_city_id?: number;
    destination_city_id?: number;
    status?: string;
    search?: string;
  };
}

// Función de transformación
const transformTripToUnifiedView = (trip: any): UnifiedTripViewItem => {
  return {
    trip_id: trip.id,
    trip_name: trip.trip_name,
    vessel_name: trip.vessel_name,
    origin_port_name: trip.origin_port_name,
    destination_port_name: trip.destination_port_name,
    departure_datetime: trip.departure_datetime,
    status: trip.status,
    total_seats: trip.total_seats,
    available_seats: trip.available_seats,
    manifest_generated: trip.manifest_generated,
    original_data: trip,
  };
};

export const useTripsView = ({
  viewMode,
  weekDate,
  companyId,
  filters,
}: UseTripsViewParams) => {
  // El queryKey solo incluye lo que realmente afecta la llamada al backend.
  // Status, search y city filters son filtros puramente frontend: no deben
  // provocar un re-fetch al cambiar.
  const queryKey =
    viewMode === 'history'
      ? ['tripsView', viewMode, weekDate, companyId, {
          origin_city_id: filters.origin_city_id,
          destination_city_id: filters.destination_city_id,
        }]
      : ['tripsView', viewMode, weekDate, companyId];
  const queryFn = async (): Promise<UnifiedTripViewItem[]> => {
    let rawTrips: any[] = [];

    switch (viewMode) {
      case 'upcoming': {
        rawTrips = await tripsService.getUpcoming({ company_id: companyId, limit: 100 });
        break;
      }
      case 'week': {
        const weekStartDate = format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        rawTrips = await tripsService.getForWeek({ company_id: companyId, start_date: weekStartDate });
        break;
      }
      case 'history': {
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subYears(new Date(), 1), 'yyyy-MM-dd');

        const searchParams: SearchTripsParams = {
          company_id: companyId,
          start_date: startDate,
          end_date: endDate,
          ...(filters.origin_city_id ? { origin_city_id: filters.origin_city_id } : {}),
          ...(filters.destination_city_id ? { destination_city_id: filters.destination_city_id } : {}),
        };

        rawTrips = await tripsService.search(searchParams);
        break;
      }
      default:
        return [];
    }

    return rawTrips.map(transformTripToUnifiedView);
  };

  return useQuery<UnifiedTripViewItem[]>({
    queryKey,
    queryFn,
    enabled: !!companyId,
  });
};
