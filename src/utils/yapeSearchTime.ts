const LIMA_TZ = 'America/Lima';

/** Fecha de hoy en Lima (YYYY-MM-DD). */
export function todayInLima(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LIMA_TZ }).format(new Date());
}

/**
 * Combina fecha + hora locales (Lima) para el API.
 * Si solo hay hora, usa la fecha de hoy en Lima.
 */
export function buildHoraVentaISO(date?: string, time?: string): string | undefined {
  const rawTime = time?.trim();
  if (!rawTime) return undefined;

  const parts = rawTime.split(':');
  const hh = parts[0]?.padStart(2, '0');
  const mm = (parts[1] ?? '00').padStart(2, '0');
  const datePart = date?.trim() || todayInLima();

  return `${datePart}T${hh}:${mm}:00-05:00`;
}

export function formatHoraVentaLabel(date?: string, time?: string): string | null {
  const iso = buildHoraVentaISO(date, time);
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('es-PE', {
    timeZone: LIMA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
