// src/utils/formatDateTime.ts

import { format } from 'date-fns';

/**
 * Formatea una fecha YYYY-MM-DD (o ISO) a dd/MM/yyyy.
 * Si no matchea el patrón, intenta parsear con date-fns;
 * como último recurso devuelve el string original.
 *
 * (Lógica movida desde InvoiceDetailPage sin cambios de comportamiento.)
 */
export const formatIssueDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
};

/**
 * Combina fecha + hora en "dd/MM/yyyy HH:mm:ss".
 * Si falta la fecha, devuelve solo la hora; si falta la hora, solo la fecha.
 */
export const formatDateTime = (dateStr?: string | null, timeStr?: string | null): string => {
  const date = formatIssueDate(dateStr);
  if (!date) return timeStr ?? '';
  return timeStr ? `${date} ${timeStr}` : date;
};
