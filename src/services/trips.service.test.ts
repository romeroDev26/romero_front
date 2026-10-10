import { describe, expect, it, vi } from 'vitest';
import { tripsService } from './trips.service';
import api from '../config/api';
vi.mock('../config/api', () => ({ default: { get: vi.fn() } }));
describe('Búsqueda de viajes para reprogramar', () => {
  it('envía estados repetidos para que FastAPI los interprete como lista', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await tripsService.search({ company_id: 1, status: ['SCHEDULED', 'RESCHEDULED'], start_date: '2026-10-09' });
    const config = vi.mocked(api.get).mock.calls[0][1];
    const serializer = config?.paramsSerializer;
    expect(typeof serializer).toBe('function');
    if (typeof serializer !== 'function') throw new Error('Missing serializer');
    const query = new URLSearchParams(serializer(config?.params));
    expect(query.getAll('status')).toEqual(['SCHEDULED', 'RESCHEDULED']);
  });
});
