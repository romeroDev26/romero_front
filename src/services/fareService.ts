// src/services/fareService.ts
import api from '../config/api';
import { Fare, ServiceCategory, FareType } from '../types';

export interface CreateFareData {
  company_id: number;
  origin_port_id: number;
  destination_port_id: number;
  service_category: ServiceCategory;
  price: number;
  currency_code: string;
  tax_category_code: string;
  description: string;
  fare_type: FareType;
  route_id?: number;
  is_active?: boolean;
  effective_date: string;
  expiration_date?: string;
}

export interface UpdateFareData {
  price?: number;
  currency_code?: string;
  tax_category_code?: string;
  description?: string;
  is_active?: boolean;
  expiration_date?: string | null;
}

export interface FareFilters {
  company_id: number;
  origin_port_id?: number;
  destination_port_id?: number;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

export interface FindFareParams {
  company_id: number;
  origin_port_id: number;
  destination_port_id: number;
  service_category: ServiceCategory;
  on_date?: string;
}

class FareService {
  async createFare(data: CreateFareData): Promise<Fare> {
    const response = await api.post('/config/fares/', data);
    return response.data;
  }

  async listFares(filters: FareFilters): Promise<Fare[]> {
    if (!filters.company_id) {
      throw new Error("El 'company_id' es requerido para listar tarifas.");
    }

    const params = new URLSearchParams({
      company_id: filters.company_id.toString(),
    });

    if (filters.origin_port_id !== undefined) {
      params.append('origin_port_id', filters.origin_port_id.toString());
    }
    if (filters.destination_port_id !== undefined) {
      params.append('destination_port_id', filters.destination_port_id.toString());
    }
    if (filters.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString());
    }
    if (filters.skip !== undefined) {
      params.append('skip', filters.skip.toString());
    }
    if (filters.limit !== undefined) {
      params.append('limit', filters.limit.toString());
    } else {
      // Sin límite por defecto, cargar todos los registros
      params.append('limit', '10000');
    }

    const response = await api.get(`/config/fares/`, { params });
    return response.data;
  }

  async findFare(params: FindFareParams): Promise<Fare | null> {
    try {
      const response = await api.get(`/config/fares/find`, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateFare(fareId: number, data: UpdateFareData): Promise<Fare> {
    const response = await api.patch(`/config/fares/${fareId}`, data);
    return response.data;
  }

  async deactivateFare(fareId: number): Promise<Fare> {
    console.log(`Desactivando tarifa con ID: ${fareId}`);
    return this.updateFare(fareId, { is_active: false });
  }

  async createBatchFares(fares: CreateFareData[]): Promise<Fare[]> {
    const promises = fares.map(fare => this.createFare(fare));
    return Promise.all(promises);
  }

  async getMissingFaresForRoute(
    routeId: number,
    companyId: number,
    portIds: number[],
    serviceCategories: ServiceCategory[]
  ): Promise<{ origin_port_id: number; destination_port_id: number; service_category: ServiceCategory }[]> {
    const existingFares = await this.listFares({
      company_id: companyId,
      is_active: true,
      limit: 2000
    });

    const missingCombinations: { origin_port_id: number; destination_port_id: number; service_category: ServiceCategory }[] = [];

    for (let i = 0; i < portIds.length; i++) {
      for (let j = i + 1; j < portIds.length; j++) {
        for (const category of serviceCategories) {
          const originId = portIds[i];
          const destinationId = portIds[j];

          const exists = existingFares.some(fare =>
            fare.origin_port_id === originId &&
            fare.destination_port_id === destinationId &&
            fare.service_category === category &&
            fare.route_id === routeId
          );

          if (!exists) {
            missingCombinations.push({
              origin_port_id: originId,
              destination_port_id: destinationId,
              service_category: category
            });
          }
        }
      }
    }

    return missingCombinations;
  }

  async getFaresByRoute(routeId: number, companyId: number): Promise<Fare[]> {
    const allFares = await this.listFares({
      company_id: companyId,
      is_active: true,
      limit: 1000
    });

    return allFares.filter(fare => fare.route_id === routeId);
  }

  async cloneFaresFromRoute(
    sourceRouteId: number,
    targetRouteId: number,
    companyId: number,
    portMapping?: { [sourcePortId: number]: number }
  ): Promise<Fare[]> {
    const sourceFares = await this.getFaresByRoute(sourceRouteId, companyId);

    const newFares: CreateFareData[] = sourceFares.map(fare => ({
      company_id: companyId,
      origin_port_id: portMapping ? (portMapping[fare.origin_port_id] || fare.origin_port_id) : fare.origin_port_id,
      destination_port_id: portMapping ? (portMapping[fare.destination_port_id] || fare.destination_port_id) : fare.destination_port_id,
      service_category: fare.service_category,
      price: fare.price,
      currency_code: fare.currency_code,
      tax_category_code: fare.tax_category_code,
      description: fare.description || '',
      fare_type: fare.fare_type,
      route_id: targetRouteId,
      is_active: true,
      effective_date: new Date().toISOString().split('T')[0],
      expiration_date: fare.expiration_date
    }));

    return this.createBatchFares(newFares);
  }

  async saveFareMatrix(
    faresToCreate: CreateFareData[],
    faresToUpdate: { fareId: number; data: UpdateFareData }[]
  ): Promise<{ created: Fare[]; updated: Fare[] }> {
    const createPromises = faresToCreate.map(data => this.createFare(data));
    const updatePromises = faresToUpdate.map(item => this.updateFare(item.fareId, item.data));

    const [created, updated] = await Promise.all([
      Promise.all(createPromises),
      Promise.all(updatePromises),
    ]);

    return { created, updated };
  }
}

export default new FareService();
