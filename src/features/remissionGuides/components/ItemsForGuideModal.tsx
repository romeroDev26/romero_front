// src/features/remissionGuides/components/ItemsForGuideModal.tsx

import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { ItemForGuide } from '../../../services/invoices.service';
import { useItemsForGuide } from '../hooks/useItemsForGuide';

// Este es el tipo de dato que el formulario de Guía de Remisión espera para cada ítem.
// Lo definimos aquí para asegurar que el modal emita los datos en el formato correcto.
export interface RemissionGuideFormItem {
  quantity: number;
  unit_code: string;
  description: string;
  internal_code?: string;
  invoice_item_id: number; // <-- Añadimos el ID para vincularlo si es necesario
}

interface ItemsForGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  // El modal debe emitir los datos completos de los ítems seleccionados,
  // no solo los del formulario, para que la página principal pueda autocompletar.
  onSelectItems: (items: ItemForGuide[]) => void; 
}

export const ItemsForGuideModal: React.FC<ItemsForGuideModalProps> = ({
  isOpen,
  onClose,
  tripId,
  onSelectItems,
}) => {
  const { data: items = [], isLoading, error } = useItemsForGuide(tripId);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const handleToggleItem = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleConfirmSelection = () => {
    const selectedApiItems = items.filter(item => selectedItems.has(item.invoice_item_id));
    onSelectItems(selectedApiItems);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cargar Encomiendas Pendientes de Guía" maxWidth="3xl">
      <div className="space-y-4">
        {isLoading && (
          <div className="flex justify-center p-8"><Spinner /></div>
        )}
        {error && (
          <p className="text-error">Error al cargar los ítems: {error instanceof Error ? error.message : 'Ocurrió un error'}</p>
        )}
        {!isLoading && !error && (
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sel.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatario</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr key="no-items"><td colSpan={4} className="text-center py-4 text-gray-500">No hay encomiendas pendientes para este viaje.</td></tr>
                ) : (
                  items.map(item => {
                    // Parsear el source_invoice_number: "03: B001-135" -> series: "B001", number: 135
                    const [, invoiceInfo] = item.source_invoice_number?.split(': ') || ['', ''];
                    const [series, numberStr] = invoiceInfo.split('-') || ['', ''];
                    const number = parseInt(numberStr) || 0;
                    
                    return (
                      <tr key={item.invoice_item_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.invoice_item_id)}
                            onChange={() => handleToggleItem(item.invoice_item_id)}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-700">{`${series}-${String(number).padStart(8, '0')}`}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{item.item_description}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">{item.client_name || 'N/A'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleConfirmSelection} disabled={selectedItems.size === 0}>
            Añadir {selectedItems.size} Ítems a la Guía
          </Button>
        </div>
      </div>
    </Modal>
  );
};