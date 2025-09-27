/**
 * Configuración para la detección de embarcaciones sin asientos
 */

import { VesselDetectionConfig } from './types';

export const vesselDetectionConfig: VesselDetectionConfig = {
  keywords: {
    withoutSeats: [
      'colectivo', 'combi', 'bus', 'ómnibus', 'lancha colectiva',
      'barco colectivo', 'embarcación colectiva', 'transporte colectivo',
      'pasajeros', 'sin asientos', 'elección libre', 'libre',
      'común', 'compartido', 'compartida', 
      'turismo', 'excursión', 'excursion', 'viaje grupal',
      'grupo', 'masivo', 'masiva', 'público', 'pública'
    ],
    withSeats: [
      'asientos', 'numerados', 'numerado', 'asiento', 'butaca',
      'silla', 'vip', 'premium', 'ejecutivo', 'primera clase',
      'business', 'turista plus', 'económico plus'
    ]
  },
  knownVessels: [
    // Embarcaciones que NO tienen asientos
    { id: 10, name: 'embarcacion sin asientos', hasSeats: false },
    
    // Embarcaciones que SÍ tienen asientos
    // Agregar aquí embarcaciones específicas conocidas
  ]
};