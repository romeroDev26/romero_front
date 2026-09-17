import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { EvolucionVentasSucursales } from '../../../types/dashboard';
import { BarChart3 } from 'lucide-react';
import { useChartTheme } from '../../../hooks/useChartTheme';

const BRANCH_COLORS: Record<string, string> = {
  'Sucursal NAUTA': '#4f46e5',
  'Sucursal YURIMAGUAS': '#059669',
  'Sucursal IQUITOS': '#d97706',
  'Sucursal REQUENA': '#dc2626',
  'Sucursal CONTAMANA': '#0891b2',
  'Sin Sucursal': '#7c3aed',
};

const PERIODO_LABEL: Record<EvolucionVentasSucursales['periodo'], string> = {
  daily: 'por día',
  weekly: 'por semana',
  monthly: 'por mes',
  yearly: 'por año',
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

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;

  const rows = [...payload].filter((e) => Number(e.value) > 0).sort(
    (a, b) => Number(b.value) - Number(a.value)
  );
  const total = payload.reduce((acc: number, entry) => acc + (Number(entry.value) || 0), 0);

  if (total <= 0) return null;

  return (
    <div className="max-w-[260px] rounded-lg border border-dm-border-primary bg-dm-bg-primary px-3 py-2.5 shadow-sm">
      <p className="mb-2 border-b border-dm-border-secondary pb-1.5 text-xs font-semibold text-dm-text-muted">{label}</p>
      <p className="mb-2 text-sm font-semibold text-dm-text-primary">
        Total: S/ {total.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
      </p>
      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {rows.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate text-dm-text-secondary" title={entry.name}>
                {shortBranchLabel(String(entry.name))}
              </span>
            </div>
            <span className="shrink-0 font-semibold tabular-nums text-dm-text-primary">
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
  variant?: 'page' | 'embedded';
}

export const BranchSalesLineChart: React.FC<BranchSalesLineChartProps> = ({
  data,
  isLoading = false,
  variant = 'embedded',
}) => {
  const chartTheme = useChartTheme();
  const chartData = data?.datos.map((item) => ({
    date: item.fecha_formateada,
    ...item.sucursales,
  })) ?? [];

  const branchNamesRaw = data?.datos.length ? Object.keys(data.datos[0].sucursales) : [];

  const { branchNamesSorted, totalsByBranch } = useMemo(() => {
    const totals: Record<string, number> = {};
    branchNamesRaw.forEach((b) => {
      totals[b] = chartData.reduce((acc, row) => acc + (Number((row as Record<string, unknown>)[b]) || 0), 0);
    });
    const sorted = [...branchNamesRaw].sort((a, b) => totals[a] - totals[b]);
    return { branchNamesSorted: sorted, totalsByBranch: totals };
  }, [branchNamesRaw, chartData]);

  const totalPeriod = useMemo(() => {
    return chartData.reduce(
      (acc, item) =>
        acc + branchNamesRaw.reduce((sum, branch) => sum + (Number((item as Record<string, unknown>)[branch]) || 0), 0),
      0
    );
  }, [chartData, branchNamesRaw]);

  const periodo = data?.periodo ?? 'daily';
  const unidad = UNIDAD_PUNTO[periodo];
  const embedded = variant === 'embedded';

  if (isLoading) {
    return (
      <div className={`rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm ${embedded ? 'flex h-full min-h-[260px] flex-col' : ''}`}>
        <div className="animate-pulse flex-1 space-y-3">
          <div className="h-5 w-1/3 rounded bg-dm-bg-secondary" />
          <div className={`rounded-lg bg-dm-bg-secondary ${embedded ? 'min-h-[200px] flex-1' : 'h-56'}`} />
        </div>
      </div>
    );
  }

  if (chartData.length === 0 || branchNamesRaw.length === 0) {
    return (
      <div className={`rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm ${embedded ? 'flex h-full min-h-[260px] flex-col' : ''}`}>
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <h3 className="text-base font-semibold text-dm-text-primary">Panorama de ventas</h3>
          </div>
          <p className="text-xs text-dm-text-muted">Por sucursal en el tiempo</p>
        </div>
        <div className={`flex flex-col items-center justify-center ${embedded ? 'flex-1 py-8' : 'py-12'}`}>
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-dm-bg-secondary">
            <BarChart3 className="h-7 w-7 text-dm-text-muted" />
          </div>
          <p className="text-sm font-medium text-dm-text-muted">Sin datos en este período</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm ${embedded ? 'flex h-full w-full min-h-0 flex-col overflow-hidden' : 'w-full'}`}>
      {/* Header compacto */}
      <div className="mb-3 flex shrink-0 items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <h3 className="text-base font-semibold text-dm-text-primary">Panorama de ventas</h3>
          </div>
          <p className="text-xs text-dm-text-muted">Cada color es una sucursal · {PERIODO_LABEL[periodo]}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-dm-text-primary">
            S/ {totalPeriod.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-dm-bg-secondary px-2.5 py-1 text-center text-[11px] font-semibold text-dm-text-muted">
          {chartData.length} {unidad}
        </span>
      </div>

      {/* Leyenda con scroll */}
      <div className={`mb-3 flex flex-wrap gap-2 ${embedded ? 'max-h-[5rem] shrink-0 overflow-y-auto overscroll-contain pr-1' : ''}`}>
        {[...branchNamesSorted].reverse().map((branch) => (
          <div
            key={branch}
            className="flex max-w-full items-center gap-1.5 rounded-full border border-dm-border-primary bg-dm-bg-secondary px-2.5 py-1"
            title={branch}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: getBranchColor(branch) }}
            />
            <span className="truncate text-[11px] font-semibold text-dm-text-secondary">
              {shortBranchLabel(branch)}
            </span>
            <span className="text-[10px] tabular-nums text-dm-text-muted">
              S/ {(totalsByBranch[branch] ?? 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className={embedded ? 'h-[220px] w-full min-w-0 shrink-0 lg:h-auto lg:min-h-[180px] lg:flex-1' : ''}>
        <ResponsiveContainer width="100%" height={embedded ? '100%' : 288}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: chartTheme.axis }}
              axisLine={false}
              tickLine={false}
              dy={8}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 10, fill: chartTheme.axis }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${v}`)}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: chartTheme.cursor }} />
            {branchNamesSorted.map((branch) => (
              <Bar
                key={branch}
                dataKey={branch}
                stackId="sucursales"
                fill={getBranchColor(branch)}
                name={branch}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
