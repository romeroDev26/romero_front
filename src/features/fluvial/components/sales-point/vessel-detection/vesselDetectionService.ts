/**
 * Servicio centralizado para detección de embarcaciones sin asientos
 */

import api from '../../../../../config/api';
import { VesselDetectionResult } from './types';
import { vesselDetectionConfig } from './config';
import { asApiError } from '../../../../../utils/errorHandler';

export class VesselDetectionService {
  
  /**
   * Método principal para detectar si una embarcación tiene asientos
   */
  static async detectVesselType(tripId: number, vesselName?: string): Promise<VesselDetectionResult> {
    try {
      // MÉTODO 1: Consultar API del mapa de asientos
      const apiResult = await this.detectViaAPI(tripId);
      if (apiResult) {
        return apiResult;
      }
    } catch {
      // Error en detección via API, continuar con métodos de respaldo
    }

    // MÉTODO 2: Detección por respaldo usando nombre de embarcación
    if (vesselName) {
      const fallbackResult = this.detectViaFallback(vesselName);
      return fallbackResult;
    }

    // MÉTODO 3: Fallback por defecto (conservador - asume que tiene asientos)
    return {
      hasSeats: true,
      method: 'fallback',
      confidence: 'low'
    };
  }

  /**
   * Detección vía API del mapa de asientos
   */
  private static async detectViaAPI(tripId: number): Promise<VesselDetectionResult | null> {
    try {
      const response = await api.get(`/operations/trips/${tripId}/seat-map`);

      if (response.status === 204) {
        return {
          hasSeats: false,
          method: 'api_204',
          confidence: 'high'
        };
      } else if (response.status === 200) {
        return {
          hasSeats: true,
          method: 'api_200',
          confidence: 'high'
        };
      }
    } catch (error) {
      const apiError = asApiError(error);
      // Si es un error 404 o similar, no es concluyente
      if (apiError.response?.status === 404) {
        throw error; // Reenviar para que se use el fallback
      }
      throw error;
    }

    return null;
  }

  /**
   * Detección por métodos de respaldo (nombre, listas conocidas)
   */
  private static detectViaFallback(vesselName: string): VesselDetectionResult {
    // MÉTODO 2A: Verificar listas conocidas
    const knownResult = this.detectFromKnownVessels(vesselName);
    if (knownResult) {
      return knownResult;
    }

    // MÉTODO 2B: Detección por keywords en el nombre
    const keywordResult = this.detectFromKeywords(vesselName);
    return keywordResult;
  }

  /**
   * Detectar usando lista de embarcaciones conocidas
   */
  private static detectFromKnownVessels(vesselName: string): VesselDetectionResult | null {
    const lowerName = vesselName.toLowerCase();
    
    // Buscar coincidencia exacta por nombre
    const knownVessel = vesselDetectionConfig.knownVessels.find(
      vessel => vessel.name.toLowerCase() === lowerName
    );

    if (knownVessel) {
      return {
        hasSeats: knownVessel.hasSeats,
        method: 'known_vessel',
        confidence: 'high'
      };
    }

    return null;
  }

  /**
   * Detectar usando keywords en el nombre de la embarcación
   */
  private static detectFromKeywords(vesselName: string): VesselDetectionResult {
    const lowerName = vesselName.toLowerCase();
    const { withSeats, withoutSeats } = vesselDetectionConfig.keywords;

    // Primero verificar keywords que indican CON asientos (para evitar falsos positivos)
    const hasSeatsKeywords = withSeats.some(keyword => lowerName.includes(keyword));
    if (hasSeatsKeywords) {
      return {
        hasSeats: true,
        method: 'name_keywords',
        confidence: 'medium'
      };
    }

    // Luego verificar keywords que indican SIN asientos
    const hasNoSeatsKeywords = withoutSeats.some(keyword => lowerName.includes(keyword));
    if (hasNoSeatsKeywords) {
      return {
        hasSeats: false,
        method: 'name_keywords',
        confidence: 'medium'
      };
    }

    // Si no hay keywords claros, asumir conservadoramente que tiene asientos
    return {
      hasSeats: true,
      method: 'fallback',
      confidence: 'low'
    };
  }
}