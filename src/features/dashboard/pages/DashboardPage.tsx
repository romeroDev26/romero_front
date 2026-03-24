// src/features/dashboard/pages/DashboardPage.tsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MonthlySalesChart } from '../components/MonthlySalesChart';
import { BranchSalesChart } from '../components/BranchSalesChart';
import { BranchSalesLineChart } from '../components/BranchSalesLineChart';
import { BranchParticipationTrack } from '../components/BranchParticipationTrack';
import { TopSellersByBranch } from '../components/TopSellersByBranch';
import { DashboardStatCard } from '../components/DashboardStatCard';
import {
  BarChart3,
  ArrowRight,
  Users,
  Banknote,
  Receipt,
  Store,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
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
      <div className="-mx-4 px-4 md:-mx-6 md:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <BarChart3 className="h-6 w-6 text-amber-700" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-800">Acceso restringido</h2>
          <p className="mb-4 text-slate-600">
            El dashboard general está disponible únicamente para administradores del sistema.
          </p>
          <Link
            to="/"
            className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-0 min-h-[calc(100vh-10rem)] bg-gradient-to-b from-slate-100/95 via-slate-50 to-slate-50 pb-10 lg:-mx-6">
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-4 md:space-y-8 md:px-6 md:pt-4 lg:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Resumen general
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Métricas consolidadas del negocio · período:{' '}
              <span className="text-slate-800">{PERIOD_LABELS[period]}</span>
              {generatedLabel ? (
                <span className="mt-1 block text-xs font-normal text-slate-500 md:inline md:mt-0 md:before:content-['_·_']">
                  Actualizado {generatedLabel}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                id="global-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month' | 'year')}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-800 shadow-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform active:scale-[0.98] sm:w-auto"
            >
              <span className="hidden sm:inline">Reportes detallados</span>
              <span className="sm:hidden">Reportes</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard
            label="Usuarios activos"
            icon={Users}
            tone="indigo"
            hint={<p className="text-xs font-medium text-slate-500">Registrados en el sistema</p>}
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
            hint={
              comparacion ? (
                <p
                  className={`flex flex-wrap items-center gap-1 text-xs font-semibold ${
                    comparacion.tendencia === 'up'
                      ? 'text-emerald-600'
                      : comparacion.tendencia === 'down'
                        ? 'text-rose-600'
                        : 'text-slate-500'
                  }`}
                >
                  {comparacion.tendencia === 'up' && <TrendingUp className="h-3.5 w-3.5 shrink-0" />}
                  {comparacion.tendencia === 'down' && <TrendingDown className="h-3.5 w-3.5 shrink-0" />}
                  {comparacion.tendencia === 'neutral' && <Minus className="h-3.5 w-3.5 shrink-0" />}
                  <span>
                    {comparacion.porcentaje > 0 ? '+' : ''}
                    {comparacion.porcentaje.toFixed(1)}% vs mes anterior
                  </span>
                </p>
              ) : undefined
            }
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
            label="Facturas"
            icon={Receipt}
            tone="rose"
            hint={
              <p className="text-xs font-medium text-slate-500">En el período del ranking de vendedores</p>
            }
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
            label="Sucursales"
            icon={Store}
            tone="amber"
            hint={
              <p className="text-xs font-medium text-slate-500">Sucursales con datos en el ranking</p>
            }
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

        {/* Bloque principal a ancho completo: altura del gráfico fija (mock "Sales overview") */}
        <MonthlySalesChart data={dashboardData?.ventas_mensuales} isLoading={isDashboardLoading} />

        {/* Tres columnas con altura alineada en desktop; listas largas con scroll interno */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
          <div className="flex min-h-[360px] lg:h-[472px] lg:min-h-0">
            <BranchSalesChart data={dashboardData?.ventas_por_sucursal} isLoading={isDashboardLoading} />
          </div>
          <div className="flex min-h-[360px] lg:h-[472px] lg:min-h-0">
            <BranchSalesLineChart
              data={dashboardData?.evolucion_ventas_sucursales}
              isLoading={isDashboardLoading}
              variant="embedded"
            />
          </div>
          <div className="flex min-h-[360px] lg:h-[472px] lg:min-h-0">
            <BranchParticipationTrack
              data={dashboardData?.ventas_por_sucursal}
              isLoading={isDashboardLoading}
            />
          </div>
        </div>

        <TopSellersByBranch
          data={dashboardData?.top_vendedores_por_sucursal}
          isLoading={isDashboardLoading}
          period={topSellersPeriod}
          onPeriodChange={setTopSellersPeriod}
        />
      </div>
    </div>
  );
};
