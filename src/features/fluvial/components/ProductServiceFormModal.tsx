// src/features/fluvial/components/ProductServiceFormModal.tsx
import React, { useEffect, useState } from 'react';
import { ProductService } from '../../../types';
import { 
  ProductServiceFormData,
  ITEM_TYPE_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  CURRENCY_OPTIONS,
  UNIT_CODE_OPTIONS,
  TAX_CATEGORY_OPTIONS,
  UNSPCS_CODE_OPTIONS,
  UnitCode,
  CurrencyCode
} from '../types/products-services-ui.types';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

interface ProductServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductServiceFormData) => void;
  item?: ProductService | null;
  isLoading: boolean;
}

const INITIAL_FORM_DATA: ProductServiceFormData = {
  internal_code: '',
  name: '',
  description: '',
  item_type: 'SERVICE',
  service_category: 'PASAJES',
  unit_code: 'NIU',
  purchase_price: 0,
  sale_price: 0,
  currency_code: 'PEN',
  tax_category_code: 'stri',
  unspcs_code: '',
  is_active: true,
  specific_route_id: undefined,
};

export const ProductServiceFormModal: React.FC<ProductServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  isLoading,
}) => {
  const isEditMode = !!item;
  const [formData, setFormData] = useState<ProductServiceFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && item) {
        // Validar que el unit_code y currency_code sean valores permitidos
        const validUnitCode = (code: string): UnitCode => {
          const validCodes: UnitCode[] = ['NIU', 'KGM', 'MTR', 'LTR', 'M2', 'M3', 'HUR', 'ZZ'];
          return validCodes.includes(code as UnitCode) ? (code as UnitCode) : 'NIU';
        };

        const validCurrencyCode = (code: string): CurrencyCode => {
          const validCodes: CurrencyCode[] = ['PEN', 'USD', 'EUR'];
          return validCodes.includes(code as CurrencyCode) ? (code as CurrencyCode) : 'PEN';
        };

        setFormData({
          internal_code: item.internal_code || '',
          name: item.name,
          description: item.description || '',
          item_type: item.item_type,
          service_category: item.service_category || 'OTROS',
          unit_code: validUnitCode(item.unit_code),
          purchase_price: Number(item.purchase_price) || 0,
          sale_price: Number(item.sale_price) || 0,
          currency_code: validCurrencyCode(item.currency_code),
          tax_category_code: item.tax_category_code,
          unspcs_code: item.unspcs_code || '',
          is_active: item.is_active,
          specific_route_id: item.specific_route_id || undefined,
        });
      } else {
        setFormData(INITIAL_FORM_DATA);
      }
    }
  }, [item, isEditMode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;

    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : parseFloat(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: 0 }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Código Interno" 
            name="internal_code" 
            value={formData.internal_code} 
            onChange={handleChange} 
          />
          <Input 
            label="Nombre" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1 focus:ring-blue-500 focus:border-blue-500" 
            rows={2}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select 
              name="item_type" 
              value={formData.item_type} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {ITEM_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {formData.item_type === 'SERVICE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría de Servicio</label>
              <select 
                name="service_category" 
                value={formData.service_category} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {SERVICE_CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input 
            label="Precio Venta" 
            name="sale_price" 
            type="number" 
            step="0.01" 
            value={formData.sale_price} 
            onChange={handleChange} 
            onBlur={handlePriceBlur} 
            required 
          />
          <Input 
            label="Precio Compra" 
            name="purchase_price" 
            type="number" 
            step="0.01" 
            value={formData.purchase_price} 
            onChange={handleChange} 
            onBlur={handlePriceBlur} 
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Moneda</label>
            <select 
              name="currency_code" 
              value={formData.currency_code} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {CURRENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
            <select 
              name="unit_code" 
              value={formData.unit_code} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {UNIT_CODE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Cód. Afectación IGV</label>
            <select 
              name="tax_category_code" 
              value={formData.tax_category_code} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {TAX_CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Cód. UNSPSC (Opcional)</label>
          <select 
            name="unspcs_code" 
            value={formData.unspcs_code} 
            onChange={handleChange} 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Ninguno</option>
            {UNSPCS_CODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <input 
            type="checkbox" 
            id="is_active" 
            name="is_active" 
            checked={formData.is_active} 
            onChange={handleChange} 
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Activo
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditMode ? 'Guardar Cambios' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};