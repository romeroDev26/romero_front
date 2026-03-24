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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
        <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900">
          S/ {Number(payload[0].value).toLocaleString('es-PE')}
        </p>
        {payload[0].payload.facturas != null && (
          <p className="mt-0.5 text-xs text-slate-500">{payload[0].payload.facturas} facturas</p>
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
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
        <div className="animate-pulse">
          <div className="mb-6 h-7 w-1/3 rounded bg-slate-100" />
          <div className="h-[300px] rounded-lg bg-slate-50" />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-800">Resumen de ventas</h2>
          <p className="text-sm text-slate-500">Últimos 6 meses · montos consolidados</p>
          <p className="mt-1 text-xl font-bold text-slate-900">S/ 0</p>
        </div>
        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-sm font-medium text-slate-600">No hay datos de ventas mensuales</p>
          <p className="mt-1 text-xs text-slate-400">El gráfico se mostrará cuando existan registros</p>
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
    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
      <div className="mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">Resumen de ventas</h2>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm text-slate-500">
            <span>Últimos 6 meses · total acumulado</span>
            {displayTrend && displayTrend.tendencia !== 'neutral' && (
              <span
                className={`inline-flex items-center gap-0.5 font-bold ${
                  displayTrend.tendencia === 'up' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {displayTrend.tendencia === 'up' ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {displayTrend.tendencia === 'up' ? '+' : '−'}
                {displayTrend.porcentaje.toFixed(1)}% último mes vs anterior
              </span>
            )}
            {displayTrend?.tendencia === 'neutral' && (
              <span className="inline-flex items-center gap-0.5 font-bold text-slate-500">
                <Minus className="h-3.5 w-3.5" />
                estable vs mes anterior
              </span>
            )}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
            S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Altura fija: el listado de sucursales no altera este bloque (mock editorial) */}
      <div className="h-[300px] w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.85} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                return String(value);
              }}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c7d2fe', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={{ r: 3, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
