// src/features/fluvial/types/products-services-ui.types.ts
// Solo tipos específicos para UI y formularios (no duplicar los tipos principales)

export type CurrencyCode = 'PEN' | 'USD' | 'EUR';

export type UnitCode =
 | 'NIU' // Unidad (para bienes físicos/encomiendas)
 | 'KGM' // Kilogramo
 | 'PAQ' // Paquete
 | 'XBX' // Caja
 | 'TNE' // Tonelada
 | 'MTR' // Metro
 | 'MTQ' // Metro Cúbico
 | 'LTR' // Litro
 | 'ZZ'; // Unidad (para servicios de transporte)

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
 { value: 'ZZ', label: 'Servicio (transporte de pasajeros)' }, // ZZ primero para servicios
 { value: 'NIU', label: 'Unidad (para bienes físicos)' },
 { value: 'KGM', label: 'Kilogramo' },
 { value: 'PAQ', label: 'Paquete' },
 { value: 'XBX', label: 'Caja' },
 { value: 'TNE', label: 'Tonelada' },
 { value: 'MTR', label: 'Metro' },
 { value: 'MTQ', label: 'Metro Cúbico' },
 { value: 'LTR', label: 'Litro' },
 { value: 'ZZ', label: 'Unidad (para servicios)' }
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

// Códigos de afectación de IGV (Catálogo 07 SUNAT)
export const TAX_CATEGORY_CODE_SUNAT_OPTIONS = [
 { value: '10', label: 'Gravado - Operación Onerosa' },
 { value: '20', label: 'Exonerado - Operación Onerosa' },
 { value: '30', label: 'Inafecto - Operación Onerosa' },
 { value: '40', label: 'Exportación' },
] as const;

// Objeto de mapeo para una búsqueda rápida del label.
export const TAX_CATEGORY_CODE_MAP: { [key: string]: string } = {
 '10': 'Gravado - Ope. Onerosa',
 '20': 'Exonerado - Ope. Onerosa',
 '30': 'Inafecto - Ope. Onerosa',
 '40': 'Exportación',
};

// Función de utilidad para obtener la etiqueta de forma segura.
export const getTaxCategoryLabel = (code: string): string => {
 return TAX_CATEGORY_CODE_MAP[code] || code; // Si no lo encuentra, devuelve el código.
};
