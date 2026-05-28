// src/features/fluvial/components/sales-point/representatives/PassengerQuantitySelector.tsx
import { Users, Plus, Minus, Calculator } from 'lucide-react';
import { Button } from '../../../../../components/common/Button';

interface Props {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
  min?: number;
}

export function PassengerQuantitySelector({ 
  quantity, 
  onQuantityChange, 
  disabled = false,
  min = 1
}: Props) {
  const handleIncrease = () => {
    onQuantityChange(quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="bg-dm-bg-primary border border-dm-border-primary rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
            <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-dm-text-primary">
              Cantidad de Pasajes Empresariales
            </label>
            <p className="text-xs text-dm-text-secondary mt-1">
              Configure el número total de pasajes para la factura
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-dm-bg-secondary rounded-lg p-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDecrease}
            disabled={disabled || quantity <= min}
            className="h-8 w-8 p-0 border-dm-border-primary hover:bg-dm-bg-hover"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            min={min}
            disabled={disabled}
            className="w-16 h-8 text-center border border-dm-border-primary rounded text-sm font-semibold bg-dm-bg-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleIncrease}
            disabled={disabled}
            className="h-8 w-8 p-0 border-dm-border-primary hover:bg-dm-bg-hover"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {quantity > 1 && (
        <div className="mt-3 flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-300">
            <span className="font-medium">Facturación empresarial configurada:</span>
            <br />
            Se generará una factura unificada para {quantity} pasajes. 
            Después podrá registrar los datos de cada representante.
          </div>
        </div>
      )}
    </div>
  );
}
