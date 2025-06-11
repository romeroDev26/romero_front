// src/services/routes.service.ts
import api from '../config/api';
import { Route, RouteStop } from '../types';

// ========================================
// INTERFACES
// ========================================

export interface RouteStopCreateData {
  port_id: number;
  stop_order: number;
  estimated_duration_from_origin: string; // Formato HH:MM:SS según los ejemplos
  is_boarding_allowed: boolean;
  is_disembarking_allowed: boolean;
  notes?: string;
}

export interface RouteCreateData {
  name: string;
  origin_port_id: number;
  destination_port_id: number;
  estimated_duration?: string;  // Formato ISO8601: "P3D"
  estimated_duration_hours?: number;
  company_id: number;
  is_active?: boolean;
  stops: RouteStopCreateData[];
}

export interface RouteUpdateData {
  name?: string;
  origin_port_id?: number;
  destination_port_id?: number;
  estimated_duration?: string;
  estimated_duration_hours?: number;
  is_active?: boolean;
}

export interface RouteListParams {
  company_id: number; // OBLIGATORIO según la API
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

// Respuesta con paradas incluidas
export interface RouteWithStops extends Route {
  route_stops?: RouteStop[];
  origin_port?: any;
  destination_port?: any;
}

// ========================================
// SERVICIO DE RUTAS
// ========================================

export const routesService = {
  // Listar rutas
  getAll: async (params: RouteListParams): Promise<Route[]> => {
    try {
      const response = await api.get<Route[]>('/config/routes/', {
        params: {
          company_id: params.company_id,
          is_active: params.is_active !== undefined ? params.is_active : true,
          skip: params.skip || 0,
          limit: params.limit || 100
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo rutas:', error);
      throw error;
    }
  },

  // Obtener ruta por ID con paradas
  getById: async (routeId: number): Promise<RouteWithStops> => {
    try {
      const response = await api.get<RouteWithStops>(`/config/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo ruta ${routeId}:`, error);
      throw error;
    }
  },

  // Crear nueva ruta con paradas
  create: async (routeData: RouteCreateData): Promise<RouteWithStops> => {
    try {
      const response = await api.post<RouteWithStops>('/config/routes/', routeData);
      return response.data;
    } catch (error) {
      console.error('Error creando ruta:', error);
      throw error;
    }
  },

  // Actualizar detalles de ruta (sin paradas)
  update: async (routeId: number, routeData: RouteUpdateData): Promise<Route> => {
    try {
      const response = await api.patch<Route>(`/config/routes/${routeId}`, routeData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando ruta ${routeId}:`, error);
      throw error;
    }
  },

  // Desactivar ruta (borrado lógico)
  delete: async (routeId: number): Promise<Route> => {
    try {
      const response = await api.delete<Route>(`/config/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error eliminando ruta ${routeId}:`, error);
      throw error;
    }
  },

  // ========================================
  // GESTIÓN DE PARADAS
  // ========================================

  // Reemplazar todas las paradas de una ruta
  updateStops: async (
    routeId: number, 
    stops: RouteStopCreateData[]
  ): Promise<RouteStop[]> => {
    try {
      const response = await api.put<RouteStop[]>(
        `/config/routes/${routeId}/stops`,
        stops
      );
      return response.data;
    } catch (error) {
      console.error(`Error actualizando paradas de ruta ${routeId}:`, error);
      throw error;
    }
  }
};

// ========================================
// OPERACIONES DE VALIDACIÓN Y UTILIDADES
// ========================================

export const routeValidations = {
  // Validar que origen y destino sean diferentes
  validatePorts: (originPortId: number, destinationPortId: number): string | null => {
    if (originPortId === destinationPortId) {
      return 'El puerto de origen y destino deben ser diferentes';
    }
    return null;
  },

  // Validar paradas de ruta
  validateStops: (stops: RouteStopCreateData[], originPortId: number, destinationPortId: number): string[] => {
    const errors: string[] = [];
    
    if (stops.length === 0) {
      errors.push('La ruta debe tener al menos las paradas de origen y destino');
      return errors;
    }
    
    // Verificar que la primera parada sea el origen
    if (stops[0].port_id !== originPortId) {
      errors.push('La primera parada debe ser el puerto de origen');
    }
    
    // Verificar que la última parada sea el destino
    if (stops[stops.length - 1].port_id !== destinationPortId) {
      errors.push('La última parada debe ser el puerto de destino');
    }
    
    // Verificar orden de paradas
    const orders = stops.map(s => s.stop_order);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    if (JSON.stringify(orders) !== JSON.stringify(sortedOrders)) {
      errors.push('El orden de las paradas debe ser secuencial');
    }
    
    // Verificar que no haya puertos duplicados consecutivos
    for (let i = 1; i < stops.length; i++) {
      if (stops[i].port_id === stops[i - 1].port_id) {
        errors.push(`Puerto duplicado en paradas consecutivas ${i} y ${i + 1}`);
      }
    }
    
    // Validar permisos de embarque/desembarque
    stops.forEach((stop, index) => {
      if (index === 0 && stop.is_disembarking_allowed) {
        errors.push('No se permite desembarque en el puerto de origen');
      }
      if (index === stops.length - 1 && stop.is_boarding_allowed) {
        errors.push('No se permite embarque en el puerto de destino');
      }
    });
    
    // Validar duración estimada
    stops.forEach((stop, index) => {
      if (stop.estimated_duration_from_origin) {
        if (index === 0 && stop.estimated_duration_from_origin !== '00:00:00') {
          errors.push('La duración desde el origen en la primera parada debe ser 00:00:00');
        }
        
        // Validar formato HH:MM:SS
        const durationPattern = /^\d{2}:\d{2}:\d{2}$/;
        if (!durationPattern.test(stop.estimated_duration_from_origin)) {
          errors.push(`Formato de duración inválido en parada ${index + 1}. Use HH:MM:SS`);
        }
      }
    });
    
    return errors;
  }
};

// ========================================
// HELPERS PARA MANEJO DE DATOS
// ========================================

export const routeHelpers = {
  // Convertir horas a formato HH:MM:SS
  hoursToTimeString: (hours: number): string => {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  },

  // Convertir formato HH:MM:SS a horas decimales
  timeStringToHours: (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours + minutes / 60 + (seconds || 0) / 3600;
  },

  // Calcular duración total de la ruta basada en las paradas
  calculateTotalDuration: (stops: RouteStop[]): number => {
    if (stops.length === 0) return 0;
    
    const lastStop = stops[stops.length - 1];
    if (!lastStop.estimated_duration_from_origin) return 0;
    
    return routeHelpers.timeStringToHours(lastStop.estimated_duration_from_origin);
  },

  // Obtener paradas intermedias (excluyendo origen y destino)
  getIntermediateStops: (route: RouteWithStops): RouteStop[] => {
    if (!route.route_stops || route.route_stops.length <= 2) return [];
    return route.route_stops.slice(1, -1);
  },

  // Generar estructura de paradas básica para una ruta nueva
  generateBasicStops: (originPortId: number, destinationPortId: number): RouteStopCreateData[] => {
    return [
      {
        port_id: originPortId,
        stop_order: 1,
        estimated_duration_from_origin: '00:00:00',
        is_boarding_allowed: true,
        is_disembarking_allowed: false,
        notes: 'Puerto de origen'
      },
      {
        port_id: destinationPortId,
        stop_order: 2,
        estimated_duration_from_origin: '00:00:00', // Debe ser actualizado
        is_boarding_allowed: false,
        is_disembarking_allowed: true,
        notes: 'Puerto de destino'
      }
    ];
  },

  // Verificar si una ruta es circular
  isCircularRoute: (route: Route): boolean => {
    return route.origin_port_id === route.destination_port_id;
  },

  // Calcular tiempo estimado entre dos paradas
  calculateTimeBetweenStops: (fromStop: RouteStop, toStop: RouteStop): number | null => {
    if (!fromStop.estimated_duration_from_origin || !toStop.estimated_duration_from_origin) {
      return null;
    }
    
    const fromHours = routeHelpers.timeStringToHours(fromStop.estimated_duration_from_origin);
    const toHours = routeHelpers.timeStringToHours(toStop.estimated_duration_from_origin);
    
    return toHours - fromHours;
  },

  // Helper para obtener el company_id del usuario actual
  getCurrentCompanyId: (): number => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.company_id || 1;
    }
    return 1; // valor por defecto
  }
};