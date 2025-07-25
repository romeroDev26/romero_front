// src/utils/validation.ts
export function validateDocument(docType: string, docNumber: string): boolean {
  const cleanNumber = docNumber.trim();
  
  switch (docType) {
    case '1': // DNI
      return /^\d{8}$/.test(cleanNumber);
    case '6': // RUC
      return /^\d{11}$/.test(cleanNumber);
    case '4': // CE
      return cleanNumber.length >= 8 && cleanNumber.length <= 12;
    case '7': // Pasaporte
      return cleanNumber.length >= 6 && cleanNumber.length <= 20;
    default:
      return false;
  }
}

export function getDocumentTypeName(docType: string): string {
  switch (docType) {
    case '1': return 'DNI';
    case '4': return 'C.E.';
    case '6': return 'RUC';
    case '7': return 'Pasaporte';
    default: return 'Desconocido';
  }
}
