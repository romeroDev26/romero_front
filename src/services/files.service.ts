// src/services/files.service.ts

import api from '../config/api';

export interface UploadInvoiceFileResponse {
  message: string;
  file_url: string;
  invoice: {
    id: number;
    series: string;
    number: number;
    // Otros campos de la factura actualizados
  };
}

export type FileType = 'pdf_a4' | 'pdf_ticket' | 'xml' | 'zip' | 'cdr';

class FilesService {
  private readonly basePath = '/files/';

  /**
   * Sube un archivo de factura al sistema de almacenamiento
   * @param file - El archivo a subir (Blob o File)
   * @param invoiceId - ID de la factura a la que asociar el archivo
   * @param fileType - Tipo de archivo según SUNAT
   * @returns Respuesta con la URL del archivo y datos de la factura actualizada
   */
  async uploadInvoiceFile(
    file: Blob | File,
    invoiceId: number,
    fileType: FileType
  ): Promise<UploadInvoiceFileResponse> {
    const formData = new FormData();
    
    // Si es un Blob, lo convertimos a File para darle un nombre apropiado
    if (file instanceof Blob && !(file instanceof File)) {
      const fileName = this.generateFileName(fileType, invoiceId);
      const fileObject = new File([file], fileName, { type: 'application/pdf' });
      formData.append('file', fileObject);
    } else {
      formData.append('file', file);
    }
    
    formData.append('invoice_id', invoiceId.toString());
    formData.append('file_type', fileType);

    const response = await api.post<UploadInvoiceFileResponse>(
      `${this.basePath}upload-invoice-file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Genera un nombre de archivo apropiado basado en el tipo y la factura
   */
  private generateFileName(fileType: FileType, invoiceId: number): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
    
    switch (fileType) {
      case 'pdf_a4':
        return `factura_${invoiceId}_a4_${timestamp}.pdf`;
      case 'pdf_ticket':
        return `ticket_${invoiceId}_${timestamp}.pdf`;
      case 'xml':
        return `factura_${invoiceId}_${timestamp}.xml`;
      case 'zip':
        return `factura_${invoiceId}_${timestamp}.zip`;
      case 'cdr':
        return `cdr_${invoiceId}_${timestamp}.xml`;
      default:
        return `archivo_${invoiceId}_${timestamp}.pdf`;
    }
  }
}

export const filesService = new FilesService();
