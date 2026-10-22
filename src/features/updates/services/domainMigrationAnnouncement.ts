import type { SystemUpdatePayload } from './updates.service';

export const DOMAIN_MIGRATION_URL = 'https://ventas.globalromero.com/login';

/** Draft only: activate after checking HTTPS, login and office workflows on the new domain. */
export const domainMigrationAnnouncement: SystemUpdatePayload = {
  version: '2026.10.20-dominio',
  title: 'Nueva dirección del sistema de ventas',
  description: 'El sistema de trabajo se trasladará a https://ventas.globalromero.com/login. Usa tu usuario y contraseña de siempre; al entrar por primera vez en la nueva dirección tendrás que iniciar sesión.\n1. Pulsa Abrir nuevo sistema en este aviso.\n2. En Chrome para computadora, pulsa la estrella a la derecha de la dirección o presiona Ctrl + D.\n3. Guarda el nombre Romero Ventas en la carpeta Barra de favoritos y pulsa Listo.\n4. En adelante entra pulsando Romero Ventas en la barra de favoritos. Si no ves la barra, presiona Ctrl + Mayús + B.\nLa dirección globalromero.com se reservará para la futura web de clientes; esa venta online todavía no está disponible.',
  image_url: '/images/updates/nuevo-dominio-ventas.png',
  learn_more_url: DOMAIN_MIGRATION_URL,
  video_url: null,
  release_date: '2026-10-20',
  platform: 'WEB',
  is_active: false,
  is_mandatory: true,
};

export function updateActionLabel(url: string): string {
  if (url === DOMAIN_MIGRATION_URL) return 'Abrir nuevo sistema';
  return url.startsWith('/') ? 'Abrir herramienta' : 'Más detalles';
}
