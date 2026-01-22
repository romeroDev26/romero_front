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
          <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              Confirmar {getSaleTypeLabel()}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Revise los detalles antes de continuar
            </p>
          </div>
        </div>

        {/* Detalles de la venta */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          {/* Cliente */}
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="font-medium text-gray-900">{passengerName}</p>
            </div>
          </div>

          {/* Viaje (si aplica) */}
          {tripName && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
              <Ship className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Viaje</p>
                <p className="font-medium text-gray-900">{tripName}</p>
              </div>
            </div>
          )}

          {/* Representantes (si aplica) */}
          {saleType === "company" && representativesCount > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
              <User className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Representantes</p>
                <p className="font-medium text-gray-900">
                  {representativesCount} representante(s)
                </p>
              </div>
            </div>
          )}

          {/* Total destacado */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Total a cobrar
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {currencySymbol} {totalAmount.toFixed(2)}
                </p>
                {hasDecimals && (
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    ⚠ Incluye decimales
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advertencia de decimales */}
        {hasDecimals && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800">
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
          <p className="text-lg font-semibold text-gray-800">
            ¿Está seguro de realizar esta venta?
          </p>
          <p className="text-sm text-gray-500 mt-1">
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
