import React from 'react';
import { motion } from 'motion/react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { AnimatedCounter } from '../../../../components/common/AnimatedCounter';

type KpiCardsProps = {
  statisticsLoading: boolean;
  todaySales: number;
  todayRevenue: number;
  monthSales: number;
};

export const KpiCards: React.FC<KpiCardsProps> = ({
  statisticsLoading,
  todaySales,
  todayRevenue,
  monthSales,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.16 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <ChartBarIcon className="h-5 w-5 text-brand" />
        <h2 className="text-lg font-semibold text-ink tracking-tight">Resumen de Operaciones</h2>
      </div>

      <div className="overflow-hidden rounded-large bg-[#fafafa]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <KpiCell
            label="Ingreso Neto del Día"
            value={todayRevenue}
            prefix="S/ "
            loading={statisticsLoading}
            highlight
          />
          <KpiCell
            label="Tickets Hoy"
            value={todaySales}
            loading={statisticsLoading}
          />
          <KpiCell
            label="Ventas Hoy"
            value={todaySales}
            loading={statisticsLoading}
          />
          <KpiCell
            label="Ventas del Mes"
            value={monthSales}
            loading={statisticsLoading}
            last
          />
        </div>
      </div>
    </motion.section>
  );
};

type KpiCellProps = {
  label: string;
  value: number;
  prefix?: string;
  loading: boolean;
  highlight?: boolean;
  last?: boolean;
};

function KpiCell({ label, value, prefix, loading, highlight, last }: KpiCellProps) {
  return (
    <div
      className={[
        'flex flex-col items-start justify-center px-6 py-6 md:py-8',
        'border-b sm:border-b-0 border-light-gray',
        !last ? 'md:border-r' : '',
      ].join(' ')}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-gray mb-2">
        {label}
      </span>
      {loading ? (
        <div className="h-9 w-32 animate-pulse rounded-lg bg-surface" />
      ) : (
        <span
          className={`text-3xl md:text-4xl font-bold tracking-tight ${
            highlight ? 'text-brand' : 'text-ink'
          }`}
        >
          <AnimatedCounter
            value={value}
            prefix={prefix}
            minimumFractionDigits={0}
            maximumFractionDigits={0}
          />
        </span>
      )}
    </div>
  );
}
