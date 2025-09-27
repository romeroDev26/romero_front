/**
 * Tipos para la detección de embarcaciones sin asientos
 */

export interface VesselDetectionResult {
  hasSeats: boolean;
  method: 'api_204' | 'api_200' | 'known_vessel' | 'name_keywords' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

export interface VesselKeywords {
  withoutSeats: string[];
  withSeats: string[];
}

export interface KnownVessel {
  id: number;
  name: string;
  hasSeats: boolean;
}

export interface VesselDetectionConfig {
  keywords: VesselKeywords;
  knownVessels: KnownVessel[];
}