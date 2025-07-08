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
}

export const assignmentsService = new AssignmentsService();