import React from 'react';
import { VentasPorSucursal } from '../../../types/dashboard';
import { Building2 } from 'lucide-react';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#db2777', '#65a30d'];

interface BranchSalesChartProps {
  data?: VentasPorSucursal;
  isLoading?: boolean;
}

function shortName(n: string) {
  return n.replace(/^Sucursal\s+/i, '').trim() || n;
}

export const BranchSalesChart: React.FC<BranchSalesChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="flex h-full w-full min-h-[280px] flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-1/2 rounded bg-slate-100" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-50" />
          ))}
        </div>
      </div>
    );
  }

  const chartData =
    data?.resumen.map((item, index) => ({
      name: item.sucursal_nombre,
      value: item.total_ventas,
      color: COLORS[index % COLORS.length],
      porcentaje: item.porcentaje_total,
      facturas: item.cantidad_facturas,
    })) ?? [];

  const total = chartData.reduce((acc, item) => acc + item.value, 0);
  const sortedData = [...chartData].sort((a, b) => b.value - a.value);

  if (sortedData.length === 0) {
    return (
      <div className="flex h-full w-full min-h-[280px] flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800">
          <Building2 className="h-5 w-5 text-indigo-600" aria-hidden />
          Ventas por sucursal
        </h3>
        <p className="mb-4 text-xs font-medium text-slate-500">Montos del período filtrado globalmente</p>
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-slate-500">Sin datos por sucursal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-[280px] flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
      <div className="mb-4 shrink-0">
        <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800">
          <Building2 className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
          Ventas por sucursal
        </h3>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Lista con scroll si crece el número de sucursales
        </p>
        <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
          S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">{sortedData.length} sucursales · desplazá para ver todas</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
        {sortedData.map((item) => (
          <div key={item.name} className="group">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-sm font-medium text-slate-700" title={item.name}>
                  {shortName(item.name)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs tabular-nums text-slate-400">{item.facturas} fac.</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                  S/ {item.value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="w-11 text-right text-xs tabular-nums text-slate-500">
                  {item.porcentaje.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:opacity-90"
                style={{
                  width: `${Math.min(100, Math.max(0, item.porcentaje))}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
