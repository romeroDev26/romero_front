// src/hooks/useWebSocketNotifications.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'react-toastify';

interface WebSocketMessage {
  type: 'PING' | 'PONG' | 'CANCELLATION_REQUEST_CREATED' | 'CANCELLATION_REQUEST_RESOLVED';
  data?: any;
  timestamp?: string;
}

interface UseWebSocketNotificationsOptions {
  onCancellationRequestCreated?: (data: any) => void;
  onCancellationRequestResolved?: (data: any) => void;
  enabled?: boolean;
}

// Singleton para evitar múltiples conexiones WebSocket
let globalWs: WebSocket | null = null;
let globalPingInterval: NodeJS.Timeout | null = null;
let connectionListeners: Set<(connected: boolean) => void> = new Set();
let messageHandlers: Map<string, Set<(data: any) => void>> = new Map();

export const useWebSocketNotifications = (options: UseWebSocketNotificationsOptions = {}) => {
  const {
    onCancellationRequestCreated,
    onCancellationRequestResolved,
    enabled = true
  } = options;

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const getWebSocketUrl = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('[WebSocket] No se encontró token de autenticación');
      return null;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'https://romeroapi-production-5dec.up.railway.app';
    let wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    wsUrl = `${wsUrl}/api/v1/ws/notifications`;
    
    return `${wsUrl}?token=${encodeURIComponent(token)}`;
  };

  const sendPing = () => {
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type: 'PING' }));
    }
  };

  const handleGlobalMessage = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'PONG':
          // Heartbeat recibido
          break;

        case 'CANCELLATION_REQUEST_CREATED':
          if (message.data) {
            toast.info(message.data.message || 'Nueva solicitud de anulación', {
              position: 'top-right',
              autoClose: 5000,
            });
            
            const handlers = messageHandlers.get('CANCELLATION_REQUEST_CREATED');
            if (handlers) {
              handlers.forEach(handler => handler(message.data));
            }
          }
          break;

        case 'CANCELLATION_REQUEST_RESOLVED':
          if (message.data) {
            const isApproved = message.data.status === 'APPROVED';
            const toastFn = isApproved ? toast.success : toast.warning;
            
            toastFn(message.data.message || `Solicitud ${message.data.status}`, {
              position: 'top-right',
              autoClose: isApproved ? 5000 : 8000,
            });

            const handlers = messageHandlers.get('CANCELLATION_REQUEST_RESOLVED');
            if (handlers) {
              handlers.forEach(handler => handler(message.data));
            }
          }
          break;

        default:
          console.warn('[WebSocket] Mensaje desconocido:', message);
      }
    } catch (error) {
      console.error('[WebSocket] Error al procesar mensaje:', error);
    }
  };

  const connectGlobal = useCallback(() => {
    if (globalWs?.readyState === WebSocket.OPEN || globalWs?.readyState === WebSocket.CONNECTING) {
      setIsConnected(true);
      return;
    }

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      console.warn('[WebSocket] No se puede conectar: token no disponible');
      return;
    }

    try {
      globalWs = new WebSocket(wsUrl);

      globalWs.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        connectionListeners.forEach(listener => listener(true));

        if (globalPingInterval) {
          clearInterval(globalPingInterval);
        }
        globalPingInterval = setInterval(sendPing, 30000);
      };

      globalWs.onmessage = handleGlobalMessage;

      globalWs.onerror = () => {
        console.error('[WebSocket] Error de conexión');
      };

      globalWs.onclose = (event) => {
        setIsConnected(false);
        connectionListeners.forEach(listener => listener(false));

        if (globalPingInterval) {
          clearInterval(globalPingInterval);
          globalPingInterval = null;
        }

        // No reconectar si es error de autenticación
        if (event.code === 1008) {
          console.error('[WebSocket] Token inválido');
          globalWs = null;
          return;
        }

        // Reconectar con backoff exponencial
        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectGlobal();
          }, delay);
        } else {
          console.error('[WebSocket] Máximo de reintentos alcanzado');
          globalWs = null;
        }
      };
    } catch (error) {
      console.error('[WebSocket] Error al crear conexión:', error);
    }
  }, [reconnectAttempts]);

  // Registrar callbacks
  useEffect(() => {
    if (onCancellationRequestCreated) {
      if (!messageHandlers.has('CANCELLATION_REQUEST_CREATED')) {
        messageHandlers.set('CANCELLATION_REQUEST_CREATED', new Set());
      }
      messageHandlers.get('CANCELLATION_REQUEST_CREATED')!.add(onCancellationRequestCreated);
    }

    if (onCancellationRequestResolved) {
      if (!messageHandlers.has('CANCELLATION_REQUEST_RESOLVED')) {
        messageHandlers.set('CANCELLATION_REQUEST_RESOLVED', new Set());
      }
      messageHandlers.get('CANCELLATION_REQUEST_RESOLVED')!.add(onCancellationRequestResolved);
    }

    return () => {
      if (onCancellationRequestCreated) {
        messageHandlers.get('CANCELLATION_REQUEST_CREATED')?.delete(onCancellationRequestCreated);
      }
      if (onCancellationRequestResolved) {
        messageHandlers.get('CANCELLATION_REQUEST_RESOLVED')?.delete(onCancellationRequestResolved);
      }
    };
  }, [onCancellationRequestCreated, onCancellationRequestResolved]);

  // Conectar solo una vez
  useEffect(() => {
    if (!enabled) return;

    const onConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
    };

    connectionListeners.add(onConnectionChange);

    if (!globalWs || globalWs.readyState === WebSocket.CLOSED) {
      connectGlobal();
    } else if (globalWs.readyState === WebSocket.OPEN) {
      setIsConnected(true);
    }

    return () => {
      connectionListeners.delete(onConnectionChange);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled, connectGlobal]);

  return {
    isConnected,
    reconnectAttempts
  };
};
