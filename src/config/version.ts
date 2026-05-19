// Single source of truth for frontend version and changelog
// Update this file with each meaningful deploy

export const APP_VERSION = '1.1.0';

export type ChangelogTag = 'feature' | 'improvement' | 'fix' | 'ui';

export interface ChangelogEntry {
  version: string;
  date: string; // ISO date string
  title: string;
  description: string;
  tags: ChangelogTag[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-05-18',
    title: 'Regeneración de manifiestos de viaje',
    description:
      'Ahora puedes regenerar manifiestos de pasajeros y carga directamente desde el detalle del manifiesto, sin necesidad de navegar a Programar Viajes.',
    tags: ['feature', 'improvement'],
  },
  {
    version: '1.1.0',
    date: '2026-05-18',
    title: 'Selector de sucursal en Reservas, Venta Rápida y Encomiendas',
    description:
      'Se agregó la posibilidad de seleccionar una sucursal directamente desde la página de Reservas, la Venta Rápida y la Venta de Encomiendas cuando aún no tienes una elegida. Esto elimina el redireccionamiento forzado y mejora la experiencia de usuario.',
    tags: ['feature', 'improvement'],
  },
  {
    version: '1.1.0',
    date: '2026-05-16',
    title: 'Nuevo diseño de inicio de sesión',
    description:
      'La página de login fue completamente rediseñada con una ilustración SVG fluvial personalizada, fondo ondulado y formulario optimizado. Se mantiene toda la lógica de bloqueo progresivo, recordar usuario y notificaciones.',
    tags: ['ui', 'feature'],
  },
  {
    version: '1.1.0',
    date: '2026-05-14',
    title: 'Notificaciones Sileo y bloqueo progresivo',
    description:
      'Migración completa de react-toastify a Sileo para notificaciones más modernas. Se integró el contador de bloqueo progresivo en el login: tras varios intentos fallidos, el sistema muestra el tiempo restante para poder volver a intentar.',
    tags: ['feature', 'improvement'],
  },
  {
    version: '1.1.0',
    date: '2026-05-12',
    title: 'Mejoras en manifiestos y dashboard',
    description:
      'El Dashboard ahora es responsive y permite navegar directamente al manifiesto de un viaje. Las tarjetas de manifiesto muestran los puertos de origen y destino, así como el peso total de carga o cantidad de pasajeros.',
    tags: ['improvement', 'ui'],
  },
  {
    version: '1.1.0',
    date: '2026-05-10',
    title: 'Tablas y formularios mejorados',
    description:
      'DataTable y ReservationsPage recibieron mejoras de estilo, accesibilidad y nuevos badges de estado. El formulario de datos de pasajero (PassengerDataForm) también fue mejorado visualmente.',
    tags: ['ui', 'improvement'],
  },
  {
    version: '1.0.1',
    date: '2026-04-28',
    title: 'Badge de versión en el sidebar',
    description:
      'Se agregó el indicador de versión en la barra lateral inferior para mantener visible la versión actual del frontend.',
    tags: ['ui'],
  },
];

export function getLatestVersion(): string {
  return APP_VERSION;
}

export function getGroupedChangelog(): Record<string, ChangelogEntry[]> {
  const groups: Record<string, ChangelogEntry[]> = {};

  for (const entry of CHANGELOG) {
    const key = entry.version;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }

  return groups;
}
