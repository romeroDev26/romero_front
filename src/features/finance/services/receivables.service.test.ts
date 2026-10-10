import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../config/api';
import { receivablesService } from './receivables.service';
vi.mock('../../../config/api', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe('Collections search and totals', () => {
  it('sends a general server search and preserves totals across pages', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {
      invoices: [{ invoice_id:1, parcels:[{ invoice_item_id:10,payment_status:'NO PAGADO' }] }],
      pagination:{total_count:120},
      summary:{total_parcels:130,paid_parcels:30,unpaid_parcels:100,total_amount:9000},
    } });
    const result = await receivablesService.getReceivables({ search:'  FLORES  ', current_page:2,page_size:50,total_count:0,total_pages:0,has_next:false,has_prev:false });
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=FLORES'));
    expect(result.parcels).toHaveLength(1);
    expect(result.summary.unpaid_parcels).toBe(100);
    expect(result.summary.paid_parcels).toBe(30);
    expect(result.summary.total_parcels).toBe(130);
  });
});
