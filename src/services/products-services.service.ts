// src/services/products-services.service.ts
import api from '../config/api';
import { ProductService, ServiceCategory } from '../types';

// Interfaces para la creación y actualización de datos.
export interface ProductServiceCreateRequest {
  internal_code?: string;
  name: string;
  description?: string;
  item_type: 'PRODUCT' | 'SERVICE';
  service_category?: ServiceCategory;
  unit_code: string;
  purchase_price?: number;
  sale_price: number;
  currency_code: string;
  tax_category_code: string;
  unspcs_code?: string;
  is_active: boolean;
  specific_route_id?: number | null;
}

// Para actualizar, todos los campos son opcionales.
export type ProductServiceUpdateRequest = Partial<ProductServiceCreateRequest>;

// Interfaz para los filtros de la API.
export interface ProductServiceFilters {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  item_type?: 'PRODUCT' | 'SERVICE';
  name?: string;
  service_category?: string;
}

class ProductsServicesService {
  private readonly basePath = '/config/products-services';

  // GET /.../ (Listar)
  async getList(filters: ProductServiceFilters = {}): Promise<ProductService[]> {
    const params = new URLSearchParams();
    
    // Valores por defecto según la documentación
    if (filters.skip !== undefined) {
      params.append('skip', String(filters.skip));
    }
    if (filters.limit !== undefined) {
      params.append('limit', String(filters.limit));
    }
    
    // Filtros opcionales
    if (filters.is_active !== undefined) {
      params.append('is_active', String(filters.is_active));
    }
    if (filters.item_type) {
      params.append('item_type', filters.item_type);
    }
    if (filters.name) {
      params.append('name', filters.name);
    }
    if (filters.service_category) {
      params.append('service_category', filters.service_category);
    }

    const response = await api.get(`${this.basePath}/`, { params });
    return response.data;
  }

  // GET /.../{id} (Obtener uno)
  async getById(id: number): Promise<ProductService> {
    const response = await api.get(`${this.basePath}/${id}`);
    return response.data;
  }

  // POST /.../ (Crear)
  async create(data: ProductServiceCreateRequest): Promise<ProductService> {
    // Asegurar que los valores numéricos se envíen correctamente
    const payload = {
      ...data,
      purchase_price: data.purchase_price ?? 0,
      sale_price: data.sale_price,
      specific_route_id: data.specific_route_id ?? 0
    };
    
    const response = await api.post(`${this.basePath}/`, payload);
    return response.data;
  }

  // PATCH /.../{id} (Actualizar)
  async update(id: number, data: ProductServiceUpdateRequest): Promise<ProductService> {
    // Solo enviar campos que realmente se quieren actualizar
    const payload: Partial<ProductServiceUpdateRequest> = {};
    
    if (data.internal_code !== undefined) payload.internal_code = data.internal_code;
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.item_type !== undefined) payload.item_type = data.item_type;
    if (data.service_category !== undefined) payload.service_category = data.service_category;
    if (data.unit_code !== undefined) payload.unit_code = data.unit_code;
    if (data.purchase_price !== undefined) payload.purchase_price = data.purchase_price;
    if (data.sale_price !== undefined) payload.sale_price = data.sale_price;
    if (data.currency_code !== undefined) payload.currency_code = data.currency_code;
    if (data.tax_category_code !== undefined) payload.tax_category_code = data.tax_category_code;
    if (data.unspcs_code !== undefined) payload.unspcs_code = data.unspcs_code;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    if (data.specific_route_id !== undefined) payload.specific_route_id = data.specific_route_id;
    
    const response = await api.patch(`${this.basePath}/${id}`, payload);
    return response.data;
  }

  // DELETE /.../{id} (Eliminar/Desactivar)
  async delete(id: number): Promise<ProductService> {
    const response = await api.delete(`${this.basePath}/${id}`);
    return response.data;
  }
  
  // --- Métodos de Ayuda ---
  
  // Obtener solo servicios
  async getServices(filters: Omit<ProductServiceFilters, 'item_type'> = {}): Promise<ProductService[]> {
    return this.getList({ ...filters, item_type: 'SERVICE' });
  }

  // Obtener solo productos
  async getProducts(filters: Omit<ProductServiceFilters, 'item_type'> = {}): Promise<ProductService[]> {
    return this.getList({ ...filters, item_type: 'PRODUCT' });
  }

  // Obtener solo elementos activos
  async getActive(filters: Omit<ProductServiceFilters, 'is_active'> = {}): Promise<ProductService[]> {
    return this.getList({ ...filters, is_active: true });
  }

  // Buscar por nombre
  async searchByName(searchTerm: string, filters: Omit<ProductServiceFilters, 'name'> = {}): Promise<ProductService[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }
    
    return this.getList({ 
      ...filters, 
      name: searchTerm.trim() 
    });
  }
}

export const productsServicesService = new ProductsServicesService();