// src/services/whatsapp.service.ts
import api from '../config/api';

export interface WhatsAppSendDocumentRequest {
  number: string;
  caption: string;
  media: string;
  fileName: string;
  mimetype?: string;
  instance_name?: string;
  business_name?: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface WhatsAppSendInvoiceRequest {
  invoice_id: number;
  phone_number: string;
  custom_message?: string;
  pdf_type?: 'a4' | 'ticket' | 'legacy';
  instance_name?: string;
  business_name?: string;
}

export interface WhatsAppSendQuotationRequest {
  quotation_id: number;
  phone_number: string;
  custom_message?: string;
  instance_name?: string;
  business_name?: string;
}

class WhatsAppService {
  /**
   * Envía una cotización por WhatsApp usando el endpoint directo del backend
   * @param quotationId ID de la cotización
   * @param phoneNumber Número de teléfono
   * @param customMessage Mensaje personalizado (opcional)
   * @param instanceName Nombre de la instancia de WhatsApp de la sucursal
   */
  async sendQuotationPdf({
    quotationId,
    phoneNumber,
    customMessage,
    instanceName,
    businessName
  }: {
    quotationId: number;
    phoneNumber: string;
    customMessage?: string;
    instanceName: string;
    businessName?: string;
  }): Promise<WhatsAppSendResponse> {
    try {
      const defaultMessage = `¡Hola!

Nos complace enviarle su cotización correspondiente.
Adjuntamos el documento PDF para su revisión.

Gracias por su confianza.
Atentamente,
${businessName || 'Nuestra Empresa'}`;

      const requestData: WhatsAppSendQuotationRequest = {
        quotation_id: quotationId,
        phone_number: this.formatPhoneNumber(phoneNumber),
        custom_message: customMessage || defaultMessage,
        instance_name: instanceName,
        business_name: businessName
      };

      await api.post('/external/whatsapp/send-quotation-pdf', requestData);
      
      return {
        success: true,
        message: 'Cotización enviada exitosamente por WhatsApp'
      };
    } catch (error: any) {
      console.error('Error enviando cotización por WhatsApp:', error);
      
      return {
        success: false,
        error: error.response?.data?.detail?.[0]?.msg || 
               error.response?.data?.message || 
               error.message || 
               'Error desconocido al enviar cotización'
      };
    }
  }

  /**
   * Envía una factura/boleta por WhatsApp usando el endpoint directo del backend
   * @param invoiceId ID del comprobante
   * @param phoneNumber Número de teléfono con código de país
   * @param customMessage Mensaje personalizado (opcional)
   * @param pdfType Tipo de PDF a enviar
   * @param instanceName Nombre de la instancia de WhatsApp de la sucursal
   */
  async sendInvoicePdf({
    invoiceId,
    phoneNumber,
    customMessage,
    pdfType = 'a4',
    instanceName,
    businessName
  }: {
    invoiceId: number;
    phoneNumber: string;
    customMessage?: string;
    pdfType?: 'a4' | 'ticket' | 'legacy';
    instanceName: string;
    businessName?: string;
  }): Promise<WhatsAppSendResponse> {
    try {
      const defaultMessage = `¡Hola!

Nos alegra mucho que hayas decidido confiar en nosotros.
Adjuntamos a continuación tu comprobante electrónico correspondiente.

Gracias por tu preferencia.
Atentamente,
${businessName || 'Nuestra Empresa'}`;

      const requestData: WhatsAppSendInvoiceRequest = {
        invoice_id: invoiceId,
        phone_number: this.formatPhoneNumber(phoneNumber),
        custom_message: customMessage || defaultMessage,
        pdf_type: pdfType,
        instance_name: instanceName,
        business_name: businessName
      };

      await api.post('/external/whatsapp/send-invoice-pdf', requestData);
      
      return {
        success: true,
        message: 'Comprobante enviado exitosamente por WhatsApp'
      };
    } catch (error: any) {
      console.error('Error enviando comprobante por WhatsApp:', error);
      
      return {
        success: false,
        error: error.response?.data?.detail?.[0]?.msg || 
               error.response?.data?.message || 
               error.message || 
               'Error desconocido al enviar comprobante'
      };
    }
  }

  /**
   * Envía un documento PDF por WhatsApp
   * @param phoneNumber Número de teléfono con código de país (ej: 51987654321)
   * @param pdfBase64 Contenido del PDF en formato base64
   * @param fileName Nombre del archivo PDF
   * @param customMessage Mensaje personalizado (opcional)
   * @param instanceName Nombre de la instancia de WhatsApp de la sucursal
   * @param businessName Nombre de la empresa para el mensaje
   */
  async sendDocument({
    phoneNumber,
    pdfBase64,
    fileName,
    customMessage,
    instanceName,
    businessName
  }: {
    phoneNumber: string;
    pdfBase64: string;
    fileName: string;
    customMessage?: string;
    instanceName: string;
    businessName?: string;
  }): Promise<WhatsAppSendResponse> {
    try {
      const defaultMessage = `¡Hola!

Nos alegra mucho que hayas decidido confiar en nosotros.
Adjuntamos a continuación tu comprobante electrónico correspondiente.

Gracias por tu preferencia.
Atentamente,
El equipo de ${businessName || 'Nuestra Empresa'}`;

      const requestData: WhatsAppSendDocumentRequest = {
        number: this.formatPhoneNumber(phoneNumber),
        caption: customMessage || defaultMessage,
        media: pdfBase64,
        fileName: fileName,
        mimetype: 'application/pdf',
        instance_name: instanceName,
        business_name: businessName
      };

      await api.post<WhatsAppSendResponse>('/external/whatsapp/send-document', requestData);
      
      return {
        success: true,
        message: 'Documento enviado exitosamente por WhatsApp'
      };
    } catch (error: any) {
      console.error('Error enviando documento por WhatsApp:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error desconocido al enviar documento'
      };
    }
  }

  /**
   * Formatea el número de teléfono para asegurar el formato correcto
   * @param phoneNumber Número de teléfono
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remover espacios, guiones y otros caracteres no numéricos excepto el +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si no empieza con + o código de país, asumir Perú (+51)
    if (!formatted.startsWith('+') && !formatted.startsWith('51')) {
      formatted = '51' + formatted;
    }
    
    // Remover el + si existe
    formatted = formatted.replace('+', '');
    
    return formatted;
  }

  /**
   * Convierte un blob PDF a base64
   * @param blob Blob del PDF
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extraer solo la parte base64 (sin el prefijo data:application/pdf;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convierte un documento jsPDF a base64
   * @param doc Documento jsPDF
   */
  pdfDocToBase64(doc: any): string {
    return doc.output('dataurlstring').split(',')[1];
  }
}

export const whatsappService = new WhatsAppService();
