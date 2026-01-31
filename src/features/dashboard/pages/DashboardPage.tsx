// src/features/dashboard/pages/DashboardPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MonthlySalesChart } from '../components/MonthlySalesChart';
import { BranchSalesChart } from '../components/BranchSalesChart';
import { BranchSalesLineChart } from '../components/BranchSalesLineChart';
import { TopSellersByBranch } from '../components/TopSellersByBranch';
import { BarChart3, ArrowRight, Users, Banknote, Receipt, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { dashboardService } from '../../../services/dashboard.service';

export const DashboardPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [topSellersPeriod, setTopSellersPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

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
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de rendimiento del negocio</p>
        </div>
        
        {/* Controles del header */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            id="global-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month' | 'year')}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="year">Este Año</option>
          </select>
          
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Reportes Detallados</span>
          </Link>
        </div>
      </div>

      {/* Metricas Clave - Compactas en una fila */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usuarios */}
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Usuarios</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {isDashboardLoading ? '--' : dashboardData?.metricas_generales?.total_usuarios || 0}
          </p>
        </div>

        {/* Ingresos */}
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Ingresos</span>
            </div>
            {dashboardData?.metricas_generales?.comparacion_mes_anterior && (
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                dashboardData.metricas_generales.comparacion_mes_anterior.tendencia === 'up' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : dashboardData.metricas_generales.comparacion_mes_anterior.tendencia === 'down'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-50 text-gray-500'
              }`}>
                {dashboardData.metricas_generales.comparacion_mes_anterior.tendencia === 'up' && <TrendingUp className="w-3 h-3" />}
                {dashboardData.metricas_generales.comparacion_mes_anterior.tendencia === 'down' && <TrendingDown className="w-3 h-3" />}
                {dashboardData.metricas_generales.comparacion_mes_anterior.tendencia === 'neutral' && <Minus className="w-3 h-3" />}
                {dashboardData.metricas_generales.comparacion_mes_anterior.porcentaje > 0 ? '+' : ''}
                {dashboardData.metricas_generales.comparacion_mes_anterior.porcentaje.toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {isDashboardLoading ? '--' : dashboardData?.metricas_generales?.ingresos_totales_formateado || 'S/ 0'}
          </p>
        </div>

        {/* Total Facturas */}
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Facturas</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {isDashboardLoading ? '--' : dashboardData?.top_vendedores_por_sucursal?.resumen_general?.total_facturas || 0}
          </p>
        </div>

        {/* Total Ventas del periodo */}
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Sucursales</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {isDashboardLoading ? '--' : dashboardData?.top_vendedores_por_sucursal?.resumen_general?.total_sucursales || 0}
          </p>
        </div>
      </div>

      {/* Graficos - Reciben datos precalculados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlySalesChart 
          data={dashboardData?.ventas_mensuales} 
          isLoading={isDashboardLoading} 
        />
        <BranchSalesChart 
          data={dashboardData?.ventas_por_sucursal} 
          isLoading={isDashboardLoading} 
        />
      </div>

      {/* Grafico de evolucion de ventas por sucursal */}
      <BranchSalesLineChart 
        data={dashboardData?.evolucion_ventas_sucursales}
        isLoading={isDashboardLoading}
      />

      {/* Top vendedores por sucursal - Ahora como tabla compacta */}
      <TopSellersByBranch 
        data={dashboardData?.top_vendedores_por_sucursal}
        isLoading={isDashboardLoading}
        period={topSellersPeriod}
        onPeriodChange={setTopSellersPeriod}
      />

    </div>
  );
};
