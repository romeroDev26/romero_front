// src/services/whatsappConfig.service.ts
import api from '../config/api';
import { BranchOffice } from '../types';

// Tipos para las respuestas del backend
export interface WhatsAppCreateInstanceRequest {
  instance_name: string;
  branch_office_id: number;
  integration?: string;  // Default: WHATSAPP-BAILEYS
  qrcode?: boolean;      // Default: true
}

export interface WhatsAppCreateInstanceResponse {
  success: boolean;
  instance: string;
  status: string;
  qr_code?: string;
  message: string;
  branch_office_updated?: boolean;
}

export interface WhatsAppQRResponse {
  success: boolean;
  instance: string;
  qr_code: string;
  status: string;
  message: string;
}

export interface WhatsAppStatusResponse {
  success: boolean;
  instance: string;
  connection_state: 'open' | 'close' | 'connecting';
  is_connected: boolean;
  requires_qr: boolean;
  message: string;
}

export interface WhatsAppDeleteResponse {
  success: boolean;
  instance: string;
  message: string;
  branch_office_updated?: boolean;
}

// Tipos para eventos de webhook
export interface WhatsAppEvent {
  type: 'connection.update' | 'qrcode.updated' | 'messages.upsert' | string;
  instance: string;
  data: {
    state?: 'open' | 'close' | 'connecting';
    qrcode?: string;
    /** El resto del payload varia segun el tipo de evento del webhook. */
    [key: string]: unknown;
  };
  timestamp: string;
}

export interface WhatsAppEventsResponse {
  success: boolean;
  instance: string;
  events: WhatsAppEvent[];
  count: number;
}

// Sucursal con información de WhatsApp
export interface BranchOfficeWithWhatsApp extends BranchOffice {
  whatsapp_instance_name?: string | null;
  whatsapp_status?: 'open' | 'close' | 'connecting' | null;
}

class WhatsAppConfigService {
  /**
   * Crea una nueva instancia de WhatsApp y la asocia a una sucursal
   * Endpoint: POST /api/v1/external/whatsapp/instance/create
   */
  async createInstance(data: WhatsAppCreateInstanceRequest): Promise<WhatsAppCreateInstanceResponse> {
    const response = await api.post<WhatsAppCreateInstanceResponse>(
      '/external/whatsapp/instance/create',
      {
        instance_name: data.instance_name,
        branch_office_id: data.branch_office_id,
        integration: data.integration || 'WHATSAPP-BAILEYS',
        qrcode: data.qrcode !== false, // Default true
      }
    );
    return response.data;
  }

  /**
   * Obtiene el código QR para conectar una instancia
   * Endpoint: GET /api/v1/external/whatsapp/instance/{instance_name}/qr
   */
  async getQRCode(instanceName: string): Promise<WhatsAppQRResponse> {
    const response = await api.get<WhatsAppQRResponse>(
      `/external/whatsapp/instance/${instanceName}/qr`
    );
    return response.data;
  }

  /**
   * Obtiene el estado de conexión de una instancia
   * Endpoint: GET /api/v1/external/whatsapp/instance/{instance_name}/status
   */
  async getConnectionStatus(instanceName: string): Promise<WhatsAppStatusResponse> {
    const response = await api.get<WhatsAppStatusResponse>(
      `/external/whatsapp/instance/${instanceName}/status`
    );
    return response.data;
  }

  /**
   * Elimina una instancia de WhatsApp
   * Endpoint: DELETE /api/v1/external/whatsapp/instance/{instance_name}
   */
  async deleteInstance(instanceName: string): Promise<WhatsAppDeleteResponse> {
    const response = await api.delete<WhatsAppDeleteResponse>(
      `/external/whatsapp/instance/${instanceName}`
    );
    return response.data;
  }

  /**
   * Desconecta (logout) una instancia de WhatsApp sin eliminarla
   * Endpoint: POST /api/v1/external/whatsapp/instance/{instance_name}/logout
   */
  async logoutInstance(instanceName: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      `/external/whatsapp/instance/${instanceName}/logout`
    );
    return response.data;
  }

  /**
   * Reinicia una instancia de WhatsApp
   * Endpoint: POST /api/v1/external/whatsapp/instance/{instance_name}/restart
   */
  async restartInstance(instanceName: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      `/external/whatsapp/instance/${instanceName}/restart`
    );
    return response.data;
  }

  /**
   * Obtiene los eventos de webhook de una instancia desde un timestamp específico
   * Endpoint: GET /api/v1/external/whatsapp/instance/{instance_name}/events
   * @param instanceName Nombre de la instancia
   * @param sinceTs Timestamp ISO8601 desde el cual obtener eventos (opcional)
   */
  async getEvents(instanceName: string, sinceTs?: string): Promise<WhatsAppEventsResponse> {
    const params = sinceTs ? { since_ts: sinceTs } : {};
    const response = await api.get<WhatsAppEventsResponse>(
      `/external/whatsapp/instance/${instanceName}/events`,
      { params }
    );
    return response.data;
  }

  /**
   * Genera un nombre de instancia válido basado en el nombre de la sucursal
   */
  generateInstanceName(branchName: string, companyPrefix: string = 'ROMERO'): string {
    // Limpiar el nombre: mayúsculas, sin espacios, sin caracteres especiales
    const cleanName = branchName
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^A-Z0-9]/g, '_')      // Reemplazar caracteres especiales por _
      .replace(/_+/g, '_')             // Evitar múltiples _
      .replace(/^_|_$/g, '');          // Quitar _ al inicio y final
    
    return `${companyPrefix}_${cleanName}`;
  }
}

export const whatsappConfigService = new WhatsAppConfigService();
