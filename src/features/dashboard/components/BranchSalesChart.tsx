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
      <div className="flex h-full w-full min-h-[260px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-1/2 rounded bg-gray-100" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 rounded-lg bg-gray-50" />
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
      <div className="flex h-full w-full min-h-[260px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-600" aria-hidden />
          <h3 className="text-base font-semibold text-gray-800">Ventas por sucursal</h3>
        </div>
        <p className="text-xs text-gray-500">Montos del período filtrado</p>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-gray-400">Sin datos por sucursal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-[260px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" aria-hidden />
            <h3 className="text-base font-semibold text-gray-800">Ventas por sucursal</h3>
          </div>
          <span className="text-xs font-medium text-gray-400">{sortedData.length} sucursales</span>
        </div>
        <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
          S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Lista con scroll */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
        {sortedData.map((item) => (
          <div key={item.name} className="group">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-sm font-medium text-gray-700" title={item.name}>
                  {shortName(item.name)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs tabular-nums text-gray-400">{item.facturas} fac.</span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  S/ {item.value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="w-11 text-right text-xs tabular-nums text-gray-400">
                  {item.porcentaje.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-300 group-hover:opacity-80"
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
