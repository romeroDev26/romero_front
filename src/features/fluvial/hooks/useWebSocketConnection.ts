// src/features/fluvial/hooks/useWebSocketConnection.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { ConnectionStatus, WebSocketConfig, SeatUpdateMessage } from '../types/websocket.types';

interface UseWebSocketConnectionReturn {
  connectionStatus: ConnectionStatus;
  isWebSocketAvailable: boolean;
  reconnectAttempts: number;
  sendMessage: (message: any) => boolean;
  forceReconnect: () => void;
  pingConnection: () => void;
  testConnection: (testUrl?: string) => void;
}

export const useWebSocketConnection = (
  config: WebSocketConfig,
  onMessage: (message: SeatUpdateMessage) => void
): UseWebSocketConnectionReturn => {
  const { tripId, userId, userName, enabled = true, maxReconnectAttempts = 3 } = config;
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isWebSocketAvailable, setIsWebSocketAvailable] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!enabled || !tripId || !isWebSocketAvailable) return;
    
    // Limpiar conexiones previas
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Reconnecting');
      }
      wsRef.current = null;
    }

    try {
      const baseUrl = import.meta.env.VITE_WS_URL || 'wss://romeroapi-production.up.railway.app';
      const wsUrl = `${baseUrl}/api/v1/ws/seats/${tripId}?user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      setConnectionStatus('connecting');

      ws.onopen = () => {
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        
        const connectMessage = { type: 'CONNECT' };
        ws.send(JSON.stringify(connectMessage));
      };

      ws.onmessage = (event) => {
        try {
          const message: SeatUpdateMessage = JSON.parse(event.data);
          console.log('📥 MENSAJE DEL BACKEND:', JSON.stringify(message, null, 2));
          onMessage(message);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        
        if (enabled && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts && isWebSocketAvailable) {
          const nextAttempt = reconnectAttempts + 1;
          const delay = event.code === 1005 
            ? Math.min(1000 * nextAttempt, 5000) 
            : Math.min(3000 * nextAttempt, 15000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(nextAttempt);
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionStatus('failed');
          setIsWebSocketAvailable(false);
        }
      };

      ws.onerror = () => {
        // Error handling se maneja en onclose
      };

    } catch (error) {
      setConnectionStatus('disconnected');
      
      if (reconnectAttempts < maxReconnectAttempts && isWebSocketAvailable) {
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
        }, 3000 * (reconnectAttempts + 1));
      } else if (reconnectAttempts >= maxReconnectAttempts) {
        setConnectionStatus('failed');
        setIsWebSocketAvailable(false);
      }
    }
  }, [tripId, userId, userName, enabled, maxReconnectAttempts, isWebSocketAvailable, reconnectAttempts, onMessage]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isWebSocketAvailable) {
      console.log('📡 ENVIANDO AL BACKEND:', JSON.stringify(message, null, 2));
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.error('❌ No se puede enviar mensaje - WebSocket no disponible:', {
        readyState: wsRef.current?.readyState,
        isWebSocketAvailable,
        message
      });
    }
    return false;
  }, [isWebSocketAvailable]);

  const forceReconnect = useCallback(() => {
    setReconnectAttempts(0);
    setIsWebSocketAvailable(true);
    setConnectionStatus('disconnected');
    connectWebSocket();
  }, [connectWebSocket]);

  const pingConnection = useCallback(() => {
    sendMessage({ type: 'PING' });
  }, [sendMessage]);

  const testConnection = useCallback((testUrl?: string) => {
    const url = testUrl || `${import.meta.env.VITE_WS_URL || 'wss://romeroapi-production.up.railway.app'}/api/v1/ws/seats/${tripId}?user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
    
    const testWs = new WebSocket(url);
    const timeout = setTimeout(() => testWs.close(), 10000);
    
    testWs.onopen = () => {
      clearTimeout(timeout);
      testWs.close();
    };
    
    testWs.onerror = () => clearTimeout(timeout);
    testWs.onclose = () => clearTimeout(timeout);
  }, [tripId, userId, userName]);

  // Conectar al montar
  useEffect(() => {
    if (enabled && tripId && userId && userName) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [enabled, tripId, userId, userName]);

  return {
    connectionStatus,
    isWebSocketAvailable,
    reconnectAttempts,
    sendMessage,
    forceReconnect,
    pingConnection,
    testConnection
  };
};
