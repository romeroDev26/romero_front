// src/services/reservations.service.ts
import api from '../config/api';
import { SeatReservation } from '../types';
import { AxiosRequestConfig } from 'axios';
import { stringify } from 'qs';

// Datos para crear una reserva
export interface ReservationCreateData {
  trip_id: number;
  seat_type_id: number;
  trip_seat_id: number;
  boarding_stop_id: number;
  disembarking_stop_id: number;
  customer_name: string;
  customer_doc_type: string;
  customer_doc_number: string;
  customer_phone?: string;
  customer_email?: string;
  total_price: number;
  advance_amount: number;
  currency_code: string;
  expires_at?: string; // ISO Date String
  seat_number: string;
  special_notes?: string;
  payment_reference?: string;
}

// Datos para actualizar una reserva (ej. confirmar o cancelar)
export interface ReservationUpdateData {
  status: 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  payment_reference?: string;
  special_notes?: string;
}

// Interfaz para los parámetros de búsqueda
export interface ReservationSearchParams {
  company_id: number;
  branch_office_id?: number;
  trip_id?: number;
  status?: string[];
  customer_doc_number?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  skip?: number;
  limit?: number;
}

class ReservationsService {
  private basePath = '/operations/reservations/';

  // Nuevo método de búsqueda
  async search(params: ReservationSearchParams): Promise<SeatReservation[]> {
    const config: AxiosRequestConfig = {
      params,
      paramsSerializer: p => stringify(p, { arrayFormat: 'comma' }),
    };
    const response = await api.get<SeatReservation[]>(this.basePath, config);
    return response.data;
  }

  async create(data: ReservationCreateData): Promise<SeatReservation> {
    const response = await api.post<SeatReservation>(this.basePath, data);
    return response.data;
  }

  async getByTrip(tripId: number): Promise<SeatReservation[]> {
    const response = await api.get<SeatReservation[]>(`${this.basePath}by-trip/${tripId}`);
    return response.data;
  }

  async getById(reservationId: number): Promise<SeatReservation> {
    const response = await api.get<SeatReservation>(`${this.basePath}${reservationId}`);
    return response.data;
  }

  async update(reservationId: number, data: Partial<ReservationUpdateData>): Promise<SeatReservation> {
    const response = await api.patch<SeatReservation>(`${this.basePath}${reservationId}`, data);
    return response.data;
  }
}

export const reservationsService = new ReservationsService();
