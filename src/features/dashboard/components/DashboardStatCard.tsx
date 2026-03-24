import React from 'react';
import { LucideIcon } from 'lucide-react';

export type DashboardStatTone = 'indigo' | 'rose' | 'emerald' | 'amber';

const toneIconClass: Record<DashboardStatTone, string> = {
  indigo: 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20',
  rose: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20',
  emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20',
  amber: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20',
};

interface DashboardStatCardProps {
  label: string;
  icon: LucideIcon;
  tone: DashboardStatTone;
  children: React.ReactNode;
  hint?: React.ReactNode;
}

/** KPI estilo mock editorial: fila con icono, sombra ambiental */
export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  label,
  icon: Icon,
  tone,
  children,
  hint,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0px_10px_30px_rgba(52,71,103,0.08)] transition-shadow hover:shadow-[0px_12px_36px_rgba(52,71,103,0.1)]">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-800">{children}</div>
        {hint ? <div className="mt-2">{hint}</div> : null}
      </div>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${toneIconClass[tone]}`}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
    </div>
  );
};
