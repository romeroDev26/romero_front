// src/features/fluvial/components/sales-point/tickets/index.ts

/**
 * API principal para la generación de tickets
 * Expone una interfaz simple y limpia para usar en los componentes
 * Incluye soporte para detección automática de embarcaciones con/sin asientos
 */

// Exportar tipos principales
export type { 
  BackendInvoiceData,
  BackendInvoiceItem,
  BackendClient,
  BackendCompany,
  BackendSeller
} from './types/backend.types';

export type {
  TicketData,
  TicketHeader,
  TicketPassengerInfo,
  TicketTripDetails,
  TicketFinancialBreakdown,
  TicketPaymentInfo,
  TicketFooter,
  TicketFinancialItem,
  TicketSummaryItem,
  TicketTripDetail
} from './types/ticket.types';

// Exportar el generador principal
export { TicketGenerator } from './generators/ticketGenerator';

// Exportar generador especializado para sin asientos
export { NoSeatsTicketGenerator } from './generators/noSeatsTicketGenerator';

// Exportar transformers
export { NormalSaleTransformer } from './transformers/normalSale.transformer';
export { NoSeatsSaleTransformer } from './transformers/noSeatsSale.transformer';

// Exportar templates
export { NormalTicketTemplate } from './templates/normalTicket.template';
export { NoSeatsTicketTemplate } from './templates/noSeatsTicket.template';

// Funciones de conveniencia con detección automática
export { 
  generateTicket,
  downloadTicket,
  generateTicketBlob,
  generateNormalSaleTicket,
  downloadNormalSaleTicket,
  generateNormalSaleTicketBlob,
  generateNormalSaleTicketBase64,
  validateNormalSaleData
} from './api/ticketApi';

// Funciones específicas para embarcaciones sin asientos
export {
  generateNoSeatsTicket,
  downloadNoSeatsTicket,
  generateNoSeatsTicketBlob,
  generateNoSeatsTicketBase64,
  validateNoSeatsData
} from './api/noSeatsTicketApi';
