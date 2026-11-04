import { useId } from 'react';
import type { ReceivablesFilters } from '../types/receivables.types';

type Service = NonNullable<ReceivablesFilters['service_type']>;
const options: { value: Service; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PASAJES', label: 'Pasajes' },
  { value: 'ENCOMIENDAS', label: 'Encomiendas y carga' },
];

export function ReceivableServiceFilter({ value, onChange }: { value: Service; onChange: (value: Service) => void }) {
  const id = useId();
  return (
    <fieldset className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      <legend className="sr-only">Tipo de servicio</legend>
      <span aria-hidden="true" className="text-xs font-medium text-dm-text-muted">Servicio</span>
      <div className="inline-flex max-w-full rounded-xl bg-dm-bg-secondary p-1">
        {options.map(option => (
          <label key={option.value} className="relative cursor-pointer">
            <input type="radio" name={`service-${id}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="peer sr-only" />
            <span className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-dm-text-secondary transition-colors hover:text-dm-text-primary peer-checked:bg-dm-bg-primary peer-checked:text-primary peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary sm:px-4">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
