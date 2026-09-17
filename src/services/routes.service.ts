// src/services/routes.service.ts
import api from '../config/api';
import { Route, RouteStop } from '../types';

// ========================================
// INTERFACES (Ajustadas para la API)
// ========================================

export interface RouteStopCreateData {
  port_id: number;
  stop_order: number;
  estimated_duration_from_origin: string; // Formato ISO 8601 Duration
  is_boarding_allowed: boolean;
  is_disembarking_allowed: boolean;
  notes?: string;
}

export interface RouteCreateData {
  name: string;
  origin_port_id: number;
  destination_port_id: number;
  estimated_duration: string; // Formato ISO 8601: "P3D"
  estimated_duration_hours: number; // Campo para UI, se eliminará antes de enviar
  company_id: number;
  is_active?: boolean;
  stops: RouteStopCreateData[];
}

export interface RouteUpdateData {
  name?: string;
  origin_port_id?: number;
  destination_port_id?: number;
  estimated_duration?: string;
  estimated_duration_hours?: number; // Campo para UI, se eliminará antes de enviar
  is_active?: boolean;
}

export interface RouteListParams {
  company_id: number;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

// Para compatibilidad con tu código. `Route` ya incluye `stops`.
/**
 * Alias con nombre propio para una ruta que trae sus paradas. Hoy no agrega
 * campos sobre Route, pero se conserva porque expresa la intencion en las
 * firmas que lo usan.
 */
export type RouteWithStops = Route;

// ========================================
// SERVICIO DE RUTAS
// ========================================

export const routesService = {
  getAll: async (params: RouteListParams): Promise<Route[]> => {
    const response = await api.get<Route[]>('/config/routes/', { params });
    return response.data;
  },

  getById: async (routeId: number): Promise<RouteWithStops> => {
    const response = await api.get<RouteWithStops>(`/config/routes/${routeId}`);
    return response.data;
  },

  create: async (routeData: RouteCreateData): Promise<RouteWithStops> => {
    // Excluimos el campo de UI 'estimated_duration_hours' antes de enviarlo
    const { estimated_duration_hours, ...payload } = routeData;
    const response = await api.post<RouteWithStops>('/config/routes/', payload);
    return response.data;
  },

  update: async (routeId: number, routeData: RouteUpdateData): Promise<Route> => {
    // Excluimos el campo de UI 'estimated_duration_hours' antes de enviarlo
    const { estimated_duration_hours, ...payload } = routeData;
    const response = await api.patch<Route>(`/config/routes/${routeId}`, payload);
    return response.data;
  },

  delete: async (routeId: number): Promise<Route> => {
    // Borrado lógico. El backend debería cambiar is_active a false.
    const response = await api.delete<Route>(`/config/routes/${routeId}`);
    return response.data;
  },

  updateStops: async (routeId: number, stops: RouteStopCreateData[]): Promise<RouteStop[]> => {
    const response = await api.put<RouteStop[]>(`/config/routes/${routeId}/stops`, stops);
    return response.data;
  },

  syncTripStops: async (routeId: number, mode: string = 'append_new'): Promise<string> => {
    const response = await api.post<string>(`/config/routes/${routeId}/sync-trip-stops`, null, {
      params: { mode }
    });
    return response.data;
  }
};

// ========================================
// HELPERS (Lógica de conversión de duración)
// ========================================

export const routeHelpers = {
  hoursToISOString: (totalHours: number): string => {
    if (isNaN(totalHours) || totalHours <= 0) return "PT0S";

    const days = Math.floor(totalHours / 24);
    const remainingHours = Math.floor(totalHours) % 24;
    const minutes = Math.round((totalHours % 1) * 60);

    let duration = "P";
    if (days > 0) duration += `${days}D`;

    let timePart = "T";
    if (remainingHours > 0) timePart += `${remainingHours}H`;
    if (minutes > 0) timePart += `${minutes}M`;

    if (timePart === "T") {
      return duration === "P" ? "PT0S" : duration;
    }

    return duration + timePart;
  },

  isoStringToHours: (isoString: string | undefined | null): number => {
    if (!isoString || isoString === "PT0S") return 0;

    const regex = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/;
    const matches = isoString.match(regex);
    if (!matches) return 0;

    const days = parseInt(matches[1] || '0');
    const hours = parseInt(matches[2] || '0');
    const minutes = parseInt(matches[3] || '0');

    return (days * 24) + hours + (minutes / 60);
  },

  generateBasicStops: (originPortId: number, destinationPortId: number, totalDurationHours: number): RouteStopCreateData[] => {
    return [
      {
        port_id: originPortId,
        stop_order: 1,
        estimated_duration_from_origin: 'PT0S',
        is_boarding_allowed: true,
        is_disembarking_allowed: false,
        notes: 'Origen'
      },
      {
        port_id: destinationPortId,
        stop_order: 2,
        estimated_duration_from_origin: routeHelpers.hoursToISOString(totalDurationHours),
        is_boarding_allowed: false,
        is_disembarking_allowed: true,
        notes: 'Destino'
      }
    ];
  },

  getCurrentCompanyId: (): number => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return user.company_id || 1;
      } catch {
        return 1;
      }
    }
    return 1;
  }
};

// ========================================
// VALIDACIONES (Manteniendo las validaciones originales)
// ========================================

export const routeValidations = {
  validatePorts: (originPortId: number, destinationPortId: number): string | null => {
    if (originPortId === destinationPortId) {
      return 'El puerto de origen y destino deben ser diferentes';
    }
    return null;
  },

  validateStops: (stops: RouteStopCreateData[], originPortId: number, destinationPortId: number): string[] => {
    const errors: string[] = [];

    if (stops.length === 0) {
      errors.push('La ruta debe tener al menos las paradas de origen y destino');
      return errors;
    }

    if (stops[0].port_id !== originPortId) {
      errors.push('La primera parada debe ser el puerto de origen');
    }

    if (stops[stops.length - 1].port_id !== destinationPortId) {
      errors.push('La última parada debe ser el puerto de destino');
    }

    const orders = stops.map(s => s.stop_order);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    if (JSON.stringify(orders) !== JSON.stringify(sortedOrders)) {
      errors.push('El orden de las paradas debe ser secuencial');
    }

    for (let i = 1; i < stops.length; i++) {
      if (stops[i].port_id === stops[i - 1].port_id) {
        errors.push(`Puerto duplicado en paradas consecutivas ${i} y ${i + 1}`);
      }
    }

    stops.forEach((stop, index) => {
      if (index === 0 && stop.is_disembarking_allowed) {
        errors.push('No se permite desembarque en el puerto de origen');
      }
      if (index === stops.length - 1 && stop.is_boarding_allowed) {
        errors.push('No se permite embarque en el puerto de destino');
      }
    });

    stops.forEach((stop, index) => {
      if (stop.estimated_duration_from_origin) {
        if (index === 0 && stop.estimated_duration_from_origin !== 'PT0S') {
          errors.push('La duración desde el origen en la primera parada debe ser PT0S');
        }

        const durationPattern = /^PT(\d+H)?(\d+M)?(\d+S)?$/;
        if (!durationPattern.test(stop.estimated_duration_from_origin)) {
          errors.push(`Formato de duración inválido en parada ${index + 1}. Use formato ISO 8601 Duration`);
        }
      }
    });

    return errors;
  }
};
