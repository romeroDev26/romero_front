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
   * Marcar una solicitud como leída (vendedor)
   */
  async markAsRead(id: number): Promise<CancellationRequest> {
    const response = await api.post<CancellationRequest>(
      `/operations/cancellation-requests/${id}/mark-read`
    );
    return response.data;
  }

  /**
   * Obtener el conteo de solicitudes resueltas sin leer (vendedor)
   */
  async getUnreadResolvedCount(): Promise<number> {
    try {
      const myRequests = await this.getMyRequests();
      // Obtener las solicitudes que están resueltas y no han sido leídas
      const unreadResolved = myRequests.filter(r => 
        (r.status === 'APPROVED' || r.status === 'REJECTED') && !r.requester_read_at
      );
      
      return unreadResolved.length;
    } catch (error) {
      console.error('Error obteniendo conteo de respuestas:', error);
      return 0;
    }
  }

  /**
   * Marcar múltiples solicitudes como leídas en batch (vendedor)
   */
  async markMultipleAsRead(requests: CancellationRequestListItem[]): Promise<void> {
    try {
      // Filtrar solicitudes resueltas y no leídas
      const unreadResolved = requests.filter(
        r => (r.status === 'APPROVED' || r.status === 'REJECTED') && !r.requester_read_at
      );
      
      if (unreadResolved.length === 0) return;
      
      // Marcar cada solicitud como leída en el backend
      await Promise.all(
        unreadResolved.map(request => this.markAsRead(request.id))
      );
    } catch (error) {
      console.error('Error al marcar solicitudes como leídas:', error);
    }
  }
}

export const cancellationRequestsService = new CancellationRequestsService();
export default cancellationRequestsService;
