// src/hooks/useWhatsAppConfig.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from '@/utils/sileo-toast';
import { 
  whatsappConfigService, 
  WhatsAppCreateInstanceRequest,
  WhatsAppStatusResponse,
  WhatsAppEventsResponse 
} from '../services/whatsappConfig.service';
import { getErrorMessage } from '../utils/errorHandler';

const QUERY_KEY = 'whatsappConfig';

/**
 * Hook para crear una instancia de WhatsApp
 */
export const useCreateWhatsAppInstance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: WhatsAppCreateInstanceRequest) => 
      whatsappConfigService.createInstance(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['branchOffices'] });
      if (result.qr_code) {
        toast.success('Instancia creada. Escanea el código QR para conectar.');
      } else {
        toast.success(result.message || 'Instancia creada exitosamente.');
      }
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al crear la instancia de WhatsApp.');
      toast.error(message);
    },
  });
};

/**
 * Hook para obtener el código QR de una instancia
 */
export const useGetQRCode = () => {
  return useMutation({
    mutationFn: (instanceName: string) => 
      whatsappConfigService.getQRCode(instanceName),
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al obtener el código QR.');
      toast.error(message);
    },
  });
};

/**
 * Hook para obtener el estado de conexión de una instancia
 */
export const useConnectionStatus = (instanceName: string | undefined, enabled: boolean = true) => {
  return useQuery<WhatsAppStatusResponse, Error>({
    queryKey: [QUERY_KEY, 'status', instanceName],
    queryFn: () => whatsappConfigService.getConnectionStatus(instanceName!),
    enabled: !!instanceName && enabled,
    refetchInterval: enabled ? 10000 : false, // Verificar cada 10 segundos cuando enabled
    refetchIntervalInBackground: false,
    retry: 1,
  });
};

/**
 * Hook para verificar estado manualmente
 */
export const useCheckConnectionStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (instanceName: string) => 
      whatsappConfigService.getConnectionStatus(instanceName),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      if (result.is_connected) {
        toast.success('WhatsApp conectado correctamente.');
      }
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al verificar el estado.');
      toast.error(message);
    },
  });
};

/**
 * Hook para desconectar una instancia (logout)
 */
export const useLogoutInstance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (instanceName: string) => 
      whatsappConfigService.logoutInstance(instanceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Sesión de WhatsApp cerrada correctamente.');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al cerrar la sesión.');
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar una instancia
 */
export const useDeleteWhatsAppInstance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (instanceName: string) => 
      whatsappConfigService.deleteInstance(instanceName),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['branchOffices'] });
      toast.success(result.message || 'Instancia eliminada correctamente.');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al eliminar la instancia.');
      toast.error(message);
    },
  });
};

/**
 * Hook para reiniciar una instancia
 */
export const useRestartInstance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (instanceName: string) => 
      whatsappConfigService.restartInstance(instanceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Instancia reiniciada correctamente.');
    },
    onError: (error: any) => {
      const message = getErrorMessage(error, 'Error al reiniciar la instancia.');
      toast.error(message);
    },
  });
};

/**
 * Hook para obtener eventos de WhatsApp (para polling)
 */
export const useWhatsAppEvents = (instanceName: string | undefined, sinceTs?: string, enabled: boolean = true) => {
  return useQuery<WhatsAppEventsResponse, Error>({
    queryKey: [QUERY_KEY, 'events', instanceName, sinceTs],
    queryFn: () => whatsappConfigService.getEvents(instanceName!, sinceTs),
    enabled: !!instanceName && enabled,
    refetchInterval: 2500, // Polling cada 2.5 segundos
    retry: 1,
    staleTime: 0, // Siempre considerar los datos como stale para forzar refetch
  });
};

/**
 * Tipo para los callbacks del polling de eventos
 */
export interface WhatsAppEventPollingCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onQRCodeUpdated?: (qrCode: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook avanzado para polling de eventos con callbacks
 * Maneja automáticamente la actualización del QR y la detección de conexión
 * 
 * Optimización: Usa since_ts del último evento recibido para evitar
 * procesar eventos duplicados y reducir carga de red
 */
export const useWhatsAppEventPolling = (
  instanceName: string | undefined,
  enabled: boolean = false,
  callbacks?: WhatsAppEventPollingCallbacks
) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastQRCode, setLastQRCode] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'open' | 'close' | 'connecting' | null>(null);
  
  // Usamos un ref para el timestamp que se actualiza con cada evento
  const lastEventTimestampRef = useRef<string | null>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());
  
  // Contador para forzar re-fetch con nuevo timestamp
  const [fetchCounter, setFetchCounter] = useState(0);

  // Iniciar polling
  const startPolling = useCallback(() => {
    if (!instanceName) return;
    // Iniciar desde ahora, luego se actualizará con cada evento
    lastEventTimestampRef.current = new Date().toISOString();
    processedEventsRef.current.clear();
    setFetchCounter(0);
    setIsPolling(true);
  }, [instanceName]);

  // Detener polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    lastEventTimestampRef.current = null;
  }, []);

  // Query de eventos - usa fetchCounter para invalidar cuando hay nuevos eventos
  const eventsQuery = useQuery<WhatsAppEventsResponse, Error>({
    queryKey: [QUERY_KEY, 'events-polling', instanceName, fetchCounter],
    queryFn: () => whatsappConfigService.getEvents(instanceName!, lastEventTimestampRef.current || undefined),
    enabled: !!instanceName && isPolling && enabled,
    refetchInterval: 3000, // Cada 3 segundos (un poco más ligero)
    retry: 2,
    staleTime: 0,
    // No refetch en focus/reconnect para evitar duplicados
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Procesar eventos cuando lleguen
  useEffect(() => {
    if (!eventsQuery.data?.events || !isPolling) return;

    const events = eventsQuery.data.events;
    let hasNewEvents = false;
    let latestTimestamp: string | null = null;
    
    for (const event of events) {
      // Crear un ID único para evitar procesar el mismo evento dos veces
      const eventId = `${event.type}-${event.timestamp}`;
      if (processedEventsRef.current.has(eventId)) continue;
      
      processedEventsRef.current.add(eventId);
      hasNewEvents = true;
      
      // Trackear el timestamp más reciente
      if (!latestTimestamp || event.timestamp > latestTimestamp) {
        latestTimestamp = event.timestamp;
      }

      // Procesar según el tipo de evento
      switch (event.type) {
        case 'connection.update':
          const state = event.data?.state as 'open' | 'close' | 'connecting' | undefined;
          if (state) {
            setConnectionState(state);
            
            if (state === 'open') {
              callbacks?.onConnected?.();
              // Auto-detener el polling cuando se conecta
              stopPolling();
            } else if (state === 'close') {
              callbacks?.onDisconnected?.();
            }
          }
          break;

        case 'qrcode.updated':
          const qrCode = event.data?.qrcode;
          if (qrCode && qrCode !== lastQRCode) {
            setLastQRCode(qrCode);
            callbacks?.onQRCodeUpdated?.(qrCode);
          }
          break;
      }
    }
    
    // Actualizar el timestamp para el próximo fetch si hubo eventos nuevos
    if (hasNewEvents && latestTimestamp) {
      lastEventTimestampRef.current = latestTimestamp;
      // Incrementar contador para que el próximo query use el nuevo timestamp
      setFetchCounter(prev => prev + 1);
    }
  }, [eventsQuery.data, isPolling, callbacks, lastQRCode, stopPolling]);

  // Manejar errores
  useEffect(() => {
    if (eventsQuery.error && isPolling) {
      callbacks?.onError?.(eventsQuery.error);
    }
  }, [eventsQuery.error, isPolling, callbacks]);

  return {
    isPolling,
    startPolling,
    stopPolling,
    lastQRCode,
    connectionState,
    eventsQuery,
    // Reset state
    reset: useCallback(() => {
      stopPolling();
      setLastQRCode(null);
      setConnectionState(null);
      processedEventsRef.current.clear();
      setFetchCounter(0);
    }, [stopPolling]),
  };
};
