import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemUpdate } from '../services/updates.service';
import { useSystemUpdates } from './useSystemUpdates';
const state = vi.hoisted(() => ({ updates: [] as SystemUpdate[] }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: state.updates, isLoading: false }) }));
const update: SystemUpdate = { id: 1, version: 'v1', title: 'Mejora', description: null, video_url: null, learn_more_url: null, release_date: '2026-10-15', is_active: true, is_mandatory: false, platform: 'WEB', created_at: '1', updated_at: '1' };
beforeEach(() => { localStorage.clear(); state.updates = [update]; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('estado de novedades en el panel', () => {
  it('registrar una vista actualiza la apertura automática sin cambiar la galería', () => {
    const { result } = renderHook(() => useSystemUpdates('a'));
    expect(result.current.autoUpdates).toHaveLength(1);
    act(() => result.current.markViewed(update));
    expect(result.current.autoUpdates).toHaveLength(0);
    expect(result.current.hasNew).toBe(false);
    expect(result.current.updates).toHaveLength(1);
  });
  it('cerrar una obligatoria pospone el modal, pero mantiene el indicador pendiente', () => {
    state.updates = [{ ...update, is_mandatory: true }];
    const { result } = renderHook(() => useSystemUpdates('a'));
    act(() => result.current.markViewed(state.updates[0]));
    act(() => result.current.dismissUpdates(state.updates));
    expect(result.current.autoUpdates).toHaveLength(0);
    expect(result.current.hasNew).toBe(true);
    act(() => result.current.confirmUpdate(state.updates[0]));
    expect(result.current.hasNew).toBe(false);
  });
  it('cambiar de usuario no hereda las lecturas del anterior', () => {
    const { result, rerender } = renderHook(({ user }) => useSystemUpdates(user), { initialProps: { user: 'a' } });
    act(() => result.current.markViewed(update));
    rerender({ user: 'b' });
    expect(result.current.autoUpdates).toHaveLength(1);
  });
  it('no suprime una novedad recién activada con un id menor', () => {
    const { result, rerender } = renderHook(() => useSystemUpdates('a'));
    act(() => result.current.markViewed(update));
    state.updates = [{ ...update, id: 0 }, update];
    rerender();
    expect(result.current.autoUpdates.map(u => u.id)).toEqual([0]);
  });
});
