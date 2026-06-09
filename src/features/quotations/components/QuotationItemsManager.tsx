import React, { useState } from 'react';
import { toast } from '@/utils/sileo-toast';
import { TableCellsIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ProductService } from '../../../types';
import { QuotationItemForm } from './QuotationItemForm';

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
  service_name?: string;
}

interface QuotationItemsManagerProps {
  items: SimpleItem[];
  onItemsChange: (items: SimpleItem[]) => void;
  serviceOptions: ProductService[];
  servicesLoading: boolean;
}

export const QuotationItemsManager: React.FC<QuotationItemsManagerProps> = ({
  items,
  onItemsChange,
  serviceOptions,
  servicesLoading,
}) => {
  // Toggle para mostrar/ocultar el formulario de agregar
  const [showAddForm, setShowAddForm] = useState(true);

  // Función para agregar item
  const handleAddItem = (item: SimpleItem) => {
    onItemsChange([...items, item]);
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
        <QuotationItemForm
          serviceOptions={serviceOptions}
          servicesLoading={servicesLoading}
          onAddItem={handleAddItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Tabla de items */}
      {items.length > 0 ? (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed">
          <thead>
            <tr className="border-b border-dm-border-secondary">
              <th className="text-left px-6 py-3 text-sm font-semibold text-dm-text-muted w-[24%]">
                Servicio
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-dm-text-muted w-[24%]">
                Descripción
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-dm-text-muted w-[8%]">
                Cant.
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-dm-text-muted w-[14%]">
                Unidad
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-dm-text-muted w-[10%]">
                Precio
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-dm-text-muted w-[10%]">
                Dcto.
              </th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-dm-text-muted w-[12%]">
                Subtotal
              </th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-dm-border-secondary">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-dm-bg-hover/60 transition-colors">
                <td className="px-6 py-4 text-sm text-primary font-medium">
                  <div className="truncate overflow-hidden" title={item.service_name || '-'}>
                    {item.service_name || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-dm-text-secondary">
                  <div className="truncate overflow-hidden" title={item.descripcion}>{item.descripcion}</div>
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
                  {item.importe_total.toFixed(2)}
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
        </div>
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
