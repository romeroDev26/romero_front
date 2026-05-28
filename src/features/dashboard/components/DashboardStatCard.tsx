import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type DashboardStatTone = 'indigo' | 'rose' | 'emerald' | 'amber' | 'blue' | 'violet' | 'cyan';

const toneIconClass: Record<DashboardStatTone, string> = {
  indigo: 'from-indigo-500 to-indigo-600',
  rose: 'from-rose-500 to-rose-600',
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  blue: 'from-blue-500 to-blue-600',
  violet: 'from-violet-500 to-violet-600',
  cyan: 'from-cyan-500 to-cyan-600',
};

const toneBgSoft: Record<DashboardStatTone, string> = {
  indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
  rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
  violet: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400',
};

export interface TrendData {
  porcentaje: number;
  tendencia: 'up' | 'down' | 'neutral';
}

interface DashboardStatCardProps {
  label: string;
  icon: LucideIcon;
  tone: DashboardStatTone;
  children: React.ReactNode;
  trend?: TrendData;
  hint?: React.ReactNode;
}

/** KPI card estilo TailAdmin: icono, valor, label y badge de tendencia suave */
export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  label,
  icon: Icon,
  tone,
  children,
  trend,
  hint,
}) => {
  return (
    <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Icono a la izquierda */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${toneIconClass[tone]} text-white shadow-sm`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>

        {/* Contenido a la derecha */}
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tracking-tight text-dm-text-primary tabular-nums">{children}</p>
          <p className="mt-0.5 text-sm font-medium text-dm-text-muted">{label}</p>
        </div>
      </div>

      {/* Tendencia / hint en la parte inferior */}
      {(trend || hint) && (
        <div className="mt-3 pt-3 border-t border-dm-border-secondary">
          {trend ? (
            <p
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                trend.tendencia === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend.tendencia === 'down'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-dm-text-muted'
              }`}
            >
              {trend.tendencia === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
              {trend.tendencia === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
              {trend.tendencia === 'neutral' && <Minus className="h-3.5 w-3.5" />}
              <span>
                {trend.porcentaje > 0 ? '+' : ''}
                {trend.porcentaje.toFixed(1)}% vs período anterior
              </span>
            </p>
          ) : hint ? (
            <div className="text-xs font-medium text-dm-text-muted">{hint}</div>
          ) : null}
        </div>
      )}
    </div>
  );
};
