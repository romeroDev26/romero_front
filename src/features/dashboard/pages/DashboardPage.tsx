// src/features/dashboard/pages/DashboardPage.tsx
import React from 'react';
<<<<<<< HEAD
import { Link } from 'react-router-dom';
import { UserMetrics } from '../components/UserMetrics';
import { RevenueMetrics } from '../components/RevenueMetrics';
import { MonthlySalesChart } from '../components/MonthlySalesChart';
import { BranchSalesChart } from '../components/BranchSalesChart';
import { BarChart3 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard de Rendimiento</h1>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserMetrics />
        <RevenueMetrics />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthlySalesChart />
        <BranchSalesChart />
      </div>

      {/* Enlace a reportes detallados */}
      <div className="flex justify-center">
        <Link
          to="/reports"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Ver Reportes Detallados
        </Link>
=======
import { format, parseISO } from 'date-fns';
import { 
  DocumentTextIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { Spinner } from '../../../components/common/Spinner';
import { SunatStatusBadge } from '../../../features/accounting/components/SunatStatusBadge';
import {
  useSalesMetrics,
  useTopSellers,
  usePopularRoutes,
  usePaymentMethods,
  useVesselOccupancy,
  useRecentInvoices
} from '../../../hooks/useDashboardMetrics';// Supongamos que tienes estos servicios
// import { dashboardService } from '../../../services/dashboard.service';
// import { invoicesService } from '../../../services/invoices.service';

export const DashboardPage: React.FC = () => {
  // Obtener métricas del backend usando los nuevos hooks
  const { data: salesMetrics, isLoading: salesLoading } = useSalesMetrics(1); // TODO: Obtener companyId del contexto/auth
  const { data: topSellers, isLoading: sellersLoading } = useTopSellers(1);
  const { data: popularRoutes, isLoading: routesLoading } = usePopularRoutes(1);
  const { data: paymentMethods, isLoading: paymentsLoading } = usePaymentMethods(1);
  const { data: vesselOccupancy, isLoading: occupancyLoading } = useVesselOccupancy(1);
  const { data: recentInvoices = [], isLoading: invoicesLoading } = useRecentInvoices(1);

  // En un caso real, usarías estos queries para obtener datos del backend
  // const { data: stats, isLoading } = useQuery(['dashboardStats'], dashboardService.getStats);
  // const { data: recentInvoices } = useQuery(['recentInvoices'], invoicesService.getRecent);

  const isLoading = salesLoading || sellersLoading || routesLoading || paymentsLoading || occupancyLoading || invoicesLoading;

  if (isLoading) return <Spinner />;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ventas del Mes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <CurrencyDollarIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Ventas del Mes</h2>
              <p className="text-2xl font-semibold">
                S/ {salesMetrics?.summary?.total_gross_amount?.toLocaleString('es-PE', { minimumFractionDigits: 2 }) || '0.00'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/reports" className="text-primary hover:text-primary/80 text-sm">
              Ver Reportes →
            </Link>
          </div>
        </div>

        {/* Total de Facturas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary/10 text-secondary">
              <DocumentTextIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Facturas del Mes</h2>
              <p className="text-2xl font-semibold">{salesMetrics?.summary?.total_invoices || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/invoices" className="text-secondary hover:text-secondary/80 text-sm">
              Ver Facturas →
            </Link>
          </div>
        </div>

        {/* Ocupación Promedio */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent/10 text-accent">
              <ChartBarIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Ocupación Promedio</h2>
              <p className="text-2xl font-semibold">{vesselOccupancy?.summary?.average_occupancy?.toFixed(1) || 0}%</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/reports" className="text-accent hover:text-accent/80 text-sm">
              Ver Ocupación →
            </Link>
          </div>
        </div>

        {/* Clientes Atendidos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-info/10 text-info">
              <UsersIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Clientes Únicos</h2>
              <p className="text-2xl font-semibold">{salesMetrics?.summary?.unique_clients || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/clients" className="text-info hover:text-info/80 text-sm">
              Ver Clientes →
            </Link>
          </div>
        </div>

        {/* Vendedores Activos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-warning/10 text-warning">
              <UserGroupIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Vendedores Activos</h2>
              <p className="text-2xl font-semibold">{salesMetrics?.summary?.unique_users || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/reports" className="text-warning hover:text-warning/80 text-sm">
              Ver Rendimiento →
            </Link>
          </div>
        </div>

        {/* Rutas Activas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success/10 text-success">
              <MapIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Rutas Activas</h2>
              <p className="text-2xl font-semibold">{popularRoutes?.summary?.total_routes_analyzed || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/routes" className="text-success hover:text-success/80 text-sm">
              Ver Rutas →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Sección de Rendimiento de Vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Top Vendedores del Mes</h2>
          </div>
          <div className="p-6">
            {topSellers?.items && topSellers.items.length > 0 ? (
              <div className="space-y-4">
                {topSellers.items.slice(0, 3).map((seller, index) => (
                  <div key={seller.user_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{seller.user_name}</p>
                        <p className="text-xs text-gray-500">{seller.branch_office_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        S/ {seller.total_sales?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">{seller.invoice_count} facturas</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos de vendedores disponibles</p>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <Link to="/reports" className="text-primary hover:text-primary/80 text-sm">
              Ver todos los vendedores →
            </Link>
          </div>
        </div>

        {/* Sección de Rutas Populares */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Rutas Más Populares</h2>
          </div>
          <div className="p-6">
            {popularRoutes?.items && popularRoutes.items.length > 0 ? (
              <div className="space-y-4">
                {popularRoutes.items.slice(0, 3).map((route, index) => (
                  <div key={route.route_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{route.route_name}</p>
                        <p className="text-xs text-gray-500">{route.origin_port} → {route.destination_port}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        S/ {route.total_revenue?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">{route.passenger_count} pasajeros</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos de rutas disponibles</p>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <Link to="/reports" className="text-primary hover:text-primary/80 text-sm">
              Ver todas las rutas →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Sección de Métodos de Pago */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Distribución de Métodos de Pago</h2>
        </div>
        <div className="p-6">
          {paymentMethods?.items && paymentMethods.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paymentMethods.items.map((method) => (
                <div key={method.payment_method} className="text-center">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">
                          {method.payment_method === 'efectivo' ? 'Efectivo' :
                           method.payment_method === 'tarjeta' ? 'Tarjeta' :
                           method.payment_method === 'transferencia' ? 'Transferencia' :
                           method.payment_method}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold inline-block text-gray-600">
                          {method.percentage_of_transactions?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${method.percentage_of_transactions}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {method.transaction_count} transacciones
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      S/ {method.total_amount?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay datos de métodos de pago disponibles</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link to="/reports" className="text-primary hover:text-primary/80 text-sm">
            Ver análisis completo →
          </Link>
        </div>
      </div>
      
      {/* Facturas recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Facturas Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serie-Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/accounting/invoices/${invoice.id}`} className="text-primary hover:text-primary/80">
                        {invoice.series}-{String(invoice.number).padStart(8, '0')}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.client?.name || 'Cliente no disponible'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(parseISO(invoice.issue_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      S/ {typeof invoice.total_payable === 'number' ? invoice.total_payable.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SunatStatusBadge status={invoice.sunat_status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No hay facturas recientes disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link to="/invoices" className="text-primary hover:text-primary/80">
            Ver todas las facturas →
          </Link>
        </div>
>>>>>>> 50a34cbf2a9176684bad5414dbf2330668046542
      </div>
    </div>
  );
};
