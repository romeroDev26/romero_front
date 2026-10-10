import { describe, it, expect, vi } from 'vitest';
import api from '../../../config/api';
import { manifestService } from './manifest.service';
vi.mock('../../../config/api', () => ({ default: { get: vi.fn() } }));

describe('Direct trip manifests', () => {
  it('fetches the selected trip without relying on a paginated branch list', async () => {
    vi.mocked(api.get).mockResolvedValue({data:[{id:877,trip_id:2769,manifest_type:'PASSENGER',total_passengers:90}]});
    const result = await manifestService.getManifestsByTripId(2769);
    expect(api.get).toHaveBeenCalledWith('/dispatch/manifests/by-trip/2769');
    expect(result[0].total_passengers).toBe(90);
  });
});
