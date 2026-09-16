// src/features/dashboard/components/SellerRanking.tsx
import React, { useState } from 'react';
import { useSellerRanking } from '../../../hooks/useSellerRanking';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Trophy, Medal, Award } from 'lucide-react';
import { motion } from 'motion/react';

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
      wrapper: 'bg-amber-400 text-white',
      icon: <Trophy className="h-3.5 w-3.5" />,
    };
  }
  if (position === 2) {
    return {
      wrapper: 'bg-slate-400 dark:bg-slate-500 text-white',
      icon: <Medal className="h-3.5 w-3.5" />,
    };
  }
  if (position === 3) {
    return {
      wrapper: 'bg-orange-400 text-white',
      icon: <Award className="h-3.5 w-3.5" />,
    };
  }
  return null;
};

const RankBadge: React.FC<{ position: number }> = ({ position }) => {
  const badge = getRankBadge(position);

  if (!badge) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dm-border-primary bg-dm-bg-secondary text-[11px] font-bold text-dm-text-muted">
        {position}
      </span>
    );
  }

  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full ${badge.wrapper}`}
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

const getTopCardStyles = (position: number) => {
  if (position === 1) {
    return 'bg-amber-50 dark:bg-amber-950/40 border-l-2 border-amber-400';
  }
  if (position === 2) {
    return 'bg-dm-bg-secondary/60 border-l-2 border-slate-400 dark:border-slate-500';
  }
  if (position === 3) {
    return 'bg-orange-50 dark:bg-orange-950/40 border-l-2 border-orange-400';
  }
  return '';
};

const TopRankBackground: React.FC<{ position: number }> = ({ position }) => {
  if (position !== 1) return null;
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="absolute -inset-full top-0 h-full w-[200%] bg-gradient-to-r from-transparent via-white/25 dark:via-white/10 to-transparent skew-x-12"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.6 }}
      />
    </motion.div>
  );
};

export const SellerRanking: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>('today');
  const { data, isLoading, error } = useSellerRanking({ period: selectedPeriod });

  const header = (
    <div className="shrink-0 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-dm-text-muted" />
          <h2 className="text-lg font-extrabold text-dm-text-primary">Ranking de Vendedores</h2>
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
                : 'bg-dm-bg-secondary text-dm-text-secondary hover:bg-dm-bg-hover'
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
      <section className="flex h-full flex-col overflow-hidden">
        {header}
        <div className="flex flex-grow items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-full flex-col overflow-hidden">
        {header}
        <div className="flex flex-grow items-center justify-center py-8 text-center text-sm text-red-500 dark:text-red-400">
          Error al cargar el ranking de vendedores
        </div>
      </section>
    );
  }

  if (!data || totalVendors === 0) {
    return (
      <section className="flex h-full flex-col overflow-hidden">
        {header}
        <div className="flex flex-grow items-center justify-center py-8 text-center text-sm text-dm-text-muted">
          No hay datos disponibles para el período seleccionado
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col overflow-hidden">
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
            <h3 className="pb-2 text-[13px] font-extrabold uppercase tracking-wide text-dm-text-secondary">
              {sucursal.sucursal_nombre}
            </h3>

            <div className="space-y-4">
              {sucursal.vendedores.map((vendedor, index) => (
                <motion.div
                  key={vendedor.vendedor_id}
                  className={`group relative min-h-[84px] overflow-hidden rounded-xl p-2 ${getTopCardStyles(vendedor.posicion_ranking)}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: vendedor.posicion_ranking <= 3 ? 0.55 : 0.35,
                    delay: vendedor.posicion_ranking <= 3
                      ? vendedor.posicion_ranking * 0.12 + 0.15
                      : index * 0.04,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  whileHover={vendedor.posicion_ranking <= 3 ? { y: -2 } : undefined}
                >
                  <TopRankBackground position={vendedor.posicion_ranking} />

                  <div className="relative z-10 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <RankBadge position={vendedor.posicion_ranking} />
                      <p className="text-sm font-semibold text-dm-text-primary">
                        {vendedor.vendedor_nombre}
                      </p>
                    </div>
                    <p className="text-xs text-dm-text-muted">
                      {vendedor.total_facturas} facturas · {vendedor.total_pasajeros} pasajeros
                    </p>
                  </div>

                  <div
                    className={`relative z-10 h-1.5 w-full overflow-hidden rounded-full ${
                      vendedor.posicion_ranking === 1 ? 'bg-amber-100/60 dark:bg-amber-900/30' : 'bg-dm-bg-secondary'
                    }`}
                  >
                    <motion.div
                      className={`h-full rounded-full transition-all duration-700 ${getProgressBarColors(vendedor.posicion_ranking)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${vendedor.porcentaje_relativo}%` }}
                      transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                    />
                  </div>

                  <div className="relative z-10 mt-2 text-right">
                    <p className="text-xs font-bold text-dm-text-muted">
                      {vendedor.porcentaje_relativo.toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
