// src/services/assignments.service.ts
import api from '../config/api';
import { SeatAssignment } from '../types';

// El tipo de dato que enviaremos a la API para crear la asignación
export interface SeatAssignmentCreateData {
  trip_id: number;
  client_id: number;
  seat_type_id: number;
  trip_seat_id: number;
  boarding_stop_id: number;
  disembarking_stop_id: number;
  passenger_name: string;
  passenger_doc_type: string;
  passenger_doc_number: string;
  seat_number: string;
  special_notes?: string;
  invoice_item_id: number; // La clave de la orquestación
}

// Interfaz extendida con información adicional del backend
export interface SeatAssignmentDetail extends SeatAssignment {
  trip_seat_id?: number;
  boarded_at?: string | null;
  boarded_by?: number | null;
  current_seat_label?: string;
  product_name?: string;
}

// Datos para reasignar un asiento
export interface ReassignSeatData {
  assignment_id: number;
  new_trip_seat_id: number;
}

// Respuesta del backend al reasignar (incluye el PDF regenerado)
export interface ReassignResponse {
  message: string;
  assignment: SeatAssignmentDetail;
  invoice?: {
    id: number;
    pdf_ticket_file_path?: string;
    pdf_a4_file_path?: string;
  };
}

class AssignmentsService {
  private basePath = '/operations/assignments/';

  /**
   * Crea una asignación de asiento confirmada.
   * Esta operación es el paso final después de crear la factura.
   */
  async create(data: SeatAssignmentCreateData): Promise<SeatAssignment> {
    try {
      const response = await api.post<SeatAssignment>(this.basePath, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear la asignación de asiento:', error);
      // Re-lanzamos el error para que React Query lo capture
      throw error;
    }
  }

  /**
   * Obtiene las asignaciones de un ticket por su serie y número
   */
  async getByTicket(series: string, number: number): Promise<SeatAssignmentDetail[]> {
    try {
      const response = await api.get<SeatAssignmentDetail[]>(
        `${this.basePath}by-ticket/${series}/${number}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener asignaciones del ticket:', error);
      throw error;
    }
  }

  /**
   * Reasigna un asiento a otra posición (trip_seat_id)
   * El backend regenera automáticamente el PDF
   */
  async reassign(data: ReassignSeatData): Promise<ReassignResponse> {
    try {
      const response = await api.post<ReassignResponse>(
        `${this.basePath}reassign`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error al reasignar asiento:', error);
      throw error;
    }
  }
}

export const assignmentsService = new AssignmentsService();