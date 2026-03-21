// src/features/fluvial/components/sales-point/index.ts

// Core types and interfaces
export * from './core/types';

// Utility functions
export * from './utils/priceCalculations';

// Services
export * from './services/saleValidationService';
export * from './services/invoiceCreationService';

// Custom hooks
export * from './hooks/useSaleFormState';
export * from './hooks/useSaleBusinessLogic';
export * from './hooks/useSaleForm';

// Components (re-export existing ones)
export { SaleForm } from './SaleForm';
export { PassengerDataForm } from './PassengerDataForm';
export { SeatAndFareSelector } from './SeatAndFareSelector';
export { PriceSummary } from './PriceSummary';
export { ReservationModal } from './ReservationModal';
export { RepresentativesManager } from './representatives';
