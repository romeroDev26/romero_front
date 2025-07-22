// src/features/fluvial/hooks/useSeatMapRealtime.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { SeatMapItem } from '../../../types';
import { useSeatMap } from './useSeatMap';

interface SeatUpdateMessage {
  type: 'SEAT_UPDATE' | 'SEAT_SELECTION' | 'SEAT_RELEASED' | 'INITIAL_STATE' | 'PONG';
  tripId: number;
  seatId?: number;
  seats?: Array<{ seatId: number; userId: string; userName: string }>; // Para INITIAL_STATE - selecciones activas
  status?: string;
  userId?: string;
  userName?: string;
  timestamp: string;
}

interface SeatSelection {
  seatId: number;
  userId: string;
  userName: string;
  timestamp: string;
  type?: 'temporary' | 'reserved' | 'purchasing'; // Tipo de selección
}

interface UseSeatMapRealtimeOptions {
  tripId: number;
  userId: string;
  userName: string;
  enabled?: boolean;
  maxReconnectAttempts?: number;
  seatSelectionTimeout?: number; // Tiempo en ms para limpiar selecciones (default: 30s)
  cleanupInterval?: number; // Intervalo de limpieza en ms (default: 5s)
  enableDebugLogs?: boolean; // Para habilitar/deshabilitar logs detallados
  purchaseTimeout?: number; // Tiempo en ms para completar compra (default: 5 min)
  onPurchaseTimeoutExpired?: () => void; // Callback cuando expira el tiempo de compra
}

export const useSeatMapRealtime = ({ 
  tripId, 
  userId, 
  userName, 
  enabled = true,
  maxReconnectAttempts = 3,
  seatSelectionTimeout = 30000, // 30 segundos por defecto
  cleanupInterval = 5000, // 5 segundos por defecto
  enableDebugLogs = false, // Deshabilitado por defecto
  purchaseTimeout = 300000, // 5 minutos por defecto
  onPurchaseTimeoutExpired
}: UseSeatMapRealtimeOptions) => {
  const { data: initialSeatMap = [], isLoading, refetch } = useSeatMap(tripId);
  const [seatMap, setSeatMap] = useState<SeatMapItem[]>([]);
  const [activeSeatSelections, setActiveSeatSelections] = useState<Map<number, SeatSelection>>(new Map());
  const [myReservedSeats, setMyReservedSeats] = useState<Set<number>>(new Set()); // Asientos reservados por mí
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isWebSocketAvailable, setIsWebSocketAvailable] = useState(true); // Nueva bandera
  
  // Estados para temporizador de compra
  const [purchaseStartTime, setPurchaseStartTime] = useState<number | null>(null);
  const [purchaseTimeRemaining, setPurchaseTimeRemaining] = useState<number>(purchaseTimeout);
  const [isPurchaseTimerActive, setIsPurchaseTimerActive] = useState(false);
  
  // Almacenar selecciones del WebSocket temporalmente hasta que lleguen los datos de la API
  const [pendingWebSocketSelections, setPendingWebSocketSelections] = useState<Array<{ seatId: number; userId: string; userName: string }> | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const purchaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const myReservedSeatsRef = useRef<Set<number>>(new Set()); // Referencia estable

  // Actualizar el estado local cuando llegan los datos iniciales
  useEffect(() => {
    if (initialSeatMap && initialSeatMap.length > 0) {
      // Si tenemos selecciones pendientes del WebSocket, aplicarlas
      if (pendingWebSocketSelections) {
        const initialSelections = new Map<number, SeatSelection>();
        
        pendingWebSocketSelections.forEach(selection => {
          // Solo agregar selecciones de otros usuarios
          if (selection.userId !== userId) {
            initialSelections.set(selection.seatId, {
              seatId: selection.seatId,
              userId: selection.userId,
              userName: selection.userName,
              timestamp: new Date().toISOString(),
              type: 'temporary'
            });
          }
        });
        
        setActiveSeatSelections(initialSelections);
        setPendingWebSocketSelections(null); // Limpiar selecciones pendientes
      }
      
      setSeatMap(initialSeatMap);
    }
  }, [initialSeatMap, pendingWebSocketSelections, userId]); // Dependencias actualizadas

  const connectWebSocket = useCallback(() => {
    if (!enabled || !tripId || !isWebSocketAvailable) return;
    
    // Limpiar timeout de reconexión pendiente
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Limpiar conexión existente si existe
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Reconnecting');
      }
      wsRef.current = null;
    }

    try {
      // Construir URL del WebSocket con más flexibilidad
      const baseUrl = import.meta.env.VITE_WS_URL || 'wss://romeroapi-production.up.railway.app';
      const wsUrl = `${baseUrl}/api/v1/ws/seats/${tripId}?user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      setConnectionStatus('connecting');

      ws.onopen = () => {
        setConnectionStatus('connected');
        setReconnectAttempts(0); // Reset counter on successful connection
        
        // Enviar mensaje de conexión según especificación del backend
        const connectMessage = {
          type: 'CONNECT'
        };
        
        ws.send(JSON.stringify(connectMessage));
      };

      ws.onmessage = (event) => {
        try {
          const message: SeatUpdateMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'INITIAL_STATE':
              if (message.seats) {
                // Este mensaje contiene las selecciones activas de otros usuarios
                const initialSelections = new Map<number, SeatSelection>();
                
                message.seats.forEach(selection => {
                  // Solo agregar selecciones de otros usuarios
                  if (selection.userId !== userId) {
                    initialSelections.set(selection.seatId, {
                      seatId: selection.seatId,
                      userId: selection.userId,
                      userName: selection.userName,
                      timestamp: message.timestamp,
                      type: 'temporary'
                    });
                  }
                });
                
                // Si ya tenemos el mapa de asientos, aplicar inmediatamente
                if (seatMap.length > 0) {
                  setActiveSeatSelections(initialSelections);
                } else {
                  // Si no tenemos datos de la API todavía, guardar para aplicar después
                  setPendingWebSocketSelections(message.seats);
                }
              }
              break;

            case 'SEAT_UPDATE':
              if (message.seatId !== undefined) {
                setSeatMap(prevMap => 
                  prevMap.map(seat => 
                    seat.id === message.seatId 
                      ? { ...seat, status: message.status as any }
                      : seat
                  )
                );
                
                setActiveSeatSelections(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(message.seatId!);
                  return newMap;
                });
              }
              break;

            case 'SEAT_SELECTION':
              if (message.userId !== userId && message.seatId !== undefined) {
                setActiveSeatSelections(prev => {
                  const newMap = new Map(prev);
                  newMap.set(message.seatId!, {
                    seatId: message.seatId!,
                    userId: message.userId!,
                    userName: message.userName!,
                    timestamp: message.timestamp
                  });
                  return newMap;
                });
              }
              break;

            case 'SEAT_RELEASED':
              if (message.userId !== userId && message.seatId !== undefined) {
                setActiveSeatSelections(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(message.seatId!);
                  return newMap;
                });
              }
              break;

            case 'PONG':
              // Connection alive confirmation
              break;
          }
        } catch (error) {
          console.error('❌ Error processing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        
        // Solo reconectar si no es un cierre normal y tenemos intentos disponibles
        if (enabled && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts && isWebSocketAvailable) {
          const nextAttempt = reconnectAttempts + 1;
          let delay;
          
          // Para código 1005 (común en proxies), reconectar más rápido
          if (event.code === 1005) {
            delay = Math.min(1000 * nextAttempt, 5000); // Max 5s para 1005
          } else {
            delay = Math.min(3000 * nextAttempt, 15000); // Max 15s para otros códigos
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(nextAttempt);
            // Ejecutar reconexión directamente aquí para evitar loops de useEffect
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionStatus('failed');
          setIsWebSocketAvailable(false);
        }
      };

      ws.onerror = () => {
        // Error handling - connection will be handled by onclose
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
  }, [tripId, userId, userName, enabled, maxReconnectAttempts, isWebSocketAvailable, reconnectAttempts, seatMap.length]); // Dependencias completas para estabilidad

  // Función para detener temporizador de compra
  const stopPurchaseTimer = useCallback(() => {
    if (purchaseTimerRef.current) {
      clearInterval(purchaseTimerRef.current);
      purchaseTimerRef.current = null;
    }
    setIsPurchaseTimerActive(false);
    setPurchaseStartTime(null);
    setPurchaseTimeRemaining(purchaseTimeout);
  }, [purchaseTimeout]);

  // Función para iniciar temporizador de compra
  const startPurchaseTimer = useCallback(() => {
    const startTime = Date.now();
    setPurchaseStartTime(startTime);
    setIsPurchaseTimerActive(true);
    setPurchaseTimeRemaining(purchaseTimeout);

    // Limpiar temporizador existente si existe
    if (purchaseTimerRef.current) {
      clearInterval(purchaseTimerRef.current);
    }

    // Actualizar cada segundo
    purchaseTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, purchaseTimeout - elapsed);
      
      setPurchaseTimeRemaining(remaining);

      if (remaining <= 0) {
        // Tiempo agotado
        clearInterval(purchaseTimerRef.current!);
        purchaseTimerRef.current = null;
        setIsPurchaseTimerActive(false);
        setPurchaseStartTime(null);
        
        // Ejecutar callback si existe
        if (onPurchaseTimeoutExpired) {
          onPurchaseTimeoutExpired();
        }
      }
    }, 1000);
  }, [purchaseTimeout, onPurchaseTimeoutExpired]);

  // Función para notificar selección de asiento
  const selectSeat = useCallback((seatId: number, selectionType: 'temporary' | 'reserved' = 'temporary') => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isWebSocketAvailable) {
      const message = {
        type: 'SEAT_SELECTION',
        seatId,
        selectionType
      };
      
      wsRef.current.send(JSON.stringify(message));
      
      // Si es una reserva, agregar a mis asientos reservados
      if (selectionType === 'reserved') {
        setMyReservedSeats(prev => {
          const newSet = new Set([...prev, seatId]);
          myReservedSeatsRef.current = newSet;
          return newSet;
        });
      }
    }
  }, [isWebSocketAvailable]);

  // Función para notificar liberación de asiento
  const releaseSeat = useCallback((seatId: number, force: boolean = false) => {
    // Si el asiento está reservado por mí y no es forzado, no liberarlo
    // Usar la referencia para evitar dependencias problemáticas
    if (myReservedSeatsRef.current.has(seatId) && !force) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN && isWebSocketAvailable) {
      const message = {
        type: 'SEAT_RELEASED',
        seatId
      };
      
      wsRef.current.send(JSON.stringify(message));
      
      // Remover de mis reservas si era mío
      setMyReservedSeats(prev => {
        const newSet = new Set(prev);
        newSet.delete(seatId);
        myReservedSeatsRef.current = newSet;
        return newSet;
      });
    }
  }, [isWebSocketAvailable]); // Removido enableDebugLogs

  // Función para reservar asiento para compra
  const reserveSeatForPurchase = useCallback((seatId: number) => {
    selectSeat(seatId, 'reserved');
    setMyReservedSeats(prev => {
      const newSet = new Set([...prev, seatId]);
      myReservedSeatsRef.current = newSet;
      return newSet;
    });
  }, [selectSeat]);

  // Función para liberar asiento reservado (forzado)
  const releaseReservedSeat = useCallback((seatId: number) => {
    releaseSeat(seatId, true);
  }, [releaseSeat]);

  // Función para confirmar compra (libera todas las reservas como compradas)
  const confirmPurchase = useCallback((seatIds?: number[]) => {
    // Usar la referencia para obtener los asientos actuales
    const seatsToConfirm = seatIds || Array.from(myReservedSeatsRef.current);
    
    seatsToConfirm.forEach(seatId => {
      if (wsRef.current?.readyState === WebSocket.OPEN && isWebSocketAvailable) {
        const message = {
          type: 'SEAT_UPDATE',
          seatId,
          status: 'SOLD' // o el estado que uses para asientos vendidos
        };
        
        wsRef.current.send(JSON.stringify(message));
      }
    });
    
    // Limpiar mis reservas
    setMyReservedSeats(() => {
      const newSet = new Set<number>();
      myReservedSeatsRef.current = newSet;
      return newSet;
    });
    
    // Detener temporizador de compra
    stopPurchaseTimer();
  }, [isWebSocketAvailable, stopPurchaseTimer]); // Removido enableDebugLogs

  // Función para cancelar todas las reservas
  const cancelAllReservations = useCallback(() => {
    // Usar la referencia para obtener los asientos actuales
    Array.from(myReservedSeatsRef.current).forEach(seatId => {
      releaseReservedSeat(seatId);
    });
    
    setMyReservedSeats(() => {
      const newSet = new Set<number>();
      myReservedSeatsRef.current = newSet;
      return newSet;
    });
    stopPurchaseTimer();
  }, [releaseReservedSeat, stopPurchaseTimer]); // Removido enableDebugLogs

  // Función para verificar conexión (opcional - solo para debugging)
  const pingConnection = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = { type: 'PING' };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Función para forzar reconexión manual (debugging)
  const forceReconnect = useCallback(() => {
    setReconnectAttempts(0);
    setIsWebSocketAvailable(true);
    setConnectionStatus('disconnected');
    connectWebSocket();
  }, [connectWebSocket]);

  // Función para testing de diferentes URLs
  const testConnection = useCallback((testUrl?: string) => {
    const url = testUrl || `${import.meta.env.VITE_WS_URL || 'wss://romeroapi-production.up.railway.app'}/api/v1/ws/seats/${tripId}?user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
    
    const testWs = new WebSocket(url);
    
    const timeout = setTimeout(() => {
      testWs.close();
    }, 10000);
    
    testWs.onopen = () => {
      clearTimeout(timeout);
      testWs.close();
    };
    
    testWs.onerror = () => {
      clearTimeout(timeout);
    };
    
    testWs.onclose = () => {
      clearTimeout(timeout);
    };
  }, [tripId, userId, userName]);

  // Función para cambiar timeout de selecciones dinámicamente
  const setSeatTimeout = useCallback((_timeoutMs: number) => {
    // Esta función puede ser usada para cambiar el timeout dinámicamente
    // Por ejemplo, en modo "urgente" podría ser más corto
  }, []); // Sin dependencias innecesarias

  // Función para debug de selecciones activas
  const debugActiveSelections = useCallback(() => {
    if (enableDebugLogs) {
      console.log('🔍 Active seat selections:', {
        totalSelections: activeSeatSelections.size,
        selections: Array.from(activeSeatSelections.entries()).map(([seatId, selection]) => ({
          seatId,
          userName: selection.userName,
          userId: selection.userId,
          timestamp: selection.timestamp
        }))
      });
    }
  }, [activeSeatSelections, enableDebugLogs]);

  // Función para extender tiempo de compra
  const extendPurchaseTime = useCallback((additionalMs: number) => {
    if (isPurchaseTimerActive && purchaseStartTime) {
      const newTimeout = purchaseTimeout + additionalMs;
      const startTime = purchaseStartTime;
      
      // Limpiar temporizador actual
      if (purchaseTimerRef.current) {
        clearInterval(purchaseTimerRef.current);
      }

      // Reiniciar con nuevo timeout
      purchaseTimerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, newTimeout - elapsed);
        
        setPurchaseTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(purchaseTimerRef.current!);
          purchaseTimerRef.current = null;
          setIsPurchaseTimerActive(false);
          setPurchaseStartTime(null);
          
          if (onPurchaseTimeoutExpired) {
            onPurchaseTimeoutExpired();
          }
        }
      }, 1000);
    }
  }, [isPurchaseTimerActive, purchaseStartTime, purchaseTimeout, onPurchaseTimeoutExpired]);

  // Función para refrescar datos desde la API
  const refreshSeatMap = useCallback(() => {
    refetch();
  }, [refetch]);

  // Conectar al montar y limpiar al desmontar
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
      if (purchaseTimerRef.current) {
        clearInterval(purchaseTimerRef.current);
        purchaseTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tripId, userId, userName]); // Solo estas dependencias básicas

  // Limpiar selecciones antiguas según configuración (mejorado para no tocar reservas)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date().getTime();
      setActiveSeatSelections(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;
        
        for (const [seatId, selection] of newMap.entries()) {
          // No limpiar selecciones propias si están reservadas para compra
          if (selection.userId === userId && myReservedSeatsRef.current.has(seatId)) {
            continue;
          }
          
          // No limpiar selecciones de tipo 'reserved' o 'purchasing'
          if (selection.type === 'reserved' || selection.type === 'purchasing') {
            continue;
          }
          
          const selectionTime = new Date(selection.timestamp).getTime();
          if (now - selectionTime > seatSelectionTimeout) {
            newMap.delete(seatId);
            hasChanges = true;
          }
        }
        
        return hasChanges ? newMap : prev;
      });
    }, cleanupInterval);

    return () => clearInterval(cleanup);
  }, [seatSelectionTimeout, cleanupInterval, userId]); // Solo dependencias estables

  return {
    seatMap,
    activeSeatSelections,
    myReservedSeats, // Nuevo: asientos que tengo reservados
    connectionStatus,
    isLoading,
    // Funciones básicas
    selectSeat,
    releaseSeat,
    refreshSeatMap,
    // Funciones de reserva para compra
    reserveSeatForPurchase,
    releaseReservedSeat,
    confirmPurchase,
    cancelAllReservations,
    // Funciones del temporizador de compra
    startPurchaseTimer,
    stopPurchaseTimer,
    extendPurchaseTime,
    // Funciones de debugging
    pingConnection,
    testConnection,
    forceReconnect,
    debugActiveSelections,
    setSeatTimeout,
    // Estados del temporizador
    purchaseTimeRemaining,
    isPurchaseTimerActive,
    // Estados de conexión
    isConnected: connectionStatus === 'connected',
    isWebSocketAvailable,
    canUseRealtime: connectionStatus === 'connected' && isWebSocketAvailable,
    // Debug info
    _debug: {
      seatMapLength: seatMap.length,
      initialSeatMapLength: initialSeatMap?.length || 0,
      connectionStatus,
      reconnectAttempts,
      isWebSocketAvailable,
      hasPendingWsSelections: !!pendingWebSocketSelections,
      pendingWsSelectionsLength: pendingWebSocketSelections?.length || 0,
      activeSelectionsCount: activeSeatSelections.size,
      myReservedSeatsCount: myReservedSeats.size,
      currentTimeout: seatSelectionTimeout,
      cleanupInterval: cleanupInterval,
      purchaseTimeRemaining,
      isPurchaseTimerActive
    }
  };
};
