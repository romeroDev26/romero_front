import api from '../config/api';
import { City, Port, PortType } from '../types';

// ========================================
// INTERFACES
// ========================================
export interface CityCreateData {
  name: string;
  code: string;
  ubigeo: string;
  department: string;
  province: string;
  country_code: string;
  is_active?: boolean;
}

export interface CityUpdateData {
  name?: string;
  code?: string;
  ubigeo?: string;
  department?: string;
  province?: string;
  country_code?: string;
  is_active?: boolean;
}

export interface CityListParams {
  skip?: number;
  limit?: number;
}

export interface PortCreateData {
  name: string;
  ubigeo: string;
  address: string;
  city_id: number;
  port_type: PortType; 
  is_active?: boolean;
}

export interface PortUpdateData {
  name?: string;
  ubigeo?: string;
  address?: string;
  city_id?: number;
  port_type?: PortType; 
  is_active?: boolean;
}

export interface PortListParams {
  is_active?: boolean;
  company_id?: number;
  skip?: number;
  limit?: number;
  city_id?: number;
}

// ========================================
// SERVICIO DE CIUDADES
// ========================================
export const citiesConfigService = {
  getAll: async (params: CityListParams = {}): Promise<City[]> => {
    const { skip = 0, limit = 100 } = params;
    const response = await api.get<City[]>('/config/cities/', {
      params: { skip, limit }
    });
    return response.data;
  },

  getById: async (cityId: number): Promise<City> => {
    const response = await api.get<City>(`/config/cities/${cityId}`);
    return response.data;
  },

  create: async (cityData: CityCreateData): Promise<City> => {
    const response = await api.post<City>('/config/cities/', cityData);
    return response.data;
  },

  update: async (cityId: number, cityData: CityUpdateData): Promise<City> => {
    const response = await api.patch<City>(`/config/cities/${cityId}`, cityData);
    return response.data;
  },

  deactivate: async (cityId: number): Promise<City> => {
    const response = await api.delete<City>(`/config/cities/${cityId}`);
    return response.data;
  }
};

// ========================================
// SERVICIO DE PUERTOS
// ========================================
export const portsConfigService = {
  getAll: async (params: PortListParams = {}): Promise<Port[]> => {
    const { is_active = true, skip = 0, limit = 100, city_id } = params;
    const response = await api.get<Port[]>('/config/ports/', {
      params: { is_active, skip, limit, city_id }
    });
    return response.data;
  },

  getById: async (portId: number): Promise<Port> => {
    const response = await api.get<Port>(`/config/ports/${portId}`);
    return response.data;
  },

  create: async (portData: PortCreateData): Promise<Port> => {
    const response = await api.post<Port>('/config/ports/', portData);
    return response.data;
  },

  update: async (portId: number, portData: PortUpdateData): Promise<Port> => {
    const response = await api.patch<Port>(`/config/ports/${portId}`, portData);
    return response.data;
  },

  deactivate: async (portId: number): Promise<Port> => {
    const response = await api.delete<Port>(`/config/ports/${portId}`);
    return response.data;
  }
};
