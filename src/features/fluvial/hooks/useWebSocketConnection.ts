// src/features/fluvial/hooks/useWebSocketConnection.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { ConnectionStatus, WebSocketConfig, SeatUpdateMessage } from '../types/websocket.types';
import { getWebSocketUrl, API_PREFIX } from '../../../config/env';

interface UseWebSocketConnectionReturn {
  connectionStatus: ConnectionStatus;
  isWebSocketAvailable: boolean;
  reconnectAttempts: number;
  sendMessage: (message: any) => boolean;
  forceReconnect: () => void;
  pingConnection: () => void;
  testConnection: (testUrl?: string) => void;
  latency: number;
  heartbeatInterval: number;
}

/**
 * Descarta un WebSocket que ya no vamos a usar (reconexión, cambio de viaje o unmount).
 *
 * - Desengancha los handlers: un socket viejo que cierra tarde ya no debe apagar el
 *   heartbeat ni marcar 'disconnected' sobre la conexión que lo reemplazó.
 * - Si todavía está en CONNECTING, espera al 'open' para cerrar. Cerrar en pleno
 *   handshake es lo que genera el warning "WebSocket is closed before the connection
 *   is established" en la consola.
 */
const discardSocket = (ws: WebSocket | null, code: number, reason: string) => {
  if (!ws) return;

  ws.onopen = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;

  if (ws.readyState === WebSocket.CONNECTING) {
    ws.addEventListener('open', () => ws.close(code, reason), { once: true });
    return;
  }

  if (ws.readyState === WebSocket.OPEN) {
    ws.close(code, reason);
  }
};

export const useWebSocketConnection = (
  config: WebSocketConfig,
  onMessage: (message: SeatUpdateMessage) => void
): UseWebSocketConnectionReturn => {
  const { tripId, userId, userName, enabled = true, maxReconnectAttempts = 5 } = config;
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isWebSocketAvailable, setIsWebSocketAvailable] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0); // Usar ref para evitar dependencias
  const initialStateRequestedRef = useRef<boolean>(false); // Evitar doble REQUEST_INITIAL_STATE
  
  // Sistema de heartbeat optimizado
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPongRef = useRef<number>(Date.now());
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const [heartbeatInterval, setHeartbeatInterval] = useState<number>(30000); // Inicial: 30s

  // Funciones del heartbeat optimizado integradas en connectWebSocket

  const connectWebSocket = useCallback(() => {
    if (!enabled || !tripId || !isWebSocketAvailable) return;
    
    // Limpiar conexiones previas
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    discardSocket(wsRef.current, 1000, 'Reconnecting');
    wsRef.current = null;

    try {
      const baseUrl = getWebSocketUrl();
      const wsUrl = `${baseUrl}${API_PREFIX}/ws/seats/${tripId}?user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      setConnectionStatus('connecting');

      ws.onopen = () => {
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        initialStateRequestedRef.current = false; // Reset flag
        
        // Iniciar heartbeat usando la referencia directa
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        heartbeatIntervalRef.current = setInterval(() => {
           if (wsRef.current?.readyState === WebSocket.OPEN) {
             const pingTime = Date.now();
             wsRef.current.send(JSON.stringify({ type: 'PING', timestamp: pingTime }));
             
             // Timeout más tolerante para detectar conexión perdida
             if (pingTimeoutRef.current) {
               clearTimeout(pingTimeoutRef.current);
             }
             
             pingTimeoutRef.current = setTimeout(() => {
               // Solo cerrar si realmente no hay respuesta y la conexión sigue abierta
               if (wsRef.current?.readyState === WebSocket.OPEN) {
                 const timeSinceLastPong = Date.now() - lastPongRef.current;
                 // Solo cerrar si han pasado más de 20 segundos sin PONG
                 if (timeSinceLastPong > 20000) {
                   wsRef.current.close(1001, 'Ping timeout');
                 }
               }
             }, 15000); // Timeout aumentado a 15 segundos
           }
         }, heartbeatIntervalRef.current ? 30000 : 30000); // Usar valor fijo inicialmente
        
        const connectMessage = { type: 'CONNECT' };
        ws.send(JSON.stringify(connectMessage));
        
        // Solicitar estado inicial (OPTIMIZADO: Evitar duplicados con flag de control)
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN && !initialStateRequestedRef.current) {
            initialStateRequestedRef.current = true;
            const initialStateMessage = { type: 'REQUEST_INITIAL_STATE' };
            ws.send(JSON.stringify(initialStateMessage));
          }
        }, 500);
      };

      ws.onmessage = (event) => {
        try {
          const message: SeatUpdateMessage = JSON.parse(event.data);
          
          // Manejar PONG para heartbeat
            if (message.type === 'PONG') {
              if (pingTimeoutRef.current) {
                clearTimeout(pingTimeoutRef.current);
                pingTimeoutRef.current = null;
              }
              
              if (message.timestamp && typeof message.timestamp === 'number') {
                const currentLatency = Math.max(0, Date.now() - message.timestamp);
                
                // Validar que la latencia sea razonable (menos de 30 segundos)
                if (currentLatency < 30000) {
                  setLatency(currentLatency);
                  
                  // Ajustar intervalo de heartbeat basado en latencia para optimizar
                   const newInterval = currentLatency < 100 ? 45000 : // Baja latencia: 45s
                                      currentLatency < 500 ? 35000 : // Media latencia: 35s
                                      25000; // Alta latencia: 25s
                   
                   if (newInterval !== heartbeatInterval) {
                     setHeartbeatInterval(newInterval);
                     
                     // Reiniciar heartbeat con nuevo intervalo usando referencia
                     if (heartbeatIntervalRef.current) {
                       clearInterval(heartbeatIntervalRef.current);
                       
                       heartbeatIntervalRef.current = setInterval(() => {
                         if (wsRef.current?.readyState === WebSocket.OPEN) {
                           const pingTime = Date.now();
                           wsRef.current.send(JSON.stringify({ type: 'PING', timestamp: pingTime }));
                           
                           if (pingTimeoutRef.current) {
                             clearTimeout(pingTimeoutRef.current);
                           }
                           
                           pingTimeoutRef.current = setTimeout(() => {
                             if (wsRef.current?.readyState === WebSocket.OPEN) {
                               const timeSinceLastPong = Date.now() - lastPongRef.current;
                               if (timeSinceLastPong > 20000) {
                                 wsRef.current.close(1001, 'Ping timeout');
                               }
                             }
                           }, 15000);
                         }
                       }, newInterval);
                     }
                   }
                 }
               }
              
              lastPongRef.current = Date.now();
              return;
            }
          
          onMessage(message);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        
        // Detener heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }
        
        // Solo reconectar si no fue un cierre intencional y no hemos excedido los intentos
        if (enabled && event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts && isWebSocketAvailable) {
          const nextAttempt = reconnectAttemptsRef.current + 1;
          const delay = event.code === 1005 
            ? Math.min(1000 * nextAttempt, 5000) 
            : Math.min(3000 * nextAttempt, 15000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current = nextAttempt;
            setReconnectAttempts(nextAttempt);
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionStatus('failed');
          setIsWebSocketAvailable(false);
        }
      };

      ws.onerror = () => {
        // Error handling se maneja en onclose
      };

    } catch {
      setConnectionStatus('disconnected');
      
      if (reconnectAttemptsRef.current < maxReconnectAttempts && isWebSocketAvailable) {
        setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          setReconnectAttempts(reconnectAttemptsRef.current);
          connectWebSocket();
        }, 3000 * (reconnectAttemptsRef.current + 1));
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        setConnectionStatus('failed');
        setIsWebSocketAvailable(false);
      }
    }
  }, [tripId, userId, userName, enabled, maxReconnectAttempts, isWebSocketAvailable]); // Removida heartbeatInterval

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isWebSocketAvailable) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [isWebSocketAvailable]);

  const forceReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
    setIsWebSocketAvailable(true);
    setConnectionStatus('disconnected');
    
    // Limpiar timeouts existentes
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Llamar connectWebSocket directamente
    setTimeout(() => connectWebSocket(), 100);
  }, [connectWebSocket]);



  const pingConnection = useCallback(() => {
    sendMessage({ type: 'PING', timestamp: Date.now() });
  }, [sendMessage]);

  const testConnection = useCallback((testUrl?: string) => {
    const baseUrl = getWebSocketUrl();
    const url = testUrl || `${baseUrl}${API_PREFIX}/ws/seats/${tripId}?user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
    
    const testWs = new WebSocket(url);
    const timeout = setTimeout(() => testWs.close(), 10000);
    
    testWs.onopen = () => {
      clearTimeout(timeout);
      testWs.close();
    };
    
    testWs.onerror = () => clearTimeout(timeout);
    testWs.onclose = () => clearTimeout(timeout);
  }, [tripId, userId, userName]);

  // Conectar al montar - Solo cuando cambien las props esenciales DESPUÉS del montaje inicial
  const isInitialMountRef = useRef(true);
  
  useEffect(() => {
    if (enabled && tripId && userId && userName) {
      // Solo conectar automáticamente si NO es el montaje inicial
      if (!isInitialMountRef.current) {
        // Reset attempts cuando cambien las props críticas
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
        connectWebSocket();
      } else {
        // Marcar que ya no es el montaje inicial
        isInitialMountRef.current = false;
      }
    }

    return () => {
      // Limpiar heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        discardSocket(wsRef.current, 1000, 'Component unmounting');
        wsRef.current = null;
        // El onclose ya no corre (lo desenganchamos), así que reflejamos el estado aquí
        setConnectionStatus('disconnected');
      }
    };
  }, [enabled, tripId, userId, userName]); // Removida connectWebSocket de dependencias

  return {
    connectionStatus,
    isWebSocketAvailable,
    reconnectAttempts,
    sendMessage,
    forceReconnect,
    pingConnection,
    testConnection,
    latency, // Exponer latencia para debugging
    heartbeatInterval // Exponer intervalo actual
  };
};