/**
 * Exportaciones del directorio de transformers
 * 
 * Este archivo centraliza todas las exportaciones de transformadores de tickets
 * y utilidades relacionadas para facilitar las importaciones desde otros módulos.
 */

// Transformadores
export { NormalSaleTransformer } from './normalSale.transformer';
export { NoSeatsSaleTransformer } from './noSeatsSale.transformer';

// Factory para selección automática
export { TransformerFactory } from './transformerFactory';
