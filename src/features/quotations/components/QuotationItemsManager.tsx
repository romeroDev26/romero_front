import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/sileo-toast';
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

interface SimpleItemFormState {
  cantidad: string;
  unidad: string;
  descripcion: string;
  precio_unitario: string;
  descuento: string;
  importe_total: number;
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
  const [newItem, setNewItem] = useState<SimpleItemFormState>({
    cantidad: '1',
    unidad: 'NIU',
    descripcion: '',
    precio_unitario: '',
    descuento: '', // monto en soles
    importe_total: 0
  });

  const parseNumber = (value: string): number => {
    if (value.trim() === '') return 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const cantidadValue = parseNumber(newItem.cantidad);
  const precioUnitarioValue = parseNumber(newItem.precio_unitario);
  const descuentoValue = parseNumber(newItem.descuento);

    // Prellenar campos del ítem cuando cambia el servicio
    useEffect(() => {
      if (selectedService) {
        setNewItem(prev => ({
          ...prev,
          descripcion: selectedService.name, // Solo el nombre, no la descripción larga
          unidad: selectedService.unit_code,
          precio_unitario: '' // Queda vacío para que el usuario lo ingrese manualmente
        }));
      }
    }, [selectedService]);

  // Calcular el importe total del nuevo item
  useEffect(() => {
    const baseAmount = cantidadValue * precioUnitarioValue;
    // El descuento ahora es monto en soles, no porcentaje
    const total = baseAmount - descuentoValue;
    setNewItem(prev => ({ ...prev, importe_total: total }));
  }, [cantidadValue, precioUnitarioValue, descuentoValue]);

  // Función para agregar item
  const handleAddItem = () => {
    if (!newItem.descripcion.trim()) {
      toast.error('Ingrese una descripción para el item');
      return;
    }
    if (precioUnitarioValue <= 0) {
      toast.error('El precio unitario debe ser mayor a 0');
      return;
    }
    if (descuentoValue < 0) {
      toast.error('El descuento no puede ser negativo');
      return;
    }
    if (descuentoValue > cantidadValue * precioUnitarioValue) {
      toast.error('El descuento no puede ser mayor al importe total');
      return;
    }
    // Agregar el id del servicio al ítem
    onItemsChange([
      ...items,
      {
        ...newItem,
        cantidad: cantidadValue,
        precio_unitario: precioUnitarioValue,
        descuento: descuentoValue,
        service_id: selectedService?.id,
      },
    ]);
    // Reset form - mantener el servicio seleccionado pero resetear precio a 0
    setNewItem({
      cantidad: '1',
      unidad: selectedService?.unit_code || 'NIU',
      descripcion: selectedService?.name || '', // Solo el nombre del servicio
      precio_unitario: '', // Queda vacío para que el usuario lo ingrese
      descuento: '',
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
    <div className="bg-dm-bg-primary rounded-xl border border-dm-border-secondary shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-dm-border-secondary">
        <h3 className="flex items-center gap-2 text-base font-semibold text-dm-text-primary">
          <TableCellsIcon className="h-5 w-5 text-dm-text-muted" />
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
        <div className="px-6 py-4 bg-dm-bg-secondary border-b border-dm-border-secondary">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-dm-text-muted mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                step="1"
                value={newItem.cantidad}
                onChange={(e) => setNewItem(prev => ({ ...prev, cantidad: e.target.value }))}
                className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dm-text-muted mb-1">Unidad</label>
              <select
                value={newItem.unidad}
                onChange={(e) => setNewItem(prev => ({ ...prev, unidad: e.target.value }))}
                className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-dm-bg-primary"
              >
                {UNITS.map(unit => (
                  <option key={unit.code} value={unit.code}>{unit.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dm-text-muted mb-1">Precio Unitario (S/)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.precio_unitario}
                onChange={(e) => setNewItem(prev => ({ ...prev, precio_unitario: e.target.value }))}
                className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dm-text-muted mb-1">Descuento (S/)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.descuento}
                onChange={(e) => setNewItem(prev => ({ ...prev, descuento: e.target.value }))}
                className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-dm-text-muted mb-1">Descripción</label>
              <input
                type="text"
                value={newItem.descripcion}
                onChange={(e) => setNewItem(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción del producto o servicio..."
                className="w-full border border-dm-border-primary rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex flex-col justify-end gap-1.5">
              <p className="text-xs text-dm-text-muted text-right">
                Total: <span className="font-semibold text-dm-text-primary">S/ {newItem.importe_total.toFixed(2)}</span>
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
                  disabled={!newItem.descripcion.trim() || precioUnitarioValue <= 0}
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
            <tr className="border-b border-dm-border-secondary">
              <th className="text-left px-6 py-3 text-sm font-semibold text-dm-text-muted w-1/3">
                Descripción
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-dm-text-muted">
                Cant.
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-dm-text-muted">
                Unidad
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-dm-text-muted">
                Precio
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-dm-text-muted">
                Dcto. (S/)
              </th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-dm-text-muted">
                Subtotal
              </th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-dm-bg-hover/60 transition-colors">
                <td className="px-6 py-4 text-sm text-primary font-medium max-w-xs">
                  <div className="truncate" title={item.descripcion}>{item.descripcion}</div>
                </td>
                <td className="px-4 py-4 text-sm text-dm-text-secondary text-center">{item.cantidad}</td>
                <td className="px-4 py-4 text-sm text-dm-text-muted text-center">
                  {UNITS.find(u => u.code === item.unidad)?.name || item.unidad}
                </td>
                <td className="px-4 py-4 text-sm text-dm-text-secondary text-right">
                  {item.precio_unitario.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-sm text-dm-text-secondary text-right">
                  {item.descuento.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-dm-text-primary text-right">
                  S/ {item.importe_total.toFixed(2)}
                </td>
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-dm-text-muted hover:text-red-500 dark:text-red-400 transition-colors"
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
            <p className="text-sm text-dm-text-muted">No hay ítems agregados.</p>
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
