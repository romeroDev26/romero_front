// src/features/accounting/debit-notes/services/debitNotes.service.ts

import api from '../../../../config/api';
import { DebitNote } from '../../../../types';
import { 
  DebitNoteCreateData, 
  DebitNotesListParams, 
  DebitNoteResponse,
  SunatStatusResponse,
  DebitNoteAnnulData,
  CreditNoteResponse,
} from '../../types';

class DebitNotesService {
  private readonly basePath = '/sunat/debit-notes/';

  // Crear nota de débito
  async create(data: DebitNoteCreateData): Promise<DebitNoteResponse> {
    const response = await api.post<DebitNoteResponse>(this.basePath, data);
    return response.data;
  }

  // Listar notas de débito
  async getAll(params: DebitNotesListParams): Promise<DebitNote[]> {
    const response = await api.get(this.basePath, { 
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
    return [];
  }

  // Obtener una nota de débito por ID
  async getById(id: number): Promise<DebitNote> {
    // Obtener recurso de nota de débito con datos enriquecidos
    const response = await api.get<DebitNote>(`${this.basePath}${id}`, {
      params: { enriched: true }
    });
    return response.data;
  }

  // Consultar detalle/estado SUNAT de una nota de débito.
  // Endpoint requerido: /api/v1/sunat/debit-notes/{debit_note_id}
  async checkSunatStatus(id: number): Promise<SunatStatusResponse> {
    // Pedir siempre con enriched=true para obtener información completa
    const response = await api.get<SunatStatusResponse>(`${this.basePath}${id}`, {
      params: { enriched: true }
    });
    return response.data;
  }

  // Refrescar estados pendientes (útil para polling)
  async refreshPendingStatuses(limit: number = 10): Promise<void> {
    await api.post(`/sunat/documents/debit_note/refresh-pending?limit=${limit}`);
  }

  // Anular nota de débito (genera una nota de crédito)
  async annul(data: DebitNoteAnnulData): Promise<CreditNoteResponse> {
    const response = await api.post<CreditNoteResponse>(`${this.basePath}annul`, data);
    return response.data;
  }
}

export const debitNotesService = new DebitNotesService();
