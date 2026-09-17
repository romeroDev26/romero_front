// src/hooks/useWebSocketNotifications.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from '@/utils/sileo-toast';
import { getWebSocketUrl as getWsBaseUrl, API_PREFIX } from '../config/env';

// Datos del evento cuando se crea una solicitud
interface CancellationRequestCreatedData {
  id: number;
  requesterName: string;
  invoice: string;
  message: string;
  requester_id?: string;
  request_reason?: string;
  passenger_name?: string;
  trip_info?: string;
  created_at?: string;
}

// Datos del evento cuando se resuelve una solicitud
interface CancellationRequestResolvedData {
  id: number;
  status: 'APPROVED' | 'REJECTED';
  message: string;
  rejection_reason?: string;
  credit_note_series?: string;
  credit_note_number?: number;
}

interface WebSocketMessage {
  type: 'PING' | 'PONG' | 'CANCELLATION_REQUEST_CREATED' | 'CANCELLATION_REQUEST_RESOLVED' | 'PAGO_DIGITAL_RECIBIDO' | string;
  // Los demas tipos de mensaje traen su propio payload; se deja abierto pero
  // no con `any`, que anulaba la union de los dos casos conocidos.
  data?:
    | CancellationRequestCreatedData
    | CancellationRequestResolvedData
    | Record<string, unknown>;
  pago?: {
    monto?: number;
    nombre_emisor?: string;
    canal?: string;
  };
  invoice_id?: number | null;
  timestamp?: string;
}

interface UseWebSocketNotificationsOptions {
  onCancellationRequestCreated?: (data: CancellationRequestCreatedData) => void;
  onCancellationRequestResolved?: (data: CancellationRequestResolvedData) => void;
  enabled?: boolean;
}

// Singleton para evitar múltiples conexiones WebSocket
let globalWs: WebSocket | null = null;
let globalPingInterval: NodeJS.Timeout | null = null;
const connectionListeners: Set<(connected: boolean) => void> = new Set();
/**
 * Handler generico guardado en el registro. Cada tipo de evento trae su propio
 * payload, asi que el registro es heterogeneo por naturaleza: se guarda con
 * `unknown` y el estrechamiento ocurre al registrar, donde si se conoce el tipo.
 */
type StoredNotificationHandler = (data: unknown) => void;

const messageHandlers: Map<string, Set<StoredNotificationHandler>> = new Map();

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

    const wsBaseUrl = getWsBaseUrl();
    const wsUrl = `${wsBaseUrl}${API_PREFIX}/ws/notifications`;
    
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
            const data = message.data as CancellationRequestCreatedData;
            
            // Construir mensaje más informativo con los nuevos datos
            let toastMessage = data.message || `Nueva solicitud de anulación de ${data.requesterName}`;
            
            // Agregar información adicional si está disponible
            const details: string[] = [];
            if (data.invoice) details.push(`Comprobante: ${data.invoice}`);
            if (data.passenger_name) details.push(`Pasajero: ${data.passenger_name}`);
            if (data.trip_info) details.push(`Viaje: ${data.trip_info}`);
            
            if (details.length > 0) {
              toastMessage += '\n' + details.join(' | ');
            }
            
            toast.info(toastMessage, {
              position: 'top-right',
              autoClose: 6000,
            });
            
            const handlers = messageHandlers.get('CANCELLATION_REQUEST_CREATED');
            if (handlers) {
              handlers.forEach(handler => handler(data));
            }

            window.dispatchEvent(new CustomEvent('cancellation-request-created', { detail: data }));
          }
          break;

        case 'CANCELLATION_REQUEST_RESOLVED':
          if (message.data) {
            const data = message.data as CancellationRequestResolvedData;
            const isApproved = data.status === 'APPROVED';
            const toastFn = isApproved ? toast.success : toast.warning;
            
            // Construir mensaje más informativo
            let toastMessage = data.message || `Solicitud ${data.status}`;
            
            // Agregar información adicional
            if (isApproved && data.credit_note_series && data.credit_note_number) {
              toastMessage += `\nNota de Crédito: ${data.credit_note_series}-${data.credit_note_number}`;
            } else if (!isApproved && data.rejection_reason) {
              toastMessage += `\nMotivo: ${data.rejection_reason}`;
            }
            
            toastFn(toastMessage, {
              position: 'top-right',
              autoClose: isApproved ? 6000 : 8000,
            });

            const handlers = messageHandlers.get('CANCELLATION_REQUEST_RESOLVED');
            if (handlers) {
              handlers.forEach(handler => handler(data));
            }

            window.dispatchEvent(new CustomEvent('cancellation-request-resolved', { detail: data }));
          }
          break;

        case 'PAGO_DIGITAL_RECIBIDO': {
          const pago = message.pago || (message.data as { pago?: typeof message.pago })?.pago;
          if (pago) {
            const canal = pago.canal || 'YAPE';
            const monto = Number(pago.monto || 0).toFixed(2);
            const nombre = pago.nombre_emisor || 'cliente';
            toast.info(`${canal} S/ ${monto} de ${nombre}`, {
              position: 'top-right',
              autoClose: 5000,
            });
            window.dispatchEvent(new CustomEvent('pago-digital-recibido', { detail: pago }));
            const handlers = messageHandlers.get('PAGO_DIGITAL_RECIBIDO');
            if (handlers) {
              handlers.forEach((handler) => handler(pago));
            }
          }
          break;
        }

        default:
          break;
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
      messageHandlers
        .get('CANCELLATION_REQUEST_CREATED')!
        .add(onCancellationRequestCreated as StoredNotificationHandler);
    }

    if (onCancellationRequestResolved) {
      if (!messageHandlers.has('CANCELLATION_REQUEST_RESOLVED')) {
        messageHandlers.set('CANCELLATION_REQUEST_RESOLVED', new Set());
      }
      messageHandlers
        .get('CANCELLATION_REQUEST_RESOLVED')!
        .add(onCancellationRequestResolved as StoredNotificationHandler);
    }

    return () => {
      if (onCancellationRequestCreated) {
        messageHandlers
          .get('CANCELLATION_REQUEST_CREATED')
          ?.delete(onCancellationRequestCreated as StoredNotificationHandler);
      }
      if (onCancellationRequestResolved) {
        messageHandlers
          .get('CANCELLATION_REQUEST_RESOLVED')
          ?.delete(onCancellationRequestResolved as StoredNotificationHandler);
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
