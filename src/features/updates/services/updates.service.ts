import api from '../../../config/api';

export interface SystemUpdate {
  id: number;
  version: string;
  title: string;
  description: string | null;
  video_url: string | null;
  image_url?: string | null;
  learn_more_url: string | null;
  release_date: string;
  is_active: boolean;
  is_mandatory: boolean;
  platform: 'WEB' | 'MOBILE' | 'ALL';
  created_at: string;
  updated_at: string;
}

export interface SystemUpdatePayload {
  version: string;
  title: string;
  description: string;
  video_url?: string | null;
  image_url?: string | null;
  learn_more_url?: string | null;
  release_date: string; // formato YYYY-MM-DD
  platform: 'WEB' | 'MOBILE' | 'ALL';
  is_active: boolean;
  is_mandatory: boolean;
}

export const updatesService = {
  /* ── Público ── */
  getLatest: async (platform: 'WEB' | 'MOBILE' | 'ALL' = 'WEB'): Promise<SystemUpdate[]> => {
    const response = await api.get<SystemUpdate[]>('/system/updates/latest', {
      params: { platform },
    });
    return response.data;
  },

  /* ── Autenticado ── */
  getAll: async (params?: { skip?: number; limit?: number; is_active?: boolean }): Promise<SystemUpdate[]> => {
    const response = await api.get<SystemUpdate[]>('/system/updates/', { params });
    return response.data;
  },

  /* ── Admin ── */
  create: async (payload: SystemUpdatePayload): Promise<SystemUpdate> => {
    const response = await api.post<SystemUpdate>('/system/updates/', payload);
    return response.data;
  },

  update: async (id: number, payload: Partial<SystemUpdatePayload>): Promise<SystemUpdate> => {
    const response = await api.put<SystemUpdate>(`/system/updates/${id}`, payload);
    return response.data;
  },

  deleteById: async (id: number): Promise<void> => {
    await api.delete(`/system/updates/${id}`);
  },

};
