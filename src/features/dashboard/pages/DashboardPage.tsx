// src/features/dashboard/pages/DashboardPage.tsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MonthlySalesChart } from '../components/MonthlySalesChart';
import { BranchSalesChart } from '../components/BranchSalesChart';
import { BranchSalesLineChart } from '../components/BranchSalesLineChart';
import { BranchParticipationTrack } from '../components/BranchParticipationTrack';
import { TopSellersByBranch } from '../components/TopSellersByBranch';
import { DashboardStatCard, TrendData } from '../components/DashboardStatCard';
import {
  BarChart3,
  ArrowRight,
  Users,
  Banknote,
  Receipt,
  Store,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { dashboardService } from '../../../services/dashboard.service';
import { AnimatedCounter } from '../../../components/common/AnimatedCounter';

const PERIOD_LABELS: Record<'today' | 'week' | 'month' | 'year', string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  year: 'Este año',
};

export const DashboardPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [topSellersPeriod, setTopSellersPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    'daily'
  );

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboard-metrics', period],
    queryFn: () => dashboardService.getDashboardMetrics({ period }),
    staleTime: 1000 * 60 * 5,
    enabled: !!user && (user?.role?.name?.toLowerCase() === 'admin' || user?.role_name?.toLowerCase() === 'admin'),
  });

  const generatedLabel = useMemo(() => {
    const raw = dashboardData?.meta?.generated_at;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  }, [dashboardData?.meta?.generated_at]);

  const comparacion = dashboardData?.metricas_generales?.comparacion_mes_anterior;

  // Solo Ingresos tiene trend real del backend
  const trendIngresos: TrendData | undefined = comparacion
    ? { porcentaje: comparacion.porcentaje, tendencia: comparacion.tendencia }
    : undefined;

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const isAdmin =
    user?.role?.name?.toLowerCase() === 'admin' || user?.role_name?.toLowerCase() === 'admin';

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <BarChart3 className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Acceso restringido</h2>
          <p className="mb-4 text-sm text-gray-500">
            El dashboard general está disponible únicamente para administradores del sistema.
          </p>
          <Link
            to="/"
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header compacto estilo TailAdmin */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Resumen general
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Métricas consolidadas del negocio ·{' '}
            <span className="font-medium text-gray-700">{PERIOD_LABELS[period]}</span>
            {generatedLabel && (
              <span className="ml-1 text-gray-400">· Actualizado {generatedLabel}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[180px]">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              id="global-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month' | 'year')}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm font-medium text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Período de métricas"
            >
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="year">Este año</option>
            </select>
          </div>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <span className="hidden sm:inline">Reportes detallados</span>
            <span className="sm:hidden">Reportes</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* KPI Cards - 4 columnas en desktop */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Usuarios activos"
          icon={Users}
          tone="indigo"
        >
          {isDashboardLoading ? (
            '—'
          ) : (
            <AnimatedCounter
              value={dashboardData?.metricas_generales?.total_usuarios ?? 0}
              minimumFractionDigits={0}
              maximumFractionDigits={0}
            />
          )}
        </DashboardStatCard>

        <DashboardStatCard
          label="Ingresos del período"
          icon={Banknote}
          tone="emerald"
          trend={trendIngresos}
        >
          {isDashboardLoading ? (
            '—'
          ) : (
            <AnimatedCounter
              value={dashboardData?.metricas_generales?.ingresos_totales ?? 0}
              prefix="S/ "
              minimumFractionDigits={2}
              maximumFractionDigits={2}
            />
          )}
        </DashboardStatCard>

        <DashboardStatCard
          label="Facturas emitidas"
          icon={Receipt}
          tone="rose"
        >
          {isDashboardLoading ? (
            '—'
          ) : (
            <AnimatedCounter
              value={dashboardData?.top_vendedores_por_sucursal?.resumen_general?.total_facturas ?? 0}
              minimumFractionDigits={0}
              maximumFractionDigits={0}
            />
          )}
        </DashboardStatCard>

        <DashboardStatCard
          label="Sucursales activas"
          icon={Store}
          tone="amber"
        >
          {isDashboardLoading ? (
            '—'
          ) : (
            <AnimatedCounter
              value={dashboardData?.top_vendedores_por_sucursal?.resumen_general?.total_sucursales ?? 0}
              minimumFractionDigits={0}
              maximumFractionDigits={0}
            />
          )}
        </DashboardStatCard>
      </section>

      {/* Fila 2: Ventas mensuales + Ventas por sucursal (60/40) */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MonthlySalesChart data={dashboardData?.ventas_mensuales} isLoading={isDashboardLoading} />
        </div>
        <div>
          <BranchSalesChart data={dashboardData?.ventas_por_sucursal} isLoading={isDashboardLoading} />
        </div>
      </section>

      {/* Fila 3: Evolución + Participación (50/50) */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BranchSalesLineChart
          data={dashboardData?.evolucion_ventas_sucursales}
          isLoading={isDashboardLoading}
          variant="embedded"
        />
        <BranchParticipationTrack
          data={dashboardData?.ventas_por_sucursal}
          isLoading={isDashboardLoading}
        />
      </section>

      {/* Fila 4: Ranking de vendedores (full width) */}
      <TopSellersByBranch
        data={dashboardData?.top_vendedores_por_sucursal}
        isLoading={isDashboardLoading}
        period={topSellersPeriod}
        onPeriodChange={setTopSellersPeriod}
      />
    </div>
  );
};
