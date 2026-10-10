import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UpdatesAdminPage from './UpdatesAdminPage';
import { updatesService } from '../services/updates.service';
vi.mock('../services/updates.service', () => ({ updatesService: { getAll: vi.fn(async () => []), create: vi.fn(async () => ({})), update: vi.fn(), deleteById: vi.fn() } }));
vi.mock('@/utils/sileo-toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
afterEach(cleanup);
describe('Novedad con imagen y descripción opcional', () => {
  it('permite guardar título e imagen sin texto adicional', async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><UpdatesAdminPage /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva Novedad' }));
    fireEvent.change(screen.getByPlaceholderText('Nuevo módulo de cotizaciones'), { target: { value: 'Reprogramación disponible' } });
    fireEvent.change(screen.getByPlaceholderText('/images/updates/reprogramacion-pasajes.png'), { target: { value: '/images/updates/reprogramacion-pasajes.png' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear novedad' }));
    await waitFor(() => expect(updatesService.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Reprogramación disponible', description: '', image_url: '/images/updates/reprogramacion-pasajes.png' })));
  });
});
