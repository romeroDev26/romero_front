import { useId } from 'react';

interface Props {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function CreditSaleOption({ checked, disabled, onChange }: Props) {
  const descriptionId = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-dm-bg-secondary p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-dm-text-primary">Venta al crédito</p>
        <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-dm-text-muted">
          {checked ? 'El ticket mostrará DEBE. Se registra en Cuentas por cobrar.' : 'Actívalo si el pago se realizará después.'}
        </p>
      </div>
      <button type="button" role="switch" aria-label="Venta al crédito" aria-describedby={descriptionId} aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dm-bg-primary disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span aria-hidden="true" className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
