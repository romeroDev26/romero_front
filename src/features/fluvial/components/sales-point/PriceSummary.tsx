// src/features/fluvial/components/sales-point/PriceSummary.tsx
import React from "react";
import { AlertTriangle } from "lucide-react";

interface PriceSummaryProps {
  basePrice: number | null;
  seatMultiplier: number;
  extraCost: number;
  onExtraCostChange: (cost: number) => void;
  extraCostDescription: string;
  onExtraCostDescriptionChange: (description: string) => void;
  isIgvGravado: boolean;
  onIgvGravadoChange: (isGravado: boolean) => void;
  taxCategoryCodeDefault: string | null;
  subtotal: number;
  igvAmount: number;
  discount: number;
  onDiscountChange: (discount: number) => void;
  finalTotal: number;
  isRuc?: boolean;
  representativesCount?: number;
  isManualPriceMode?: boolean;
  manualPrice?: number | null;
  onManualPriceChange?: (price: number) => void;
  editableBasePrice?: number | null;
  onEditableBasePriceChange?: (price: number) => void;
  currencySymbol?: string;
}

const lbl =
  "block text-dm-text-muted text-[11px] font-medium uppercase tracking-wider mb-1.5 ml-1";
const fieldShell =
  "w-full bg-dm-bg-secondary border border-dm-border-primary rounded-lg py-3 px-4 text-sm text-dm-text-primary placeholder:text-dm-text-muted focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50";

const stopWheel: React.WheelEventHandler<HTMLInputElement> = (e) => {
  e.currentTarget.blur();
};

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
  isManualPriceMode = false,
  manualPrice = null,
  onManualPriceChange,
  editableBasePrice = null,
  onEditableBasePriceChange,
  currencySymbol = "S/",
}) => {
  const quantity = isRuc ? Math.max(1, representativesCount) : 1;
  const ticketPricePerUnit = (basePrice || 0) * seatMultiplier;
  const baseSubtotal = ticketPricePerUnit * quantity;
  const totalBeforeDiscount = baseSubtotal + extraCost;
  const maxDiscountAllowed = totalBeforeDiscount;
  const isIgvDisabled = taxCategoryCodeDefault === null;

  return (
    <section className="overflow-hidden rounded-xl border border-dm-border-primary/80 bg-dm-bg-primary shadow-sm">
      {isManualPriceMode && (
        <div className="flex items-center gap-2 border-b border-orange-200/40 bg-orange-100 dark:bg-orange-950/40 px-5 py-3">
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-amber-900 dark:text-amber-200"
            aria-hidden
          />
          <span className="text-xs font-semibold text-amber-950 dark:text-amber-200">
            Requiere revisión manual de precios
          </span>
        </div>
      )}

      <div className="space-y-5 p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight text-dm-text-primary">
          Resumen de Venta
        </h2>

        {isManualPriceMode && (
          <div>
            <label className={lbl}>Precio manual</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={
                  manualPrice === null || manualPrice === 0
                    ? ""
                    : String(manualPrice)
                }
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  onManualPriceChange?.(value);
                }}
                onWheel={stopWheel}
                placeholder="0.00"
                step="0.1"
                min={0}
                max={10000}
                className="w-full rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-4 pl-10 pr-4 text-2xl font-extrabold text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            {manualPrice !== null && manualPrice > 0 && (
              <p className="mt-1 text-xs font-medium text-green-700 dark:text-green-300">
                Precio configurado: {currencySymbol} {manualPrice.toFixed(2)}
              </p>
            )}
          </div>
        )}

        {isManualPriceMode && isRuc && quantity > 1 && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dm-text-secondary">Cantidad de representantes</span>
              <span className="font-semibold text-dm-text-primary">{quantity}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-dm-border-primary pt-2">
              <span className="font-medium text-dm-text-secondary">Total pasajes</span>
              <span className="font-semibold text-dm-text-primary">
                {baseSubtotal > 0
                  ? `${currencySymbol} ${baseSubtotal.toFixed(2)}`
                  : "N/A"}
              </span>
            </div>
          </div>
        )}

        {!isManualPriceMode && (
          <>
            {isRuc && quantity > 1 ? (
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Tarifa por pasajero (editable)</label>
                  <input
                    type="number"
                    value={
                      editableBasePrice === null || editableBasePrice === 0
                        ? ""
                        : String(editableBasePrice)
                    }
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      onEditableBasePriceChange?.(value);
                    }}
                    onWheel={stopWheel}
                    placeholder={`${currencySymbol} 0.00`}
                    step="0.1"
                    min={0}
                    max={10000}
                    className={fieldShell}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dm-text-secondary">Representantes</span>
                  <span className="font-semibold text-dm-text-primary">{quantity}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-dm-border-primary pt-2 text-sm">
                  <span className="font-medium text-dm-text-secondary">Total pasajes</span>
                  <span className="font-semibold text-dm-text-primary">
                    {baseSubtotal > 0
                      ? `${currencySymbol} ${baseSubtotal.toFixed(2)}`
                      : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className={lbl}>Tarifa pasaje (editable)</label>
                <input
                  type="number"
                  value={
                    editableBasePrice === null || editableBasePrice === 0
                      ? ""
                      : String(editableBasePrice)
                  }
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    onEditableBasePriceChange?.(value);
                  }}
                  onWheel={stopWheel}
                  placeholder={`${currencySymbol} 0.00`}
                  step="0.1"
                  min={0}
                  max={10000}
                  className={fieldShell}
                />
                {seatMultiplier !== 1 && (
                  <p className="mt-1 text-xs text-primary/80">
                    Multiplicador de asiento: ×{seatMultiplier.toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div>
          <label className={lbl}>Costo adicional (bultos)</label>
          <input
            type="number"
            value={extraCost === 0 ? "" : String(extraCost)}
            onChange={(e) => onExtraCostChange(parseFloat(e.target.value) || 0)}
            onWheel={stopWheel}
            placeholder={`${currencySymbol} 0.00`}
            step="0.1"
            min={0}
            className={fieldShell}
          />
        </div>

        {extraCost > 0 && (
          <div>
            <label className={lbl}>Descripción del costo adicional</label>
            <input
              type="text"
              value={extraCostDescription || ""}
              onChange={(e) => {
                if (e.target.value.length <= 85) {
                  onExtraCostDescriptionChange(e.target.value);
                }
              }}
              placeholder="Ej. exceso de equipaje"
              maxLength={85}
              className={fieldShell}
            />
            <p className="mt-1 text-[10px] text-dm-text-muted">
              {(extraCostDescription || "").length}/85 caracteres
            </p>
          </div>
        )}

        <div className="space-y-3 pt-1">
          {extraCost > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-dm-text-secondary">Costo adicional</span>
              <span className="font-semibold text-dm-text-primary">
                + {currencySymbol} {extraCost.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-dm-text-secondary">Aplicar IGV (18%)</span>
              <button
                type="button"
                onClick={() =>
                  !isIgvDisabled && onIgvGravadoChange(!isIgvGravado)
                }
                disabled={isIgvDisabled}
                title={
                  isIgvDisabled
                    ? "No se pudo cargar la configuración del servicio"
                    : undefined
                }
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 ${
                  isIgvGravado ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                } ${
                  isIgvDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-dm-bg-primary shadow transition-transform ${
                    isIgvGravado ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <span className="tabular-nums font-semibold text-dm-text-primary">
              {currencySymbol} {igvAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between gap-3 text-sm">
            <span className="shrink-0 text-dm-text-secondary">Descuento</span>
            <input
              type="number"
              value={discount === 0 ? "" : String(discount)}
              onChange={(e) =>
                onDiscountChange(parseFloat(e.target.value) || 0)
              }
              onWheel={stopWheel}
              placeholder="0.00"
              step="0.1"
              min={0}
              max={maxDiscountAllowed}
              className="max-w-[7.5rem] rounded-lg border border-dm-border-primary bg-dm-bg-secondary py-2 px-3 text-right text-sm font-medium text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-dm-text-secondary">Descuento aplicado</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                - {currencySymbol} {discount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-dm-text-secondary">
            <span>Subtotal</span>
            <span className="font-medium text-dm-text-primary tabular-nums">
              {currencySymbol} {subtotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border-t border-dashed border-dm-border-primary/80 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[#dbe1ff] dark:bg-blue-700 p-4">
            <span className="text-sm font-medium text-[#00174d] dark:text-white">
              Total a cobrar
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-[#00174d] dark:text-white tabular-nums">
              {currencySymbol} {finalTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
