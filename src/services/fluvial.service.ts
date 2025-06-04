// src/services/fluvial.service.ts
import api from '../config/api';
import { 
  City, 
  Port, 
  Vessel, 
  VesselSeatConfiguration,
  Route, 
  RouteStop,
  Fare,
  SeatType,
  Trip,
  TripStop,
  TripSeatAvailability,
  SeatReservation,
  SeatAssignment,
  AvailableTrip,
  FareMatrix,
  ScheduledRouteTemplate,
  TripManifest,
  ManifestItem
} from '../types';

// ========================================
// SERVICIOS DE CONFIGURACIÓN GEOGRÁFICA
// ========================================

export const citiesService = {
  getAll: async (): Promise<City[]> => {
    try {
      const response = await api.get('/fluvial/cities');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ciudades:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<City> => {
    try {
      const response = await api.get(`/fluvial/cities/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo ciudad ${id}:`, error);
      throw error;
    }
  },

  create: async (cityData: Partial<City>): Promise<City> => {
    try {
      const response = await api.post('/fluvial/cities', cityData);
      return response.data;
    } catch (error) {
      console.error('Error creando ciudad:', error);
      throw error;
    }
  },

  update: async (id: number, cityData: Partial<City>): Promise<City> => {
    try {
      const response = await api.patch(`/fluvial/cities/${id}`, cityData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando ciudad ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/fluvial/cities/${id}`);
    } catch (error) {
      console.error(`Error eliminando ciudad ${id}:`, error);
      throw error;
    }
  }
};

export const portsService = {
  getAll: async (cityId?: number): Promise<Port[]> => {
    try {
      const params = cityId ? { city_id: cityId } : {};
      const response = await api.get('/fluvial/ports', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo puertos:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Port> => {
    try {
      const response = await api.get(`/fluvial/ports/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo puerto ${id}:`, error);
      throw error;
    }
  },

  create: async (portData: Partial<Port>): Promise<Port> => {
    try {
      const response = await api.post('/fluvial/ports', portData);
      return response.data;
    } catch (error) {
      console.error('Error creando puerto:', error);
      throw error;
    }
  },

  update: async (id: number, portData: Partial<Port>): Promise<Port> => {
    try {
      const response = await api.patch(`/fluvial/ports/${id}`, portData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando puerto ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/fluvial/ports/${id}`);
    } catch (error) {
      console.error(`Error eliminando puerto ${id}:`, error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS DE EMBARCACIONES
// ========================================

export const vesselsService = {
  getAll: async (): Promise<Vessel[]> => {
    try {
      const response = await api.get('/fluvial/vessels');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo embarcaciones:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Vessel> => {
    try {
      const response = await api.get(`/fluvial/vessels/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo embarcación ${id}:`, error);
      throw error;
    }
  },

  create: async (vesselData: Partial<Vessel>): Promise<Vessel> => {
    try {
      const response = await api.post('/fluvial/vessels', vesselData);
      return response.data;
    } catch (error) {
      console.error('Error creando embarcación:', error);
      throw error;
    }
  },

  update: async (id: number, vesselData: Partial<Vessel>): Promise<Vessel> => {
    try {
      const response = await api.patch(`/fluvial/vessels/${id}`, vesselData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando embarcación ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/fluvial/vessels/${id}`);
    } catch (error) {
      console.error(`Error eliminando embarcación ${id}:`, error);
      throw error;
    }
  },

  // Configuración de asientos
  getSeatConfigurations: async (vesselId: number): Promise<VesselSeatConfiguration[]> => {
    try {
      const response = await api.get(`/fluvial/vessels/${vesselId}/seat-configurations`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo configuraciones de asientos para embarcación ${vesselId}:`, error);
      throw error;
    }
  },

  updateSeatConfigurations: async (vesselId: number, configurations: Partial<VesselSeatConfiguration>[]): Promise<VesselSeatConfiguration[]> => {
    try {
      const response = await api.put(`/fluvial/vessels/${vesselId}/seat-configurations`, configurations);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando configuraciones de asientos para embarcación ${vesselId}:`, error);
      throw error;
    }
  }
};

export const seatTypesService = {
  getAll: async (): Promise<SeatType[]> => {
    try {
      const response = await api.get('/fluvial/seat-types');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tipos de asiento:', error);
      throw error;
    }
  },

  create: async (seatTypeData: Partial<SeatType>): Promise<SeatType> => {
    try {
      const response = await api.post('/fluvial/seat-types', seatTypeData);
      return response.data;
    } catch (error) {
      console.error('Error creando tipo de asiento:', error);
      throw error;
    }
  },

  update: async (id: number, seatTypeData: Partial<SeatType>): Promise<SeatType> => {
    try {
      const response = await api.patch(`/fluvial/seat-types/${id}`, seatTypeData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando tipo de asiento ${id}:`, error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS DE RUTAS Y TARIFAS
// ========================================

export const routesService = {
  getAll: async (): Promise<Route[]> => {
    try {
      const response = await api.get('/fluvial/routes');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo rutas:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Route> => {
    try {
      const response = await api.get(`/fluvial/routes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo ruta ${id}:`, error);
      throw error;
    }
  },

  create: async (routeData: Partial<Route>): Promise<Route> => {
    try {
      const response = await api.post('/fluvial/routes', routeData);
      return response.data;
    } catch (error) {
      console.error('Error creando ruta:', error);
      throw error;
    }
  },

  update: async (id: number, routeData: Partial<Route>): Promise<Route> => {
    try {
      const response = await api.patch(`/fluvial/routes/${id}`, routeData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando ruta ${id}:`, error);
      throw error;
    }
  },

  // Paradas de ruta
  getStops: async (routeId: number): Promise<RouteStop[]> => {
    try {
      const response = await api.get(`/fluvial/routes/${routeId}/stops`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo paradas de ruta ${routeId}:`, error);
      throw error;
    }
  },

  updateStops: async (routeId: number, stops: Partial<RouteStop>[]): Promise<RouteStop[]> => {
    try {
      const response = await api.put(`/fluvial/routes/${routeId}/stops`, stops);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando paradas de ruta ${routeId}:`, error);
      throw error;
    }
  }
};

export const faresService = {
  getAll: async (params?: {
    origin_port_id?: number;
    destination_port_id?: number;
    service_category?: string;
  }): Promise<Fare[]> => {
    try {
      const response = await api.get('/fluvial/fares', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tarifas:', error);
      throw error;
    }
  },

  getMatrix: async (): Promise<FareMatrix[]> => {
    try {
      const response = await api.get('/fluvial/fares/matrix');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo matriz de tarifas:', error);
      throw error;
    }
  },

  create: async (fareData: Partial<Fare>): Promise<Fare> => {
    try {
      const response = await api.post('/fluvial/fares', fareData);
      return response.data;
    } catch (error) {
      console.error('Error creando tarifa:', error);
      throw error;
    }
  },

  update: async (id: number, fareData: Partial<Fare>): Promise<Fare> => {
    try {
      const response = await api.patch(`/fluvial/fares/${id}`, fareData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando tarifa ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/fluvial/fares/${id}`);
    } catch (error) {
      console.error(`Error eliminando tarifa ${id}:`, error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS DE VIAJES Y OPERACIONES
// ========================================

export const tripsService = {
  getAvailable: async (params?: {
    departure_date?: string;
    origin_city_id?: number;
    destination_city_id?: number;
  }): Promise<AvailableTrip[]> => {
    try {
      const response = await api.get('/fluvial/trips/available', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo viajes disponibles:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Trip> => {
    try {
      const response = await api.get(`/fluvial/trips/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo viaje ${id}:`, error);
      throw error;
    }
  },

  create: async (tripData: Partial<Trip>): Promise<Trip> => {
    try {
      const response = await api.post('/fluvial/trips', tripData);
      return response.data;
    } catch (error) {
      console.error('Error creando viaje:', error);
      throw error;
    }
  },

  update: async (id: number, tripData: Partial<Trip>): Promise<Trip> => {
    try {
      const response = await api.patch(`/fluvial/trips/${id}`, tripData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando viaje ${id}:`, error);
      throw error;
    }
  },

  // Paradas de viaje
  getStops: async (tripId: number): Promise<TripStop[]> => {
    try {
      const response = await api.get(`/fluvial/trips/${tripId}/stops`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo paradas de viaje ${tripId}:`, error);
      throw error;
    }
  },

  // Disponibilidad de asientos
  getSeatAvailability: async (tripId: number): Promise<TripSeatAvailability[]> => {
    try {
      const response = await api.get(`/fluvial/trips/${tripId}/seat-availability`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo disponibilidad de asientos para viaje ${tripId}:`, error);
      throw error;
    }
  }
};

export const templatesService = {
  getAll: async (): Promise<ScheduledRouteTemplate[]> => {
    try {
      const response = await api.get('/fluvial/route-templates');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo plantillas de rutas:', error);
      throw error;
    }
  },

  create: async (templateData: Partial<ScheduledRouteTemplate>): Promise<ScheduledRouteTemplate> => {
    try {
      const response = await api.post('/fluvial/route-templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Error creando plantilla de ruta:', error);
      throw error;
    }
  },

  generateTrips: async (weeksAhead?: number): Promise<{ generated_trips: number }> => {
    try {
      const response = await api.post('/fluvial/route-templates/generate-trips', { weeks_ahead: weeksAhead });
      return response.data;
    } catch (error) {
      console.error('Error generando viajes desde plantillas:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS DE RESERVAS Y VENTAS
// ========================================

export const reservationsService = {
  getAll: async (params?: {
    trip_id?: number;
    status?: string;
    customer_doc_number?: string;
  }): Promise<SeatReservation[]> => {
    try {
      const response = await api.get('/fluvial/reservations', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reservas:', error);
      throw error;
    }
  },

  create: async (reservationData: Partial<SeatReservation>): Promise<SeatReservation> => {
    try {
      const response = await api.post('/fluvial/reservations', reservationData);
      return response.data;
    } catch (error) {
      console.error('Error creando reserva:', error);
      throw error;
    }
  },

  confirm: async (reservationId: number, clientId: number): Promise<SeatAssignment> => {
    try {
      const response = await api.post(`/fluvial/reservations/${reservationId}/confirm`, { client_id: clientId });
      return response.data;
    } catch (error) {
      console.error(`Error confirmando reserva ${reservationId}:`, error);
      throw error;
    }
  },

  cancel: async (reservationId: number): Promise<SeatReservation> => {
    try {
      const response = await api.patch(`/fluvial/reservations/${reservationId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error cancelando reserva ${reservationId}:`, error);
      throw error;
    }
  }
};

export const salesService = {
  createDirectSale: async (saleData: {
    trip_id: number;
    client_id: number;
    seat_type_id: number;
    boarding_stop_id: number;
    disembarking_stop_id: number;
    passenger_name: string;
    passenger_doc_type: string;
    passenger_doc_number: string;
    special_notes?: string;
  }): Promise<SeatAssignment> => {
    try {
      const response = await api.post('/fluvial/sales/direct', saleData);
      return response.data;
    } catch (error) {
      console.error('Error creando venta directa:', error);
      throw error;
    }
  },

  calculatePrice: async (params: {
    origin_port_id: number;
    destination_port_id: number;
    seat_type_id: number;
    service_category?: string;
  }): Promise<{ price: number; fare: Fare; seat_type: SeatType }> => {
    try {
      const response = await api.get('/fluvial/sales/calculate-price', { params });
      return response.data;
    } catch (error) {
      console.error('Error calculando precio:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS DE MANIFIESTOS
// ========================================

export const manifestsService = {
  getAll: async (params?: {
    trip_id?: number;
    generation_date?: string;
  }): Promise<TripManifest[]> => {
    try {
      const response = await api.get('/fluvial/manifests', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo manifiestos:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<TripManifest> => {
    try {
      const response = await api.get(`/fluvial/manifests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo manifiesto ${id}:`, error);
      throw error;
    }
  },

  generate: async (tripId: number): Promise<TripManifest> => {
    try {
      const response = await api.post('/fluvial/manifests', { trip_id: tripId });
      return response.data;
    } catch (error) {
      console.error(`Error generando manifiesto para viaje ${tripId}:`, error);
      throw error;
    }
  },

  getItems: async (manifestId: number): Promise<ManifestItem[]> => {
    try {
      const response = await api.get(`/fluvial/manifests/${manifestId}/items`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo items de manifiesto ${manifestId}:`, error);
      throw error;
    }
  },

  print: async (manifestId: number): Promise<{ pdf_url: string }> => {
    try {
      const response = await api.post(`/fluvial/manifests/${manifestId}/print`);
      return response.data;
    } catch (error) {
      console.error(`Error imprimiendo manifiesto ${manifestId}:`, error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS DE DASHBOARD Y REPORTES
// ========================================

export const dashboardService = {
  getFluvialStats: async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const response = await api.get('/fluvial/dashboard/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard fluvial:', error);
      throw error;
    }
  },

  getTodayTrips: async () => {
    try {
      const response = await api.get('/fluvial/dashboard/today-trips');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo viajes de hoy:', error);
      throw error;
    }
  },

  getAlerts: async () => {
    try {
      const response = await api.get('/fluvial/dashboard/alerts');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo alertas:', error);
      throw error;
    }
  }
};

export const reportsService = {
  getOccupancyReport: async (params: {
    start_date: string;
    end_date: string;
    route_id?: number;
    vessel_id?: number;
  }) => {
    try {
      const response = await api.get('/fluvial/reports/occupancy', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reporte de ocupación:', error);
      throw error;
    }
  },

  getRevenueReport: async (params: {
    start_date: string;
    end_date: string;
    route_id?: number;
  }) => {
    try {
      const response = await api.get('/fluvial/reports/revenue', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reporte de ingresos:', error);
      throw error;
    }
  },

  getPassengerReport: async (params: {
    start_date: string;
    end_date: string;
    origin_city_id?: number;
    destination_city_id?: number;
  }) => {
    try {
      const response = await api.get('/fluvial/reports/passengers', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reporte de pasajeros:', error);
      throw error;
    }
  }
};