// src/features/accounting/services/cancellationRequests.service.ts

import api from '../../../config/api';
import {
  CancellationRequest,
  CancellationRequestCreate,
  CancellationRequestApproval,
  CancellationRequestRejection,
  CancellationRequestListItem,
  CancellationRequestListParams,
  CancellationRequestApprovalResponse
} from '../types/cancellationRequests';

class CancellationRequestsService {
  /**
   * Crear una solicitud de anulación (vendedor)
   */
  async create(data: CancellationRequestCreate): Promise<CancellationRequest> {
    const response = await api.post<CancellationRequest>('/operations/cancellation-requests/', data);
    return response.data;
  }

  /**
   * Listar solicitudes pendientes (supervisor)
   */
  async getPending(params?: CancellationRequestListParams): Promise<CancellationRequestListItem[]> {
    const response = await api.get<CancellationRequestListItem[]>('/operations/cancellation-requests/pending', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 50
      }
    });
    return response.data;
  }

  /**
   * Listar todas las solicitudes con filtros (supervisor)
   */
  async getAll(params?: CancellationRequestListParams): Promise<CancellationRequestListItem[]> {
    const response = await api.get<CancellationRequestListItem[]>('/operations/cancellation-requests/', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 50,
        status: params?.status
      }
    });
    return response.data;
  }

  /**
   * Obtener una solicitud por ID
   */
  async getById(id: number): Promise<CancellationRequestListItem> {
    const response = await api.get<CancellationRequestListItem>(`/operations/cancellation-requests/${id}`);
    return response.data;
  }

  /**
   * Aprobar una solicitud (supervisor)
   */
  async approve(id: number, data: CancellationRequestApproval): Promise<CancellationRequestApprovalResponse> {
    const response = await api.post<CancellationRequestApprovalResponse>(
      `/operations/cancellation-requests/${id}/approve`,
      data
    );
    return response.data;
  }

  /**
   * Rechazar una solicitud (supervisor)
   */
  async reject(id: number, data: CancellationRequestRejection): Promise<CancellationRequest> {
    const response = await api.post<CancellationRequest>(
      `/operations/cancellation-requests/${id}/reject`,
      data
    );
    return response.data;
  }

  /**
   * Obtener el conteo de solicitudes pendientes
   */
  async getPendingCount(): Promise<number> {
    try {
      // Usar límite más razonable o sin límite explícito
      const pending = await this.getPending();
      return pending.length;
    } catch (error) {
      console.error('Error obteniendo conteo de solicitudes pendientes:', error);
      return 0;
    }
  }

  /**
   * Obtener las solicitudes del vendedor actual
   */
  async getMyRequests(params?: CancellationRequestListParams): Promise<CancellationRequestListItem[]> {
    const response = await api.get<CancellationRequestListItem[]>('/operations/cancellation-requests/my-requests', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 50,
        status: params?.status
      }
    });
    return response.data;
  }

  /**
   * Obtener el conteo de solicitudes resueltas sin leer (vendedor)
   */
  async getUnreadResolvedCount(): Promise<number> {
    try {
      const myRequests = await this.getMyRequests();
      // Obtener las solicitudes que están resueltas
      const resolvedRequests = myRequests.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED');
      
      // Obtener IDs de solicitudes ya vistas desde localStorage
      const viewedKey = 'cancellation_requests_viewed';
      const viewedStr = localStorage.getItem(viewedKey);
      const viewedIds: Set<number> = viewedStr ? new Set(JSON.parse(viewedStr)) : new Set();
      
      // Contar solo las que NO han sido vistas
      const unreadCount = resolvedRequests.filter(r => !viewedIds.has(r.id)).length;
      
      return unreadCount;
    } catch (error) {
      console.error('Error obteniendo conteo de respuestas:', error);
      return 0;
    }
  }

  /**
   * Marcar solicitudes resueltas como vistas (vendedor)
   */
  markResolvedAsViewed(requests: CancellationRequestListItem[]): void {
    try {
      const resolvedRequests = requests.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED');
      const resolvedIds = resolvedRequests.map(r => r.id);
      
      if (resolvedIds.length === 0) return;
      
      const viewedKey = 'cancellation_requests_viewed';
      const viewedStr = localStorage.getItem(viewedKey);
      const viewedIds: Set<number> = viewedStr ? new Set(JSON.parse(viewedStr)) : new Set();
      
      // Añadir los nuevos IDs
      resolvedIds.forEach(id => viewedIds.add(id));
      
      // Guardar en localStorage
      localStorage.setItem(viewedKey, JSON.stringify(Array.from(viewedIds)));
    } catch (error) {
      console.error('Error al marcar solicitudes como vistas:', error);
    }
  }
}

export const cancellationRequestsService = new CancellationRequestsService();
export default cancellationRequestsService;
