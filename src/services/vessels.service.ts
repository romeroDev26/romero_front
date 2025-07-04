// src/services/vessels.service.ts
import api from '../config/api';
import { Vessel, VesselSeatConfiguration } from '../types';

// ========================================
// INTERFACES
// ========================================
export interface VesselCreateData {
  registration_number: string;
  name: string;
  capacity_weight_kg?: number;
  capacity_packages?: number;
  capacity_passengers?: number;
  company_id: number;
  is_active?: boolean;
}

export interface VesselUpdateData {
  registration_number?: string;
  name?: string;
  capacity_weight_kg?: number;
  capacity_packages?: number;
  capacity_passengers?: number;
  is_active?: boolean;
  total_columns?: number;
}

export interface VesselListParams {
  company_id: number; // OBLIGATORIO según la API
  skip?: number;
  limit?: number;
  is_active?: boolean;
}

export interface SeatConfigurationCreateData {
  seat_type_id: number;
  total_seats: number;
  // --- NUEVOS CAMPOS AÑADIDOS ---
  total_rows: number;
  total_columns?: number;
  // --- FIN DE NUEVOS CAMPOS ---
  deck_level?: number;
  notes?: string;
}

// Respuesta con configuraciones incluidas
export type VesselWithConfigurations = Omit<Vessel, 'seat_configurations'> & {
  seat_configurations?: VesselSeatConfiguration[];
  total_columns?: number;
};

// ========================================
// CLASE DE SERVICIO DE EMBARCACIONES
// ========================================
class VesselsService {
  private basePath = '/config/vessels/';

  // NUEVO MÉTODO: Para obtener todas las embarcaciones de una compañía
  async getAllForCompany(companyId: number): Promise<Vessel[]> {
    const response = await api.get(this.basePath, {
      params: { company_id: companyId, limit: 200 } // Pedimos un límite alto para tener todas
    });
    return response.data;
  }

  // Listar embarcaciones con filtros opcionales
  async getAll(params: VesselListParams): Promise<Vessel[]> {
    try {
      const response = await api.get<Vessel[]>(this.basePath, {
        params: {
          company_id: params.company_id,
          skip: params.skip || 0,
          limit: params.limit || 100,
          ...(params.is_active !== undefined && { is_active: params.is_active })
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo embarcaciones:', error);
      throw error;
    }
  }

  // Obtener embarcación por ID con configuraciones
  async getById(vesselId: number): Promise<VesselWithConfigurations> {
    try {
      const response = await api.get<VesselWithConfigurations>(`${this.basePath}${vesselId}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo embarcación ${vesselId}:`, error);
      throw error;
    }
  }

  // Crear nueva embarcación
  async create(vesselData: VesselCreateData): Promise<Vessel> {
    try {
      const response = await api.post<Vessel>(this.basePath, vesselData);
      return response.data;
    } catch (error) {
      console.error('Error creando embarcación:', error);
      throw error;
    }
  }

  // Actualizar embarcación
  async update(vesselId: number, vesselData: VesselUpdateData): Promise<Vessel> {
    try {
      const response = await api.patch<Vessel>(`${this.basePath}${vesselId}`, vesselData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando embarcación ${vesselId}:`, error);
      throw error;
    }
  }

  // Desactivar embarcación (borrado lógico)
  async delete(vesselId: number): Promise<Vessel> {
    try {
      const response = await api.delete<Vessel>(`${this.basePath}${vesselId}`);
      return response.data;
    } catch (error) {
      console.error(`Error eliminando embarcación ${vesselId}:`, error);
      throw error;
    }
  }

  // Añadir configuración de asientos a una embarcación
  async addSeatConfiguration(
    vesselId: number,
    config: SeatConfigurationCreateData
  ): Promise<VesselSeatConfiguration> {
    const response = await api.post<VesselSeatConfiguration>(
      `${this.basePath}${vesselId}/seat-configurations`,
      config
    );
    return response.data;
  }

  // Añadir múltiples configuraciones (helper que usa el método anterior)
  async addMultipleSeatConfigurations(
    vesselId: number,
    configs: SeatConfigurationCreateData[]
  ): Promise<VesselSeatConfiguration[]> {
    const promises = configs.map(config =>
      this.addSeatConfiguration(vesselId, config)
    );
    return Promise.all(promises);
  }

  // Eliminar configuración de asientos específica
  async deleteSeatConfiguration(configId: number): Promise<void> {
    await api.delete(`${this.basePath}seat-configurations/${configId}`);
  }
}

// ========================================
// OPERACIONES DE VALIDACIÓN Y UTILIDADES
// ========================================
export const vesselValidations = {
  // Validar número de matrícula
  validateRegistrationNumber: (registrationNumber: string): boolean => {
    // Formato: XX-XXXXX-XX (letras/números)
    const pattern = /^[A-Z]{2}-[A-Z0-9]{5}-[A-Z0-9]{2}$/;
    return pattern.test(registrationNumber);
  },
  // Validar capacidades
  validateCapacities: (vessel: VesselCreateData | VesselUpdateData): string[] => {
    const errors: string[] = [];
    if (vessel.capacity_weight_kg !== undefined && vessel.capacity_weight_kg < 0) {
      errors.push('La capacidad de peso no puede ser negativa');
    }
    if (vessel.capacity_packages !== undefined && vessel.capacity_packages < 0) {
      errors.push('La capacidad de bultos no puede ser negativa');
    }
    if (vessel.capacity_passengers !== undefined && vessel.capacity_passengers < 0) {
      errors.push('La capacidad de pasajeros no puede ser negativa');
    }
    return errors;
  },
  // Validar configuración de asientos
  validateSeatConfiguration: (
    configs: SeatConfigurationCreateData[],
    maxPassengers?: number
  ): string[] => {
    const errors: string[] = [];
    // Verificar que no haya tipos de asiento duplicados por cubierta
    const seatTypesByDeck = new Map<string, Set<number>>();
    configs.forEach((config, index) => {
      const deckKey = `deck-${config.deck_level || 1}`;
      if (!seatTypesByDeck.has(deckKey)) {
        seatTypesByDeck.set(deckKey, new Set());
      }
      const deckSeatTypes = seatTypesByDeck.get(deckKey)!;
      if (deckSeatTypes.has(config.seat_type_id)) {
        errors.push(
          `Configuración ${index + 1}: El tipo de asiento ya está configurado para la cubierta ${config.deck_level || 1}`
        );
      } else {
        deckSeatTypes.add(config.seat_type_id);
      }
      if (config.total_seats < 0) {
        errors.push(`Configuración ${index + 1}: El número de asientos no puede ser negativo`);
      }
    });
    // Verificar que el total de asientos no exceda la capacidad máxima
    if (maxPassengers) {
      const totalSeats = configs.reduce((sum, config) => sum + config.total_seats, 0);
      if (totalSeats > maxPassengers) {
        errors.push(
          `El total de asientos configurados (${totalSeats}) excede la capacidad máxima de pasajeros (${maxPassengers})`
        );
      }
    }
    return errors;
  }
};

// ========================================
// HELPERS PARA MANEJO DE DATOS
// ========================================
export const vesselHelpers = {
  // Calcular el total de asientos configurados
  getTotalConfiguredSeats: (vessel: VesselWithConfigurations): number => {
    if (!vessel.seat_configurations) return 0;
    return vessel.seat_configurations.reduce((total, config) => total + config.total_seats, 0);
  },
  // Obtener resumen de configuración por tipo de asiento
  getSeatConfigurationSummary: (vessel: VesselWithConfigurations) => {
    if (!vessel.seat_configurations) return [];
    const summary = vessel.seat_configurations.reduce((acc, config) => {
      const seatType = config.seat_type?.name || 'Sin tipo';
      if (!acc[seatType]) {
        acc[seatType] = {
          seatType,
          totalSeats: 0,
          decks: []
        };
      }
      acc[seatType].totalSeats += config.total_seats;
      acc[seatType].decks.push(config.deck_level);
      return acc;
    }, {} as Record<string, { seatType: string; totalSeats: number; decks: number[] }>);
    return Object.values(summary);
  },
  // Generar número de matrícula automático
  generateRegistrationNumber: (): string => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const randomNumber = Math.floor(Math.random() * 90000) + 10000;
    return `IQ-${randomNumber}-${currentYear}`;
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

export const vesselsService = new VesselsService();
