// src/features/fluvial/types/products-services-ui.types.ts
// Solo tipos específicos para UI y formularios (no duplicar los tipos principales)

export type CurrencyCode = 'PEN' | 'USD' | 'EUR';

export type UnitCode = 
  | 'NIU'  // Unidad (número de elementos)
  | 'KGM'  // Kilogramo
  | 'MTR'  // Metro
  | 'LTR'  // Litro
  | 'M2'   // Metro cuadrado
  | 'M3'   // Metro cúbico
  | 'HUR'  // Hora
  | 'ZZ';  // Unidad no definida

export interface ProductServiceFormData {
  internal_code: string;
  name: string;
  description?: string;
  item_type: 'PRODUCT' | 'SERVICE';
  service_category: string;
  unit_code: UnitCode;
  purchase_price: number;
  sale_price: number;
  currency_code: CurrencyCode;
  tax_category_code: string;
  unspcs_code: string;
  is_active: boolean;
  specific_route_id?: number;
}

export interface ProductServiceFilters {
  search?: string;
  item_type?: 'PRODUCT' | 'SERVICE' | '';
  is_active?: boolean;
  service_category?: string;
}

// Opciones predefinidas para formularios
export const ITEM_TYPE_OPTIONS = [
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'PRODUCT', label: 'Producto' }
] as const;

export const SERVICE_CATEGORY_OPTIONS = [
  { value: 'PASAJES', label: 'Pasajes' },
  { value: 'ENCOMIENDA_PEQUENA', label: 'Encomienda Pequeña' },
  { value: 'ENCOMIENDA_MEDIANA', label: 'Encomienda Mediana' },
  { value: 'ENCOMIENDA_GRANDE', label: 'Encomienda Grande' },
  { value: 'CARGA_GENERAL_KGM', label: 'Carga General (KG)' },
  { value: 'CARGA_GENERAL_VOL', label: 'Carga General (VOL)' },
  { value: 'OTROS', label: 'Otros' }
] as const;

export const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
  { value: 'EUR', label: 'Euros (EUR)' }
] as const;

export const UNIT_CODE_OPTIONS = [
  { value: 'NIU', label: 'Unidad' },
  { value: 'KGM', label: 'Kilogramo' },
  { value: 'MTR', label: 'Metro' },
  { value: 'LTR', label: 'Litro' },
  { value: 'M2', label: 'Metro cuadrado' },
  { value: 'M3', label: 'Metro cúbico' },
  { value: 'HUR', label: 'Hora' },
  { value: 'ZZ', label: 'No definida' }
] as const;

// Códigos de categoría tributaria comunes
export const TAX_CATEGORY_OPTIONS = [
  { value: 'stri', label: 'Servicio de transporte regular de pasajeros (STRI)' },
  { value: 'grav', label: 'Gravado - Operación Onerosa' },
  { value: 'exon', label: 'Exonerado - Operación Onerosa' },
  { value: 'inaf', label: 'Inafecto - Operación Onerosa' },
  { value: 'gratuito', label: 'Gratuito' }
] as const;

// Códigos UNSPSC comunes para transporte fluvial
export const UNSPCS_CODE_OPTIONS = [
  { value: '78111804', label: 'Servicios de transporte de pasajeros por agua' },
  { value: '78111805', label: 'Servicios de transporte de carga por agua' },
  { value: '78111801', label: 'Servicios de transporte fluvial' },
  { value: '34061773', label: 'Productos y servicios diversos' }
] as const;