// src/features/fluvial/types/sunat.types.ts

// Catálogo 06: Tipo de Documento de Identidad
export enum SunatDocType {
  OTROS = '0',
  DNI = '1',
  CARNET_EXTRANJERIA = '4',
  RUC = '6',
  PASAPORTE = '7',
  CEDULA_DIPLOMATICA = 'A',
  // ... puedes añadir los otros si los necesitas
}

// Helper para obtener una lista legible para los <select>
export const DOCUMENT_TYPES = [
  { code: SunatDocType.DNI, name: 'DNI' },
  { code: SunatDocType.RUC, name: 'RUC' },
  { code: SunatDocType.CARNET_EXTRANJERIA, name: 'Carnet de Extranjería' },
  { code: SunatDocType.PASAPORTE, name: 'Pasaporte' },
  { code: SunatDocType.CEDULA_DIPLOMATICA, name: 'Cédula Diplomática' },
  { code: SunatDocType.OTROS, name: 'Otros (Sin RUC)' },
];

// Catálogo 01: Tipo de Comprobante de Pago
export enum SunatInvoiceType {
  FACTURA = '01',
  BOLETA = '03',
  NOTA_CREDITO = '07',
  NOTA_DEBITO = '08',
}

// Catálogo 07: Tipo de Afectación del IGV
export enum SunatTaxCategory {
  GRAVADO = '10',
  EXONERADO = '20',
  INAFECTO = '30',
}

// Catálogo 52: Códigos de Leyendas
export enum SunatLegendCode {
    MONTO_EN_LETRAS = '1000',
    LEYENDA_AMAZONIA_SERVICIOS = '2002', // "SERVICIOS PRESTADOS EN LA AMAZONÍA..."
}