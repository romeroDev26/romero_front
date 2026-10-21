import api from '../config/api';

export interface PendingReprogramming {
  id: number;
  invoice_id: number;
  source_trip_id: number;
  source_trip_name?: string;
  reason: string;
  passenger_count?: number;
  requested_by_name?: string | null;
  created_at: string;
  series: string;
  number: number;
  client_name?: string;
  total_payable: string;
  sunat_status: string;
}

export const reprogrammingService = {
  pending: async (): Promise<PendingReprogramming[]> =>
    (await api.get('/operations/reprogramming/pending', { params: { limit: 500 } })).data,
  status: async (invoiceId: number): Promise<PendingReprogramming | null> =>
    (await api.get(`/operations/reprogramming/${invoiceId}`)).data,
  postpone: async (invoiceId: number, reason: string) =>
    (await api.post(`/operations/reprogramming/${invoiceId}/pending`, { reason })).data,
  schedule: async (invoiceId: number, payload: { new_trip_id: number; new_boarding_port_id?: number; new_disembarking_port_id?: number }) =>
    (await api.post(`/sunat/invoices/${invoiceId}/reprogram`, payload)).data,
};
