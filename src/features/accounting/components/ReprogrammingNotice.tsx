import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { Invoice } from '../../../types';

type Summary = NonNullable<Invoice['reprogramming']>;

export function ReprogrammingNotice({ summary }: { summary: Summary }) {
  const pending = summary.status === 'PENDING';
  const count = summary.passenger_count;
  return (
    <section aria-label="Estado de reprogramación" className="mt-4 rounded-lg border border-dm-border-primary bg-dm-bg-secondary p-3 sm:p-4 text-sm text-dm-text-secondary">
      <div className="flex items-start gap-3">
        <CalendarDaysIcon className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-semibold text-dm-text-primary">{pending ? 'Pendiente de nueva fecha' : 'Reprogramación completada'}</h2>
          <p className="break-words">{pending ? 'Los asientos están libres. Los pasajeros no figuran en el manifiesto anterior.' : `Nuevo viaje: ${summary.destination_trip_name || 'Asignado'}.`}</p>
          <p className="text-dm-text-muted break-words">{count != null && `${count} ${count === 1 ? 'pasajero' : 'pasajeros'} · `}{pending ? 'Lo dejó pendiente' : 'Lo completó'}: {(pending ? summary.requested_by_name : summary.completed_by_name) || summary.reprogrammed_by_name || '—'}</p>
          {(summary.reason || summary.source_trip_name) && <details className="pt-1">
            <summary className="cursor-pointer text-primary w-fit rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Ver motivo y viaje anterior</summary>
            <div className="pt-2 space-y-1 break-words">
              {summary.reason && <p>Motivo: {summary.reason}</p>}
              {summary.source_trip_name && <p>Viaje anterior: {summary.source_trip_name}</p>}
            </div>
          </details>}
        </div>
      </div>
    </section>
  );
}
