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
 * Bloque estilo "Progress Track" del mock editorial: solo participación %,
 * con scroll interno si hay muchas sucursales (no empuja el resto del grid).
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
      <div className="flex h-full w-full min-h-[280px] flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-2/3 rounded bg-slate-100" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-slate-50" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full w-full min-h-[280px] flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800">
          <PieChart className="h-5 w-5 text-indigo-600" aria-hidden />
          Participación
        </h3>
        <p className="mb-4 text-xs font-medium text-slate-500">Cuota sobre el total del período</p>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-sm text-slate-400">
          Sin datos de sucursales
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-[280px] flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)]">
      <h3 className="mb-1 flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-slate-800">
        <PieChart className="h-5 w-5 text-indigo-600" aria-hidden />
        Participación
      </h3>
      <p className="mb-4 shrink-0 text-xs font-medium text-slate-500">
        Cuota % sobre ventas totales · {rows.length} sucursales
      </p>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-1">
        {rows.map((item) => (
          <div key={item.sucursal_id}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wide text-slate-500"
                title={item.sucursal_nombre}
              >
                {shortName(item.sucursal_nombre)}
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-slate-800">
                {item.porcentaje_total.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-500"
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
