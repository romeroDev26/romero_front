// src/features/fluvial/components/sales-point/tickets/index.ts

/**
 * API principal para la generación de tickets
 * Expone una interfaz simple y limpia para usar en los componentes
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

// Exportar transformers (por si se necesitan individualmente)
export { NormalSaleTransformer } from './transformers/normalSale.transformer';

// Exportar templates (por si se necesitan individualmente)
export { NormalTicketTemplate } from './templates/normalTicket.template';

// Funciones de conveniencia para casos comunes
export { 
  generateNormalSaleTicket,
  downloadNormalSaleTicket,
  generateNormalSaleTicketBlob,
  generateNormalSaleTicketBase64,
  validateNormalSaleData
} from './api/ticketApi';
