import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene la fecha actual en la zona horaria de Perú (America/Lima).
 * Devuelve un Date que representa el inicio de ese día en Perú (05:00 UTC).
 */
export function getPeruDate(date: Date = new Date()): Date {
  const peruStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  // Perú es UTC-5. El inicio del día en Perú (00:00) son las 05:00 UTC.
  return new Date(`${peruStr}T05:00:00Z`);
}

/**
 * Formatea un Date al string yyyy-MM-DD en zona horaria de Perú.
 */
export function formatPeruDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Extrae la hora HH:mm de un string ISO.
 */
export function formatTimeFromISO(iso: string | undefined): string {
  if (!iso) return '--:--';
  try {
    return format(new Date(iso), 'HH:mm');
  } catch {
    return '--:--';
  }
}

/**
 * Etiqueta legible para una fecha: Hoy / lunes, 12 de mayo de 2025
 */
export function formatDateLabel(date: Date): string {
  if (isToday(date)) return `Hoy, ${format(date, 'd MMMM', { locale: es })}`;
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}
