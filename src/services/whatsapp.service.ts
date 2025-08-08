// src/services/whatsapp.service.ts
import api from '../config/api';

export interface WhatsAppSendDocumentRequest {
  number: string;
  caption: string;
  media: string;
  fileName: string;
  mimetype?: string;
  instance_name?: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class WhatsAppService {
  /**
   * Envía un documento PDF por WhatsApp
   * @param phoneNumber Número de teléfono con código de país (ej: 51987654321)
   * @param pdfBase64 Contenido del PDF en formato base64
   * @param fileName Nombre del archivo PDF
   * @param customMessage Mensaje personalizado (opcional)
   */
  async sendDocument({
    phoneNumber,
    pdfBase64,
    fileName,
    customMessage,
  }: {
    phoneNumber: string;
    pdfBase64: string;
    fileName: string;
    customMessage?: string;
  }): Promise<WhatsAppSendResponse> {
    try {
      const defaultMessage = `¡Hola!

Nos alegra mucho que hayas decidido confiar en nosotros.
Adjuntamos a continuación tu comprobante electrónico correspondiente.

Gracias por tu preferencia.
Atentamente,
El equipo de GLOBAL ROMERO S.A.C.`;

      const requestData: WhatsAppSendDocumentRequest = {
        number: this.formatPhoneNumber(phoneNumber),
        caption: customMessage || defaultMessage,
        media: pdfBase64,
        fileName: fileName,
        mimetype: 'application/pdf',
        instance_name: 'romero_ventas'
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
