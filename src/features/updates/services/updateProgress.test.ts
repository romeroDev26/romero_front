import { beforeEach, describe, expect, it } from 'vitest';
import type { SystemUpdate } from './updates.service';
import { acknowledgeUpdate, deferMandatoryUpdates, hasUnreadUpdate, recordUpdateView, shouldAutoOpenUpdate, UPDATE_REMINDER_DELAY } from './updateProgress';
export const announcement: SystemUpdate = { id: 1, version: '2026.10.15', title: 'Una mejora', description: null, video_url: null, learn_more_url: null, release_date: '2026-10-15', is_active: true, is_mandatory: false, platform: 'WEB', created_at: '2026-10-15T10:00:00Z', updated_at: '2026-10-15T10:00:00Z' };
beforeEach(() => localStorage.clear());
describe('lectura de novedades por usuario y revisión', () => {
  it('una novedad normal deja de abrirse después de mostrarse', () => {
    expect(shouldAutoOpenUpdate('a', announcement)).toBe(true);
    recordUpdateView('a', announcement);
    expect(hasUnreadUpdate('a', announcement)).toBe(false);
    expect(shouldAutoOpenUpdate('a', announcement)).toBe(false);
  });
  it('el mismo navegador mantiene lecturas distintas entre usuarios', () => {
    recordUpdateView('a', announcement);
    expect(hasUnreadUpdate('b', announcement)).toBe(true);
  });
  it('cerrar una obligatoria pospone el aviso 24 horas sin confirmarla', () => {
    const update = { ...announcement, is_mandatory: true };
    recordUpdateView('a', update);
    deferMandatoryUpdates('a', [update], 1000);
    expect(hasUnreadUpdate('a', update)).toBe(true);
    expect(shouldAutoOpenUpdate('a', update, 1000 + UPDATE_REMINDER_DELAY - 1)).toBe(false);
    expect(shouldAutoOpenUpdate('a', update, 1000 + UPDATE_REMINDER_DELAY)).toBe(true);
  });
  it('Entendido detiene los recordatorios obligatorios', () => {
    const update = { ...announcement, is_mandatory: true };
    acknowledgeUpdate('a', update);
    deferMandatoryUpdates('a', [update], 1000);
    expect(hasUnreadUpdate('a', update)).toBe(false);
    expect(shouldAutoOpenUpdate('a', update, 1000 + 2 * UPDATE_REMINDER_DELAY)).toBe(false);
  });
  it('editar una novedad ya vista permite anunciar la nueva revisión', () => {
    acknowledgeUpdate('a', announcement);
    expect(hasUnreadUpdate('a', { ...announcement, updated_at: '2026-10-16T10:00:00Z' })).toBe(true);
  });
  it('no marca como vistas imágenes que el usuario no recorrió', () => {
    recordUpdateView('a', announcement);
    expect(hasUnreadUpdate('a', { ...announcement, id: 2 })).toBe(true);
  });
  it('un registro antiguo global no silencia novedades a otros usuarios', () => {
    localStorage.setItem('last_seen_update_id', '999');
    expect(hasUnreadUpdate('a', announcement)).toBe(true);
  });
  it('tolera datos de almacenamiento dañados', () => {
    localStorage.setItem('system_update_progress:a', 'not-json');
    expect(hasUnreadUpdate('a', announcement)).toBe(true);
  });
});
