// src/features/fluvial/quick-sales/components/ServiceDetailsForm.tsx

import React, { useEffect, useState } from 'react';
import { Settings, AlertTriangle } from 'lucide-react';
import { ProductService } from '../../../../types';

interface ServiceDetailsFormProps {
  selectedProduct: ProductService | null;
  quantity: number;
  customPrice: string;
  description: string;
  isIgvGravado: boolean;
  onQuantityChange: (value: number) => void;
  onCustomPriceChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIgvGravadoChange: (value: boolean) => void;
  disabled?: boolean;
}

export const ServiceDetailsForm: React.FC<ServiceDetailsFormProps> = ({
  selectedProduct,
  quantity,
  customPrice,
  description,
  isIgvGravado,
  onQuantityChange,
  onCustomPriceChange,
  onDescriptionChange,
  onIgvGravadoChange,
  disabled = false,
}) => {
  const [quantityDisplay, setQuantityDisplay] = useState<string>(String(quantity));

  useEffect(() => {
    setQuantityDisplay(quantity > 0 ? String(quantity) : '');
  }, [quantity]);

  const handleQuantityChange = (value: string) => {
    setQuantityDisplay(value);

    if (value.trim() === '') {
      onQuantityChange(0);
      return;
    }

    const parsedValue = Number.parseInt(value, 10);
    onQuantityChange(Number.isNaN(parsedValue) ? 0 : parsedValue);
  };

  if (!selectedProduct) {
    return (
      <div className="bg-dm-bg-primary p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center py-8 text-dm-text-muted">
          <div className="text-center">
            <Settings className="h-12 w-12 mx-auto mb-2" />
            <p>Seleccione un servicio o producto para continuar</p>
          </div>
        </div>
      </div>
    );
  }

  const finalPrice = customPrice ? parseFloat(customPrice) : Number(selectedProduct.sale_price);
  const isCustomPrice = customPrice.trim() !== '';

  return (
    <div className="bg-dm-bg-primary p-6 rounded-lg shadow-sm border">
      <h3 className="font-semibold text-lg text-dm-text-primary mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2 text-dm-text-secondary" />
        Detalles del Servicio
      </h3>

      <div className="space-y-4">
        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-dm-text-secondary mb-2">
            Cantidad *
          </label>
          <input
            type="number"
            value={quantityDisplay}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            min="1"
            step="1"
            disabled={disabled}
            className="w-full px-4 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-dm-bg-secondary"
          />
        </div>

        {/* Precio de venta */}
        <div>
          <label className="block text-sm font-medium text-dm-text-secondary mb-2">
            Precio de Venta *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dm-text-muted">
              S/
            </span>
            <input
              type="number"
              value={customPrice}
              onChange={(e) => onCustomPriceChange(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={disabled}
              className="w-full pl-10 pr-4 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-dm-bg-secondary"
            />
          </div>
          <p className="text-xs text-dm-text-muted mt-1">
            Ingrese el precio total de venta para este servicio
          </p>
        </div>

        {/* Descripción adicional */}
        <div>
          <label className="block text-sm font-medium text-dm-text-secondary mb-2">
            Descripción Adicional (Opcional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Información adicional sobre la venta..."
            maxLength={100}
            disabled={disabled}
            className="w-full px-4 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-dm-bg-secondary"
          />
          <p className="text-xs text-dm-text-muted mt-1">
            {description.length}/100 caracteres
          </p>
        </div>

        {/* Switch IGV */}
        <div className="bg-dm-bg-secondary border border-dm-border-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dm-text-secondary">
                Aplicar IGV (18%)
              </p>
              <p className="text-xs text-dm-text-muted mt-1">
                {isIgvGravado 
                  ? 'Gravado - Se aplicará IGV al monto ingresado' 
                  : 'Exonerado - Sin IGV'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isIgvGravado}
              onClick={() => onIgvGravadoChange(!isIgvGravado)}
              disabled={disabled}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isIgvGravado ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-dm-bg-primary shadow-md transition-transform duration-200 ease-in-out ${
                  isIgvGravado ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
