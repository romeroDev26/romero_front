import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ExistingPassengerTicket } from '../../services/trips.service';

function formatTicket(match: ExistingPassengerTicket): string | null {
  if (match.ticket_series && match.ticket_number != null) {
    return `${match.ticket_series}-${match.ticket_number}`;
  }
  return null;
}

interface DuplicatePassengerWarningProps {
  matches: ExistingPassengerTicket[];
  loading?: boolean;
}

export const DuplicatePassengerWarning: React.FC<DuplicatePassengerWarningProps> = ({
  matches,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
        Verificando si ya tiene pasaje en este viaje...
      </div>
    );
  }

  if (!matches.length) {
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-400 bg-amber-50 px-3 py-3 dark:border-amber-700 dark:bg-amber-950/30">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
            Este pasajero ya tiene un pasaje en este viaje
          </p>
          <ul className="space-y-1.5 text-sm text-amber-900 dark:text-amber-200">
            {matches.map((match, index) => {
              const ticket = formatTicket(match);
              return (
                <li
                  key={`${match.passenger_name}-${match.seat_number}-${index}`}
                  className="rounded-md border border-amber-300/80 bg-amber-100/70 px-2.5 py-1.5 dark:border-amber-700 dark:bg-amber-950/40"
                >
                  <span className="font-medium">{match.passenger_name}</span>
                  <span className="text-amber-800 dark:text-amber-300">
                    {' '}
                    — Asiento {match.seat_number || 'sin asignar'}
                    {ticket ? ` — Comprobante ${ticket}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Solo es un aviso. Puede continuar con la venta si corresponde.
          </p>
        </div>
      </div>
    </div>
  );
};
