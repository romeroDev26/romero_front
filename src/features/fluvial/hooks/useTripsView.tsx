// src/features/fluvial/hooks/useTripsView.tsx
import { useQuery } from '@tanstack/react-query';
import { tripsService, SearchTripsParams } from '../../../services/trips.service';
import { format, startOfWeek, subYears } from 'date-fns';
import { useMemo } from 'react';
import { useVesselsData } from './useVesselsData';
import { Vessel } from '../../../types';

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
  total_capacity?: number | null;
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

// Las funciones de transformación ahora recibirán el mapa de embarcaciones
const transformTrip = (trip: any, vesselsMap: Map<number, Vessel>): UnifiedTripViewItem => {
  // Encuentra la embarcación correspondiente al viaje
  const vessel = vesselsMap.get(trip.vessel_id);

  // El endpoint /upcoming ya viene con muchos datos, pero lo enriquecemos
  if (trip.route?.name) {
    // Asumimos que es un formato anidado (como /upcoming)
    return {
      trip_id: trip.trip_id || trip.id,
      trip_name: trip.trip_name,
      route_name: trip.route?.name,
      origin_city: trip.origin_port_name || trip.route?.origin_port?.name || 'N/A',
      destination_city: trip.destination_port_name || trip.route?.destination_port?.name || 'N/A',
      vessel_name: trip.vessel?.name || trip.vessel_name,
      departure_datetime: trip.departure_datetime,
      estimated_arrival_datetime: trip.estimated_arrival_datetime,
      status: trip.status || 'SCHEDULED',
      // Este endpoint es el que trae la disponibilidad real
      total_available_seats: trip.total_available_seats,
      // Obtenemos la capacidad total desde la embarcación
      total_capacity: vessel?.capacity_passengers ?? null,
      sales_status: trip.sales_status,
      original_data: trip,
    };
  }

  // Formato plano (como /search, /week-view)
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
    // Para estos endpoints, si no viene la disponibilidad, la dejamos como null
    total_available_seats: trip.total_available_seats ?? null,
    // Pero sí podemos mostrar la capacidad total de la embarcación
    total_capacity: vessel?.capacity_passengers ?? null,
    sales_status: 'CONSULTAR', // Valor por defecto si no viene
    original_data: trip,
  };
};

export const useTripsView = ({
  viewMode,
  weekDate,
  companyId,
  filters,
}: UseTripsViewParams) => {
  // Obtenemos los datos de las embarcaciones. React Query se encarga del cache.
  const { data: vessels = [] } = useVesselsData(companyId);

  // Creamos un mapa para buscar embarcaciones por ID eficientemente.
  // Usamos useMemo para no recalcularlo en cada render.
  const vesselsMap = useMemo(() => {
    return new Map(vessels.map(vessel => [vessel.id, vessel]));
  }, [vessels]);

  const queryKey = ['tripsView', viewMode, weekDate, companyId, filters];

  const queryFn = async (): Promise<UnifiedTripViewItem[]> => {
    // Si no tenemos el mapa de embarcaciones aún, podríamos esperar, pero
    // react-query lo gestionará. El mapeo se hará cuando los datos lleguen.

    let tripsData: any[] = [];
    switch (viewMode) {
      case 'upcoming': {
        tripsData = await tripsService.getUpcoming({ company_id: companyId, limit: 100 });
        break;
      }
      case 'week': {
        const weekStartDate = format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        tripsData = await tripsService.getForWeek({ company_id: companyId, start_date: weekStartDate });
        break;
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
            ...filters
          };
          tripsData = await tripsService.search(searchParams);
        } else {
          tripsData = await tripsService.getAllForCompany({ company_id: companyId, limit: 200 });
        }
        break;
      }
      default:
        return [];
    }

    // Transformamos TODOS los resultados usando el mapa de embarcaciones
    return tripsData.map(trip => transformTrip(trip, vesselsMap));
  };

  return useQuery<UnifiedTripViewItem[]>({
    queryKey,
    queryFn,
    enabled: !!companyId && vessels.length > 0, // Habilitamos la query solo si tenemos las embarcaciones
  });
};
