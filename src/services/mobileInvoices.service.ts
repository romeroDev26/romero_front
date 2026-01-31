// src/services/mobileInvoices.service.ts

import api from '../config/api';

/**
 * Interfaz para crear una factura/boleta móvil con soporte de pago dividido
 */
export interface MobileInvoiceCreateData {
  // Datos del cliente (opcional para montos < 700 en boletas)
  client_id?: number | null;
  client_doc_type?: string;
  client_doc_number?: string;
  client_name?: string;
  client_email?: string;
  
  // Datos del comprobante
  document_type_code: string; // "03" = Boleta, "01" = Factura
  series: string;
  
  // Configuración de venta
  is_credit_sale?: boolean;
  total_discount?: number;
  notes?: string;
  
  // Método de pago principal
  payment_method_code?: string; // EFE, TRF, YAP, PLN, DEP, OTR
  payment_operation_code?: string;
  payment_amount_1?: number;
  
  // Segundo método de pago (para pago dividido)
  payment_method_code_2?: string;
  payment_operation_code_2?: string;
  payment_amount_2?: number;
  
  // Items de la factura
  items: MobileInvoiceItem[];
}

/**
 * Interfaz para un ítem de factura móvil
 */
export interface MobileInvoiceItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  unit_code?: string;
  tax_category_code: string; // "10" = Gravado, "20" = Exonerado
  discount?: number;
  item_description?: string;
  
  // Datos opcionales del viaje (no aplica para equipaje extra)
  trip_id?: number;
  trip_seat_id?: number;
  auto_assign_seat?: boolean;
  
  // Datos opcionales del destinatario
  recipient_name?: string;
  recipient_doc_type?: string;
  recipient_doc_number?: string;
  recipient_phone?: string;
}

/**
 * Respuesta simplificada al crear una factura móvil
 * El backend devuelve solo estos campos, luego debemos obtener los datos completos
 */
export interface MobileInvoiceResponse {
  success: boolean;
  invoice_id: number;
  series: string;
  number: number;
  message: string | null;
}

class MobileInvoicesService {
  private basePath = '/mobile/invoices';

  /**
   * Crea una factura/boleta desde móvil con soporte de pago dividido
   * @param data - Datos de la factura a crear
   * @returns Respuesta con los datos de la factura creada
   */
  async create(data: MobileInvoiceCreateData): Promise<MobileInvoiceResponse> {
    const response = await api.post<MobileInvoiceResponse>(this.basePath, data);
    return response.data;
  }
}

export const mobileInvoicesService = new MobileInvoicesService();
