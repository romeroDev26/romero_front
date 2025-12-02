// src/features/accounting/services/sunatBatches.service.ts
import api from '../../../config/api';
import { VoidDocument, VoidDocumentCreateData } from '../types';

/**
 * Servicio para gestionar comunicaciones de baja con SUNAT
 */
export const sunatBatchesService = {
  /**
   * Obtener todas las comunicaciones de baja de una empresa
   */
  getVoids: async (companyId: number): Promise<VoidDocument[]> => {
    const response = await api.get<VoidDocument[]>(`/accounting/voids/by-company/${companyId}`);
    return response.data;
  },

  /**
   * Obtener una comunicación de baja por ID
   */
  getVoidById: async (id: number): Promise<VoidDocument> => {
    const response = await api.get<VoidDocument>(`/accounting/voids/${id}`);
    return response.data;
  },

  /**
   * Crear una comunicación de baja
   */
  createVoid: async (data: VoidDocumentCreateData): Promise<VoidDocument> => {
    const response = await api.post<VoidDocument>('/accounting/voids/', data);
    return response.data;
  },

  /**
   * Verificar el estado de una comunicación de baja en SUNAT
   */
  checkVoidStatus: async (id: number): Promise<VoidDocument> => {
    const response = await api.post<VoidDocument>(`/accounting/voids/${id}/check-status`);
    return response.data;
  },
};
