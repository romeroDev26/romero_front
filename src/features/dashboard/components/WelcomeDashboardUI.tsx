import React from 'react';
import {
  ChartBarIcon,
  ArchiveBoxIcon,
  BoltIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { AnimatedCounter } from '../../../components/common/AnimatedCounter';

export type QuickActionKey =
  | 'sales-point'
  | 'cargo'
  | 'quick-sale'
  | 'reservations'
  | 'manifests';

type BranchItem = {
  id: number | string;
  name: string;
};

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type ActionCard = {
  action: QuickActionKey;
  label: string;
  description: string;
  Icon: IconComponent;
  accentColor: string;
  iconBg: string;
  iconColor: string;
};

export const ACTION_CARDS: ActionCard[] = [
  {
    action: 'sales-point',
    label: 'Punto de Ventas',
    description: 'Emision de pasajes, cambios y gestion operativa de pasajeros.',
    Icon: ShoppingCartIcon,
    accentColor: 'from-primary to-indigo-700',
    iconBg: 'bg-primary/10 group-hover:bg-primary',
    iconColor: 'text-primary group-hover:text-white',
  },
  {
    action: 'cargo',
    label: 'Encomiendas',
    description: 'Registro de envios, control de recepcion y estado de paqueteria.',
    Icon: ArchiveBoxIcon,
    accentColor: 'from-cyan-500 to-blue-600',
    iconBg: 'bg-cyan-500/10 group-hover:bg-cyan-500',
    iconColor: 'text-cyan-600 group-hover:text-white',
  },
  {
    action: 'quick-sale',
    label: 'Venta Rapida',
    description: 'Venta agil de servicios sin reserva previa para atencion inmediata.',
    Icon: BoltIcon,
    accentColor: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-500/10 group-hover:bg-amber-500',
    iconColor: 'text-amber-600 group-hover:text-white',
  },
  {
    action: 'reservations',
    label: 'Reservas',
    description: 'Gestion de cupos, separaciones y seguimiento de compromisos.',
    Icon: CalendarDaysIcon,
    accentColor: 'from-indigo-500 to-violet-600',
    iconBg: 'bg-indigo-500/10 group-hover:bg-indigo-500',
    iconColor: 'text-indigo-600 group-hover:text-white',
  },
  {
    action: 'manifests',
    label: 'Manifiestos',
    description: 'Control y generacion de manifiestos para pasajeros y carga.',
    Icon: ClipboardDocumentListIcon,
    accentColor: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-500/10 group-hover:bg-emerald-500',
    iconColor: 'text-emerald-600 group-hover:text-white',
  },
];

type WelcomeHeroSectionProps = {
  branchesLoading: boolean;
  branches?: BranchItem[];
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
};

export function WelcomeHeroSection({
  branchesLoading,
  branches,
  selectedBranch,
  onBranchChange,
}: WelcomeHeroSectionProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.10),transparent_48%)]" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="space-y-3">
            <div>
              <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-[#1A237E]">
                Bienvenido al Centro de Control Fluvial
              </h1>
              <p className="text-slate-600 text-sm md:text-lg mt-2">
                Optimizando cada trayecto • Gestión centralizada de transporte fluvial
              </p>
            </div>
          </div>

        </div>

        <div className="w-full lg:max-w-md">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Sucursal activa</label>
          {branchesLoading ? (
            <div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <select
              value={selectedBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Seleccionar sucursal</option>
              {branches?.map((branch) => (
                <option key={branch.id} value={branch.id.toString()}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </header>
  );
}

type QuickActionsGridProps = {
  selectedBranch: string;
  onActionClick: (action: QuickActionKey) => void;
};

export function QuickActionsGrid({ selectedBranch, onActionClick }: QuickActionsGridProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {ACTION_CARDS.map(({ action, label, description, Icon, accentColor, iconBg, iconColor }) => (
        <button
          key={action}
          onClick={() => onActionClick(action)}
          disabled={!selectedBranch}
          className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
            selectedBranch
              ? 'cursor-pointer border-slate-200/90 bg-white shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md'
              : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'
          }`}
        >
          <div className={`absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r ${accentColor}`} />
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${iconBg}`}>
            <Icon className={`h-6 w-6 transition-colors ${iconColor}`} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 md:text-base">{label}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p>
        </button>
      ))}
    </section>
  );
}

type OperationSummaryProps = {
  statisticsLoading: boolean;
  todaySales: number;
  todayRevenue: number;
  monthSales: number;
};

export function OperationSummaryCards({
  statisticsLoading,
  todaySales,
  todayRevenue,
  monthSales,
}: OperationSummaryProps) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-900">
        <ChartBarIcon className="h-5 w-5 text-primary" />
        Resumen de Operaciones
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 auto-rows-fr">
        <PrimaryKpiCard
          loading={statisticsLoading}
          value={todayRevenue}
          secondary={`${todaySales.toLocaleString('es-PE')} tickets hoy`}
        />
        <MetricCard
          title="Ventas Hoy"
          footer="Transacciones activas"
          loading={statisticsLoading}
          accent="bg-primary"
          value={todaySales}
        />
        <MetricCard
          title="Ventas del Mes"
          footer="Acumulado mensual"
          loading={statisticsLoading}
          accent="bg-indigo-500"
          value={monthSales}
        />
      </div>
    </section>
  );
}

type PrimaryKpiCardProps = {
  value: number;
  secondary: string;
  loading: boolean;
};

function PrimaryKpiCard({ value, secondary, loading }: PrimaryKpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A237E] to-primary p-6 text-white shadow-xl shadow-primary/20 md:col-span-2">
      <div className="absolute -right-14 -bottom-14 h-40 w-40 rounded-full border border-white/15" />
      <p className="text-xs font-bold uppercase tracking-wider text-white/70">Ingreso Neto del Dia</p>
      {loading ? (
        <div className="mt-4 h-10 w-44 animate-pulse rounded bg-white/20" />
      ) : (
        <h3 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
          <AnimatedCounter
            value={value}
            prefix="S/ "
            minimumFractionDigits={0}
            maximumFractionDigits={0}
          />
        </h3>
      )}
      <div className="mt-6 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
        {secondary}
      </div>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number;
  footer: string;
  accent: string;
  loading: boolean;
};

function MetricCard({ title, value, footer, accent, loading }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className={`mb-5 h-1.5 w-16 rounded-full ${accent}`} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {loading ? (
        <div className="mt-3 h-10 w-36 animate-pulse rounded bg-slate-100" />
      ) : (
        <h3 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-slate-900">
          <AnimatedCounter value={value} minimumFractionDigits={0} maximumFractionDigits={0} />
        </h3>
      )}
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">{footer}</p>
    </div>
  );
}

type MainAnalyticsGridProps = {
  chart: React.ReactNode;
  ranking: React.ReactNode;
};

export function MainAnalyticsGrid({ chart, ranking }: MainAnalyticsGridProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div className="lg:col-span-8 h-full">
        {chart}
      </div>
      <div className="lg:col-span-4 h-full">
        {ranking}
      </div>
    </section>
  );
}

export function WelcomeFooter() {
  return (
    <footer className="flex flex-col gap-2 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-extrabold tracking-tight text-primary">Centro de Control Fluvial</p>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Sistema de Transportes {new Date().getFullYear()} | BUGBUSTERS
      </p>
    </footer>
  );
}
