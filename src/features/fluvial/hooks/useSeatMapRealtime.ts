// src/features/fluvial/hooks/useSeatMapRealtime.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SeatMapItem } from '../../../types';
import { useSeatMap } from './useSeatMap';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useSeatSelections } from './useSeatSelections';
import { usePurchaseTimer } from './usePurchaseTimer';
import { WebSocketMessageHandler } from '../services/websocketMessageHandler';
import { SeatOperations } from '../services/seatOperations';
import { SeatMapRealtimeOptions, SeatSelection, SeatUpdateMessage } from '../types/websocket.types';

/**
 * Hook principal para gestión en tiempo real del mapa de asientos
 * Versión refactorizada y optimizada - reemplaza el hook monolítico original
 */
export const useSeatMapRealtime = (options: SeatMapRealtimeOptions) => {
  const {
    tripId,
    userId,
    userName,
    enabled = true,
    maxReconnectAttempts = 3,
    seatSelectionTimeout = 30000,
    cleanupInterval = 5000,
    enableDebugLogs = false,
    purchaseTimeout = 300000,
    onPurchaseTimeoutExpired,
    companyName,
    isCompanyMode = false
  } = options;

  // Hook para datos iniciales del mapa de asientos
  const { data: initialSeatMap = [], isLoading, refetch } = useSeatMap(tripId);
  
  // Estado del mapa de asientos
  const [seatMap, setSeatMap] = useState<SeatMapItem[]>([]);
  const [pendingWebSocketSelections, setPendingWebSocketSelections] = useState<SeatSelection[] | null>(null);

  // Configuración WebSocket - Memoizada para evitar recreaciones innecesarias
  const webSocketConfig = useMemo(() => ({
    tripId,
    userId,
    userName,
    enabled,
    maxReconnectAttempts,
    companyName,
    isCompanyMode
  }), [tripId, userId, userName, enabled, maxReconnectAttempts, companyName, isCompanyMode]);

  // Hooks especializados - Separación de responsabilidades (antes del messageHandler)
  const {
    activeSeatSelections,
    myReservedSeats,
    myActiveSelections, //  NUEVO: Mis selecciones activas
    myReservedSeatsRef, // Nueva referencia para evitar recreaciones
    addSelection,
    removeSelection,
    addMySelection, //  NUEVO: Agregar mi propia selección
    addReservation,
    removeReservation,
    clearAllReservations
  } = useSeatSelections({
    userId,
    seatSelectionTimeout,
    cleanupInterval
  });

  // Debouncing para actualizaciones del mapa de asientos
  const seatUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSeatUpdatesRef = useRef<Map<number, string>>(new Map());

  const debouncedSeatMapUpdate = useCallback((seatId: number, status: string) => {
    // Acumular actualizaciones pendientes
    pendingSeatUpdatesRef.current.set(seatId, status);
    
    // Limpiar timeout anterior
    if (seatUpdateTimeoutRef.current) {
      clearTimeout(seatUpdateTimeoutRef.current);
    }
    
    // Aplicar actualizaciones después de 100ms de inactividad
    seatUpdateTimeoutRef.current = setTimeout(() => {
      const updates = new Map(pendingSeatUpdatesRef.current);
      pendingSeatUpdatesRef.current.clear();
      
      setSeatMap(prevMap => {
        let hasChanges = false;
        const newMap = prevMap.map(seat => {
          if (updates.has(seat.id)) {
            hasChanges = true;
            return { ...seat, status: updates.get(seat.id) as any };
          }
          return seat;
        });
        return hasChanges ? newMap : prevMap;
      });
    }, 100);
  }, []);

  // Refs para callbacks estables - Evitar recreaciones del messageHandler
  const addSelectionRef = useRef(addSelection);
  const removeSelectionRef = useRef(removeSelection);
  const debouncedSeatMapUpdateRef = useRef(debouncedSeatMapUpdate);

  // Actualizar refs en cada render para mantener referencias actualizadas
  useEffect(() => {
    addSelectionRef.current = addSelection;
    removeSelectionRef.current = removeSelection;
    debouncedSeatMapUpdateRef.current = debouncedSeatMapUpdate;
  }, [addSelection, removeSelection, debouncedSeatMapUpdate]);

  // Handler de mensajes WebSocket - Memoizado para evitar recreaciones
  const messageHandler = useMemo(() => {
    return new WebSocketMessageHandler(userId, {
      onSeatMapUpdate: (seatId: number, status: string) => {
        debouncedSeatMapUpdateRef.current(seatId, status);
      },
      onSelectionUpdate: (selection: SeatSelection) => {
        addSelectionRef.current(selection);
      },
      onSelectionRemove: (seatId: number) => {
        removeSelectionRef.current(seatId);
      },
      onInitialState: (selections: SeatSelection[]) => {
        // Usar una callback function para acceder al estado actual sin dependencias
        setSeatMap(currentSeatMap => {
          if (currentSeatMap.length > 0) {
            selections.forEach(selection => addSelectionRef.current(selection));
          } else {
            setPendingWebSocketSelections(selections);
          }
          return currentSeatMap; // No modificar el estado aquí
        });
      }
    }, enableDebugLogs);
  }, [userId, enableDebugLogs]); // Removidas dependencias cambiantes: addSelection, removeSelection, debouncedSeatMapUpdate

  const handleWebSocketMessage = useCallback((message: SeatUpdateMessage) => {
    messageHandler.handleMessage(message);
  }, [messageHandler]);

  const {
    connectionStatus,
    isWebSocketAvailable,
    sendMessage,
    forceReconnect,
    pingConnection,
    testConnection
  } = useWebSocketConnection(webSocketConfig, handleWebSocketMessage);

  const {
    purchaseTimeRemaining,
    isPurchaseTimerActive,
    startPurchaseTimer,
    stopPurchaseTimer,
    extendPurchaseTime
  } = usePurchaseTimer({
    purchaseTimeout,
    onPurchaseTimeoutExpired
  });

  // Servicio de operaciones de asientos - Encapsula la lógica de envío de mensajes
  const seatOperations = new SeatOperations(sendMessage, userId, userName, tripId, companyName);

  // Sincronizar datos iniciales con selecciones pendientes del WebSocket
  useEffect(() => {
    if (initialSeatMap && initialSeatMap.length > 0) {
      if (pendingWebSocketSelections) {
        pendingWebSocketSelections.forEach(selection => {
          if (selection.userId !== userId) {
            addSelection(selection);
          }
        });
        setPendingWebSocketSelections(null);
      }
      setSeatMap(initialSeatMap);
    }
  }, [initialSeatMap, pendingWebSocketSelections, userId, addSelection]);

  // CORRECCIÓN: Solo reconectar cuando cambien valores críticos de conexión DESPUÉS del montaje inicial
  const previousConfigRef = useRef<{
    tripId?: number, 
    userId?: string, 
    userName?: string, 
    enabled?: boolean,
    companyName?: string,
    isCompanyMode?: boolean
  }>({});
  const isInitialMountRef = useRef(true);
  
  useEffect(() => {
    if (enabled && tripId && userId && userName) {
      const currentConfig = { tripId, userId, userName, enabled, companyName, isCompanyMode };
      const prevConfig = previousConfigRef.current;
      
      // En el montaje inicial, iniciar la conexión directamente
      if (isInitialMountRef.current) {
        const timer = setTimeout(() => {
          forceReconnect();
        }, 50); // Delay mínimo para asegurar que el componente esté montado
        
        isInitialMountRef.current = false;
        previousConfigRef.current = currentConfig;
        return () => clearTimeout(timer);
      }
      
      // Solo reconectar si realmente cambió algo crítico DESPUÉS del montaje inicial
      const shouldReconnect = (
        prevConfig.tripId !== tripId ||
        prevConfig.userId !== userId ||
        prevConfig.userName !== userName ||
        prevConfig.enabled !== enabled ||
        prevConfig.companyName !== companyName ||
        prevConfig.isCompanyMode !== isCompanyMode
      );
      
      if (shouldReconnect) {
        // Pequeño delay para asegurar que el componente esté completamente montado
        const timer = setTimeout(() => {
          forceReconnect();
        }, 100);
        
        previousConfigRef.current = currentConfig;
        return () => clearTimeout(timer);
      }
      
      previousConfigRef.current = currentConfig;
    }
  }, [tripId, userId, userName, enabled, companyName, isCompanyMode, forceReconnect]); // Dependencias críticas para reconexión

  // === API PÚBLICA DEL HOOK ===

  // Operaciones básicas de asientos
  const selectSeat = useCallback((seatId: number, selectionType: 'temporary' | 'reserved' = 'temporary') => {
    // 🔧 CORRECCIÓN: NO liberar selecciones automáticamente en modo empresa
    // En modo empresa (RUC con representantes), necesitamos mantener múltiples asientos
    if (selectionType === 'temporary' && !isCompanyMode) {
      // Solo en modo individual: Liberar la selección actual antes de hacer una nueva
      myActiveSelections.forEach((selectedSeatId) => {
        if (selectedSeatId !== seatId) {
          seatOperations.releaseSeat(selectedSeatId);
          removeSelection(selectedSeatId);
        }
      });
    }
    
    //  SOLUCIÓN: Verificar que el asiento no esté siendo usado por otro vendedor
    const existingSelection = activeSeatSelections.get(seatId);
    if (existingSelection && existingSelection.userId !== userId) {
      // El asiento está siendo usado por otro vendedor, no permitir la selección
      return false;
    }
    
    const success = seatOperations.selectSeat(seatId, selectionType);
    if (success) {
      // Agregar mi propia selección al tracking
      addMySelection(seatId);
      
      if (selectionType === 'reserved') {
        addReservation(seatId);
      }
    }
    return success;
  }, [seatOperations, addReservation, addMySelection, myActiveSelections, isCompanyMode, removeSelection, activeSeatSelections, userId]);

  const releaseSeat = useCallback((seatId: number, force: boolean = false) => {
    // Usar referencia para evitar dependencia en myReservedSeats que cambia constantemente
    if (myReservedSeatsRef.current?.has(seatId) && !force) {
      return false;
    }
    const success = seatOperations.releaseSeat(seatId);
    if (success) {
      removeReservation(seatId);
      //  SOLUCIÓN: Remover de mis selecciones activas
      removeSelection(seatId);
    }
    return success;
  }, [seatOperations, removeReservation, removeSelection, myReservedSeatsRef]); // Usando referencia estable

  // Operaciones para representantes (modo empresa)
  const selectSeatForRepresentative = useCallback((
    seatId: number, 
    representativeIndex: number, 
    representativeName: string
  ) => {
    return seatOperations.selectSeatForRepresentative(seatId, representativeIndex, representativeName);
  }, [seatOperations]);

  const releaseSeatForRepresentative = useCallback((seatId: number, representativeIndex?: number) => {
    return seatOperations.releaseSeatForRepresentative(seatId, representativeIndex);
  }, [seatOperations]);

  // Operaciones de compra
  const reserveSeatForPurchase = useCallback((seatId: number) => {
    const success = selectSeat(seatId, 'reserved');
    if (success) {
      addReservation(seatId);
    }
    return success;
  }, [selectSeat, addReservation]);

  const releaseReservedSeat = useCallback((seatId: number) => {
    return releaseSeat(seatId, true);
  }, [releaseSeat]);

  const confirmPurchase = useCallback((seatIds?: number[]) => {
    // Usar referencia para obtener el valor actual sin dependencia de estado
    const seatsToConfirm = seatIds || Array.from(myReservedSeatsRef.current || new Set());
    const success = seatOperations.confirmPurchase(seatsToConfirm);
    if (success) {
      clearAllReservations();
      stopPurchaseTimer();
    }
    return success;
  }, [seatOperations, clearAllReservations, stopPurchaseTimer, myReservedSeatsRef]); // Usando referencia estable

  const cancelAllReservations = useCallback(() => {
    // Usar referencia para obtener el valor actual sin dependencia de estado
    const seatsToRelease = Array.from(myReservedSeatsRef.current || new Set());
    
    // Usar directamente seatOperations en lugar de releaseReservedSeat para evitar loops
    seatsToRelease.forEach(seatId => {
      seatOperations.releaseSeat(seatId);
      removeReservation(seatId);
    });
    
    clearAllReservations();
    stopPurchaseTimer();
  }, [seatOperations, removeReservation, clearAllReservations, stopPurchaseTimer, myReservedSeatsRef]); // Evitando releaseReservedSeat

  // Función de debug mejorada (condicional)
  const debugActiveSelectionsEnhanced = useCallback(() => {
    if (enableDebugLogs) {
      // Llamar directamente sin dependencia problemática
      console.log('Active seat selections:', {
        totalSelections: activeSeatSelections.size,
        selections: Array.from(activeSeatSelections.entries()).map(([seatId, selection]) => ({
          seatId,
          userName: selection.userName,
          userId: selection.userId,
          timestamp: selection.timestamp
        }))
      });
      
      console.log('Enhanced Debug Info:', {
        seatMapLength: seatMap.length, // Capturar valor actual
        initialSeatMapLength: initialSeatMap?.length || 0, // Capturar valor actual
        connectionStatus,
        isWebSocketAvailable,
        myReservedSeatsCount: myReservedSeatsRef.current?.size || 0, // Usar referencia
        purchaseTimeRemaining,
        isPurchaseTimerActive,
        companyName: companyName || 'N/A',
        isCompanyMode
      });
    }
  }, [
    enableDebugLogs, activeSeatSelections,
    connectionStatus, isWebSocketAvailable, myReservedSeatsRef, // Usar referencia
    purchaseTimeRemaining, isPurchaseTimerActive, companyName, isCompanyMode
  ]); // Removido seatMap.length e initialSeatMap?.length que cambian constantemente

  // Cleanup del debouncing al desmontar
  useEffect(() => {
    return () => {
      if (seatUpdateTimeoutRef.current) {
        clearTimeout(seatUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Funciones auxiliares (mantener compatibilidad con la API original)
  const setSeatTimeout = useCallback((_timeoutMs: number) => {
    // Función placeholder para cambiar timeout dinámicamente
    // Puede implementarse en el futuro si es necesario
  }, []);

  const refreshSeatMap = useCallback(() => {
    refetch();
  }, [refetch]);

  // === INTERFAZ PÚBLICA (COMPATIBLE CON VERSIÓN ORIGINAL) ===
  return {
    // Estados principales
    seatMap,
    activeSeatSelections,
    myReservedSeats,
    connectionStatus,
    isLoading,
    
    // Operaciones básicas
    selectSeat,
    releaseSeat,
    refreshSeatMap,
    
    // Operaciones para representantes
    selectSeatForRepresentative,
    releaseSeatForRepresentative,
    
    // Operaciones de compra
    reserveSeatForPurchase,
    releaseReservedSeat,
    confirmPurchase,
    cancelAllReservations,
    
    // Temporizador de compra
    startPurchaseTimer,
    stopPurchaseTimer,
    extendPurchaseTime,
    purchaseTimeRemaining,
    isPurchaseTimerActive,
    
    // Funciones de debugging y conexión
    pingConnection,
    testConnection,
    forceReconnect,
    debugActiveSelections: debugActiveSelectionsEnhanced,
    setSeatTimeout,
    
    // Estados de conexión
    isConnected: connectionStatus === 'connected',
    isWebSocketAvailable,
    canUseRealtime: connectionStatus === 'connected' && isWebSocketAvailable,
    
    // Debug info (solo si está habilitado)
    _debug: enableDebugLogs ? {
      seatMapLength: seatMap.length,
      initialSeatMapLength: initialSeatMap?.length || 0,
      connectionStatus,
      isWebSocketAvailable,
      hasPendingWsSelections: !!pendingWebSocketSelections,
      pendingWsSelectionsLength: pendingWebSocketSelections?.length || 0,
      activeSelectionsCount: activeSeatSelections.size,
      myReservedSeatsCount: myReservedSeatsRef.current?.size || 0, // Usar referencia
      currentTimeout: seatSelectionTimeout,
      cleanupInterval: cleanupInterval,
      purchaseTimeRemaining,
      isPurchaseTimerActive,
      companyName: companyName || 'N/A',
      isCompanyMode
    } : undefined
  };
};