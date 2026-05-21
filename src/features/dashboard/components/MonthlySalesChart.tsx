import React, { useId, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { VentasMensuales } from '../../../types/dashboard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useChartTheme } from '../../../hooks/useChartTheme';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2 shadow-sm">
        <p className="mb-1 text-xs font-medium text-dm-text-muted">{label}</p>
        <p className="text-sm font-semibold text-dm-text-primary">
          S/ {Number(payload[0].value).toLocaleString('es-PE')}
        </p>
        {payload[0].payload.facturas != null && (
          <p className="mt-0.5 text-xs text-dm-text-muted">{payload[0].payload.facturas} facturas</p>
        )}
      </div>
    );
  }
  return null;
};

interface MonthlySalesChartProps {
  data?: VentasMensuales;
  isLoading?: boolean;
}

export const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({ data, isLoading = false }) => {
  const chartTheme = useChartTheme();
  const gradientId = useId().replace(/:/g, '');

  const chartData = useMemo(
    () =>
      data?.ultimos_6_meses.map((item) => ({
        name: item.mes,
        value: item.total_ventas,
        facturas: item.cantidad_facturas,
      })) ?? [],
    [data?.ultimos_6_meses]
  );

  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  const lastTwoDelta = useMemo(() => {
    if (chartData.length < 2) return null;
    const a = chartData[chartData.length - 2].value;
    const b = chartData[chartData.length - 1].value;
    if (!a) return b > 0 ? 100 : 0;
    return ((b - a) / a) * 100;
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-1/3 rounded bg-dm-bg-secondary" />
          <div className="h-64 rounded-lg bg-dm-bg-secondary" />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-dm-text-primary">Resumen de ventas</h2>
          <p className="text-xs text-dm-text-muted">Últimos 6 meses</p>
        </div>
        <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-dm-border-primary bg-dm-bg-secondary">
          <p className="text-sm font-medium text-dm-text-muted">Sin datos de ventas</p>
        </div>
      </div>
    );
  }

  const displayTrend =
    lastTwoDelta != null
      ? {
          porcentaje: Math.abs(lastTwoDelta),
          tendencia:
            lastTwoDelta > 0.5 ? ('up' as const) : lastTwoDelta < -0.5 ? ('down' as const) : ('neutral' as const),
        }
      : null;

  return (
    <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm">
      {/* Header compacto */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-dm-text-primary">Resumen de ventas</h2>
          <p className="text-xs text-dm-text-muted">Últimos 6 meses · total acumulado</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums text-dm-text-primary">
            S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          {displayTrend && displayTrend.tendencia !== 'neutral' && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                displayTrend.tendencia === 'up'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {displayTrend.tendencia === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {displayTrend.tendencia === 'up' ? '+' : '−'}
              {displayTrend.porcentaje.toFixed(1)}%
            </span>
          )}
          {displayTrend?.tendencia === 'neutral' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-dm-bg-secondary px-2 py-0.5 text-xs font-semibold text-dm-text-muted">
              <Minus className="h-3 w-3" />
              Estable
            </span>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: chartTheme.axis }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: chartTheme.axis }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                return String(value);
              }}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartTheme.cursorStroke, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{ r: 2.5, fill: '#4f46e5', stroke: chartTheme.dotStroke, strokeWidth: 1.5 }}
              activeDot={{ r: 4.5, fill: '#4f46e5', stroke: chartTheme.dotStroke, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
