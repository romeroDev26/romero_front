// src/features/fluvial/components/reservations/ReservationStatusBadge.tsx
import React from 'react';

const RESERVATION_STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  RESERVED: {
    label: 'Reservado',
    classes: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40',
  },
  CONFIRMED: {
    label: 'Confirmado',
    classes: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100',
  },
  CANCELLED: {
    label: 'Cancelado',
    classes: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-100',
  },
  EXPIRED: {
    label: 'Expirado',
    classes: 'bg-dm-bg-secondary text-dm-text-secondary border border-dm-border-primary',
  },
};

export const ReservationStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = RESERVATION_STATUS_CONFIG[status] || RESERVATION_STATUS_CONFIG.EXPIRED;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
};
