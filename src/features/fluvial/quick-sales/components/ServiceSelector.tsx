// src/features/fluvial/quick-sales/components/ServiceSelector.tsx

import React from 'react';
import { Package } from 'lucide-react';
import { ProductService } from '../../../../types';

interface ServiceSelectorProps {
  products: ProductService[];
  selectedProduct: ProductService | null;
  onSelectProduct: (product: ProductService | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
  disabled = false,
  isLoading = false,
}) => {
  // Filtrar el servicio con ID 3
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => p.id !== 3);
  }, [products]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = parseInt(e.target.value);
    if (productId) {
      const product = filteredProducts.find(p => p.id === productId);
      onSelectProduct(product || null);
    } else {
      onSelectProduct(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-dm-bg-primary p-6 rounded-lg shadow-sm border border-dm-border-primary">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dm-bg-primary p-6 rounded-lg shadow-sm border border-dm-border-primary">
      <h3 className="font-semibold text-lg text-dm-text-primary mb-4 flex items-center">
        <Package className="h-5 w-5 mr-2 text-dm-text-secondary" />
        Seleccione el Servicio o Producto *
      </h3>

      <div className="space-y-4">
        <select
          value={selectedProduct?.id || ''}
          onChange={handleChange}
          disabled={disabled}
          className="w-full px-4 py-3.5 border-2 border-dm-border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-dm-bg-secondary text-base font-medium text-dm-text-secondary hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
        >
          <option value="" className="text-dm-text-muted">
            -- Seleccione un servicio o producto --
          </option>
          {filteredProducts.map((product) => (
            <option key={product.id} value={product.id} className="py-2">
              {product.name}
            </option>
          ))}
        </select>

        {/* Información del producto seleccionado */}
        {selectedProduct && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg shadow-sm">
            <div className="space-y-3">
              <div>
                <p className="text-base font-semibold text-purple-900">
                  {selectedProduct.name}
                </p>
                {selectedProduct.internal_code && (
                  <p className="text-xs text-purple-600 mt-1">
                    Código: <span className="font-mono font-medium">{selectedProduct.internal_code}</span>
                  </p>
                )}
              </div>
              
              {selectedProduct.description && (
                <p className="text-sm text-dm-text-secondary leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 pt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-800">
                  {selectedProduct.item_type === 'SERVICE' ? 'Servicio' : 'Producto'}
                </span>
                {selectedProduct.service_category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    {selectedProduct.service_category}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
