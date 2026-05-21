import React from 'react';
import { motion } from 'motion/react';
import {
  ArchiveBoxIcon,
  BoltIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import type { QuickActionKey } from './types';

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type ActionItem = {
  action: QuickActionKey;
  label: string;
  description: string;
  Icon: IconComponent;
  accent: string;
};

const ACTIONS: ActionItem[] = [
  {
    action: 'sales-point',
    label: 'Punto de Ventas',
    description: 'Pasajes y gestión',
    Icon: ShoppingCartIcon,
    accent: 'bg-brand/10 dark:bg-brand/20 text-brand',
  },
  {
    action: 'cargo',
    label: 'Encomiendas',
    description: 'Envíos y paquetería',
    Icon: ArchiveBoxIcon,
    accent: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400',
  },
  {
    action: 'quick-sale',
    label: 'Venta Rápida',
    description: 'Atención inmediata',
    Icon: BoltIcon,
    accent: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  },
  {
    action: 'reservations',
    label: 'Reservas',
    description: 'Cupos y separaciones',
    Icon: CalendarDaysIcon,
    accent: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
  },
  {
    action: 'manifests',
    label: 'Manifiestos',
    description: 'Control de carga',
    Icon: ClipboardDocumentListIcon,
    accent: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  },
];

type QuickActionsProps = {
  selectedBranch: string;
  onActionClick: (action: QuickActionKey) => void;
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  selectedBranch,
  onActionClick,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
    >
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label, description, Icon, accent }) => {
          const enabled = !!selectedBranch;
          return (
            <button
              key={action}
              onClick={() => onActionClick(action)}
              disabled={!enabled}
              className={[
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200',
                enabled
                  ? 'hover:bg-dm-bg-secondary cursor-pointer'
                  : 'opacity-50 cursor-not-allowed',
              ].join(' ')}
              title={enabled ? label : 'Selecciona una sucursal primero'}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${accent} group-hover:scale-105`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-dm-text-primary leading-tight">{label}</div>
                <div className="text-xs text-dm-text-secondary leading-tight mt-0.5">{description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
};
