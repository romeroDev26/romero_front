// src/features/accounting/services/sunatBatches.service.ts

import api from '../../../config/api';
import { 
  SummaryCreateData, 
  Summary, 
  VoidItem, 
  VoidCreateData, 
  Void 
} from '../types';

class SunatBatchesService {
  private readonly summariesPath = '/sunat/summaries';
  private readonly voidsPath = '/sunat/voids';

  // ===== RESÚMENES DIARIOS =====
  
  // Listar resúmenes
  async getSummaries(companyId: number): Promise<Summary[]> {
    const response = await api.get<Summary[]>(this.summariesPath, {
      params: { company_id: companyId }
    });
    return response.data;
  }

  // Obtener un resumen por ID
  async getSummaryById(id: number): Promise<Summary> {
    const response = await api.get<Summary>(`${this.summariesPath}/${id}`);
    return response.data;
  }

  // Crear un resumen diario
  async createSummary(data: SummaryCreateData): Promise<Summary> {
    const response = await api.post<Summary>(this.summariesPath, data);
    return response.data;
  }

  // Consultar estado de un resumen
  async checkSummaryStatus(id: number): Promise<Summary> {
    const response = await api.post<Summary>(`${this.summariesPath}/${id}/check-status`);
    return response.data;
  }

  // ===== COMUNICACIONES DE BAJA =====
  
  // Listar comunicaciones de baja
  async getVoids(companyId: number): Promise<Void[]> {
    const response = await api.get<Void[]>(this.voidsPath, {
      params: { company_id: companyId }
    });
    return response.data;
  }

  // Obtener una comunicación de baja por ID
  async getVoidById(id: number): Promise<Void> {
    const response = await api.get<Void>(`${this.voidsPath}/${id}`);
    return response.data;
  }

  // Crear una comunicación de baja
  async createVoid(data: VoidCreateData): Promise<Void> {
    const response = await api.post<Void>(this.voidsPath, data);
    return response.data;
  }

  // Consultar estado de una comunicación de baja
  async checkVoidStatus(id: number): Promise<Void> {
    const response = await api.post<Void>(`${this.voidsPath}/${id}/check-status`);
    return response.data;
  }
}

export const sunatBatchesService = new SunatBatchesService();
