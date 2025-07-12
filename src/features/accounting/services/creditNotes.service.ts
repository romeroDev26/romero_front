// src/features/accounting/services/creditNotes.service.ts

import api from '../../../config/api';
import { CreditNote } from '../../../types';
import { 
  CreditNoteCreateData, 
  CreditNotesListParams, 
  VoidableInvoice 
} from '../types';

class CreditNotesService {
  private readonly basePath = '/credit-notes';

  // Listar notas de crédito
  async getAll(params: CreditNotesListParams): Promise<CreditNote[]> {
    const response = await api.get<CreditNote[]>(this.basePath, { params });
    return response.data;
  }

  // Obtener una nota de crédito por ID
  async getById(id: number): Promise<CreditNote> {
    const response = await api.get<CreditNote>(`${this.basePath}/${id}`);
    return response.data;
  }

  // Crear una nueva nota de crédito
  async create(data: CreditNoteCreateData): Promise<CreditNote> {
    const response = await api.post<CreditNote>(this.basePath, data);
    return response.data;
  }

  // Obtener facturas que pueden ser anuladas (para crear NC)
  async getVoidableInvoices(companyId: number): Promise<VoidableInvoice[]> {
    const response = await api.get(`/invoices/voidable`, {
      params: { company_id: companyId }
    });
    return response.data;
  }
}

export const creditNotesService = new CreditNotesService();