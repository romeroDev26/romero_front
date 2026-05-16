import React from 'react';
import { motion } from 'motion/react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { BranchItem } from './types';

type WelcomeHeroSectionProps = {
  branchesLoading: boolean;
  branches?: BranchItem[];
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
};

export const WelcomeHero: React.FC<WelcomeHeroSectionProps> = ({
  branchesLoading,
  branches,
  selectedBranch,
  onBranchChange,
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pt-8 md:pt-10"
    >
      <div className="max-w-2xl space-y-1">
        <h1 className="text-4xl md:text-[56px] font-bold tracking-tight text-ink leading-[1.1]">
          Centro de Control Fluvial
        </h1>
        <p className="text-base md:text-lg text-medium-gray leading-relaxed">
          Optimizando cada trayecto • Gestión centralizada de transporte fluvial
        </p>
      </div>

      <div className="w-full md:w-auto md:min-w-[280px] shrink-0">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-gray mb-2">
          <MapPinIcon className="h-3.5 w-3.5" />
          Sucursal activa
        </label>
        {branchesLoading ? (
          <div className="h-11 w-full rounded-xl bg-surface animate-pulse" />
        ) : (
          <div className="relative">
            <select
              value={selectedBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-light-gray bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light"
            >
              <option value="">Seleccionar sucursal</option>
              {branches?.map((branch) => (
                <option key={branch.id} value={branch.id.toString()}>
                  {branch.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-gray">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </motion.header>
  );
};
