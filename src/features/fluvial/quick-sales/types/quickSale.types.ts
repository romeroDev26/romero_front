// src/features/fluvial/quick-sales/types/quickSale.types.ts

import { ProductService } from '../../../../types';

export interface QuickSaleFormData {
  selectedProduct: ProductService | null;
  origin: string;
  destination: string;
  quantity: number;
  customPrice: string;
  description: string;
  isIgvGravado: boolean;
}

export const initialQuickSaleFormData: QuickSaleFormData = {
  selectedProduct: null,
  origin: '',
  destination: '',
  quantity: 1,
  customPrice: '',
  description: '',
  isIgvGravado: false,
};
