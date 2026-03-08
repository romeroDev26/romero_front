import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { TableCellsIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { ProductService } from '../../../types';

// Unidades de medida
const UNITS = [
  { code: 'NIU', name: 'Unidad' },
  { code: 'KGM', name: 'Kilogramo' },
  { code: 'TNE', name: 'Tonelada' },
  { code: 'M3', name: 'Metro Cúbico' },
  { code: 'LTR', name: 'Litro' },
  { code: 'KTM', name: 'Kilómetro' },
  { code: 'HUR', name: 'Hora' },
  { code: 'ZZ', name: 'Servicios' }
];

// Tipo para items simplificados
export interface SimpleItem {
  cantidad: number;
  unidad: string;
  descripcion: string;
  precio_unitario: number;
  descuento: number; // ahora es monto en soles
  importe_total: number;
  service_id?: number;
}

interface QuotationItemsManagerProps {
  items: SimpleItem[];
  onItemsChange: (items: SimpleItem[]) => void;
  selectedService?: ProductService | null;
}

export const QuotationItemsManager: React.FC<QuotationItemsManagerProps> = ({
  items,
  onItemsChange,
  selectedService
}) => {
  // Toggle para mostrar/ocultar el formulario de agregar
  const [showAddForm, setShowAddForm] = useState(true);

  // Estados para el formulario de nuevo item
  const [newItem, setNewItem] = useState<SimpleItem>({
    cantidad: 1,
    unidad: 'NIU',
    descripcion: '',
    precio_unitario: 0,
    descuento: 0, // monto en soles
    importe_total: 0
  });

    // Prellenar campos del ítem cuando cambia el servicio
    useEffect(() => {
      if (selectedService) {
        setNewItem(prev => ({
          ...prev,
          descripcion: selectedService.name, // Solo el nombre, no la descripción larga
          unidad: selectedService.unit_code,
          precio_unitario: 0 // Siempre en 0 para que el usuario lo ingrese manualmente
        }));
      }
    }, [selectedService]);

  // Calcular el importe total del nuevo item
  useEffect(() => {
    const baseAmount = newItem.cantidad * newItem.precio_unitario;
    // El descuento ahora es monto en soles, no porcentaje
    const total = baseAmount - newItem.descuento;
    setNewItem(prev => ({ ...prev, importe_total: total }));
  }, [newItem.cantidad, newItem.precio_unitario, newItem.descuento]);

  // Función para agregar item
  const handleAddItem = () => {
    if (!newItem.descripcion.trim()) {
      toast.error('Ingrese una descripción para el item');
      return;
    }
    if (newItem.precio_unitario <= 0) {
      toast.error('El precio unitario debe ser mayor a 0');
      return;
    }
    if (newItem.descuento < 0) {
      toast.error('El descuento no puede ser negativo');
      return;
    }
    if (newItem.descuento > newItem.cantidad * newItem.precio_unitario) {
      toast.error('El descuento no puede ser mayor al importe total');
      return;
    }
    // Agregar el id del servicio al ítem
    onItemsChange([...items, { ...newItem, service_id: selectedService?.id }]);
    // Reset form - mantener el servicio seleccionado pero resetear precio a 0
    setNewItem({
      cantidad: 1,
      unidad: selectedService?.unit_code || 'NIU',
      descripcion: selectedService?.name || '', // Solo el nombre del servicio
      precio_unitario: 0, // Siempre en 0 para que el usuario lo ingrese
      descuento: 0,
      importe_total: 0
    });
    setShowAddForm(false);
    toast.success('Item agregado');
  };

  // Función para eliminar item
  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
    toast.success('Item eliminado');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <TableCellsIcon className="h-5 w-5 text-gray-400" />
          Ítems de Cotización
        </h3>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Agregar Ítem
          </button>
        )}
      </div>

      {/* Formulario para agregar nuevo item */}
      {showAddForm && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                step="1"
                value={newItem.cantidad}
                onChange={(e) => setNewItem(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 1 }))}
                onFocus={(e) => { if (e.target.value === '1') e.target.value = ''; }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
              <select
                value={newItem.unidad}
                onChange={(e) => setNewItem(prev => ({ ...prev, unidad: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                {UNITS.map(unit => (
                  <option key={unit.code} value={unit.code}>{unit.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Precio Unitario (S/)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.precio_unitario}
                onChange={(e) => setNewItem(prev => ({ ...prev, precio_unitario: parseFloat(e.target.value) || 0 }))}
                onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descuento (S/)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.descuento}
                onChange={(e) => setNewItem(prev => ({ ...prev, descuento: parseFloat(e.target.value) || 0 }))}
                onFocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
              <input
                type="text"
                value={newItem.descripcion}
                onChange={(e) => setNewItem(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción del producto o servicio..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex flex-col justify-end gap-1.5">
              <p className="text-xs text-gray-500 text-right">
                Total: <span className="font-semibold text-gray-900">S/ {newItem.importe_total.toFixed(2)}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!newItem.descripcion.trim() || newItem.precio_unitario <= 0}
                  size="sm"
                  className="flex-1"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de items */}
      {items.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-sm font-semibold text-slate-500 w-1/3">
                Descripción
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-slate-500">
                Cant.
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-slate-500">
                Unidad
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-slate-500">
                Precio
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-slate-500">
                Dcto. (S/)
              </th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-slate-500">
                Subtotal
              </th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 text-sm text-primary font-medium max-w-xs">
                  <div className="truncate" title={item.descripcion}>{item.descripcion}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700 text-center">{item.cantidad}</td>
                <td className="px-4 py-4 text-sm text-slate-500 text-center">
                  {UNITS.find(u => u.code === item.unidad)?.name || item.unidad}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700 text-right">
                  {item.precio_unitario.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700 text-right">
                  {item.descuento.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">
                  S/ {item.importe_total.toFixed(2)}
                </td>
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !showAddForm && (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">No hay ítems agregados.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-sm text-primary font-medium hover:underline"
            >
              + Agregar primer ítem
            </button>
          </div>
        )
      )}
    </div>
  );
};
