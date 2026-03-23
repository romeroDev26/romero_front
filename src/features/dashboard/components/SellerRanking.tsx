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

const getTopCardStyles = (position: number) => {
  if (position === 1) {
    return 'bg-gradient-to-br from-indigo-950/95 via-slate-900/95 to-indigo-900/95 ring-1 ring-indigo-300/30';
  }
  if (position === 2) {
    return 'bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-300/80';
  }
  if (position === 3) {
    return 'bg-gradient-to-br from-orange-100/90 to-amber-50 ring-1 ring-orange-300/80';
  }
  return '';
};

const TopRankBackground: React.FC<{ position: number }> = ({ position }) => {
  if (position === 1) {
    const stars = [
      { left: '10%', top: '18%', size: 'h-1 w-1', delay: 0 },
      { left: '22%', top: '42%', size: 'h-1.5 w-1.5', delay: 0.2 },
      { left: '34%', top: '24%', size: 'h-1 w-1', delay: 0.45 },
      { left: '48%', top: '55%', size: 'h-1.5 w-1.5', delay: 0.7 },
      { left: '61%', top: '30%', size: 'h-1 w-1', delay: 1 },
      { left: '74%', top: '50%', size: 'h-1.5 w-1.5', delay: 1.25 },
      { left: '86%', top: '22%', size: 'h-1 w-1', delay: 1.4 },
    ];

    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        <motion.div
          className="absolute -left-10 -top-12 h-28 w-28 rounded-full bg-indigo-400/30 blur-2xl"
          animate={{ x: [0, 15, -10, 0], y: [0, 10, -8, 0], scale: [1, 1.12, 0.95, 1] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-violet-400/30 blur-2xl"
          animate={{ x: [0, -10, 8, 0], y: [0, -6, 6, 0], scale: [1, 1.1, 0.96, 1] }}
          transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />
        <motion.div
          className="absolute left-[35%] top-[35%] h-20 w-20 rounded-full bg-cyan-300/20 blur-2xl"
          animate={{ opacity: [0.25, 0.55, 0.22], scale: [0.9, 1.15, 0.95] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {stars.map((star, idx) => (
          <motion.span
            key={idx}
            className={`absolute block rounded-full bg-white/85 shadow-[0_0_8px_rgba(255,255,255,0.7)] ${star.size}`}
            style={{ left: star.left, top: star.top }}
            animate={{ opacity: [0.25, 1, 0.35], scale: [0.8, 1.3, 0.9] }}
            transition={{
              duration: 2.4,
              delay: star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (position === 2) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        <motion.div
          className="absolute right-2 top-1 opacity-45"
          animate={{ rotate: [0, 10, 0], scale: [0.94, 1.08, 0.98], opacity: [0.3, 0.6, 0.35] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Medal className="h-10 w-10 text-slate-400" />
        </motion.div>
        <motion.div
          className="absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/80 to-transparent"
          animate={{ x: ['-20%', '360%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
        />
      </div>
    );
  }

  if (position === 3) {
    const bronzeShards = [
      { left: '18%', top: '70%', delay: 0 },
      { left: '36%', top: '62%', delay: 0.25 },
      { left: '54%', top: '74%', delay: 0.5 },
      { left: '72%', top: '66%', delay: 0.75 },
    ];

    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        <motion.div
          className="absolute right-4 top-2 opacity-35"
          animate={{ y: [0, -2, 0], rotate: [0, -5, 0], opacity: [0.28, 0.48, 0.32] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Award className="h-10 w-10 text-orange-400" />
        </motion.div>
        <motion.div
          className="absolute -left-10 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-orange-300/45"
          animate={{ scale: [0.82, 1.3], opacity: [0.55, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -left-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-amber-200/40"
          animate={{ scale: [0.84, 1.34], opacity: [0.52, 0.06] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        {bronzeShards.map((shard, idx) => (
          <motion.span
            key={idx}
            className="absolute block h-2 w-2 rotate-45 rounded-[2px] bg-amber-200/90 shadow-[0_0_10px_rgba(251,191,36,0.75)]"
            style={{
              left: shard.left,
              top: shard.top,
            }}
            animate={{ x: [0, 16, 28], y: [0, -5, -9], opacity: [0.12, 0.85, 0.18], scale: [0.86, 1, 0.92] }}
            transition={{
              duration: 2.4,
              delay: shard.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  return null;
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
              {sucursal.vendedores.map((vendedor, index) => (
                <motion.div
                  key={vendedor.vendedor_id}
                  className={`group relative min-h-[84px] overflow-hidden rounded-xl p-2 ${getTopCardStyles(vendedor.posicion_ranking)}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
                >
                  <TopRankBackground position={vendedor.posicion_ranking} />

                  {vendedor.posicion_ranking === 1 && (
                    <motion.div
                      className="pointer-events-none absolute right-2 top-1"
                      animate={{ opacity: [0.04, 0.2, 0.06], scale: [0.94, 1.06, 0.98] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Trophy className="h-14 w-14 text-yellow-300" />
                    </motion.div>
                  )}

                  <div className="relative z-10 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RankBadge position={vendedor.posicion_ranking} />
                      <p
                        className={`text-sm font-semibold ${
                          vendedor.posicion_ranking === 1 ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {vendedor.vendedor_nombre}
                      </p>
                    </div>
                    <p
                      className={`text-xs ${
                        vendedor.posicion_ranking === 1 ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {vendedor.total_facturas} facturas · {vendedor.total_pasajeros} pasajeros
                    </p>
                  </div>

                  <div
                    className={`relative z-10 h-1.5 w-full overflow-hidden rounded-full ${
                      vendedor.posicion_ranking === 1 ? 'bg-white/20' : 'bg-slate-100'
                    }`}
                  >
                    <motion.div
                      className={`h-full rounded-full transition-all duration-700 ${getProgressBarColors(vendedor.posicion_ranking)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${vendedor.porcentaje_relativo}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                    />
                  </div>

                  <div className="relative z-10 mt-2 text-right">
                    <p
                      className={`text-xs font-black ${
                        vendedor.posicion_ranking === 1
                          ? 'text-yellow-200'
                          : getPercentageColor(vendedor.posicion_ranking)
                      }`}
                    >
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
