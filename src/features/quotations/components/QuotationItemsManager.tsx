import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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
    toast.success('Item agregado');
  };

  // Función para eliminar item
  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
    toast.success('Item eliminado');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Items de la Cotización</h3>
      
      {/* Formulario para agregar nuevo item */}
      <div className="border rounded-lg p-4 mb-4 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-3">Agregar Item</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              step="1"
              value={newItem.cantidad}
              onChange={(e) => setNewItem(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 1 }))}
              onFocus={(e) => {
                // Si el valor es exactamente 1, limpiarlo para que el usuario pueda escribir directamente
                if (e.target.value === '1') {
                  e.target.value = '';
                }
              }}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label>
            <select
              value={newItem.unidad}
              onChange={(e) => setNewItem(prev => ({ ...prev, unidad: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {UNITS.map(unit => (
                <option key={unit.code} value={unit.code}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">P. Unitario (S/)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newItem.precio_unitario}
              onChange={(e) => setNewItem(prev => ({ ...prev, precio_unitario: parseFloat(e.target.value) || 0 }))}
              onFocus={(e) => {
                // Si el valor es exactamente 0, limpiarlo para que el usuario pueda escribir directamente
                if (e.target.value === '0') {
                  e.target.value = '';
                }
              }}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descuento (S/)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newItem.descuento}
              onChange={(e) => setNewItem(prev => ({ ...prev, descuento: parseFloat(e.target.value) || 0 }))}
              onFocus={(e) => {
                // Si el valor es exactamente 0, limpiarlo para que el usuario pueda escribir directamente
                if (e.target.value === '0') {
                  e.target.value = '';
                }
              }}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              value={newItem.descripcion}
              onChange={(e) => setNewItem(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción del producto o servicio..."
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="text-sm text-gray-600 mb-1">
              <strong>Total: S/ {newItem.importe_total.toFixed(2)}</strong>
            </div>
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={!newItem.descripcion.trim() || newItem.precio_unitario <= 0}
              size="sm"
            >
              Agregar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de items */}
      {items.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-4">Items Agregados ({items.length})</h4>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P. Unitario
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importe Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.cantidad}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {UNITS.find(u => u.code === item.unidad)?.name || item.unidad}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={item.descripcion}>
                        {item.descripcion}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      S/ {item.precio_unitario.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      S/ {item.descuento.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      S/ {item.importe_total.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
