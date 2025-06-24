import { useQuery } from '@tanstack/react-query';
import { tripsService, SearchTripsParams } from '../../../services/trips.service';
import { format, startOfWeek, subYears } from 'date-fns';
import { AvailableTrip, Trip, ScheduledRouteTemplate } from '../../../types';

type ViewFilterMode = 'upcoming' | 'week' | 'history';

export interface UnifiedTripViewItem {
  trip_id: number;
  trip_name?: string | null;
  route_name?: string | null;
  origin_city?: string | null;
  destination_city?: string | null;
  vessel_name?: string | null;
  departure_datetime: string;
  estimated_arrival_datetime?: string | null;
  status?: string | null;
  sales_status?: string | null;
  total_available_seats?: number | null;
  original_data: any;
}

interface UseTripsViewParams {
  viewMode: ViewFilterMode;
  weekDate: Date;
  companyId: number;
  filters: {
    origin_city_id?: number;
    destination_city_id?: number;
  };
}

// Esta función es para datos que vienen con objetos 'route' y 'vessel' anidados.
// El endpoint /upcoming SÍ devuelve este formato.
const transformNestedTrip = (trip: any): UnifiedTripViewItem => {
  return {
    trip_id: trip.trip_id || trip.id, // Acepta ambos nombres de ID
    trip_name: trip.trip_name,
    // Aquí está la clave: extraemos de los objetos anidados
    route_name: trip.route?.name,
    // Para las ciudades/puertos, ahora el backend los provee planos incluso en el objeto anidado.
    // O si no, los construimos.
    origin_city: trip.origin_port_name || trip.route?.origin_port?.name || 'N/A',
    destination_city: trip.destination_port_name || trip.route?.destination_port?.name || 'N/A',
    vessel_name: trip.vessel?.name || trip.vessel_name,
    departure_datetime: trip.departure_datetime,
    estimated_arrival_datetime: trip.estimated_arrival_datetime,
    status: trip.status || 'SCHEDULED', // El status puede venir o no
    sales_status: trip.sales_status || 'CONSULTAR', // Igual para sales_status
    total_available_seats: trip.total_available_seats || 0,
    original_data: trip,
  };
};

// Esta función es para los datos que ya vienen planos (Semanal, Historial)
const transformFlatTrip = (trip: any): UnifiedTripViewItem => {
  return {
    trip_id: trip.id,
    trip_name: trip.trip_name,
    route_name: `${trip.origin_port_name} → ${trip.destination_port_name}`,
    origin_city: trip.origin_port_name,
    destination_city: trip.destination_port_name,
    vessel_name: trip.vessel_name,
    departure_datetime: trip.departure_datetime,
    estimated_arrival_datetime: trip.estimated_arrival_datetime,
    status: trip.status,
    sales_status: 'CONSULTAR',
    total_available_seats: 0,
    original_data: trip,
  };
};

export const useTripsView = ({
  viewMode,
  weekDate,
  companyId,
  filters,
}: UseTripsViewParams) => {

  const queryKey = ['tripsView', viewMode, weekDate, companyId, filters];

  const queryFn = async (): Promise<UnifiedTripViewItem[]> => {
    switch (viewMode) {
      case 'upcoming': {
        const nestedTrips = await tripsService.getUpcoming({ company_id: companyId, limit: 100 });
        return nestedTrips.map(transformNestedTrip);
      }

      case 'week': {
        const weekStartDate = format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const flatTrips = await tripsService.getForWeek({ company_id: companyId, start_date: weekStartDate });
        return flatTrips.map(transformFlatTrip);
      }

      case 'history': {
        const hasAdvancedFilters = filters.origin_city_id || filters.destination_city_id;

        if (hasAdvancedFilters) {
          const today = format(new Date(), 'yyyy-MM-dd');
          const oneYearAgo = format(subYears(new Date(), 1), 'yyyy-MM-dd');

          const searchParams: SearchTripsParams = {
            company_id: companyId,
            start_date: oneYearAgo,
            end_date: today,
            ...filters,
          };

          const flatTrips = await tripsService.search(searchParams);
          return flatTrips.map(transformFlatTrip);
        } else {
          const flatTrips = await tripsService.getAllForCompany({ company_id: companyId, limit: 200 });
          return flatTrips.map(transformFlatTrip);
        }
      }

      default:
        return [];
    }
  };

  return useQuery<UnifiedTripViewItem[]>({
    queryKey,
    queryFn,
    enabled: !!companyId,
  });
};
