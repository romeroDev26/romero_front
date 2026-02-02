// src/features/accounting/types/cancellationRequests.ts

/**
 * Estado de una solicitud de anulación
 */
export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Datos para crear una solicitud de anulación
 */
export interface CancellationRequestCreate {
  invoice_id: number;
  request_reason: string;
}

/**
 * Datos para aprobar una solicitud de anulación
 */
export interface CancellationRequestApproval {
  credit_note_series: string;
}

/**
 * Datos para rechazar una solicitud de anulación
 */
export interface CancellationRequestRejection {
  rejection_reason: string;
}

/**
 * Solicitud de anulación completa (respuesta del backend)
 */
export interface CancellationRequest {
  id: number;
  invoice_id: number;
  requester_id: string;
  supervisor_id?: string | null;
  status: CancellationRequestStatus;
  request_reason: string;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  requester_read_at?: string | null;
}

/**
 * Solicitud de anulación con información extendida (para la lista del supervisor)
 */
export interface CancellationRequestListItem extends CancellationRequest {
  requester_name: string;
  series: string;
  number: number;
  passenger_name?: string;
  trip_info?: string;
}

/**
 * Parámetros para listar solicitudes de anulación
 */
export interface CancellationRequestListParams {
  skip?: number;
  limit?: number;
  status?: CancellationRequestStatus;
}

/**
 * Respuesta al aprobar una solicitud
 */
export interface CancellationRequestApprovalResponse {
  message: string;
  cancellation_request: CancellationRequest;
  credit_note: {
    id: number;
    series: string;
    number: number;
    type: string;
    sunat_status: string;
  };
}
