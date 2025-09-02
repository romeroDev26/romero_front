// src/features/fluvial/components/sales-point/tickets/utils/ticketHelpers.ts

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Funciones de ayuda para formateo y transformación de datos del ticket
 * Detecta si una embarcación no maneja asientos numerados
 * CRITERIOS MEJORADOS:
 * - trip_seat_id es null (no hay asiento asignado)
 * - seat_number es null (no hay número de asiento)
 * - O si hay representantes con "Sin asientos configurados"
 * Basándose en trip_seat_id null y seat_number null
 */
export function isVesselWithoutSeats(items: any[]): boolean {
  // CRITERIO 1: Verificar si todos los items tienen trip_seat_id y seat_number null
  const allItemsHaveNullSeats = items.every(item => 
    (item.trip_seat_id === null || item.trip_seat_id === undefined) &&
    (item.seat_number === null || item.seat_number === undefined)
  );
  
  if (allItemsHaveNullSeats) {
    return true;
  }
  
  // CRITERIO 2: Verificar si item_description contiene "elección libre" (criterio anterior)
  const hasEleccionLibre = items.some(item => 
    item.item_description && 
    item.item_description.toLowerCase().includes('elección libre')
  );
  
  if (hasEleccionLibre) {
    return true;
  }
  
  return false;
}

/**
 * Obtiene la etiqueta del tipo de documento del cliente
 */
export function getDocumentLabel(docType: string): string {
  const docTypeMap: Record<string, string> = {
    '1': 'DNI PASAJERO',
    '4': 'CARNET EXT. PASAJERO', 
    '6': 'RUC',
    '7': 'PASAPORTE PASAJERO',
    '11': 'CÉDULA DIPLOMÁTICA PASAJERO',
    '0': 'OTROS PASAJERO'
  };
  
  return docTypeMap[docType] || 'DOCUMENTO PASAJERO';
}

/**
 * Obtiene el título del documento según el código de tipo
 */
export function getDocumentTitle(documentTypeCode: string): string {
  const titleMap: Record<string, string> = {
    '01': 'FACTURA ELECTRÓNICA',
    '03': 'BOLETA DE VENTA ELECTRÓNICA',
    '07': 'NOTA DE CRÉDITO ELECTRÓNICA',
    '08': 'NOTA DE DÉBITO ELECTRÓNICA'
  };
  
  return titleMap[documentTypeCode] || 'COMPROBANTE ELECTRÓNICO';
}

/**
 * Formatea la fecha y hora de emisión en formato legible
 */
export function formatEmissionDateTime(issueDate: string, issueTime: string): string {
  try {
    const dateTime = parseISO(`${issueDate}T${issueTime}`);
    return format(dateTime, 'dd/MM/yyyy h:mm a', { locale: es }).toUpperCase();
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Obtiene el punto de emisión derivado de la sucursal de venta
 * Por ahora usamos una implementación básica, el backend debería proporcionarlo
 */
// Mejorado: permite pasar un fallback (ej: nombre de sucursal del usuario) y nunca retorna 'IQUITOS' por defecto si no hay nada
export function getEmissionPoint(branchOfficeName: string | null, fallback?: string): string {
  if (branchOfficeName && branchOfficeName.trim() !== '') {
    // Convertir nombre de sucursal a punto de emisión
    const pointMap: Record<string, string> = {
      'NAUTA': 'NAUTA',
      'YURIMAGUAS': 'YURIMAGUAS', 
      'PUCALLPA': 'PUCALLPA',
      'IQUITOS': 'IQUITOS'
    };
    const upperBranch = branchOfficeName.toUpperCase();
    return pointMap[upperBranch] || branchOfficeName;
  }
  if (fallback && fallback.trim() !== '') return fallback;
  return '';
}

/**
 * Convierte array de teléfonos a string único o array según se necesite
 */
export function formatCompanyPhones(phone: string): string[] {
  if (!phone) return [];
  
  // Si ya es múltiple separado por comas
  if (phone.includes(',')) {
    return phone.split(',').map(p => p.trim());
  }
  
  return [phone];
}

/**
 * Extrae información del puerto de origen desde el primer item de servicio principal
 */
export function extractOriginPort(items: any[]): string {
  // Buscar el primer item con boarding_port_name válido
  const mainServiceItem = items.find(item => item.boarding_port_name && item.boarding_port_name.trim() !== '');
  return mainServiceItem?.boarding_port_name || '';
}

/**
 * Extrae información del puerto de destino desde el primer item de servicio principal  
 */
export function extractDestinationPort(items: any[]): string {
  // Buscar el primer item con disembarking_port_name válido
  const mainServiceItem = items.find(item => item.disembarking_port_name && item.disembarking_port_name.trim() !== '');
  return mainServiceItem?.disembarking_port_name || '';
}

/**
 * Extrae el nombre de la embarcación desde el primer item
 */
export function extractVehicleName(items: any[]): string {
  // Primero buscar items con trip_seat_id (embarcaciones con asientos)
  const mainServiceItem = items.find(item => 
    item.trip_seat_id && item.vehicle_name
  );
  
  if (mainServiceItem) {
    return mainServiceItem.vehicle_name;
  }
  
  // Si no hay asientos, buscar por trip_id (embarcaciones sin asientos)
  const transportItem = items.find(item => 
    item.trip_id && item.vehicle_name
  );
  
  return transportItem?.vehicle_name || 'N/A';
}

/**
 * Extrae el número de asiento principal o indica si es elección libre
 */
export function extractMainSeatNumber(items: any[]): string {
  // Buscar el primer item que tenga seat_number válido
  for (const item of items) {
    if (item.seat_number && item.seat_number.trim() !== '') {
      return item.seat_number;
    }
  }
  
  // Si no hay asiento específico, verificar si es una embarcación sin asientos
  // basándose en la descripción del item o si trip_seat_id es null
  const hasTransportService = items.some(item => 
    item.trip_id && (item.trip_seat_id === null || item.trip_seat_id === undefined)
  );
  
  if (hasTransportService) {
    // Verificar si la descripción indica "elección libre"
    const transportItem = items.find(item => 
      item.item_description && 
      item.item_description.toLowerCase().includes('elección libre')
    );
    
    if (transportItem) {
      return 'Elección libre';
    }
  }
  
  return 'N/A';
}

/**
 * Formatea la fecha de viaje desde trip_departure_time
 * CORREGIDO: Si trip_departure_time es solo hora, usar issue_date como fecha base
 */
export function formatTripDate(tripDepartureTime: string, issueDate?: string): string {
  try {
    // Si trip_departure_time es solo hora "HH:MM:SS", usar issue_date o fecha actual
    if (!tripDepartureTime.includes('T') && !tripDepartureTime.includes(' ') && tripDepartureTime.includes(':')) {
      // Es solo hora, usar fecha de emisión o fecha actual
      const dateToUse = issueDate || new Date().toISOString().split('T')[0];
      return format(new Date(dateToUse), 'dd/MM/yyyy', { locale: es });
    } else {
      // Es datetime completo
      const date = parseISO(tripDepartureTime);
      return format(date, 'dd/MM/yyyy', { locale: es });
    }
  } catch (error) {
    // Fallback: usar fecha actual
    return format(new Date(), 'dd/MM/yyyy', { locale: es });
  }
}

/**
 * Formatea la hora de viaje desde trip_departure_time  
 */
export function formatTripTime(tripDepartureTime: string): string {
  try {
    // CORRECCIÓN: Manejar tanto datetime ISO como solo tiempo "HH:MM:SS"
    if (tripDepartureTime.includes('T') || tripDepartureTime.includes(' ')) {
      // Es un datetime completo, usar parseISO
      const date = parseISO(tripDepartureTime);
      return format(date, 'h:mm a', { locale: es }).toUpperCase();
    } else {
      // Es solo tiempo "HH:MM:SS", usar la misma lógica que formatBoardingTime
      const [hours, minutes] = tripDepartureTime.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      
      return `${hour12}:${minutes} ${ampm}`;
    }
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Formatea la hora de embarque desde boarding_time
 */
export function formatBoardingTime(boardingTime: string): string {
  try {
    // boarding_time viene como "22:00:00"
    const [hours, minutes] = boardingTime.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Calcula el subtotal de todos los items usando total_line (valores ya calculados por el backend)
 */
export function calculateSubtotal(items: any[]): number {
  return items.reduce((total, item) => {
    const totalLine = parseFloat(item.total_line) || 0;
    return total + totalLine;
  }, 0);
}

/**
 * Calcula el total de descuentos
 */
export function calculateTotalDiscounts(items: any[]): number {
  return items.reduce((total, item) => {
    const discount = parseFloat(item.discount) || 0;
    return total + discount;
  }, 0);
}

/**
 * Formatea moneda peruana
 */
export function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

/**
 * Detecta si una factura es de encomienda/cargo
 * CRITERIOS MEJORADOS Y MÁS ESPECÍFICOS:
 * - Debe tener recipient_name (información del destinatario) - ES EL CRITERIO MÁS IMPORTANTE
 * - Los items deben tener palabras clave específicas de encomienda en la descripción
 * - Solo unidades específicas de carga (sin 'ZZ' ni 'NIU' que pueden ser de pasajeros)
 * - Verificación estricta para evitar falsos positivos con pasajes
 */
export function isCargoInvoice(invoiceData: any): boolean {
  // CRITERIO 1 (PRINCIPAL): Verificar si algún item tiene recipient_name
  // Este es el criterio más confiable para distinguir encomiendas
  if (invoiceData.items && invoiceData.items.length > 0) {
    const hasRecipientInItems = invoiceData.items.some((item: any) => 
      item.recipient_name && item.recipient_name.trim() !== ''
    );
    
    if (hasRecipientInItems) {
      return true;
    }
  }
  
  // CRITERIO 2: Verificar palabras clave específicas de encomienda en item_description
  // IMPORTANTE: Este criterio debe ser EXPLÍCITO para evitar falsos positivos
  if (invoiceData.items && invoiceData.items.length > 0) {
    const hasCargoKeywords = invoiceData.items.some((item: any) => {
      if (!item.item_description) return false;
      
      const description = item.item_description.toLowerCase();
      return (
        description.includes('encomienda') ||
        description.includes('paquete') ||
        description.includes('envío de carga') ||
        description.includes('servicio de carga') ||
        description.includes('transporte de mercancía') ||
        description.includes('flete')
      );
    });
    
    if (hasCargoKeywords) {
      return true;
    }
  }
  
  // CRITERIO 3: Verificar unidades ESPECÍFICAS de encomienda (sin ZZ ni NIU)
  // Solo unidades que definitivamente NO se usan para pasajeros
  if (invoiceData.items && invoiceData.items.length > 0) {
    const specificCargoUnits = ['PAQ', 'XBX', 'KGM', 'TNE', 'MTR', 'MTQ', 'LTR']; // Removido 'ZZ' y 'NIU'
    const hasSpecificCargoUnits = invoiceData.items.some((item: any) => 
      (item.unit && specificCargoUnits.includes(item.unit)) || 
      (item.unit_code && specificCargoUnits.includes(item.unit_code))
    );
    
    // SOLO si también no tiene información de asientos Y tiene palabras clave de cargo
    if (hasSpecificCargoUnits) {
      const allItemsWithoutSeats = invoiceData.items.every((item: any) => 
        !item.trip_seat_id && !item.seat_number
      );
      
      if (allItemsWithoutSeats) {
        return true;
      }
    }
  }
  
  // CRITERIO 4: Verificar por palabras clave específicas en notas
  if (invoiceData.notes) {
    const notes = invoiceData.notes.toLowerCase();
    const hasCargoNotes = notes.includes('encomienda') || 
                         notes.includes('paquete') || 
                         notes.includes('flete') ||
                         notes.includes('carga') ||
                         notes.includes('mercancía');
    
    if (hasCargoNotes) {
      return true;
    }
  }
  
  // CRITERIO ELIMINADO: El criterio anterior que solo verificaba ausencia de asientos
  // era demasiado amplio y causaba falsos positivos con pasajes sin asientos numerados
  
  return false;
}

/**
 * Construye una descripción limpia del item para el ticket
 * REGLA: Solo mostrar product_name + información adicional del usuario desde saleform
 * Eliminar completamente información de tramo, asiento, destinos, etc.
 */
export function buildCleanItemDescription(item: any): string {
  const productName = item.product_name || 'Servicio';
  const itemDescription = item.item_description || '';
  
  // Si no hay item_description, usar solo product_name
  if (!itemDescription) {
    return productName;
  }
  
  // Para servicios de transporte: buscar información del usuario después del asiento
  if (itemDescription.includes('Servicio de Transporte')) {
    // PATRÓN NUEVO: Buscar información después de ". Asiento: [número] - "
    // Ejemplo: "Servicio de Transporte Fluvial. Tramo: SARAMURO - NAUTA. Asiento: 28 - asdasdasdasdadasdadasd"
    const afterSeatMatch = itemDescription.match(/\.\s*Asiento:\s*\d+\s*-\s*(.+)$/);
    
    if (afterSeatMatch && afterSeatMatch[1].trim()) {
      const userInfo = afterSeatMatch[1].trim();
      
      // Verificar que no sea información del sistema
      const systemInfoPatterns = [
        /^[A-Z\s]+ - [A-Z\s]+$/, // Tramos: "ORIGEN - DESTINO"
        /^[A-Z\s]+$/, // Solo nombres de ciudades/puertos en mayúsculas
        /^Tramo:/i,
        /^Asiento:/i,
        /^Ruta:/i,
      ];
      
      const isSystemInfo = systemInfoPatterns.some(pattern => pattern.test(userInfo));
      
      if (!isSystemInfo && userInfo.length > 2) {
        return `${productName} - ${userInfo}`;
      }
    }
    
    // PATRÓN ANTERIOR: Buscar información después de "- " pero antes de ". Asiento:" (por compatibilidad)
    const beforeSeatMatch = itemDescription.match(/Servicio de Transporte[^-]*-\s*(.+?)\.\s*Asiento:/);
    
    if (beforeSeatMatch && beforeSeatMatch[1].trim()) {
      const additionalInfo = beforeSeatMatch[1].trim();
      
      const systemInfoPatterns = [
        /^[A-Z\s]+ - [A-Z\s]+$/, // Tramos: "ORIGEN - DESTINO"
        /^[A-Z\s]+$/, // Solo nombres de ciudades/puertos en mayúsculas
        /^Tramo:/i,
        /^Asiento:/i,
        /^Ruta:/i,
      ];
      
      const isSystemInfo = systemInfoPatterns.some(pattern => pattern.test(additionalInfo));
      
      if (!isSystemInfo && additionalInfo.length > 2) {
        return `${productName} - ${additionalInfo}`;
      }
    }
    
    // Si no hay información útil del usuario, solo devolver product_name
    return productName;
  }
  
  // Para otros servicios (como Exceso de Equipaje)
  if (itemDescription.includes('Asiento:')) {
    // Extraer información antes del asiento
    const beforeAsiento = itemDescription.split('. Asiento:')[0];
    const lastDashIndex = beforeAsiento.lastIndexOf(' - ');
    if (lastDashIndex !== -1) {
      const additionalInfo = beforeAsiento.substring(lastDashIndex + 3).trim();
      
      // Aplicar los mismos filtros para otros servicios
      const systemInfoPatterns = [
        /^[A-Z\s]+ - [A-Z\s]+$/, // Tramos
        /^[A-Z\s]+$/, // Solo nombres en mayúsculas
      ];
      
      const isSystemInfo = systemInfoPatterns.some(pattern => pattern.test(additionalInfo));
      
      if (!isSystemInfo && additionalInfo.length > 2) {
        return `${productName} - ${additionalInfo}`;
      }
    }
  }
  
  // Para servicios sin asiento, buscar información después del último guión
  const lastDashIndex = itemDescription.lastIndexOf(' - ');
  if (lastDashIndex !== -1) {
    const additionalInfo = itemDescription.substring(lastDashIndex + 3).trim();
    
    // Aplicar filtros
    const systemInfoPatterns = [
      /^[A-Z\s]+ - [A-Z\s]+$/, // Tramos
      /^[A-Z\s]+$/, // Solo nombres en mayúsculas como "NAUTA"
    ];
    
    const isSystemInfo = systemInfoPatterns.some(pattern => pattern.test(additionalInfo));
    
    if (!isSystemInfo && additionalInfo.length > 2) {
      return `${productName} - ${additionalInfo}`;
    }
  }
  
  // Si no hay información adicional válida del usuario, usar solo product_name
  return productName;
}
