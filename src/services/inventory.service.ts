// src/services/inventory.service.ts
import api from '../config/api';
import { 
  Warehouse, 
  InventoryStock, 
  InventoryMovement, 
  InventoryAdjustment 
} from '../types';

export const inventoryService = {
  // ALMACENES
  getWarehouses: async (): Promise<Warehouse[]> => {
    const response = await api.get('/warehouses');
    return response.data;
  },
  
  getWarehouseById: async (id: number): Promise<Warehouse> => {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  },
  
  createWarehouse: async (warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>): Promise<Warehouse> => {
    const response = await api.post('/warehouses', warehouse);
    return response.data;
  },
  
  updateWarehouse: async (id: number, warehouse: Partial<Warehouse>): Promise<Warehouse> => {
    const response = await api.put(`/warehouses/${id}`, warehouse);
    return response.data;
  },
  
  // STOCK
  getStock: async (params?: {
    warehouseId?: number;
    productId?: number;
    minStock?: boolean;
  }): Promise<InventoryStock[]> => {
    const response = await api.get('/inventory/stock', { params });
    return response.data;
  },
  
  getStockByProduct: async (productId: number): Promise<InventoryStock[]> => {
    const response = await api.get(`/inventory/stock/product/${productId}`);
    return response.data;
  },
  
  // MOVIMIENTOS
  getMovements: async (params?: {
    warehouseId?: number;
    productId?: number;
    movementType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: InventoryMovement[]; total: number }> => {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },
  
  getMovementById: async (id: number): Promise<InventoryMovement> => {
    const response = await api.get(`/inventory/movements/${id}`);
    return response.data;
  },
  
  createMovement: async (movement: Omit<InventoryMovement, 'id' | 'created_at'>): Promise<InventoryMovement> => {
    const response = await api.post('/inventory/movements', movement);
    return response.data;
  },
  
  // AJUSTES DE INVENTARIO
  createAdjustment: async (adjustment: InventoryAdjustment): Promise<InventoryMovement> => {
    const response = await api.post('/inventory/adjustments', adjustment);
    return response.data;
  },
  
  // REPORTES
  getDashboardData: async () => {
    const response = await api.get('/inventory/dashboard');
    return response.data;
  },
  
  getLowStockProducts: async (warehouseId?: number) => {
    const response = await api.get('/inventory/alerts/low-stock', { 
      params: { warehouseId } 
    });
    return response.data;
  },
  
  getStockValue: async (warehouseId?: number) => {
    const response = await api.get('/inventory/reports/stock-value', { 
      params: { warehouseId } 
    });
    return response.data;
  },
  
  generateKardex: async (productId: number, params?: {
    warehouseId?: number;
    startDate?: Date;
    endDate?: Date;
  }) => {
    const response = await api.get(`/inventory/reports/kardex/${productId}`, { params });
    return response.data;
  }
};
