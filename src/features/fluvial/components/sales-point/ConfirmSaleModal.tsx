import type { PassengerSegmentSummary } from './utils/passengerSegments';
import React from "react";
import { Modal } from "../../../../components/common/Modal";
import { Button } from "../../../../components/common/Button";
import { AlertTriangle, CreditCard, User, Ship } from "lucide-react";

interface ConfirmSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  totalAmount: number;
  currencySymbol: string;
  passengerName: string;
  saleType: "normal" | "company" | "cargo";
  tripName?: string;
  representativesCount?: number;
  segmentSummary?: PassengerSegmentSummary[];
}

export const ConfirmSaleModal: React.FC<ConfirmSaleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  totalAmount,
  currencySymbol,
  passengerName,
  saleType,
  tripName,
  segmentSummary = [],
  representativesCount = 0,
}) => {
  const getSaleTypeLabel = () => {
    switch (saleType) {
      case "company":
        return "Factura Empresarial";
      case "cargo":
        return "Venta de Encomienda";
      default:
        return "Venta de Pasaje";
    }
  };

  const hasDecimals = totalAmount % 1 !== 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-6">
        {/* Encabezado con icono de advertencia */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-dm-text-primary">
              Confirmar {getSaleTypeLabel()}
            </h3>
            <p className="text-sm text-dm-text-muted mt-1">
              Revise los detalles antes de continuar
            </p>
          </div>
        </div>

        {/* Detalles de la venta */}
        <div className="bg-dm-bg-secondary rounded-lg p-4 space-y-3">
          {/* Cliente */}
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-dm-text-muted" />
            <div className="flex-1">
              <p className="text-xs text-dm-text-muted">Cliente</p>
              <p className="font-medium text-dm-text-primary">{passengerName}</p>
            </div>
          </div>

          {/* Viaje (si aplica) */}
          {tripName && (
            <div className="flex items-center gap-3 pt-3 border-t border-dm-border-primary">
              <Ship className="h-5 w-5 text-dm-text-muted" />
              <div className="flex-1">
                <p className="text-xs text-dm-text-muted">Viaje</p>
                <p className="font-medium text-dm-text-primary">{tripName}</p>
              </div>
            </div>
          )}

          {/* Representantes (si aplica) */}
          {saleType === "company" && representativesCount > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t border-dm-border-primary">
              <User className="h-5 w-5 text-dm-text-muted" />
              <div className="flex-1">
                <p className="text-xs text-dm-text-muted">Representantes</p>
                <p className="font-medium text-dm-text-primary">
                  {representativesCount} representante(s)
                </p>
              </div>
            </div>
          )}

        {segmentSummary.length > 0 && (
          <div className="space-y-2 rounded-lg border border-dm-border-primary p-3 text-sm">
            <p className="font-semibold">Tramos incluidos</p>
            {segmentSummary.map(group => (
              <div key={group.key} className="space-y-1 border-t border-dm-border-primary pt-2">
                <p className="font-medium">{group.origin} → {group.destination}</p>
                <div className="flex justify-between gap-2 text-dm-text-secondary">
                  <span>{group.count} × {currencySymbol} {group.fare.toFixed(2)}</span>
                  <span>{currencySymbol} {group.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
          {/* Total destacado */}
          <div className="pt-3 border-t border-dm-border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-dm-text-muted" />
                <p className="text-sm font-medium text-dm-text-secondary">
                  Total a cobrar
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currencySymbol} {totalAmount.toFixed(2)}
                </p>
                {hasDecimals && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                    ⚠ Incluye decimales
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advertencia de decimales */}
        {hasDecimals && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  Verifique el monto con decimales
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Asegúrese de que el monto{" "}
                  <span className="font-bold">
                    {currencySymbol} {totalAmount.toFixed(2)}
                  </span>{" "}
                  es correcto antes de continuar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pregunta de confirmación */}
        <div className="text-center py-2">
          <p className="text-lg font-semibold text-dm-text-primary">
            ¿Está seguro de realizar esta venta?
          </p>
          <p className="text-sm text-dm-text-muted mt-1">
            Esta acción generará el comprobante correspondiente
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Sí, Confirmar Venta
          </Button>
        </div>
      </div>
    </Modal>
  );
};
