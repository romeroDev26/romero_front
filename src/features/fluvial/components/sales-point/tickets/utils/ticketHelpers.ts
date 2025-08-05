// src/features/fluvial/components/sales-point/tickets/utils/ticketHelpers.ts

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Funciones de ayuda para formateo y transformación de datos del ticket
 * Actualizado para la nueva estructura propuesta
 */

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
    console.error('Error formateando fecha de emisión:', error);
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
 */
export function formatTripDate(tripDepartureTime: string): string {
  try {
    const date = parseISO(tripDepartureTime);
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    console.error('Error formateando fecha de viaje:', error);
    return 'N/A';
  }
}

/**
 * Formatea la hora de viaje desde trip_departure_time  
 */
export function formatTripTime(tripDepartureTime: string): string {
  try {
    const date = parseISO(tripDepartureTime);
    return format(date, 'h:mm a', { locale: es }).toUpperCase();
  } catch (error) {
    console.error('Error formateando hora de viaje:', error);
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
    console.error('Error formateando hora de embarque:', error);
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
 * Detecta si la venta corresponde a una embarcación sin asientos
 * Basándose en trip_seat_id null y descripción con "elección libre"
 */
export function isVesselWithoutSeats(items: any[]): boolean {
  return items.some(item => 
    item.trip_id && 
    (item.trip_seat_id === null || item.trip_seat_id === undefined) &&
    item.item_description && 
    item.item_description.toLowerCase().includes('elección libre')
  );
}
