// src/features/inventory/pages/InventoryMovementFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

// Este servicio tendría que ser implementado
// import { inventoryService } from '../../../services/inventory.service';
// import { productsService } from '../../../services/products.service';

const movementSchema = z.object({
  product_id: z.number({
    required_error: 'Producto es requerido',
  }),
  warehouse_id: z.number({
    required_error: 'Almacén es requerido',
  }),
  movement_date: z.date({
    required_error: 'Fecha es requerida',
  }),
  movement_type: z.enum([
    'PURCHASE_ENTRY',
    'SALE_EXIT',
    'INITIAL_STOCK',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'TRANSFER_IN',
    'TRANSFER_OUT'
  ], {
    errorMap: () => ({ message: 'Tipo de movimiento es requerido' }),
  }),
  quantity: z.number()
    .min(0.01, 'Cantidad debe ser mayor a 0')
    .max(99999, 'Cantidad muy grande'),
  unit_cost: z.number()
    .min(0, 'Costo no puede ser negativo')
    .optional(),
  reference_doc_type: z.string().optional(),
  reference_doc_id: z.string().optional(),
  notes: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

export const InventoryMovementFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [movementType, setMovementType] = useState<string>('');
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery(
  //   ['warehouses'],
  //   inventoryService.getWarehouses
  // );
  
  // const { data: products, isLoading: isLoadingProducts } = useQuery(
  //   ['products'],
  //   productsService.getAll
  // );
  
  // Datos simulados para el ejemplo
  const warehouses = [
    { id: 1, name: 'Almacén Principal', address: 'Av. Industrial 123, Iquitos' },
    { id: 2, name: 'Almacén Secundario', address: 'Jr. Comercio 456, Iquitos' },
    { id: 3, name: 'Almacén Taller', address: 'Av. Participación 789, Iquitos' }
  ];
  
  const products = [
    { id: 1, name: 'Aceite Motor 15W40', internal_code: 'ACE001', unit_code: 'LTR', sale_price: 35.00 },
    { id: 2, name: 'Filtro de Aire', internal_code: 'FIL001', unit_code: 'NIU', sale_price: 45.00 },
    { id: 3, name: 'Batería 12V', internal_code: 'BAT001', unit_code: 'NIU', sale_price: 250.00 },
    { id: 4, name: 'Casco de Seguridad', internal_code: 'SEG001', unit_code: 'NIU', sale_price: 45.00 }
  ];
  
  const isLoadingWarehouses = false;
  const isLoadingProducts = false;
  
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movement_date: new Date(),
    },
  });
  
  // Observar cambios en el tipo de movimiento
  const selectedMovementType = watch('movement_type');
  
  useEffect(() => {
    setMovementType(selectedMovementType);
  }, [selectedMovementType]);
  
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
  
  const onSubmit = (data: MovementFormData) => {
    // En un proyecto real, llamarías a una API
    // inventoryService.createMovement(data);
    
    console.log('Guardando movimiento:', data);
    navigate('/inventory/movements');
  };
  
  if (isLoadingWarehouses || isLoadingProducts) {
    return <Spinner />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Movimiento de Inventario</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Movimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Movimiento *
              </label>
              <select
                {...register('movement_type')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="">Seleccione</option>
                <optgroup label="Entradas">
                  <option value="PURCHASE_ENTRY">Entrada por Compra</option>
                  <option value="INITIAL_STOCK">Carga Inicial</option>
                  <option value="ADJUSTMENT_IN">Ajuste de Entrada</option>
                  <option value="TRANSFER_IN">Entrada por Transferencia</option>
                </optgroup>
                <optgroup label="Salidas">
                  <option value="SALE_EXIT">Salida por Venta</option>
                  <option value="ADJUSTMENT_OUT">Ajuste de Salida</option>
                  <option value="TRANSFER_OUT">Salida por Transferencia</option>
                </optgroup>
              </select>
              {errors.movement_type && (
                <p className="mt-1 text-sm text-red-600">{errors.movement_type.message}</p>
              )}
            </div>
            
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <Controller
                control={control}
                name="movement_date"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    dateFormat="dd/MM/yyyy"
                    locale={es}
                    showTimeSelect={true}
                    timeFormat="HH:mm"
                  />
                )}
              />
              {errors.movement_date && (
                <p className="mt-1 text-sm text-red-600">{errors.movement_date.message}</p>
              )}
            </div>
            
            {/* Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto *
              </label>
              <select
                {...register('product_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="">Seleccione un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.internal_code} - {product.name}
                  </option>
                ))}
              </select>
              {errors.product_id && (
                <p className="mt-1 text-sm text-red-600">{errors.product_id.message}</p>
              )}
            </div>
            
            {/* Almacén */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Almacén *
              </label>
              <select
                {...register('warehouse_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="">Seleccione un almacén</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.warehouse_id && (
                <p className="mt-1 text-sm text-red-600">{errors.warehouse_id.message}</p>
              )}
            </div>
            
            {/* Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('quantity', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>
            
            {/* Costo Unitario */}
            {(movementType === 'PURCHASE_ENTRY' || movementType === 'INITIAL_STOCK') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('unit_cost', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
                {errors.unit_cost && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit_cost.message}</p>
                )}
              </div>
            )}
            
            {/* Tipo de Documento de Referencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento de Referencia
              </label>
              <select
                {...register('reference_doc_type')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="">Seleccione</option>
                {movementType === 'PURCHASE_ENTRY' && (
                  <>
                    <option value="PURCHASE_ORDER">Orden de Compra</option>
                    <option value="INVOICE">Factura de Compra</option>
                  </>
                )}
                {movementType === 'SALE_EXIT' && (
                  <>
                    <option value="INVOICE">Factura de Venta</option>
                    <option value="TICKET">Boleta</option>
                  </>
                )}
                {(movementType === 'TRANSFER_IN' || movementType === 'TRANSFER_OUT') && (
                  <option value="TRANSFER">Guía de Transferencia</option>
                )}
                {(movementType === 'ADJUSTMENT_IN' || movementType === 'ADJUSTMENT_OUT') && (
                  <option value="ADJUSTMENT">Acta de Ajuste</option>
                )}
              </select>
            </div>
            
            {/* Número de Documento de Referencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Documento de Referencia
              </label>
              <input
                type="text"
                {...register('reference_doc_id')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Ej: F001-00123"
              />
            </div>
            
            {/* Notas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas / Observaciones
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Observaciones adicionales del movimiento"
              />
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/inventory/movements')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Guardar Movimiento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
