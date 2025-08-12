// src/features/quotations/index.ts

// Exportar tipos
export * from './types';

// Exportar servicios
export { quotationsService } from './services/quotations.service';

// Exportar hooks
export { useQuotations } from './hooks/useQuotations';
export { useQuotationSeries } from './hooks/useQuotationSeries';
export { useQuotationSeriesByBranch } from './hooks/useQuotationSeriesByBranch';

// Exportar páginas
export { QuotationsListPage } from './pages/QuotationsListPage';
export { QuotationDetailPage } from './pages/QuotationDetailPage';
export { QuotationNewPage } from './pages/QuotationNewPage';
