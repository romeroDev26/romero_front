import { describe, expect, it } from 'vitest';
import { tripDateTime } from './tripDateTime';
describe('Horarios de búsqueda en Lima', () => {
  it('interpreta una hora sin zona como hora de Lima', () => {
    expect(tripDateTime('2026-10-09T17:00:00').toISOString()).toBe('2026-10-09T22:00:00.000Z');
  });
  it('conserva el instante de horarios que ya incluyen zona', () => {
    expect(tripDateTime('2026-10-09T22:00:00Z').toISOString()).toBe('2026-10-09T22:00:00.000Z');
    expect(tripDateTime('2026-10-09T17:00:00-05:00').toISOString()).toBe('2026-10-09T22:00:00.000Z');
  });
});
