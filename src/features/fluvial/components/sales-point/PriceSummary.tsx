// src/features/fluvial/components/sales-point/PriceSummary.tsx
import React from 'react';
import { Input } from '../../../../components/common/Input'; // Asumiendo que tienes un componente Input

interface PriceSummaryProps {
  basePrice: number | null;
  seatMultiplier: number;
  extraCost: number;
  onExtraCostChange: (cost: number) => void;
  extraCostDescription: string;
  onExtraCostDescriptionChange: (description: string) => void;
  isIgvGravado: boolean;
  onIgvGravadoChange: (isGravado: boolean) => void;
  taxCategoryCodeDefault: string | null; // '10' o '20'
  subtotal: number;
  igvAmount: number;
  discount: number;
  onDiscountChange: (discount: number) => void;
  finalTotal: number;
  // Nuevas props para representantes
  isRuc?: boolean;
  representativesCount?: number;
  // NUEVO: Props para precio manual
  isManualPriceMode?: boolean;
  manualPrice?: number | null;
  onManualPriceChange?: (price: number) => void;
  // NUEVO: Props para precio base editable
  editableBasePrice?: number | null;
  onEditableBasePriceChange?: (price: number) => void;
  // NUEVO: Props para moneda
  currencySymbol?: string;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  basePrice,
  seatMultiplier,
  extraCost,
  onExtraCostChange,
  extraCostDescription,
  onExtraCostDescriptionChange,
  isIgvGravado,
  onIgvGravadoChange,
  taxCategoryCodeDefault,
  subtotal,
  igvAmount,
  discount,
  onDiscountChange,
  finalTotal,
  isRuc = false,
  representativesCount = 1,
  // NUEVO: Props para precio manual
  isManualPriceMode = false,
  manualPrice = null,
  onManualPriceChange,
  // NUEVO: Props para precio base editable
  editableBasePrice = null,
  onEditableBasePriceChange,
  // NUEVO: Props para moneda
  currencySymbol = 'S/',
}) => {
  // Calcular el precio del ticket y límites
  const quantity = isRuc ? Math.max(1, representativesCount) : 1;
  const ticketPricePerUnit = (basePrice || 0) * seatMultiplier;
  
  // Calcular el total antes de descuentos para mostrar y para límite máximo
  const baseSubtotal = ticketPricePerUnit * quantity;
  const totalBeforeDiscount = baseSubtotal + extraCost;
  const maxDiscountAllowed = totalBeforeDiscount;
  
  const isIgvDisabled = taxCategoryCodeDefault === null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
      <h3 className="font-semibold text-lg text-gray-800">Resumen de Venta</h3>
      
      {/* NUEVO: Nota informativa sobre precio editable */}
      {!isManualPriceMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
          <p className="text-xs text-blue-700">
            💡 <strong>Consejo:</strong> Puede editar el precio de la tarifa directamente si es necesario
          </p>
        </div>
      )}
      
      {/* NUEVO: Campo de precio manual cuando no hay tarifa automática */}
      {isManualPriceMode && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">
                No hay tarifa configurada para este tramo
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Ingrese el precio manualmente para continuar con la venta
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-yellow-900 mb-2">
              Precio Manual por Pasajero *
            </label>
            <Input
              type="number"
              value={manualPrice === null || manualPrice === 0 ? '' : manualPrice.toString()}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                onManualPriceChange?.(value);
              }}
              placeholder={`Ingrese el precio (${currencySymbol})`}
              step="0.10"
              min="0"
              max="10000"
              className="text-lg font-semibold border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
            {manualPrice !== null && manualPrice > 0 && (
              <p className="text-xs text-green-700 mt-1 font-medium">
                ✓ Precio configurado: {currencySymbol} {manualPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Mostrar información según el tipo de venta */}
      {isRuc && quantity > 1 ? (
        <>
          {/* NUEVO: Campo editable para tarifa por pasajero */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tarifa por Pasajero (Editable):
            </label>
            <Input
              type="number"
              value={editableBasePrice === null || editableBasePrice === 0 ? '' : editableBasePrice.toString()}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                onEditableBasePriceChange?.(value);
              }}
              placeholder={`${currencySymbol} 0.00`}
              step="0.10"
              min="0"
              max="10000"
              className="text-sm font-medium"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cantidad de Representantes:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-gray-600 font-medium">Total Pasajes:</span>
            <span className="font-medium">{baseSubtotal > 0 ? `${currencySymbol} ${baseSubtotal.toFixed(2)}` : 'N/A'}</span>
          </div>
        </>
      ) : (
        /* NUEVO: Campo editable para tarifa pasaje individual */
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tarifa Pasaje (Editable):
          </label>
          <Input
            type="number"
            value={editableBasePrice === null || editableBasePrice === 0 ? '' : editableBasePrice.toString()}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              onEditableBasePriceChange?.(value);
            }}
            placeholder={`${currencySymbol} 0.00`}
            step="0.10"
            min="0"
            max="10000"
            className="text-sm font-medium"
          />
          {/* Mostrar multiplicador de asiento si es diferente de 1 */}
          {seatMultiplier !== 1 && (
            <p className="text-xs text-blue-600">
              Multiplicador de asiento: x{seatMultiplier.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* --- CAMPO PARA COSTO ADICIONAL --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Adicional (Bultos)</label>
        <Input
          type="number"
          value={extraCost === 0 ? '' : extraCost.toString()}
          onChange={(e) => onExtraCostChange(parseFloat(e.target.value) || 0)}
          placeholder={`${currencySymbol} 0.00`}
          step="0.10"
          min="0"
        />
      </div>

      {/* --- CAMPO PARA DESCRIPCIÓN DEL COSTO ADICIONAL --- */}
      {extraCost > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Costo Adicional</label>
          <Input
            type="text"
            value={extraCostDescription || ''}
            onChange={(e) => {
              if (e.target.value.length <= 85) {
                onExtraCostDescriptionChange(e.target.value);
              }
            }}
            placeholder="Ej: Exceso de equipaje, Bultos adicionales"
            maxLength={85}
          />
          <div className="text-xs text-gray-500 mt-1">
            {(extraCostDescription || '').length}/85 caracteres
          </div>
        </div>
      )}
      
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
          <span>{currencySymbol} {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IGV (18%):</span>
          <span>{currencySymbol} {igvAmount.toFixed(2)}</span>
        </div>
        
        {/* --- CAMPO PARA DESCUENTO MANUAL --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Manual</label>
          <Input
            type="number"
            value={discount === 0 ? '' : discount.toString()}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            placeholder={`${currencySymbol} 0.00`}
            step="0.10"
            min="0"
            max={maxDiscountAllowed}
          />
        </div>
        
        {/* Mostrar descuento aplicado si es mayor a 0 */}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span>Descuento:</span>
            <span>- {currencySymbol} {discount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-xl font-bold text-gray-900">
          <span>TOTAL:</span>
          <span>{currencySymbol} {finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};