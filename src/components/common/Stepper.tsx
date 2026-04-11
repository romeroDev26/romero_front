// src/components/common/Stepper.tsx
import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { motion } from 'motion/react';

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
  /** Pasos ya visitados o el actual: clic para retroceder sin perder datos */
  onStepClick?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  const interactive = typeof onStepClick === 'function';

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-4 shadow-sm sm:px-5 sm:py-5">
      <div className="flex min-w-0 items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isFuture = index > currentStep;
          const clickable = interactive && !isFuture;

          const circle = (
            <motion.div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm sm:h-10 sm:w-10 ${
                isCompleted
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-200'
                  : isActive
                    ? 'bg-primary text-white ring-4 ring-primary/25'
                    : 'bg-slate-200 text-slate-500'
              }`}
              initial={false}
              animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {isCompleted ? <CheckIcon className="h-5 w-5" /> : index + 1}
            </motion.div>
          );

          const label = (
            <div
              className={`ml-2 min-w-0 font-semibold transition-colors duration-300 sm:ml-3 ${
                isCompleted ? 'text-emerald-700' : isActive ? 'text-primary' : 'text-slate-400'
              } ${step.length > 22 ? 'max-w-[5.5rem] truncate text-[11px] sm:max-w-none sm:whitespace-nowrap sm:text-sm' : 'text-xs sm:text-sm'}`}
              title={step}
            >
              {step}
            </div>
          );

          return (
            <React.Fragment key={step}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick!(index)}
                  className="flex min-w-0 max-w-[38%] shrink items-center rounded-lg py-1 pl-0.5 pr-1 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:max-w-none"
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Ir a: ${step}`}
                >
                  {circle}
                  <span className="hidden sm:contents">{label}</span>
                </button>
              ) : (
                <div
                  className={`flex min-w-0 max-w-[38%] shrink items-center py-1 pl-0.5 pr-1 sm:max-w-none ${isFuture ? 'cursor-not-allowed opacity-55' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {circle}
                  <span className="hidden sm:contents">{label}</span>
                </div>
              )}
              {index < steps.length - 1 && (
                <div
                  className={`mx-1 min-w-[0.75rem] flex-auto border-t-2 transition-colors duration-500 sm:mx-3 ${
                    isCompleted ? 'border-emerald-400' : 'border-slate-200'
                  }`}
                  aria-hidden
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs font-medium text-slate-600 sm:hidden">{steps[currentStep]}</p>
      {interactive && (
        <p className="mt-2 text-center text-[11px] leading-snug text-slate-400">
          Pulse un paso ya completado para volver; sus datos se conservan en esta sesión
        </p>
      )}
    </div>
  );
};
