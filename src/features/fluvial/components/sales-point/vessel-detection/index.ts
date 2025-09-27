/**
 * Barrel export para el módulo de detección de embarcaciones
 */

export { VesselDetectionService } from './vesselDetectionService';
export { useVesselDetection } from './useVesselDetection';
export { vesselDetectionConfig } from './config';
export type { 
  VesselDetectionResult, 
  VesselKeywords, 
  KnownVessel, 
  VesselDetectionConfig 
} from './types';