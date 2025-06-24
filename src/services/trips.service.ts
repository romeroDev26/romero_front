// src/services/trips.service.ts
import api from '../config/api';
import { Trip, AvailableTrip } from '../types';
import { AxiosRequestConfig } from 'axios';
import { stringify } from 'qs';

export interface CreateTripData {
  company_id: number;
  route_id: number;
  vessel_id: number;
  departure_datetime: string; // ISO datetime
  can_sell_tickets?: boolean;
  notes?: string;
  trip_name?: string;
  captain_user_id?: string;
}

export interface UpdateTripData {
  vessel_id?: number;
  departure_datetime?: string;
  status?: string;
  captain_user_id?: string;
  can_sell_tickets?: boolean;
  notes?: string;
  actual_departure_datetime?: string;
  actual_arrival_datetime?: string;
}

export interface CancelTripData {
  reason: string; // mínimo 10 caracteres según la API
}

export interface SearchTripsParams {
  company_id: number;
  start_date?: string; // formato YYYY-MM-DD
  end_date?: string; // formato YYYY-MM-DD
  status?: string[]; // Siempre como array
  origin_city_id?: number;
  destination_city_id?: number;
  skip?: number;
  limit?: number;
}

class TripsService {
  private basePath = '/operations/trips/';

  async create(data: CreateTripData): Promise<Trip> {
    const response = await api.post(this.basePath, data);
    return response.data;
  }

  async getById(tripId: number): Promise<Trip> {
    const response = await api.get(`${this.basePath}${tripId}`);
    return response.data;
  }

  async update(tripId: number, data: UpdateTripData): Promise<Trip> {
    const response = await api.patch(`${this.basePath}${tripId}`, data);
    return response.data;
  }

  async cancel(tripId: number, data: CancelTripData): Promise<Trip> {
    const response = await api.post(`${this.basePath}${tripId}/cancel`, data);
    return response.data;
  }

  // NUEVO MÉTODO para el historial base
  async getAllForCompany(params: { company_id: number; skip?: number; limit?: number }): Promise<Trip[]> {
    const response = await api.get(this.basePath, { params });
    return response.data;
  }

  // Para la vista "Próximos Viajes"
  async getUpcoming(params: { company_id: number; limit?: number }): Promise<AvailableTrip[]> {
    const response = await api.get(`${this.basePath}upcoming`, { params });
    return response.data;
  }

  // Para la vista "Semanal"
  async getForWeek(params: { company_id: number; start_date: string }): Promise<Trip[]> {
    const response = await api.get(`${this.basePath}week-view`, { params });
    return response.data;
  }

  // Para la vista "Historial" y filtros avanzados
  async search(params: SearchTripsParams): Promise<Trip[]> {
    const config: AxiosRequestConfig = {
      params,
      paramsSerializer: p => stringify(p, { arrayFormat: 'comma', allowDots: true }),
    };
    const response = await api.get(`${this.basePath}search`, config);
    return response.data;
  }

  // Este método ya no es necesario para la página de Schedule, pero lo mantenemos
  // por si es usado en otro lado (ej: punto de venta).
  async searchAvailable(params: {
    start_date: string;
    company_id: number;
    origin_city_id?: number;
    destination_city_id?: number;
  }): Promise<AvailableTrip[]> {
    const response = await api.get(`${this.basePath}available`, { params });
    return response.data;
  }
}

export const tripsService = new TripsService();
