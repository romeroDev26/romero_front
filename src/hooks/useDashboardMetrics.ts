// src/hooks/useDashboardMetrics.ts
import { useQuery } from '@tanstack/react-query';
import { adminReportsService, ReportFilters } from '../services/adminReports.service';
import { invoicesService } from '../services/invoices.service';
import { getStartOfMonth, getEndOfMonth } from '../utils/dateUtils';

// Hook para obtener métricas generales de ventas del mes actual
export const useSalesMetrics = (companyId?: number) => {
  const startOfMonth = getStartOfMonth();
  const endOfMonth = getEndOfMonth();

  const filters: ReportFilters = {
    start_date: startOfMonth,
    end_date: endOfMonth,
  };

  return useQuery({
    queryKey: ['dashboard', 'sales-metrics', filters],
    queryFn: () => adminReportsService.getSalesSummary(filters),
    enabled: !!companyId, // Solo ejecutar si hay companyId
  });
};

// Hook para obtener rendimiento de vendedores (top 3)
export const useTopSellers = (companyId?: number) => {
  const startOfMonth = getStartOfMonth();
  const endOfMonth = getEndOfMonth();

  const filters: ReportFilters = {
    start_date: startOfMonth,
    end_date: endOfMonth,
    limit: 3,
  };

  return useQuery({
    queryKey: ['dashboard', 'top-sellers', filters],
    queryFn: () => adminReportsService.getSalesPerformance(filters),
    enabled: !!companyId,
  });
};

// Hook para obtener rutas más populares
export const usePopularRoutes = (companyId?: number) => {
  const startOfMonth = getStartOfMonth();
  const endOfMonth = getEndOfMonth();

  const filters: ReportFilters = {
    start_date: startOfMonth,
    end_date: endOfMonth,
    limit: 5,
  };

  return useQuery({
    queryKey: ['dashboard', 'popular-routes', filters],
    queryFn: () => adminReportsService.getPopularRoutes(filters),
    enabled: !!companyId,
  });
};

// Hook para obtener distribución de métodos de pago
export const usePaymentMethods = (companyId?: number) => {
  const startOfMonth = getStartOfMonth();
  const endOfMonth = getEndOfMonth();

  const filters: ReportFilters = {
    start_date: startOfMonth,
    end_date: endOfMonth,
  };

  return useQuery({
    queryKey: ['dashboard', 'payment-methods', filters],
    queryFn: () => adminReportsService.getPaymentMethods(filters),
    enabled: !!companyId,
  });
};

// Hook para obtener ocupación de embarcaciones
export const useVesselOccupancy = (companyId?: number) => {
  const startOfMonth = getStartOfMonth();
  const endOfMonth = getEndOfMonth();

  const filters: ReportFilters = {
    start_date: startOfMonth,
    end_date: endOfMonth,
  };

  return useQuery({
    queryKey: ['dashboard', 'vessel-occupancy', filters],
    queryFn: () => adminReportsService.getVesselOccupancy(filters),
    enabled: !!companyId,
  });
};

// Hook para obtener las últimas facturas del dashboard
export const useRecentInvoices = (companyId?: number) => {
  return useQuery({
    queryKey: ['dashboard', 'recent-invoices', companyId],
    queryFn: async () => {
      const invoices = await invoicesService.getInvoices({
        company_id: companyId,
        limit: 50, // Obtener más para filtrar
      });
      
      // Convertir valores string a números y filtrar facturas con monto válido (> 0)
      const processedInvoices = invoices.map(invoice => ({
        ...invoice,
        total_payable: parseFloat(invoice.total_payable.toString()) || 0,
        total_taxable: parseFloat(invoice.total_taxable.toString()) || 0,
        total_exonerated: parseFloat(invoice.total_exonerated.toString()) || 0,
        total_unaffected: parseFloat(invoice.total_unaffected.toString()) || 0,
        total_free: parseFloat(invoice.total_free.toString()) || 0,
        total_igv: parseFloat(invoice.total_igv.toString()) || 0,
        total_isc: parseFloat(invoice.total_isc.toString()) || 0,
        total_other_taxes: parseFloat(invoice.total_other_taxes.toString()) || 0,
      }));
      
      return processedInvoices
        .filter(invoice => invoice.total_payable > 0)
        .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
        .slice(0, 10); // Tomar solo las 10 más recientes
    },
    enabled: !!companyId,
  });
};