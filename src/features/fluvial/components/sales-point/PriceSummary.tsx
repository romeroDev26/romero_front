// src/features/fluvial/components/sales-point/PriceSummary.tsx
import React from 'react';

interface PriceSummaryProps {
  basePrice: number | null;
  seatMultiplier: number;
  isExonerated: boolean;
  onExoneratedChange: (isExonerated: boolean) => void;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({ basePrice, seatMultiplier, isExonerated, onExoneratedChange }) => {
  const finalPrice = basePrice ? basePrice * seatMultiplier : 0;
  const igvAmount = isExonerated ? 0 : finalPrice * 0.18;
  const totalPrice = finalPrice; // En exonerado, el total es el precio final. Si no, sería finalPrice + igv.
                                  // Simplificamos: El precio ya incluye IGV si no es exonerado.
  const subtotal = totalPrice / (isExonerated ? 1 : 1.18);


  return (
    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
      <h3 className="font-semibold text-lg text-gray-800">Resumen de Venta</h3>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tarifa Base:</span>
        <span className="font-medium">{basePrice ? `S/ ${basePrice.toFixed(2)}` : 'N/A'}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Multiplicador Asiento:</span>
        <span className="font-medium">x {seatMultiplier.toFixed(2)}</span>
      </div>
      
      <div className="border-t pt-3 mt-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="font-medium text-gray-700">Operación Exonerada (Ley Amazonía)</span>
          <input
            type="checkbox"
            checked={isExonerated}
            onChange={(e) => onExoneratedChange(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </div>

      <div className="border-t pt-3 mt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IGV (18%):</span>
          <span>S/ {igvAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold text-gray-900">
          <span>TOTAL:</span>
          <span>S/ {totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};