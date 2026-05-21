// src/features/inventory/pages/InventoryDashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  CubeIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';

// Este servicio tendría que ser implementado
// import { inventoryService } from '../../../services/inventory.service';

export const InventoryDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: dashboardData, isLoading } = useQuery(
  //   ['inventoryDashboard'],
  //   inventoryService.getDashboardData
  // );
  
  // Datos simulados para el ejemplo
  const dashboardData = {
    totalProducts: 45,
    totalWarehouses: 3,
    lowStockItems: 8, // Productos con stock bajo
    outOfStockItems: 2, // Productos sin stock
    recentMovements: [
      { 
        id: 1, 
        product: 'Casco de Seguridad', 
        type: 'SALE_EXIT', 
        quantity: -5, 
        warehouse: 'Almacén Principal',
        date: '2025-04-19'
      },
      { 
        id: 2, 
        product: 'Aceite Motor 15W40', 
        type: 'PURCHASE_ENTRY', 
        quantity: 20, 
        warehouse: 'Almacén Secundario',
        date: '2025-04-18'
      },
      { 
        id: 3, 
        product: 'Filtro de Aire', 
        type: 'ADJUSTMENT_OUT', 
        quantity: -2, 
        warehouse: 'Almacén Principal',
        date: '2025-04-18'
      }
    ],
    stockValue: 125450.75, // Valor total del inventario
    topMovedProducts: [
      { product: 'Aceite Motor 15W40', totalMovements: 45 },
      { product: 'Filtro de Aire', totalMovements: 32 },
      { product: 'Batería 12V', totalMovements: 28 }
    ]
  };
  
  const isLoading = false;
  
  const getMovementTypeDisplay = (type: string) => {
    switch (type) {
      case 'PURCHASE_ENTRY': return 'Entrada por Compra';
      case 'SALE_EXIT': return 'Salida por Venta';
      case 'INITIAL_STOCK': return 'Carga Inicial';
      case 'ADJUSTMENT_IN': return 'Ajuste de Entrada';
      case 'ADJUSTMENT_OUT': return 'Ajuste de Salida';
      case 'TRANSFER_IN': return 'Entrada por Transferencia';
      case 'TRANSFER_OUT': return 'Salida por Transferencia';
      default: return type;
    }
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dm-text-primary">Panel de Inventario</h1>
        <Button
          onClick={() => navigate('/inventory/movement/new')}
          className="flex items-center"
        >
          <ArrowUpIcon className="h-5 w-5 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Total de productos */}
        <div className="bg-dm-bg-primary rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <CubeIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-dm-text-muted text-sm">Total de Productos</h2>
              <p className="text-2xl font-semibold">{dashboardData.totalProducts}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/inventory/stock')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Ver Stock →
            </button>
          </div>
        </div>
        
        {/* Almacenes */}
        <div className="bg-dm-bg-primary rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary/10 text-secondary">
              <BuildingOfficeIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-dm-text-muted text-sm">Almacenes Activos</h2>
              <p className="text-2xl font-semibold">{dashboardData.totalWarehouses}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/inventory/warehouses')}
              className="text-secondary hover:text-secondary/80 text-sm font-medium"
            >
              Gestionar Almacenes →
            </button>
          </div>
        </div>
        
        {/* Productos con stock bajo */}
        <div className="bg-dm-bg-primary rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-warning/10 text-warning">
              <ExclamationTriangleIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-dm-text-muted text-sm">Stock Bajo</h2>
              <p className="text-2xl font-semibold">{dashboardData.lowStockItems}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/inventory/alerts')}
              className="text-warning hover:text-warning/80 text-sm font-medium"
            >
              Ver Alertas →
            </button>
          </div>
        </div>
        
        {/* Valor del inventario */}
        <div className="bg-dm-bg-primary rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success/10 text-success">
              <CubeIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-dm-text-muted text-sm">Valor del Inventario</h2>
              <p className="text-2xl font-semibold">
                S/ {dashboardData.stockValue.toLocaleString('es-PE')}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/inventory/valuation')}
              className="text-success hover:text-success/80 text-sm font-medium"
            >
              Ver Valorización →
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimientos recientes */}
        <div className="bg-dm-bg-primary rounded-lg shadow">
          <div className="px-6 py-4 border-b border-dm-border-primary flex justify-between items-center">
            <h2 className="text-lg font-medium">Movimientos Recientes</h2>
            <button
              onClick={() => navigate('/inventory/movements')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Ver Todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-dm-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                    Almacén
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dm-bg-primary divide-y divide-gray-200">
                {dashboardData.recentMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-dm-bg-secondary">
                    <td className="px-6 py-4 whitespace-nowrap">{movement.product}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dm-text-muted">
                      {getMovementTypeDisplay(movement.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${
                        movement.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dm-text-muted">
                      {movement.warehouse}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dm-text-muted">
                      {movement.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Productos más movidos */}
        <div className="bg-dm-bg-primary rounded-lg shadow">
          <div className="px-6 py-4 border-b border-dm-border-primary">
            <h2 className="text-lg font-medium">Productos Más Movidos</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.topMovedProducts.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-dm-bg-secondary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-dm-text-secondary">
                        {index + 1}
                      </span>
                    </div>
                    <span className="ml-3 text-sm font-medium text-dm-text-primary">
                      {item.product}
                    </span>
                  </div>
                  <span className="text-sm text-dm-text-muted">
                    {item.totalMovements} movimientos
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
