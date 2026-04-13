import React, { useMemo } from 'react';
import { VentasPorSucursal } from '../../../types/dashboard';
import { PieChart } from 'lucide-react';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#db2777', '#65a30d'];

function shortName(n: string) {
  return n.replace(/^Sucursal\s+/i, '').trim() || n;
}

interface BranchParticipationTrackProps {
  data?: VentasPorSucursal;
  isLoading?: boolean;
}

/**
 * Bloque estilo TailAdmin: participación % con progress tracks limpios
 */
export const BranchParticipationTrack: React.FC<BranchParticipationTrackProps> = ({
  data,
  isLoading = false,
}) => {
  const rows = useMemo(() => {
    const list = data?.resumen ?? [];
    return [...list].sort((a, b) => b.porcentaje_total - a.porcentaje_total).map((item, i) => ({
      ...item,
      color: COLORS[i % COLORS.length],
    }));
  }, [data?.resumen]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full min-h-[260px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-2/3 rounded bg-gray-100" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full w-full min-h-[260px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-indigo-600" aria-hidden />
          <h3 className="text-base font-semibold text-gray-800">Participación</h3>
        </div>
        <p className="text-xs text-gray-500">Cuota sobre el total del período</p>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-sm text-gray-400">
          Sin datos de sucursales
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
            <PieChart className="h-4 w-4 text-indigo-600" aria-hidden />
            <h3 className="text-base font-semibold text-gray-800">Participación</h3>
          </div>
          <span className="text-xs font-medium text-gray-400">{rows.length} sucursales</span>
        </div>
        <p className="text-xs text-gray-500">Cuota % sobre ventas totales</p>
      </div>

      {/* Progress tracks */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
        {rows.map((item) => (
          <div key={item.sucursal_id}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span
                className="min-w-0 truncate text-xs font-medium text-gray-600"
                title={item.sucursal_nombre}
              >
                {shortName(item.sucursal_nombre)}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-800">
                {item.porcentaje_total.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, item.porcentaje_total))}%`,
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
