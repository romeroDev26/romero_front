// Single source of truth for frontend version and changelog
// Update this file with each meaningful deploy

export const APP_VERSION = '1.2.0';

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
    "version": "1.2.0",
    "date": "2026-10-10",
    "title": "Novedades en una galería de imágenes",
    "description": "Los anuncios con imagen ocupan casi toda la pantalla y se recorren con flechas. La descripción es opcional; los anuncios de texto y video siguen disponibles.",
    "tags": [
      "feature",
      "ui"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-10-10",
    "title": "Reprogramación de pasajes desde la web",
    "description": "Desde el detalle del comprobante puedes cambiar la fecha del viaje conservando el pago y el importe. El calendario marca fechas con salidas; las tarjetas permiten elegir viaje y revisar los puertos.",
    "tags": [
      "feature",
      "ui"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-10-10",
    "title": "Pasajes pendientes de nueva fecha",
    "description": "Puedes liberar los asientos y retirar pasajeros del manifiesto sin devolver el pago. El acceso Reprogramaciones pendientes permite asignar un viaje cuando confirmen su fecha.",
    "tags": [
      "feature"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-10-10",
    "title": "Cargo por reprogramación en Venta Rápida",
    "description": "El cargo se registra con otro comprobante, monto autorizado en cada venta y referencia al pasaje original. El servicio exonerado se mantiene fuera de pasajeros y encomiendas.",
    "tags": [
      "feature"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-09-27",
    "title": "Reportes por embarcación y período",
    "description": "Consulta viajes operados, pasajeros, ventas, notas de crédito, recaudación y pendientes por embarcación. Los detalles permiten revisar ocupación, rutas y vendedores.",
    "tags": [
      "feature",
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-09-26",
    "title": "Consultas de reportes más eficientes",
    "description": "Se optimizaron las consultas de reportes por viaje y embarcación, con más detalle para analizar las operaciones y sus ventas.",
    "tags": [
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-09-23",
    "title": "Sesiones entre aplicaciones",
    "description": "Se mejoró el manejo de sesiones al usar distintas aplicaciones del sistema.",
    "tags": [
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-09-22",
    "title": "Asistencia para identificar pagos Yape",
    "description": "La búsqueda asistida permite localizar pagos por fecha y hora, con mejoras de avisos y actualización en tiempo real.",
    "tags": [
      "feature",
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-09-19",
    "title": "Registro de pagos en encomiendas por cobrar",
    "description": "Se mejoró el formulario de confirmación de pagos y su integración con la búsqueda asistida.",
    "tags": [
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-09-08",
    "title": "Reservas con notas especiales",
    "description": "Puedes registrar notas para la reserva y revisarlas al consultar sus detalles y confirmar la venta. La lista de reservas tiene una presentación más clara.",
    "tags": [
      "feature",
      "ui"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-08-19",
    "title": "Descripción ampliada en Venta Rápida",
    "description": "El detalle adicional del servicio permite escribir varias líneas para documentar mejor la venta.",
    "tags": [
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-08-02",
    "title": "País del pasajero en Punto de Venta",
    "description": "Se agregó un selector de país en el formulario de pasajeros.",
    "tags": [
      "feature"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-07-17",
    "title": "Edición de medios de pago",
    "description": "Desde el detalle del comprobante y la vista previa del ticket puedes revisar y editar los medios de pago. Se mejoró el formato de importes y la actualización del resumen.",
    "tags": [
      "feature",
      "fix"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-07-16",
    "title": "Cierre por inactividad ajustado",
    "description": "Se amplió el límite de inactividad antes del cierre automático de sesión.",
    "tags": [
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-07-12",
    "title": "Validación de carné de extranjería",
    "description": "Se corrigió la validación del documento al agregar representantes.",
    "tags": [
      "fix"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-07-06",
    "title": "Búsqueda de clientes y destinatarios",
    "description": "Se integró la búsqueda con autocompletado para seleccionar clientes y destinatarios con mayor facilidad.",
    "tags": [
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-06-15",
    "title": "Inicio de sesión adaptable",
    "description": "La pantalla de ingreso se adapta mejor a distintos tamaños y al cambio de tema; se incorporó el cierre automático por inactividad.",
    "tags": [
      "ui",
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-06-11",
    "title": "Más contexto en gráficos de ventas",
    "description": "Los gráficos muestran totales de ventas, rutas y vendedores para facilitar la lectura de resultados.",
    "tags": [
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-06-10",
    "title": "Vista previa de cambio de embarcación",
    "description": "Al cambiar la embarcación de un viaje puedes revisar previamente la reubicación de pasajeros. También se mejoró la vista de calendario de programación.",
    "tags": [
      "feature",
      "ui"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-06-09",
    "title": "Búsqueda en el menú lateral",
    "description": "El menú incorpora una búsqueda para encontrar secciones y se mejoró la selección de clientes.",
    "tags": [
      "improvement"
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-05-28",
    "title": "Tema oscuro y estados de carga",
    "description": "Se amplió el soporte del tema oscuro y se mejoró la presentación de errores, carga de tablas y notificaciones.",
    "tags": [
      "ui",
      "improvement"
    ]
  },
  {
    version: '1.1.0',
    date: '2026-05-18',
    title: 'Refactorización de modales de anulación y supervisión',
    description:
      'Los modales de respuestas a solicitudes (vendedor), solicitud de aprobación de anulación, aprobación y rechazo (supervisor), así como la página de gestión de solicitudes, fueron completamente rediseñados con una estética minimalista empresarial: bordes finos, tipografía jerárquica, fondos neutros y sin sombras pesadas.',
    tags: ['ui', 'improvement'],
  },
  {
    version: '1.1.0',
    date: '2026-05-18',
    title: 'Rediseño de la anulación de comprobantes',
    description:
      'La página de anulación de notas de crédito (/accounting/credit-notes/annul) ahora usa un layout de dos columnas: a la izquierda la información del comprobante y a la derecha el formulario de acción. Se unificó el fondo del contenedor principal, se eliminaron los emojis y se aplicó el mismo estilo minimalista empresarial del sistema.',
    tags: ['ui', 'improvement'],
  },
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
