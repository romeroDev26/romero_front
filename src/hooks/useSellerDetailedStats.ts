// src/hooks/useSellerDetailedStats.ts
import { useQuery } from '@tanstack/react-query';
import { adminReportsService } from '../services/adminReports.service';
import { SellerDetailedReportResponse, SellerMetrics } from '../types/sellerDetailedReport';

interface UseSellerDetailedStatsParams {
  userId: string;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

const calculateMetrics = (data: SellerDetailedReportResponse): SellerMetrics => {
  const invoices = data.items || [];

  // Métricas básicas
  const total_invoices = invoices.length;
  const total_revenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);
  
  // Contar pasajeros y carga
  let total_passengers = 0;
  let total_cargo_items = 0;
  
  invoices.forEach(invoice => {
    invoice.items.forEach(item => {
      if (item.seat_number) {
        total_passengers++;
      } else {
        total_cargo_items += parseFloat(item.quantity || '0');
      }
    });
  });

  const average_ticket = total_invoices > 0 ? total_revenue / total_invoices : 0;

  // Breakdown por métodos de pago
  const payment_methods_breakdown: Record<string, number> = {};
  invoices.forEach(inv => {
    const method = inv.payment_method || 'No especificado';
    payment_methods_breakdown[method] = (payment_methods_breakdown[method] || 0) + parseFloat(inv.total_amount || '0');
  });

  // Breakdown por tipos de documento
  const document_types_breakdown: Record<string, number> = {};
  invoices.forEach(inv => {
    const type = inv.document_type || 'No especificado';
    document_types_breakdown[type] = (document_types_breakdown[type] || 0) + 1;
  });

  // Breakdown por estado SUNAT
  const sunat_status_breakdown: Record<string, number> = {};
  invoices.forEach(inv => {
    const status = inv.sunat_status || 'No especificado';
    sunat_status_breakdown[status] = (sunat_status_breakdown[status] || 0) + 1;
  });

  // Ventas diarias
  const dailySalesMap: Record<string, { amount: number; invoices: number }> = {};
  invoices.forEach(inv => {
    const date = inv.issue_date.split('T')[0];
    if (!dailySalesMap[date]) {
      dailySalesMap[date] = { amount: 0, invoices: 0 };
    }
    dailySalesMap[date].amount += parseFloat(inv.total_amount || '0');
    dailySalesMap[date].invoices += 1;
  });

  const daily_sales = Object.entries(dailySalesMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top rutas
  const routesMap: Record<string, { revenue: number; passengers: number }> = {};
  invoices.forEach(invoice => {
    invoice.items.forEach(item => {
      if (item.route_name) {
        const route = item.route_name;
        if (!routesMap[route]) {
          routesMap[route] = { revenue: 0, passengers: 0 };
        }
        routesMap[route].revenue += parseFloat(item.total_amount || '0');
        if (item.seat_number) {
          routesMap[route].passengers += 1;
        }
      }
    });
  });

  const top_routes = Object.entries(routesMap)
    .map(([route, data]) => ({ route, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top productos
  const productsMap: Record<string, { quantity: number; revenue: number }> = {};
  invoices.forEach(invoice => {
    invoice.items.forEach(item => {
      const product = item.product_name || 'No especificado';
      if (!productsMap[product]) {
        productsMap[product] = { quantity: 0, revenue: 0 };
      }
      productsMap[product].quantity += parseFloat(item.quantity || '0');
      productsMap[product].revenue += parseFloat(item.total_amount || '0');
    });
  });

  const top_products = Object.entries(productsMap)
    .map(([product, data]) => ({ product, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    total_invoices,
    total_revenue,
    total_passengers,
    total_cargo_items,
    average_ticket,
    payment_methods_breakdown,
    document_types_breakdown,
    sunat_status_breakdown,
    daily_sales,
    top_routes,
    top_products,
  };
};

export const useSellerDetailedStats = ({ 
  userId, 
  startDate, 
  endDate, 
  enabled = true 
}: UseSellerDetailedStatsParams) => {
  const query = useQuery({
    queryKey: ['sellerDetailedStats', userId, startDate, endDate],
    queryFn: async () => {
      const response = await adminReportsService.getDailySalesDetailed({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      });
      return response as SellerDetailedReportResponse;
    },
    enabled: enabled && !!userId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const metrics = query.data ? calculateMetrics(query.data) : null;

  return {
    ...query,
    metrics,
    rawData: query.data,
  };
};
