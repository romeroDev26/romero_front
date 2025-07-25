// src/features/fluvial/components/sales-point/representatives/PassengerQuantitySelector.tsx
import { Users, Plus, Minus } from 'lucide-react';
import { Button } from '../../../../../components/common/Button';

interface Props {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export function PassengerQuantitySelector({ 
  quantity, 
  onQuantityChange, 
  disabled = false,
  min = 1,
  max = 50
}: Props) {
  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <div>
            <label className="text-sm font-medium text-blue-900">
              Cantidad de Pasajes
            </label>
            <p className="text-xs text-blue-700">
              Número total de pasajes a facturar
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDecrease}
            disabled={disabled || quantity <= min}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            min={min}
            max={max}
            disabled={disabled}
            className="w-16 h-8 text-center border border-gray-300 rounded text-sm font-medium"
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleIncrease}
            disabled={disabled || quantity >= max}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {quantity > 1 && (
        <div className="mt-2 text-xs text-blue-600">
          💡 Se creará una factura empresarial para {quantity} pasajes. 
          Luego podrá agregar los representantes individuales.
        </div>
      )}
    </div>
  );
}
