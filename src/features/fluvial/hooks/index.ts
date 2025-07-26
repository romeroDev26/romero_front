// src/features/fluvial/hooks/index.ts

// Hook principal refactorizado
export { useSeatMapRealtime } from './useSeatMapRealtime';

// Hooks especializados (para uso individual si es necesario)
export { useWebSocketConnection } from './useWebSocketConnection';
export { useSeatSelections } from './useSeatSelections';
export { usePurchaseTimer } from './usePurchaseTimer';

// Tipos
export type { 
  SeatUpdateMessage, 
  SeatSelection, 
  WebSocketConfig, 
  SeatMapRealtimeOptions,
  ConnectionStatus 
} from '../types/websocket.types';

// Servicios
export { WebSocketMessageHandler } from '../services/websocketMessageHandler';
export { SeatOperations } from '../services/seatOperations';
