// src/features/fluvial/components/sales-point/PriceSummary.tsx
import React from 'react';
import { Input } from '../../../../components/common/Input'; // Asumiendo que tienes un componente Input

interface PriceSummaryProps {
  basePrice: number | null;
  seatMultiplier: number;
  extraCost: number;
  onExtraCostChange: (cost: number) => void;
  isIgvGravado: boolean;
  onIgvGravadoChange: (isGravado: boolean) => void;
  taxCategoryCodeDefault: string | null; // '10' o '20'
  subtotal: number;
  igvAmount: number;
  finalTotal: number;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  basePrice,
  seatMultiplier,
  extraCost,
  onExtraCostChange,
  isIgvGravado,
  onIgvGravadoChange,
  taxCategoryCodeDefault,
  subtotal,
  igvAmount,
  finalTotal
}) => {
  const ticketPrice = basePrice ? basePrice * seatMultiplier : 0;
  const isIgvDisabled = taxCategoryCodeDefault === null; // Deshabilitar si no se pudo cargar el servicio

  return (
    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
      <h3 className="font-semibold text-lg text-gray-800">Resumen de Venta</h3>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tarifa Pasaje:</span>
        <span className="font-medium">{ticketPrice > 0 ? `S/ ${ticketPrice.toFixed(2)}` : 'N/A'}</span>
      </div>

      {/* --- CAMPO PARA COSTO ADICIONAL --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Adicional (Bultos)</label>
        <Input
          type="number"
          value={extraCost === 0 ? '' : extraCost.toString()}
          onChange={(e) => onExtraCostChange(parseFloat(e.target.value) || 0)}
          placeholder="S/ 0.00"
          step="0.10"
          min="0"
        />
      </div>
      
      <div className="border-t pt-3 mt-3">
        {/* --- SWITCH DE IGV --- */}
        <div className="flex items-center justify-between">
          <span className={`font-medium ${isIgvDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
            Gravar con IGV (18%)
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => !isIgvDisabled && onIgvGravadoChange(!isIgvGravado)}
              disabled={isIgvDisabled}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isIgvGravado 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
                }
                ${isIgvDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
              `}
              title={isIgvDisabled ? 'No se pudo cargar la configuración del servicio de pasajes' : ''}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                  ${isIgvGravado ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
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
          <span>S/ {finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};