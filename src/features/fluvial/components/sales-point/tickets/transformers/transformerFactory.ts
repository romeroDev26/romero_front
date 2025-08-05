/**
 * Factory para seleccionar automáticamente el transformador de tickets apropiado
 * 
 * Este factory detecta automáticamente si una embarcación requiere selección de asientos
 * o si permite elección libre, y utiliza el transformador especializado correspondiente.
 * 
 * Transformadores Disponibles:
 * - NormalSaleTransformer: Para embarcaciones con asientos numerados
 * - NoSeatsSaleTransformer: Para embarcaciones con elección libre (sin asientos numerados)
 */

import { BackendInvoiceData } from '../types/backend.types';
import { TicketData } from '../types/ticket.types';
import { NormalSaleTransformer } from './normalSale.transformer';
import { NoSeatsSaleTransformer } from './noSeatsSale.transformer';
import { isVesselWithoutSeats } from '../utils/ticketHelpers';

export class TransformerFactory {
  /**
   * Selecciona automáticamente el transformador apropiado basado en el tipo de embarcación
   * 
   * @param backendData - Datos de la factura del backend
   * @returns TicketData transformado usando el transformador apropiado
   */
  static transform(backendData: BackendInvoiceData): TicketData {
    try {
      // Detectar tipo de embarcación
      const hasNoSeats = isVesselWithoutSeats(backendData.items);
      
      if (hasNoSeats) {
        // Embarcación sin asientos numerados (elección libre)
        console.log('🚢 Detectada embarcación sin asientos - usando NoSeatsSaleTransformer');
        return NoSeatsSaleTransformer.transform(backendData);
      } else {
        // Embarcación con asientos numerados (selección específica)  
        console.log('🚢 Detectada embarcación con asientos - usando NormalSaleTransformer');
        return NormalSaleTransformer.transform(backendData);
      }
    } catch (error) {
      console.error('❌ Error en TransformerFactory:', error);
      
      // Fallback al transformador normal en caso de error
      console.log('🔄 Usando NormalSaleTransformer como fallback');
      return NormalSaleTransformer.transform(backendData);
    }
  }

  /**
   * Determina qué transformador sería utilizado sin ejecutar la transformación
   * Útil para logging, debugging o lógica condicional
   * 
   * @param backendData - Datos de la factura del backend
   * @returns Nombre del transformador que sería utilizado
   */
  static getTransformerType(backendData: BackendInvoiceData): 'NoSeats' | 'Normal' {
    try {
      return isVesselWithoutSeats(backendData.items) ? 'NoSeats' : 'Normal';
    } catch (error) {
      console.error('Error determinando tipo de transformador:', error);
      return 'Normal'; // Fallback
    }
  }

  /**
   * Información sobre los criterios de detección utilizados
   * Útil para debugging y documentación
   */
  static getDetectionCriteria(): string[] {
    return [
      'Categoría del servicio: "OTROS" indica embarcación sin asientos',
      'Respuesta API 204: /seat-map/ sin contenido indica sin mapa de asientos',
      'Función isVesselWithoutSeats(): Implementa la lógica de detección'
    ];
  }
}
