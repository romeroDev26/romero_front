// src/services/seat-types.service.ts
import api from '../config/api';
import { SeatType } from '../types';

// ========================================
// INTERFACES
// ========================================

export interface SeatTypeCreateData {
  name: string;
  code: string;
  description?: string;
  price_multiplier: number;
  display_order: number;
  is_active?: boolean;
}

export interface SeatTypeUpdateData {
  name?: string;
  code?: string;
  description?: string;
  price_multiplier?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface SeatTypeListParams {
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

// ========================================
// SERVICIO DE TIPOS DE ASIENTO
// ========================================

export const seatTypesService = {
  getAll: async (params: SeatTypeListParams = {}): Promise<SeatType[]> => {
    const { is_active = true, skip = 0, limit = 100 } = params;
    const response = await api.get<SeatType[]>('/config/seat-types/', {
      params: { is_active, skip, limit }
    });
    return response.data;
  },

  getById: async (seatTypeId: number): Promise<SeatType> => {
    const response = await api.get<SeatType>(`/config/seat-types/${seatTypeId}`);
    return response.data;
  },

  create: async (seatTypeData: SeatTypeCreateData): Promise<SeatType> => {
    const response = await api.post<SeatType>('/config/seat-types/', seatTypeData);
    return response.data;
  },

  update: async (seatTypeId: number, seatTypeData: SeatTypeUpdateData): Promise<SeatType> => {
    const response = await api.patch<SeatType>(`/config/seat-types/${seatTypeId}`, seatTypeData);
    return response.data;
  },

  delete: async (seatTypeId: number): Promise<SeatType> => {
    const response = await api.delete<SeatType>(`/config/seat-types/${seatTypeId}`);
    return response.data;
  }
};