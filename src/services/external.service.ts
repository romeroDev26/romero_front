// src/services/external.service.ts
import api from '../config/api';

// Interfaces para tipar las respuestas de la API
export interface DniResponse {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  digitoVerificador: string;
}

export interface RucResponse {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion: string;
  estado: string;
  condicion: string;
  // Añadir más campos si la API los devuelve
}

class ExternalQueryService {
  async queryDni(dni: string): Promise<DniResponse> {
    const response = await api.get<DniResponse>('/external/query-dni', {
      params: { dni },
    });
    return response.data;
  }

  async queryRuc(ruc: string): Promise<RucResponse> {
    const response = await api.get<RucResponse>('/external/query-ruc', {
      params: { ruc },
    });
    return response.data;
  }
}

export const externalQueryService = new ExternalQueryService();