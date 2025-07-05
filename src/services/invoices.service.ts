// src/services/invoices.service.ts
import api from '../config/api';
import { Invoice } from '../types'; // Asumiendo que tienes un tipo Invoice

// Interfaz para el payload de creación de la factura
export interface InvoiceItemCreateData {
  product_id: number;
  quantity: number;
  item_description?: string;
  unit_code?: string;
  unit_price: string | number;
  price_type_code?: string;
  discount?: number;
  tax_category_code: string;

  // --- NUEVOS CAMPOS PARA PASAJES ---
  trip_id?: number;
  seat_type_id?: number;
  boarding_stop_id?: number;
  disembarking_stop_id?: number;
  seat_number?: string; // El número de asiento que el cliente eligió
}

export interface LegendCreateData {
  code: string;
  value: string;
}

export interface InvoiceCreateData {
  client_id: number;
  document_type_code: string;
  series: string;
  issue_date: string;
  issue_time: string;
  operation_type_code: string;
  currency_code: string;
  payment_terms_description?: string;
  notes?: string;
  items: InvoiceItemCreateData[];
  legends?: LegendCreateData[];
}

class InvoicesService {
  private readonly basePath = '/sunat/invoices/';

  async create(data: InvoiceCreateData): Promise<Invoice> {
    const response = await api.post<Invoice>(this.basePath, data);
    return response.data;
  }

  // Aquí podrías añadir otros métodos como getList, getById, etc.
}

export const invoicesService = new InvoicesService();
