// src/services/invoices.service.ts

import api from '../config/api';
import { Invoice, InvoiceItem } from '../types';

// Esta interfaz define los datos para CREAR un ítem de factura.
// La hacemos precisa para que coincida con lo que el backend espera.
export interface InvoiceItemCreateData {
  product_id: number;
  quantity: number;
  unit_price: string | number;
  tax_category_code: string;
  item_description?: string;
  unit_code?: string;
  
  // Campo para pasajes (asiento)
  trip_seat_id?: number;

  // Campos para encomiendas
  trip_id?: number;
  recipient_name?: string;
  recipient_doc_type?: string;
  recipient_doc_number?: string;
  recipient_phone?: string;
}

export interface LegendCreateData {
  code: string;
  value: string;
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
  legends?: LegendCreateData[];
}

// Esta interfaz define la forma de un ítem de factura que viene del backend
// cuando lo pedimos para una guía de remisión.
export interface ItemForGuide extends InvoiceItem {
  // Hereda todos los campos de InvoiceItem (id, quantity, product, recipient_name, etc.)
  // y añade los específicos de este endpoint.
  invoice_series: string;
  invoice_number: number;
}


class InvoicesService {
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
}

export const invoicesService = new InvoicesService();