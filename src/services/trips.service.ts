// src/services/trips.service.ts
import api from '../config/api';
import { Trip, AvailableTrip, TripStop, Vessel, TripSeatAvailability } from '../types';
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

// Tipado para la respuesta del endpoint /by-boarding-port
export interface AvailableTripByPort {
  id: number;
  trip_name: string;
  status: string;
  vessel_name: string;
  estimated_arrival_time: string;
  estimated_departure_time: string;
}

// NUEVO: Interfaz para la respuesta detallada del viaje
export interface TripDetailsResponse extends Trip {
  vessel: Vessel;
  route: Trip['route']; // Asumimos que el tipo Route ya está definido en Trip
  stops: TripStop[];
  availability: TripSeatAvailability[]; // El backend lo llama 'availability'
}

class TripsService {
  private basePath = '/operations/trips/';

  async create(data: CreateTripData): Promise<Trip> {
    const response = await api.post(this.basePath, data);
    return response.data;
  }

  async getById(tripId: number): Promise<TripDetailsResponse> {
    const response = await api.get<TripDetailsResponse>(`${this.basePath}${tripId}`);
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

  async getAllForCompany(params: { company_id: number; skip?: number; limit?: number }): Promise<Trip[]> {
    const response = await api.get(this.basePath, { params });
    return response.data;
  }

  async getUpcoming(params: { company_id: number; limit?: number }): Promise<AvailableTrip[]> {
    const response = await api.get(`${this.basePath}upcoming`, { params });
    return response.data;
  }

  async getForWeek(params: { company_id: number; start_date: string }): Promise<Trip[]> {
    const response = await api.get(`${this.basePath}week-view`, { params });
    return response.data;
  }

  async search(params: SearchTripsParams): Promise<Trip[]> {
    const config: AxiosRequestConfig = {
      params,
      paramsSerializer: p => stringify(p, { arrayFormat: 'comma', allowDots: true }),
    };
    const response = await api.get(`${this.basePath}search`, config);
    return response.data;
  }

  async searchAvailable(params: {
    start_date: string;
    company_id: number;
    origin_city_id?: number;
    destination_city_id?: number;
  }): Promise<AvailableTrip[]> {
    const response = await api.get(`${this.basePath}available`, { params });
    return response.data;
  }

  async getTripsByBoardingPort(companyId: number, portId: number, onDate: string): Promise<AvailableTripByPort[]> {
    const response = await api.get<AvailableTripByPort[]>('/operations/trips/by-boarding-port', {
      params: {
        company_id: companyId,
        port_id: portId,
        on_date: onDate,
      },
    });
    return response.data;
  }
}

export const tripsService = new TripsService();
