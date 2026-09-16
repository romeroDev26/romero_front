import axios from 'axios';
import api from '../config/api';
import { Invoice } from '../types';
import { pdfTasksService, GeneratePdfResponse } from './pdfTasks.service';

/** GET a URLs públicas (CDN) sin cabecera Authorization: evita preflight/CORS innecesarios del cliente `api`. */
const publicCdnClient = axios.create({
  timeout: 120_000,
});

function parseContentDispositionFilename(header: string | undefined): string | undefined {
  if (!header || typeof header !== 'string') return undefined;
  const utf8 = /filename\*=UTF-8''([^;\s]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].replace(/^["']|["']$/g, ''));
    } catch {
      return utf8[1];
    }
  }
  const plain = /filename\s*=\s*("?)([^";\r\n]+)\1/i.exec(header);
  return plain?.[2]?.trim();
}

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
  // Campos de pago principal
  payment_method_code?: string; // Codigo interno: EFE, TRF, YAP, PLN, TDB, TCR, DEP, OTR
  payment_operation_code?: string; // Codigo de operacion (hasta 50 caracteres)
  // Campos para pago dividido
  payment_amount_1?: number; // Monto del primer pago
  payment_method_code_2?: string; // Codigo del segundo metodo de pago
  payment_operation_code_2?: string; // Codigo de operacion del segundo pago
  payment_amount_2?: number; // Monto del segundo pago
  pago_yape_id?: string;
  // Campo para contraentrega
  is_credit_sale?: boolean;
}

// Interfaz para actualizar métodos de pago de una factura ya emitida.
// Solo control interno: no regenera vouchers ni toca SUNAT.
export interface PaymentMethodUpdate {
  method: string;
  amount: number;
  operation_number?: string | null;
}

export interface UpdatePaymentMethodsPayload {
  payment_methods: PaymentMethodUpdate[];
}

// Esta interfaz define la forma de un ítem de factura que viene del backend
// cuando lo pedimos para una guía de remisión.
export interface ItemForGuide {
  invoice_item_id: number;
  item_description: string;
  quantity: string;
  unit_code: string;
  service_category: string;
  source_invoice_number: string;
  source_invoice_id: number;
  client_name: string;
  client_doc_number: string;
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

  /**
   * Actualiza los métodos de pago de una factura ya emitida.
   * Solo control interno: no regenera vouchers ni afecta SUNAT.
   * Endpoint: PATCH /api/v1/sunat/invoices/{invoice_id}/payment-methods
   */
  async updatePaymentMethods(invoiceId: number, payload: UpdatePaymentMethodsPayload): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`${this.basePath}${invoiceId}/payment-methods`, payload);
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

  /**
   * Genera y obtiene el PDF de una factura desde el backend.
   * Maneja la respuesta inteligente del backend:
   * - status: "completed" → URL disponible de inmediato
   * - status: "uploading" → hace polling hasta obtener la URL (máx. 30s)
   * @returns URL del PDF generado en el CDN
   */
  async generatePdf(
    invoiceId: number,
    size: '80mm' | '58mm' | 'a4' | '100x100' = '80mm',
    force: boolean = false,
  ): Promise<string> {
    const response = await api.post<GeneratePdfResponse>(
      `${this.basePath}${invoiceId}/generate-pdf`,
      null,
      {
        // force=true se envía siempre que el caller lo pida O cuando el tamaño es 100x100
        params: { size, ...((force || size === '100x100') ? { force: true } : {}) }
      }
    );

    const data = response.data;

    // Respuesta rápida: Bunny terminó dentro del tiempo de espera del backend
    if (data.status === 'completed' && data.url) {
      return data.url;
    }

    // Respuesta lenta: Bunny aún está procesando → hacer polling desde frontend
    if (data.task_id) {
      const url = await pdfTasksService.pollForUrl(data.task_id);
      if (url) return url;
    }

    // Fallback: obtener la URL directamente desde la invoice actualizada
    const updatedInvoice = await this.getById(invoiceId);
    let fallbackUrl: string | null | undefined;
    switch (size) {
      case '80mm':    fallbackUrl = updatedInvoice.pdf_ticket_file_path; break;
      case '58mm':    fallbackUrl = updatedInvoice.pdf_ticket58_file_path; break;
      case 'a4':      fallbackUrl = updatedInvoice.pdf_a4_file_path; break;
      case '100x100': fallbackUrl = updatedInvoice.pdf_sticker_100x100_file_path; break;
    }
    if (fallbackUrl) return fallbackUrl;

    throw new Error(`No se pudo obtener la URL del PDF ${size} para la factura ${invoiceId}`);
  }

  /**
   * Genera el sticker de encomienda 100x100mm y retorna la URL del PDF.
   * Maneja la respuesta inteligente (completed vs uploading + polling).
   */
  async generateSticker100x100(invoiceId: number): Promise<string> {
    // Reutiliza generatePdf que ya maneja el polling
    return this.generatePdf(invoiceId, '100x100');
  }

  /**
   * Obtiene el PDF ya generado como Blob para vista previa
   * Primero genera el PDF (si no existe) y luego obtiene la URL desde la invoice
   * Finalmente hace fetch del PDF usando el backend como proxy para evitar CORS
   * @param invoiceId - ID de la factura
   * @param size - Tamaño del PDF para determinar qué PDF obtener
   * @returns Blob del PDF para mostrar/descargar
   */
  async getPdfBlob(invoiceId: number, size: '80mm' | '58mm' | 'a4' | '100x100' = '80mm'): Promise<Blob> {
    // 1. Obtener la invoice actualizada (que debería tener la URL del PDF)
    const invoice = await this.getById(invoiceId);
    
    // 2. Extraer la URL según el tamaño solicitado
    let pdfUrl: string | null | undefined = null;
    
    switch (size) {
      case '80mm':
        pdfUrl = invoice.pdf_ticket_file_path;
        break;
      case '58mm':
        pdfUrl = invoice.pdf_ticket58_file_path;
        break;
      case 'a4':
        pdfUrl = invoice.pdf_a4_file_path;
        break;
      case '100x100':
        pdfUrl = invoice.pdf_sticker_100x100_file_path;
        break;
    }
    
    if (!pdfUrl) {
      throw new Error(`PDF ${size} no está disponible. La URL es null o vacía.`);
    }
    
    // 3. Hacer fetch del PDF a través de un proxy simple usando axios con modo cors
    // Importante: axios manejará mejor el CORS que fetch nativo
    const response = await api.get(pdfUrl, {
      responseType: 'blob',
      // Configurar axios para hacer la petición directamente sin pasar por nuestro backend
      baseURL: '', // Resetear baseURL para usar la URL completa
      headers: {
        'Accept': 'application/pdf'
      }
    });
    
    return response.data;
  }

  /**
   * Descarga el contenido de un archivo expuesto en CDN (p. ej. XML firmado) como Blob.
   * No usa el cliente `api` para no enviar Bearer al dominio del CDN.
   */
  async getPublicCdnFileBlob(fileUrl: string): Promise<Blob> {
    const response = await publicCdnClient.get<Blob>(fileUrl, {
      responseType: 'blob',
      headers: {
        Accept: 'application/xml, text/xml, application/octet-stream, */*',
      },
    });
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.data;
  }

  /**
   * XML firmado vía API (mismo origen que el panel): evita CORS del CDN en el navegador.
   *
   * Contrato esperado del backend:
   * `GET /sunat/invoices/{invoice_id}/signed-xml` con Bearer → cuerpo XML, idealmente
   * `Content-Type: application/xml` y opcional `Content-Disposition: attachment; filename="....xml"`.
   */
  async fetchSignedXmlBlob(invoiceId: number): Promise<{ blob: Blob; fileNameFromHeader?: string }> {
    const response = await api.get<Blob>(`${this.basePath}${invoiceId}/signed-xml`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/xml, text/xml, */*',
      },
    });
    const cd =
      (response.headers['content-disposition'] as string | undefined) ??
      (response.headers['Content-Disposition'] as string | undefined);
    const fileNameFromHeader = parseContentDispositionFilename(cd);
    return { blob: response.data, fileNameFromHeader };
  }

  /**
   * Genera ambos PDFs (80mm y A4) y retorna sus URLs
   * @param invoiceId - ID de la factura
   * @returns URLs de ambos PDFs generados
   */
  async generateBothPdfs(
    invoiceId: number,
    force: boolean = false,
  ): Promise<{ url80mm: string; urlA4: string }> {
    const [url80mm, urlA4] = await Promise.all([
      this.generatePdf(invoiceId, '80mm', force),
      this.generatePdf(invoiceId, 'a4', force)
    ]);
    
    return { url80mm, urlA4 };
  }
}

export const invoicesService = new InvoicesService();