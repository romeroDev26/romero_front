import React from 'react';
import { SimpleItem } from './QuotationItemsManager';

interface QuotationSummaryProps {
  items: SimpleItem[];
  observations: string;
  onObservationsChange: (observations: string) => void;
}

export const QuotationSummary: React.FC<QuotationSummaryProps> = ({
  items,
  observations,
  onObservationsChange
}) => {
  // Calcular total general
  const calculateTotal = (): number => {
    return items.reduce((sum, item) => sum + item.importe_total, 0);
  };

  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  };

  const calculateTotalDiscount = (): number => {
    return items.reduce((sum, item) => sum + item.descuento, 0);
  };

  return (
    <>
      {/* Observaciones */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h3>
        <textarea
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Condiciones especiales, términos, horarios, etc..."
        />
      </div>

      {/* Total */}
      {items.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resumen</h3>
              <p className="text-sm text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div className="flex justify-between text-sm gap-8">
                  <span>Subtotal:</span>
                  <span>S/ {calculateSubtotal().toFixed(2)}</span>
                </div>
                {calculateTotalDiscount() > 0 && (
                  <div className="flex justify-between text-sm text-red-600 gap-8">
                    <span>Descuentos:</span>
                    <span>- S/ {calculateTotalDiscount().toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-gray-300" />
                <div className="flex justify-between text-xl font-bold text-gray-900 gap-8">
                  <span>Total:</span>
                  <span>S/ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
