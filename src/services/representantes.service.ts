// src/services/representantes.service.ts
import api from '../config/api';
import { asApiError, detailToString } from '../utils/errorHandler';

// NUEVOS TIPOS SEGÚN ESPECIFICACIÓN BACKEND
export interface CompanyInvoiceWithRepresentatives {
  // Datos de la empresa (OBLIGATORIO)
  company_data: {
    client_doc_type: string; // Siempre "6" para RUC
    client_doc_number: string; // RUC de 11 dígitos
    client_name: string; // Razón social
    client_address?: string;
    client_email?: string;
    client_phone?: string;
  };
  
  // Datos del viaje (OBLIGATORIO)
  trip_id: number;
  boarding_stop_id: number;
  disembarking_stop_id: number;
  
  // Lista de representantes (OBLIGATORIO)
  representatives: Array<{
    passenger_name: string;
    passenger_doc_type: string; // "1"=DNI, "4"=CE, "6"=RUC, "7"=Pasaporte
    passenger_doc_number: string;
    passenger_phone?: string;
    passenger_email?: string; // ← AGREGADO: Campo email
    seat_number?: string; // "Elección libre" o número específico
    item_description?: string; // ← NUEVO: Texto libre (máx. 453; backend concatena servicio fijo, total SUNAT 500)
    special_notes?: string; // ← AGREGADO: Campo notas especiales
    trip_seat_id?: number; // ← NUEVO: ID del asiento en la embarcación
    infants?: Array<{
      full_name: string;
      birth_date: string; // YYYY-MM-DD
      gender: 'M' | 'F';
      relationship: string;
      document_number?: string;
    }>;
  }>;
  
  // ← NUEVO: Configuración opcional de factura
  invoice_config?: {
    document_type_code?: string; // "01"=Factura, "03"=Boleta
    operation_type_code?: string; // "0101"=Venta interna
    currency_code?: string; // "PEN", "USD", "EUR"
    exchange_rate?: number | null; // ← CORREGIDO: Número o null
    issue_time?: string; // HH:MM:SS
    payment_terms_description?: string; // Términos de pago
    due_date?: string | null; // ← CORREGIDO: String o null
    detraccion_code?: string | null; // ← CORREGIDO: String o null
    detraccion_percentage?: number | null; // ← CORREGIDO: Número o null
    // ← NUEVOS CAMPOS DE PAGO
    payment_method_code?: string; // Código interno: EFE, TRF, YAP, PLN, TDB, TCR, DEP, OTR
    payment_operation_code?: string; // Código de operación (hasta 50 caracteres)
  };
  
  // Serie de documento (opcional, requerida para Facturas)
  series?: string;

  // ← ACTUALIZADO: Configuración de items como array
  items_config?: Array<{
    product_id: number; // ← CLAVE: ID del producto/servicio
    quantity: number; // Cantidad
    unit_price: number; // Precio unitario
    discount?: number; // Descuento
    tax_category_code: string; // "10"=Gravado, "20"=Exonerado, "30"=Inafecto
    item_description: string; // Descripción del servicio
    unit_code: string; // "NIU"=Unidad, "ZZ"=Servicio, "KGM"=Kilogramo
    // Campos para asientos
    trip_seat_id?: number; // ID del asiento en la embarcación
    seat_number?: string; // Número del asiento seleccionado por el vendedor
  }>;
  
  // Configuración adicional (OPCIONAL)
  special_notes?: string; // Máximo 500 caracteres
}

export interface CompanyInvoiceResponse {
  invoice: {
    id: number;
    series: string;
    number: string;
    document_type_code: string;
    client_name: string;
    total_amount: number;
    created_at: string;
    items?: Array<{
      id: number;
      product_id: number;
      quantity: number;
      unit_price: number;
      // ... otros campos
    }>;
  };
  representatives: Array<{
    id: number;
    passenger_name: string;
    passenger_doc_type: string;
    passenger_doc_number: string;
    seat_number?: string;
    boarding_stop_id?: number;
    disembarking_stop_id?: number;
    special_notes?: string;
    // ... otros campos de representante
  }>;
  summary: {
    total_capacity: number;
    used_capacity: number;
    remaining_capacity: number;
    is_complete: boolean;
  };
}

//  TIPO PARA REPRESENTANTE INDIVIDUAL (para UI)
export interface Representative {
  passenger_name: string;
  passenger_doc_type: string;
  passenger_doc_number: string;
  passenger_phone?: string;
  passenger_email?: string;
  seat_number?: string;
  special_notes?: string;
  trip_seat_id?: number; // ← NUEVO: ID del asiento en la embarcación
}

class RepresentantesService {
  //  NUEVO: Endpoint único según especificación backend
  async createCompanyInvoiceWithRepresentatives(
    data: CompanyInvoiceWithRepresentatives
  ): Promise<CompanyInvoiceResponse> {
    try {
      // ← CORREGIDO: Endpoint con prefijo /sunat según especificación
      const response = await api.post('/sunat/invoices/company-with-representatives-extended', data);
      return response.data;
    } catch (error) {
      const apiError = asApiError(error);
      // Manejar errores específicos según la especificación
      if (apiError.response?.status === 400) {
        throw new Error(detailToString(apiError.response.data?.detail) || 'Error de validación');
      } else if (apiError.response?.status === 404) {
        throw new Error('Viaje o paradas no encontradas');
      } else if (apiError.response?.status === 422) {
        throw new Error('Error de datos: ' + detailToString(apiError.response.data?.detail));
      } else if (apiError.response?.status === 500) {
        throw new Error('Error interno del servidor');
      }
      throw error;
    }
  }
}

export const representantesService = new RepresentantesService();

// UTILIDAD: Manejo de errores según especificación
export const handleApiError = (error: any) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  
  switch (status) {
    case 400:
      // Errores de validación
      if (detail?.includes('RUC inválido')) {
        return 'El RUC ingresado no es válido. Verifique el número.';
      } else if (detail?.includes('Documento inválido')) {
        return 'Uno o más documentos de representantes son inválidos.';
      } else if (detail?.includes('duplicado')) {
        return 'No se permiten documentos duplicados en la misma factura.';
      } else if (detail?.includes('Capacidad insuficiente')) {
        return detail; // Mostrar mensaje específico de capacidad
      }
      return `Error de validación: ${detail}`;
      
    case 404:
      if (detail?.includes('Viaje no encontrado')) {
        return 'El viaje seleccionado no existe o está inactivo.';
      } else if (detail?.includes('Parada')) {
        return 'Una o más paradas seleccionadas no son válidas.';
      }
      return 'Recurso no encontrado.';
      
    case 422:
      return `Error de datos: ${detail}`;
      
    case 500:
      return 'Error interno del servidor. Intente nuevamente en unos momentos.';
      
    default:
      return 'Error inesperado. Contacte al soporte técnico.';
  }
};
