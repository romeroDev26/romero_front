// src/features/inventory/pages/StockListPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';

// Este servicio tendría que ser implementado
// import { inventoryService } from '../../../services/inventory.service';

export const StockListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: stockData, isLoading } = useQuery(
  //   ['inventoryStock', warehouseFilter, stockStatusFilter],
  //   () => inventoryService.getStock({ warehouseId: warehouseFilter })
  // );
  
  // Datos simulados para el ejemplo
  const stockData = {
    warehouses: [
      { id: 1, name: 'Almacén Principal', address: 'Av. Industrial 123, Iquitos' },
      { id: 2, name: 'Almacén Secundario', address: 'Jr. Comercio 456, Iquitos' },
      { id: 3, name: 'Almacén Taller', address: 'Av. Participación 789, Iquitos' }
    ],
    stockItems: [
      {
        id: 1,
        product: { id: 1, name: 'Aceite Motor 15W40', internal_code: 'ACE001', unit_code: 'LTR', sale_price: 35.00 },
        warehouse: { id: 1, name: 'Almacén Principal' },
        quantity: 150,
        minStock: 50,
        value: 5250.00
      },
      {
        id: 2,
        product: { id: 2, name: 'Filtro de Aire', internal_code: 'FIL001', unit_code: 'NIU', sale_price: 45.00 },
        warehouse: { id: 1, name: 'Almacén Principal' },
        quantity: 20,
        minStock: 10,
        value: 900.00
      },
      {
        id: 3,
        product: { id: 3, name: 'Batería 12V', internal_code: 'BAT001', unit_code: 'NIU', sale_price: 250.00 },
        warehouse: { id: 2, name: 'Almacén Secundario' },
        quantity: 5,
        minStock: 3,
        value: 1250.00
      },
      {
        id: 4,
        product: { id: 4, name: 'Casco de Seguridad', internal_code: 'SEG001', unit_code: 'NIU', sale_price: 45.00 },
        warehouse: { id: 3, name: 'Almacén Taller' },
        quantity: 2,
        minStock: 5,
        value: 90.00
      },
      {
        id: 5,
        product: { id: 5, name: 'Guantes de Trabajo', internal_code: 'SEG002', unit_code: 'PAR', sale_price: 15.00 },
        warehouse: { id: 3, name: 'Almacén Taller' },
        quantity: 0,
        minStock: 10,
        value: 0.00
      }
    ]
  };
  
  const isLoading = false;
  
  // Filtrar items de stock
  let filteredStockItems = stockData.stockItems;
  
  // Filtrar por almacén
  if (warehouseFilter !== 'ALL') {
    filteredStockItems = filteredStockItems.filter(
      item => item.warehouse.id === parseInt(warehouseFilter)
    );
  }
  
  // Filtrar por estado de stock
  if (stockStatusFilter !== 'ALL') {
    if (stockStatusFilter === 'OUT_OF_STOCK') {
      filteredStockItems = filteredStockItems.filter(item => item.quantity === 0);
    } else if (stockStatusFilter === 'LOW_STOCK') {
      filteredStockItems = filteredStockItems.filter(
        item => item.quantity > 0 && item.quantity <= item.minStock
      );
    } else if (stockStatusFilter === 'IN_STOCK') {
      filteredStockItems = filteredStockItems.filter(item => item.quantity > item.minStock);
    }
  }
  
  // Filtrar por búsqueda
  if (searchTerm) {
    filteredStockItems = filteredStockItems.filter(item => 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.internal_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  const getStockStatusBadge = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
          Sin Stock
        </span>
      );
    } else if (quantity <= minStock) {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
          Stock Bajo
        </span>
      );
    } else {
      return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
          Disponible
        </span>
      );
    }
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dm-text-primary">Stock de Inventario</h1>
        <Button
          onClick={() => navigate('/inventory/adjustment')}
          className="flex items-center"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          Ajuste de Inventario
        </Button>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-dm-text-muted" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="rounded-md border-dm-border-primary shadow-sm p-2 border"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="ALL">Todos los almacenes</option>
            {stockData.warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id.toString()}>
                {warehouse.name}
              </option>
            ))}
          </select>
          
          <select
            className="rounded-md border-dm-border-primary shadow-sm p-2 border"
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos los estados</option>
            <option value="IN_STOCK">Disponible</option>
            <option value="LOW_STOCK">Stock Bajo</option>
            <option value="OUT_OF_STOCK">Sin Stock</option>
          </select>
        </div>
      </div>
      
      {/* Tabla de stock */}
      <div className="bg-dm-bg-primary rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-dm-bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Código
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Producto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Almacén
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Cantidad
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Stock Mín.
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-dm-bg-primary divide-y divide-gray-200">
            {filteredStockItems.map((item) => (
              <tr 
                key={item.id} 
                className="hover:bg-dm-bg-secondary cursor-pointer"
                onClick={() => navigate(`/inventory/product/${item.product.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-primary">
                    {item.product.internal_code}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-dm-text-primary">{item.product.name}</div>
                  <div className="text-sm text-dm-text-muted">{item.product.unit_code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dm-text-muted">
                  {item.warehouse.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-dm-text-muted">
                  {item.minStock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  S/ {item.value.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStockStatusBadge(item.quantity, item.minStock)}
                </td>
              </tr>
            ))}
            
            {filteredStockItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-dm-text-muted">
                  No se encontraron items de inventario
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
