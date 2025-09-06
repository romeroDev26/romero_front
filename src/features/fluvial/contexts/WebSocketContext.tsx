// src/features/fluvial/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useCallback, useMemo, useRef } from 'react';
import { useWebSocketConnection } from '../hooks/useWebSocketConnection';
import { WebSocketConfig, SeatUpdateMessage, ConnectionStatus } from '../types/websocket.types';

interface WebSocketContextValue {
  connectionStatus: ConnectionStatus;
  isWebSocketAvailable: boolean;
  reconnectAttempts: number;
  latency: number;
  heartbeatInterval: number;
  sendMessage: (message: any) => boolean;
  forceReconnect: () => void;
  pingConnection: () => void;
  testConnection: (testUrl?: string) => void;
  subscribe: (id: string, callback: (message: SeatUpdateMessage) => void) => () => void;
  unsubscribe: (id: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  config: WebSocketConfig;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, config }) => {
  // Mapa de suscriptores para evitar re-renders innecesarios
  const subscribersRef = useRef<Map<string, (message: SeatUpdateMessage) => void>>(new Map());
  
  // Handler centralizado que distribuye mensajes solo a suscriptores relevantes
  const messageHandler = useCallback((message: SeatUpdateMessage) => {
    // Filtrar suscriptores basado en el tipo de mensaje o criterios específicos
    subscribersRef.current.forEach((callback, id) => {
      try {
        // Aquí se puede implementar lógica de filtrado más sofisticada
        // Por ejemplo, solo enviar actualizaciones de asientos específicos
        callback(message);
      } catch (error) {
        console.error(`Error in subscriber ${id}:`, error);
      }
    });
  }, []);
  
  const connection = useWebSocketConnection(config, messageHandler);
  
  // Funciones de suscripción memoizadas
  const subscribe = useCallback((id: string, callback: (message: SeatUpdateMessage) => void) => {
    subscribersRef.current.set(id, callback);
    
    // Retornar función de cleanup
    return () => {
      subscribersRef.current.delete(id);
    };
  }, []);
  
  const unsubscribe = useCallback((id: string) => {
    subscribersRef.current.delete(id);
  }, []);
  
  // Valor del contexto memoizado para evitar re-renders
  const contextValue = useMemo(() => ({
    ...connection,
    subscribe,
    unsubscribe
  }), [
    connection.connectionStatus,
    connection.isWebSocketAvailable,
    connection.reconnectAttempts,
    connection.latency,
    connection.heartbeatInterval,
    connection.sendMessage,
    connection.forceReconnect,
    connection.pingConnection,
    connection.testConnection,
    subscribe,
    unsubscribe
  ]);
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook personalizado para usar el contexto WebSocket
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Hook especializado para suscribirse a actualizaciones específicas
export const useWebSocketSubscription = (
  subscriberId: string,
  callback: (message: SeatUpdateMessage) => void,
  dependencies: any[] = []
) => {
  const { subscribe } = useWebSocket();
  
  React.useEffect(() => {
    const unsubscribe = subscribe(subscriberId, callback);
    return unsubscribe;
  }, [subscribe, subscriberId, ...dependencies]);
};

// Hook para obtener solo el estado de conexión (sin suscribirse a mensajes)
export const useWebSocketStatus = () => {
  const { connectionStatus, isWebSocketAvailable, reconnectAttempts, latency } = useWebSocket();
  
  return useMemo(() => ({
    connectionStatus,
    isWebSocketAvailable,
    reconnectAttempts,
    latency
  }), [connectionStatus, isWebSocketAvailable, reconnectAttempts, latency]);
};

// Hook para operaciones de conexión (sin estado)
export const useWebSocketActions = () => {
  const { sendMessage, forceReconnect, pingConnection, testConnection } = useWebSocket();
  
  return useMemo(() => ({
    sendMessage,
    forceReconnect,
    pingConnection,
    testConnection
  }), [sendMessage, forceReconnect, pingConnection, testConnection]);
};