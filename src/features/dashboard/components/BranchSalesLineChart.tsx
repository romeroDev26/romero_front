import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EvolucionVentasSucursales } from '../../../types/dashboard';
import { BarChart3 } from 'lucide-react';

const BRANCH_COLORS: Record<string, string> = {
  'Sucursal NAUTA': '#4f46e5',
  'Sucursal YURIMAGUAS': '#059669',
  'Sucursal IQUITOS': '#d97706',
  'Sucursal REQUENA': '#dc2626',
  'Sucursal CONTAMANA': '#0891b2',
  'Sin Sucursal': '#7c3aed',
};

const PERIODO_LABEL: Record<EvolucionVentasSucursales['periodo'], string> = {
  daily: 'agrupado por día',
  weekly: 'agrupado por semana',
  monthly: 'agrupado por mes',
  yearly: 'agrupado por año',
};

const UNIDAD_PUNTO: Record<EvolucionVentasSucursales['periodo'], string> = {
  daily: 'días',
  weekly: 'semanas',
  monthly: 'meses',
  yearly: 'años',
};

function shortBranchLabel(name: string): string {
  return name.replace(/^Sucursal\s+/i, '').trim() || name;
}

function getBranchColor(branchName: string): string {
  if (BRANCH_COLORS[branchName]) {
    return BRANCH_COLORS[branchName];
  }
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    const char = branchName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 48%)`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const rows = [...payload].filter((e: any) => Number(e.value) > 0).sort(
    (a: any, b: any) => Number(b.value) - Number(a.value)
  );
  const total = payload.reduce((acc: number, entry: any) => acc + (Number(entry.value) || 0), 0);

  if (total <= 0) return null;

  return (
    <div className="max-w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg">
      <p className="mb-2 border-b border-slate-100 pb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mb-2 text-sm font-bold text-slate-900">
        Total: S/ {total.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
      </p>
      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {rows.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate text-slate-600" title={entry.name}>
                {shortBranchLabel(String(entry.name))}
              </span>
            </div>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
              S/ {Number(entry.value).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BranchSalesLineChartProps {
  data?: EvolucionVentasSucursales;
  isLoading?: boolean;
  /** En columnas del grid: altura controlada, leyenda con scroll para muchas sucursales */
  variant?: 'page' | 'embedded';
}

const cardShell =
  'rounded-xl border border-slate-200/80 bg-white shadow-[0px_10px_30px_rgba(52,71,103,0.08)]';

export const BranchSalesLineChart: React.FC<BranchSalesLineChartProps> = ({
  data,
  isLoading = false,
  variant = 'page',
}) => {
  const chartData = data?.datos.map((item) => ({
    date: item.fecha_formateada,
    ...item.sucursales,
  })) ?? [];

  const branchNamesRaw = data?.datos.length ? Object.keys(data.datos[0].sucursales) : [];

  const { branchNamesSorted, totalsByBranch } = useMemo(() => {
    const totals: Record<string, number> = {};
    branchNamesRaw.forEach((b) => {
      totals[b] = chartData.reduce((acc, row) => acc + (Number((row as any)[b]) || 0), 0);
    });
    const sorted = [...branchNamesRaw].sort((a, b) => totals[a] - totals[b]);
    return { branchNamesSorted: sorted, totalsByBranch: totals };
  }, [branchNamesRaw, chartData]);

  const totalPeriod = useMemo(() => {
    return chartData.reduce(
      (acc, item) =>
        acc + branchNamesRaw.reduce((sum, branch) => sum + (Number((item as any)[branch]) || 0), 0),
      0
    );
  }, [chartData, branchNamesRaw]);

  const periodo = data?.periodo ?? 'daily';
  const unidad = UNIDAD_PUNTO[periodo];

  const embedded = variant === 'embedded';

  if (isLoading) {
    return (
      <div
        className={`${cardShell} p-6 ${embedded ? 'flex h-full min-h-[280px] flex-col' : ''}`}
      >
        <div className="animate-pulse flex-1 space-y-4">
          <div className="h-6 w-1/3 rounded bg-slate-100" />
          <div className={`rounded-xl bg-slate-50 ${embedded ? 'min-h-[200px] flex-1' : 'h-56'}`} />
        </div>
      </div>
    );
  }

  if (chartData.length === 0 || branchNamesRaw.length === 0) {
    return (
      <div
        className={`${cardShell} p-6 ${embedded ? 'flex h-full min-h-[280px] flex-col' : ''}`}
      >
        <div className="mb-4 shrink-0">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <BarChart3 className="h-5 w-5 text-indigo-600" aria-hidden />
              Panorama de ventas
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">Por sucursal en el tiempo</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">S/ 0</p>
          </div>
        </div>
        <div className={`flex flex-col items-center justify-center ${embedded ? 'flex-1 py-8' : 'py-14'}`}>
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <BarChart3 className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No hay datos en este período</p>
          <p className="mt-1 max-w-sm text-center text-xs text-slate-400">
            Cuando existan ventas por fecha, verás cada sucursal como un color distinto en la barra.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${cardShell} p-6 ${embedded ? 'flex h-full w-full min-h-0 flex-col overflow-hidden' : 'w-full'}`}
    >
      <div className="mb-3 flex shrink-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <BarChart3 className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
            Panorama de ventas
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Cada color es una sucursal · {PERIODO_LABEL[periodo]}
          </p>
          <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
            S/{' '}
            {totalPeriod.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:text-right">
            {chartData.length} {unidad}
          </span>
          <p className="hidden text-[11px] text-slate-400 sm:block">Pasá el cursor para desglosar</p>
        </div>
      </div>

      <div
        className={`mb-3 flex flex-wrap gap-2 sm:mb-4 ${
          embedded ? 'max-h-[5.5rem] shrink-0 overflow-y-auto overscroll-contain pr-1 sm:max-h-[6rem]' : ''
        }`}
      >
        {[...branchNamesSorted].reverse().map((branch) => (
          <div
            key={branch}
            className="flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/90 px-2.5 py-1"
            title={branch}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: getBranchColor(branch) }}
            />
            <span className="truncate text-[11px] font-semibold text-slate-700">
              {shortBranchLabel(branch)}
            </span>
            <span className="text-[10px] tabular-nums text-slate-400">
              S/ {(totalsByBranch[branch] ?? 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>

      {embedded ? (
        <div className="h-[248px] w-full min-w-0 shrink-0 lg:h-auto lg:min-h-[200px] lg:flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                dy={8}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${v}`)}
                width={32}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
              {branchNamesSorted.map((branch) => (
                <Bar
                  key={branch}
                  dataKey={branch}
                  stackId="sucursales"
                  fill={getBranchColor(branch)}
                  name={branch}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={48}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={288}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
          barCategoryGap="18%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            dy={8}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${v}`)}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
          {branchNamesSorted.map((branch) => (
            <Bar
              key={branch}
              dataKey={branch}
              stackId="sucursales"
              fill={getBranchColor(branch)}
              name={branch}
              radius={[0, 0, 0, 0]}
              maxBarSize={56}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      )}

      {!embedded ? (
        <p className="mt-3 text-center text-[11px] text-slate-400 sm:hidden">Toca el gráfico para ver el desglose</p>
      ) : (
        <p className="mt-2 shrink-0 text-center text-[10px] text-slate-400">Leyenda con scroll si hay muchas sucursales</p>
      )}
    </div>
  );
};
