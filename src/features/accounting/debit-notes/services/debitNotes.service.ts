// src/features/accounting/debit-notes/services/debitNotes.service.ts

import api from '../../../../config/api';
import { DebitNote } from '../../../../types';
import { 
  DebitNoteCreateData, 
  DebitNotesListParams, 
  DebitNoteResponse,
  SunatStatusResponse,
} from '../../types';

class DebitNotesService {
  private readonly basePath = '/sunat/debit-notes';

  // Crear nota de débito
  async create(data: DebitNoteCreateData): Promise<DebitNoteResponse> {
    const response = await api.post<DebitNoteResponse>(this.basePath, data);
    return response.data;
  }

  // Listar notas de débito
  async getAll(params: DebitNotesListParams): Promise<DebitNote[]> {
    const response = await api.get('/sunat/debit-notes/', { 
      params: {
        ...params
      }
    });
    
    // Según la documentación, la respuesta tiene formato: { debit_notes: [...], total: 0, skip: 0, limit: 0 }
    if (response.data && response.data.debit_notes && Array.isArray(response.data.debit_notes)) {
      return response.data.debit_notes;
    }
    
    // Fallback para otros formatos
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Si no es array, devolver array vacío para evitar errores
    console.warn('Debit notes response is not in expected format:', response.data);
    return [];
  }

  // Obtener una nota de débito por ID
  async getById(id: number): Promise<DebitNote> {
    const response = await api.get<DebitNote>(`/invoices/notes/${id}`);
    return response.data;
  }

  // Consultar estado SUNAT de una nota de débito
  async checkSunatStatus(id: number): Promise<SunatStatusResponse> {
    const response = await api.get<SunatStatusResponse>(`/sunat/tickets/documents/debit_note/${id}/status`);
    return response.data;
  }

  // Refrescar estados pendientes (útil para polling)
  async refreshPendingStatuses(limit: number = 10): Promise<void> {
    await api.post(`/sunat/documents/debit_note/refresh-pending?limit=${limit}`);
  }
}

export const debitNotesService = new DebitNotesService();
