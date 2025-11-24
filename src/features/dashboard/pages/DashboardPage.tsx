// src/features/dashboard/pages/DashboardPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserMetrics } from '../components/UserMetrics';
import { RevenueMetrics } from '../components/RevenueMetrics';
import { MonthlySalesChart } from '../components/MonthlySalesChart';
import { BranchSalesChart } from '../components/BranchSalesChart';
import { BranchSalesLineChart } from '../components/BranchSalesLineChart';
import { TopSellersByBranch } from '../components/TopSellersByBranch';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { dashboardService } from '../../../services/dashboard.service';

export const DashboardPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [evolutionPeriod, setEvolutionPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [topSellersPeriod, setTopSellersPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [includeSellerDetails, setIncludeSellerDetails] = useState(true);

  // Obtener todas las métricas del dashboard en una sola llamada
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboard-metrics', period],
    queryFn: () => dashboardService.getDashboardMetrics({ period }),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!user && (user?.role?.name?.toLowerCase() === 'admin' || user?.role_name?.toLowerCase() === 'admin'),
  });

  // Mostrar loading mientras se carga la información del usuario
  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Solo administradores pueden acceder al dashboard analítico
  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || 
                  user?.role_name?.toLowerCase() === 'admin';
  
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            El Dashboard General está disponible únicamente para administradores del sistema.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  // Para administradores, mostrar el dashboard analítico completo
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Rendimiento</h1>
        
        {/* Selector de período global */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="global-period" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Período:
          </label>
          <select
            id="global-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month' | 'year')}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="year">Este Año</option>
          </select>
        </div>
      </div>

      {/* Métricas Clave - Reciben datos precalculados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserMetrics 
          data={dashboardData?.metricas_generales} 
          isLoading={isDashboardLoading} 
        />
        <RevenueMetrics 
          data={dashboardData?.metricas_generales} 
          isLoading={isDashboardLoading} 
        />
      </div>

      {/* Gráficos - Reciben datos precalculados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthlySalesChart 
          data={dashboardData?.ventas_mensuales} 
          isLoading={isDashboardLoading} 
        />
        <BranchSalesChart 
          data={dashboardData?.ventas_por_sucursal} 
          isLoading={isDashboardLoading} 
        />
      </div>

      {/* Gráfico de evolución de ventas por sucursal */}
      <div className="grid grid-cols-1 gap-6">
        <BranchSalesLineChart 
          data={dashboardData?.evolucion_ventas_sucursales}
          isLoading={isDashboardLoading}
          period={evolutionPeriod}
          onPeriodChange={setEvolutionPeriod}
        />
      </div>

      {/* Top vendedores por sucursal */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <TopSellersByBranch 
          data={dashboardData?.top_vendedores_por_sucursal}
          isLoading={isDashboardLoading}
          period={topSellersPeriod}
          includeSellerDetails={includeSellerDetails}
          onPeriodChange={setTopSellersPeriod}
          onSellerDetailsChange={setIncludeSellerDetails}
        />
      </div>

      {/* Enlaces a reportes y estadísticas */}
      <div className="grid grid-cols-1 gap-4">
        <Link
          to="/reports"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <BarChart3 className="w-5 h-5" />
          Ver Reportes Detallados
        </Link>
      </div>
    </div>
  );
};
