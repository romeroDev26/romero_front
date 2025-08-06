// PRUEBA RÁPIDA DEL SISTEMA DE UPLOAD AUTOMÁTICO
// Este archivo es solo para testing - no incluir en producción

import { filesService } from '../services/files.service';

/**
 * Función de prueba para verificar el endpoint de upload
 * Ejecutar en la consola del navegador cuando esté en una venta
 */
export const testUploadEndpoint = async () => {
  try {
    // Crear un PDF de prueba simple
    const testPdf = new Blob(['%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'], { 
      type: 'application/pdf' 
    });
    
    // ID de factura de prueba (cambiar por uno real)
    const testInvoiceId = 123;
    
    console.log('🧪 Iniciando prueba de upload...');
    
    const result = await filesService.uploadInvoiceFile(
      testPdf, 
      testInvoiceId, 
      'pdf_ticket'
    );
    
    console.log('✅ Upload exitoso:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en upload:', error);
    throw error;
  }
};

/**
 * Instrucciones para probar en desarrollo:
 * 
 * 1. Abrir DevTools (F12)
 * 2. Ir a Console
 * 3. Importar esta función:
 *    import { testUploadEndpoint } from './path/to/this/file';
 * 4. Ejecutar:
 *    testUploadEndpoint();
 * 5. Verificar la respuesta en la consola
 * 
 * Para probar con una venta real:
 * 1. Completar una venta normal
 * 2. En el TicketPreviewModal, verificar que aparezca:
 *    "✅ Ticket almacenado en el servidor: [URL]"
 * 3. Verificar en la consola del navegador los logs:
 *    "✅ Ticket PDF subido exitosamente: [URL]"
 */
