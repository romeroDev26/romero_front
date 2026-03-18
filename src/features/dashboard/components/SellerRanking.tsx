// src/features/dashboard/components/SellerRanking.tsx
import React, { useState } from 'react';
import { useSellerRanking } from '../../../hooks/useSellerRanking';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Trophy, Medal, Award } from 'lucide-react';

type RankingPeriod = 'today' | 'week' | 'month' | 'year';

const periodLabels: Record<RankingPeriod, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
};

const getRankBadge = (position: number) => {
  if (position === 1) {
    return {
      wrapper: 'bg-yellow-100 text-yellow-600 ring-yellow-200 shadow-yellow-100',
      icon: <Trophy className="h-5 w-5" />,
    };
  }

  if (position === 2) {
    return {
      wrapper: 'bg-slate-100 text-slate-600 ring-slate-200 shadow-slate-100',
      icon: <Medal className="h-5 w-5" />,
    };
  }

  if (position === 3) {
    return {
      wrapper: 'bg-orange-100 text-orange-600 ring-orange-200 shadow-orange-100',
      icon: <Award className="h-5 w-5" />,
    };
  }

  return null;
};

const RankBadge: React.FC<{ position: number }> = ({ position }) => {
  const badge = getRankBadge(position);

  if (!badge) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
        {position}
      </span>
    );
  }

  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-xl ring-2 shadow-sm transition-transform group-hover:scale-105 ${badge.wrapper}`}
      title={`Puesto ${position}`}
    >
      {badge.icon}
    </span>
  );
};

const getProgressBarColors = (position: number) => {
  if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
  if (position === 2) return 'bg-gradient-to-r from-slate-400 to-slate-500';
  if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500';
  return 'bg-gradient-to-r from-blue-500 to-blue-600';
};

const getPercentageColor = (position: number) => {
  if (position === 1) return 'text-yellow-600';
  if (position === 2) return 'text-slate-600';
  if (position === 3) return 'text-orange-600';
  return 'text-blue-600';
};

export const SellerRanking: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>('today');
  const { data, isLoading, error } = useSellerRanking({ period: selectedPeriod });

  const header = (
    <div className="shrink-0 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-extrabold text-slate-900">Ranking de Vendedores</h2>
        </div>
      </div>

      <div className="flex gap-2">
        {(Object.keys(periodLabels) as RankingPeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedPeriod === period
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>
    </div>
  );

  const branchGroups = data
    ? data.top_vendedores_por_sucursal.sucursales
      .map((sucursal) => ({
        ...sucursal,
        vendedores: [...sucursal.vendedores].sort(
          (a, b) => a.posicion_ranking - b.posicion_ranking
        ),
      }))
      .filter((sucursal) => sucursal.vendedores.length > 0)
    : [];

  const totalVendors = branchGroups.reduce(
    (sum, sucursal) => sum + sucursal.vendedores.length,
    0
  );

  const hasMoreThanFiveItems = totalVendors > 5;

  if (isLoading) {
    return (
      <section className="flex h-full flex-col overflow-hidden rounded-xl bg-white p-0 shadow-sm">
        {header}
        <div className="flex flex-grow items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-full flex-col overflow-hidden rounded-xl bg-white p-0 shadow-sm">
        {header}
        <div className="flex flex-grow items-center justify-center p-6 text-center text-sm text-red-500">
          Error al cargar el ranking de vendedores
        </div>
      </section>
    );
  }

  if (!data || totalVendors === 0) {
    return (
      <section className="flex h-full flex-col overflow-hidden rounded-xl bg-white p-0 shadow-sm">
        {header}
        <div className="flex flex-grow items-center justify-center p-6 text-center text-sm text-slate-500">
          No hay datos disponibles para el período seleccionado
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl bg-white p-0 shadow-sm">
      {header}

      <div
        className={`space-y-5 px-6 pb-5 ${
          hasMoreThanFiveItems
            ? 'ranking-scroll overflow-y-auto pr-3'
            : 'overflow-visible'
        }`}
        style={hasMoreThanFiveItems ? { maxHeight: '560px' } : undefined}
      >
        {branchGroups.map((sucursal) => (
          <div key={sucursal.sucursal_id} className="space-y-3">
            <h3 className="border-b border-slate-200 pb-2 text-[13px] font-extrabold uppercase tracking-wide text-slate-700">
              {sucursal.sucursal_nombre}
            </h3>

            <div className="space-y-4">
              {sucursal.vendedores.map((vendedor) => (
                <div
                  key={vendedor.vendedor_id}
                  className={`group relative min-h-[84px] overflow-hidden rounded-xl p-2 ${
                    vendedor.posicion_ranking === 1 ? 'bg-yellow-50/40' : ''
                  }`}
                >
                  {vendedor.posicion_ranking === 1 && (
                    <div className="pointer-events-none absolute right-2 top-1 opacity-[0.08]">
                      <Trophy className="h-14 w-14 text-yellow-600" />
                    </div>
                  )}

                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RankBadge position={vendedor.posicion_ranking} />
                      <p className="text-sm font-semibold text-slate-900">{vendedor.vendedor_nombre}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {vendedor.total_facturas} facturas · {vendedor.total_pasajeros} pasajeros
                    </p>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${getProgressBarColors(vendedor.posicion_ranking)}`}
                      style={{ width: `${vendedor.porcentaje_relativo}%` }}
                    />
                  </div>

                  <div className="mt-2 text-right">
                    <p className={`text-xs font-black ${getPercentageColor(vendedor.posicion_ranking)}`}>
                      {vendedor.porcentaje_relativo.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
