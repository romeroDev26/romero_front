// src/features/accounting/services/creditNotes.service.ts

import api from '../../../config/api';
import { CreditNote } from '../../../types';
import { pdfTasksService, GeneratePdfResponse } from '../../../services/pdfTasks.service';
import { 
  CreditNoteCreateData, 
  CreditNoteAnnulData,
  CreditNotesListParams, 
  CreditNoteResponse,
  SunatStatusResponse,
  VoidableInvoice 
} from '../types';

class CreditNotesService {
  // Crear nota de crédito (endpoint principal)
  async create(data: CreditNoteCreateData): Promise<CreditNoteResponse> {
    const response = await api.post<CreditNoteResponse>('/sunat/credit-notes/', data);
    return response.data;
  }

  // Crear nota de crédito por anulación (endpoint alternativo)
  async createByAnnulment(data: CreditNoteAnnulData): Promise<CreditNoteResponse> {
    const response = await api.post<CreditNoteResponse>('/sunat/credit-notes/annul', data);
    return response.data;
  }

  // Listar notas de crédito (actualizado según documentación)
  async getAll(params: CreditNotesListParams): Promise<CreditNote[]> {
    const response = await api.get('/sunat/credit-notes/', { 
      params: {
        company_id: params.company_id,
        skip: params.skip || 0,
        limit: params.limit || 50,
        sunat_status: params.sunat_status,
        issue_date: params.issue_date,
        series: params.series
      }
    });
    
    // Según la documentación, la respuesta tiene formato: 
    // { credit_notes: [...], total: 0, skip: 0, limit: 0, message: "..." }
    if (response.data && response.data.credit_notes && Array.isArray(response.data.credit_notes)) {
      return response.data.credit_notes;
    }
    
    // Fallback para otros formatos
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Si no es array, devolver array vacío para evitar errores
    return [];
  }

  // Obtener una nota de crédito por ID
  async getById(id: number): Promise<CreditNote> {
    const response = await api.get<CreditNote>(`/sunat/credit-notes/${id}`);
    return response.data;
  }

  /**
   * Genera u obtiene el PDF de la nota de crédito.
   * Maneja la respuesta inteligente del backend (completed vs uploading + polling).
   */
  async generatePdf(id: number, size: '80mm' | 'a4' = 'a4'): Promise<string> {
    const response = await api.post<GeneratePdfResponse>(
      `/sunat/credit-notes/${id}/generate-pdf`,
      null,
      { params: { size } }
    );

    const data = response.data;

    // Respuesta rápida: Bunny terminó dentro del tiempo de espera del backend
    if (data.status === 'completed' && data.url) {
      return data.url;
    }

    // Respuesta lenta: hacer polling desde frontend
    if (data.task_id) {
      const url = await pdfTasksService.pollForUrl(data.task_id);
      if (url) return url;
    }

    // Fallback: obtener URL directamente de la nota de crédito actualizada
    const updatedNote = await this.getById(id);
    const fallbackUrl = size === 'a4'
      ? (updatedNote as any).pdf_a4_file_path
      : (updatedNote as any).pdf_ticket_file_path;
    if (fallbackUrl) return fallbackUrl;

    throw new Error(`No se pudo obtener la URL del PDF ${size} para la NC ${id}`);
  }

  // Consultar estado SUNAT de una nota de crédito
  async checkSunatStatus(id: number): Promise<SunatStatusResponse> {
    const response = await api.get<SunatStatusResponse>(`/sunat/tickets/documents/credit_note/${id}/status`);
    return response.data;
  }

  // Refrescar estados pendientes (útil para polling)
  async refreshPendingStatuses(limit: number = 10): Promise<void> {
    await api.post(`/sunat/documents/credit_note/refresh-pending?limit=${limit}`);
  }

  // Obtener facturas que pueden ser anuladas (para crear NC)
  async getVoidableInvoices(companyId: number): Promise<VoidableInvoice[]> {
    // En lugar de usar un endpoint específico, usamos el listado de facturas
    // filtradas por estado ACCEPTED (que son las que se pueden anular)
    const response = await api.get('/sunat/invoices/', {
      params: {
        company_id: companyId,
        sunat_status: 'ACCEPTED', // Solo facturas aceptadas por SUNAT
        limit: 100 // Límite razonable para selección
      }
    });

    // Convertir las facturas al formato esperado por VoidableInvoice
    const invoices = response.data?.invoices || response.data || [];
    
    const mappedInvoices = invoices.map((invoice: any) => {
      // Intentar obtener client_id de múltiples fuentes
      let clientId = 0;
      let clientName = 'N/A';

      // Prioridad 1: client_id directo
      if (invoice.client_id && invoice.client_id !== 0) {
        clientId = invoice.client_id;
      }
      // Prioridad 2: client.id
      else if (invoice.client?.id && invoice.client.id !== 0) {
        clientId = invoice.client.id;
      }

      // Obtener nombre del cliente
      if (invoice.client?.name) {
        clientName = invoice.client.name;
      } else if (invoice.client_name) {
        clientName = invoice.client_name;
      }

      return {
        id: invoice.id,
        series: invoice.series,
        number: invoice.number,
        document_type_code: invoice.document_type_code,
        client_id: clientId,
        client_name: clientName,
        total_payable: invoice.total_payable?.toString() || '0.00',
        issue_date: invoice.issue_date,
        currency_code: invoice.currency_code || 'PEN',
        business_status: invoice.business_status || 'ACTIVE' // Campo añadido
      };
    });

    return mappedInvoices;
  }
}

export const creditNotesService = new CreditNotesService();