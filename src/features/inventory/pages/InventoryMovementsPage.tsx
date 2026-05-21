// src/features/inventory/pages/InventoryMovementsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';

// Este servicio tendría que ser implementado
// import { inventoryService } from '../../../services/inventory.service';

export const InventoryMovementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: movementsData, isLoading } = useQuery(
  //   ['inventoryMovements', warehouseFilter, movementTypeFilter, startDate, endDate],
  //   () => inventoryService.getMovements({
  //     warehouseId: warehouseFilter,
  //     movementType: movementTypeFilter,
  //     startDate,
  //     endDate
  //   })
  // );
  
  // Datos simulados para el ejemplo
  const movementsData = {
    warehouses: [
      { id: 1, name: 'Almacén Principal' },
      { id: 2, name: 'Almacén Secundario' },
      { id: 3, name: 'Almacén Taller' }
    ],
    movements: [
      {
        id: 1,
        product: { id: 1, name: 'Aceite Motor 15W40', internal_code: 'ACE001', unit_code: 'LTR' },
        warehouse: { id: 1, name: 'Almacén Principal' },
        movement_date: '2025-04-19T10:30:00',
        movement_type: 'SALE_EXIT',
        quantity: -5,
        unit_cost: 35.00,
        balance_quantity: 145,
        balance_cost: 35.00,
        reference_doc_type: 'INVOICE',
        reference_doc_id: 'F001-00123',
        notes: 'Venta a Transportes Norte SAC'
      },
      {
        id: 2,
        product: { id: 2, name: 'Filtro de Aire', internal_code: 'FIL001', unit_code: 'NIU' },
        warehouse: { id: 1, name: 'Almacén Principal' },
        movement_date: '2025-04-19T09:15:00',
        movement_type: 'PURCHASE_ENTRY',
        quantity: 20,
        unit_cost: 40.00,
        balance_quantity: 40,
        balance_cost: 42.50,
        reference_doc_type: 'PURCHASE',
        reference_doc_id: 'OC-2025-054',
        notes: 'Compra a Proveedor ABC'
      },
      {
        id: 3,
        product: { id: 3, name: 'Batería 12V', internal_code: 'BAT001', unit_code: 'NIU' },
        warehouse: { id: 2, name: 'Almacén Secundario' },
        movement_date: '2025-04-18T16:45:00',
        movement_type: 'TRANSFER_IN',
        quantity: 5,
        unit_cost: 250.00,
        balance_quantity: 10,
        balance_cost: 250.00,
        reference_doc_type: 'TRANSFER',
        reference_doc_id: 'TRF-2025-018',
        notes: 'Transferencia desde Almacén Principal'
      },
      {
        id: 4,
        product: { id: 4, name: 'Casco de Seguridad', internal_code: 'SEG001', unit_code: 'NIU' },
        warehouse: { id: 3, name: 'Almacén Taller' },
        movement_date: '2025-04-18T14:20:00',
        movement_type: 'ADJUSTMENT_OUT',
        quantity: -2,
        unit_cost: 45.00,
        balance_quantity: 8,
        balance_cost: 45.00,
        reference_doc_type: 'ADJUSTMENT',
        reference_doc_id: 'AJ-2025-012',
        notes: 'Ajuste por deterioro de producto'
      }
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
  
  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE_ENTRY':
      case 'ADJUSTMENT_IN':
      case 'TRANSFER_IN':
      case 'INITIAL_STOCK':
        return 'text-green-600 dark:text-green-400';
      case 'SALE_EXIT':
      case 'ADJUSTMENT_OUT':
      case 'TRANSFER_OUT':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-dm-text-secondary';
    }
  };
  
  // Filtrar movimientos
  let filteredMovements = movementsData.movements;
  
  // Filtrar por almacén
  if (warehouseFilter !== 'ALL') {
    filteredMovements = filteredMovements.filter(
      movement => movement.warehouse.id === parseInt(warehouseFilter)
    );
  }
  
  // Filtrar por tipo de movimiento
  if (movementTypeFilter !== 'ALL') {
    filteredMovements = filteredMovements.filter(
      movement => movement.movement_type === movementTypeFilter
    );
  }
  
  // Filtrar por búsqueda
  if (searchTerm) {
    filteredMovements = filteredMovements.filter(movement => 
      movement.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.product.internal_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference_doc_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Filtrar por fechas
  if (startDate) {
    filteredMovements = filteredMovements.filter(
      movement => new Date(movement.movement_date) >= startDate
    );
  }
  if (endDate) {
    filteredMovements = filteredMovements.filter(
      movement => new Date(movement.movement_date) <= endDate
    );
  }
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dm-text-primary">Movimientos de Inventario</h1>
        <Button
          onClick={() => navigate('/inventory/movement/new')}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="bg-dm-bg-primary rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-dm-text-muted" />
            </div>
            <input
              type="text"
              className="pl-10 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
              placeholder="Buscar por producto o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="rounded-md border-dm-border-primary shadow-sm p-2 border"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="ALL">Todos los almacenes</option>
            {movementsData.warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id.toString()}>
                {warehouse.name}
              </option>
            ))}
          </select>
          
          <select
            className="rounded-md border-dm-border-primary shadow-sm p-2 border"
            value={movementTypeFilter}
            onChange={(e) => setMovementTypeFilter(e.target.value)}
          >
            <option value="ALL">Todos los tipos</option>
            <option value="PURCHASE_ENTRY">Entrada por Compra</option>
            <option value="SALE_EXIT">Salida por Venta</option>
            <option value="INITIAL_STOCK">Carga Inicial</option>
            <option value="ADJUSTMENT_IN">Ajuste de Entrada</option>
            <option value="ADJUSTMENT_OUT">Ajuste de Salida</option>
            <option value="TRANSFER_IN">Entrada por Transferencia</option>
            <option value="TRANSFER_OUT">Salida por Transferencia</option>
          </select>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-dm-text-muted" />
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="rounded-md border-dm-border-primary shadow-sm p-2 border"
              placeholderText="Desde fecha"
              dateFormat="dd/MM/yyyy"
              locale={es}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-dm-text-muted" />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="rounded-md border-dm-border-primary shadow-sm p-2 border"
              placeholderText="Hasta fecha"
              dateFormat="dd/MM/yyyy"
              locale={es}
            />
          </div>
        </div>
      </div>
      
      {/* Tabla de movimientos */}
      <div className="bg-dm-bg-primary rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-dm-bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Producto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Almacén
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Cantidad
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Costo Unit.
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Saldo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">
                Referencia
              </th>
            </tr>
          </thead>
          <tbody className="bg-dm-bg-primary divide-y divide-gray-200">
            {filteredMovements.map((movement) => (
              <tr key={movement.id} className="hover:bg-dm-bg-secondary">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dm-text-muted">
                  {new Date(movement.movement_date).toLocaleString('es-PE')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-dm-text-primary">
                    {movement.product.internal_code} - {movement.product.name}
                  </div>
                  <div className="text-sm text-dm-text-muted">
                    {movement.product.unit_code}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dm-text-muted">
                  {movement.warehouse.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                    {getMovementTypeDisplay(movement.movement_type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`text-sm font-medium ${
                    movement.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-dm-text-muted">
                  {movement.unit_cost ? `S/ ${movement.unit_cost.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {movement.balance_quantity}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-dm-text-primary">
                    {movement.reference_doc_id}
                  </div>
                  {movement.notes && (
                    <div className="text-sm text-dm-text-muted">
                      {movement.notes}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {filteredMovements.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-dm-text-muted">
                  No se encontraron movimientos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
