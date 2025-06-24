// src/services/scheduled-templates.service.ts
import api from '../config/api';
import { ScheduledRouteTemplate } from '../types';

export interface CreateScheduledTemplateData {
  company_id: number;
  route_id: number;
  template_name: string;
  day_of_week: number; // 1=Lunes, 7=Domingo
  departure_time: string; // formato "HH:MM:SS"
  vessel_id?: number;
  is_active?: boolean;
  auto_generate_trips?: boolean;
  generate_weeks_ahead?: number;
}

export interface UpdateScheduledTemplateData {
  template_name?: string;
  vessel_id?: number;
  is_active?: boolean;
  auto_generate_trips?: boolean;
  generate_weeks_ahead?: number;
}

class ScheduledTemplatesService {
  // Aseguramos que el basePath tenga una barra final
  private basePath = '/config/scheduled_templates/';

  // Crear nueva plantilla
  async create(data: CreateScheduledTemplateData): Promise<ScheduledRouteTemplate> {
    const response = await api.post(this.basePath, data);
    return response.data;
  }

  // Listar plantillas por compañía
  async getByCompany(companyId: number, skip = 0, limit = 100): Promise<ScheduledRouteTemplate[]> {
    const response = await api.get(`${this.basePath}by-company/${companyId}`, {
      params: { skip, limit }
    });
    return response.data;
  }

  // Obtener plantilla por ID
  async getById(templateId: number): Promise<ScheduledRouteTemplate> {
    const response = await api.get(`${this.basePath}${templateId}`);
    return response.data;
  }

  // Actualizar plantilla
  async update(templateId: number, data: UpdateScheduledTemplateData): Promise<ScheduledRouteTemplate> {
    const response = await api.patch(`${this.basePath}${templateId}`, data);
    return response.data;
  }

  // Desactivar plantilla (borrado lógico)
  async deactivate(templateId: number): Promise<ScheduledRouteTemplate> {
    const response = await api.delete(`${this.basePath}${templateId}`);
    return response.data;
  }
}

export const scheduledTemplatesService = new ScheduledTemplatesService();