// src/services/invoices.service.ts

import api from '../config/api';
import { Invoice, InvoiceItem } from '../types';

// Esta interfaz define los datos para CREAR un ítem de factura.
// La hacemos precisa para que coincida con lo que el backend espera.
export interface InvoiceItemCreateData {
  product_id: number;
  quantity: number;
  unit_price: string | number;
  discount?: number; // Campo para descuentos manuales
  tax_category_code: string;
  item_description?: string;
  unit_code?: string;
  
  // Campo para pasajes (asiento)
  trip_seat_id?: number;
  seat_number?: string; // Número del asiento seleccionado por el vendedor

  // Campo para vincular con el viaje (nuevo campo del backend)
  trip_id?: number;

  // Campos para encomiendas y carga
  recipient_name?: string;
  recipient_doc_type?: string;
  recipient_doc_number?: string;
  recipient_phone?: string;
  boarding_trip_stop_id?: number;
  disembarking_trip_stop_id?: number;
}

// Esta interfaz define los datos para CREAR una factura completa.
export interface InvoiceCreateData {
  client_id: number;
  document_type_code: string;
  series: string;
  issue_date: string;
  issue_time: string;
  operation_type_code: string;
  currency_code: string;
  notes?: string;
  items: InvoiceItemCreateData[];
}

// Esta interfaz define la forma de un ítem de factura que viene del backend
// cuando lo pedimos para una guía de remisión.
export interface ItemForGuide extends InvoiceItem {
  // Hereda todos los campos de InvoiceItem (id, quantity, product, recipient_name, etc.)
  // y añade los específicos de este endpoint.
  invoice_series: string;
  invoice_number: number;
}

// Interfaz para los parámetros de filtrado del nuevo endpoint
export interface InvoiceFilters {
  skip?: number;
  limit?: number;
  company_id?: number;
  series?: string;
  number?: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  client_search?: string;
  sunat_status?: 'PENDING' | 'GENERATED' | 'SIGNED' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'OBSERVED' | 'VOIDED' | 'ERROR';
  period?: 'LAST_WEEK' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'LAST_YEAR';
}

class InvoicesService {
  // El path base para facturas es diferente al de notas de crédito y guías
  private readonly basePath = '/sunat/invoices/';

  // Crea una nueva factura.
  async create(data: InvoiceCreateData): Promise<Invoice> {
    const response = await api.post<Invoice>(this.basePath, data);
    return response.data;
  }

  // Obtiene los ítems de encomienda de un viaje que aún no tienen guía.
  async getItemsForGuide(tripId: number): Promise<ItemForGuide[]> {
    const response = await api.get<ItemForGuide[]>(`${this.basePath}items-for-guide`, {
      params: { trip_id: tripId }
    });
    return response.data;
  }

  // ========= INICIO DE LA MODIFICACIÓN =========
  
  // NUEVO MÉTODO: Para obtener una lista filtrable y paginada de facturas
  async getInvoices(filters: InvoiceFilters = {}): Promise<Invoice[]> {
    // Limpiamos los parámetros undefined para no enviarlos
    const cleanParams = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    );
    
    const response = await api.get(this.basePath, {
      params: cleanParams
    });
    
    // Manejar diferentes formatos de respuesta de la API
    if (response.data && response.data.invoices && Array.isArray(response.data.invoices)) {
      return response.data.invoices;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Si no es array, devolver array vacío para evitar errores
    console.warn('Invoices response is not in expected format:', response.data);
    return [];
  }

  // NUEVO MÉTODO: Para obtener una factura por su ID
  async getById(invoiceId: number): Promise<Invoice> {
    const response = await api.get<Invoice>(`${this.basePath}${invoiceId}`);
    return response.data;
  }

  // NUEVO MÉTODO: Para obtener la lista de facturas anulables
  // Usa el mismo endpoint de listado pero filtrado por estado ACCEPTED
  async getVoidableInvoices(companyId: number): Promise<any[]> {
    const response = await api.get<any>(this.basePath, {
      params: { 
        company_id: companyId,
        sunat_status: 'ACCEPTED', // Solo facturas aceptadas por SUNAT
        limit: 100
      }
    });
    // Extraer el array de facturas del formato de respuesta
    return response.data?.invoices || response.data || [];
  }
}

export const invoicesService = new InvoicesService();