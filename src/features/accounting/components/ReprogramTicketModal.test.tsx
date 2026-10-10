import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReprogramTicketModal from './ReprogramTicketModal';
import { reprogrammingService } from '../../../services/reprogramming.service';
import { tripsService } from '../../../services/trips.service';

vi.mock('../../../services/reprogramming.service', () => ({ reprogrammingService: { status: vi.fn(), postpone: vi.fn(), schedule: vi.fn() } }));
vi.mock('../../../services/trips.service', () => ({ tripsService: { search: vi.fn(), getById: vi.fn() } }));
vi.mock('../../../services/auth.service', () => ({ authService: { getCurrentUser: () => ({ company_id: 1 }) } }));
vi.mock('@/utils/sileo-toast', () => ({ toast: { success: vi.fn() } }));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(reprogrammingService.status).mockResolvedValue(null);
  vi.mocked(tripsService.search).mockResolvedValue([]);
  vi.mocked(reprogrammingService.postpone).mockResolvedValue({});
});
function show() {
  const close = vi.fn();
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><ReprogramTicketModal invoiceId={75447} label="B006-16956" open onClose={close} /></QueryClientProvider>);
  return close;
}
describe('Reprogramación desde la web', () => {
  it('deja pendiente sin solicitar otra fecha y envía únicamente el motivo', async () => {
    const close = show();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Aún no tiene fecha' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Aún no tiene fecha' }));
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'El pasajero confirmará su fecha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dejar pendiente y liberar asientos' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(reprogrammingService.postpone).toHaveBeenCalledWith(75447, 'El pasajero confirmará su fecha');
    expect(reprogrammingService.schedule).not.toHaveBeenCalled();
  });
  it('no ejecuta cambios si no hay motivo ni viaje seleccionado', async () => {
    show();
    const confirm = screen.getByRole('button', { name: 'Confirmar reprogramación' });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    expect(screen.getByText('Elige el nuevo viaje.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aún no tiene fecha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dejar pendiente y liberar asientos' }));
    expect(screen.getByText('Escribe el motivo (al menos 5 caracteres).')).toBeInTheDocument();
    expect(reprogrammingService.postpone).not.toHaveBeenCalled();
    expect(reprogrammingService.schedule).not.toHaveBeenCalled();
  });
  it('permite asignar fecha a un pendiente sin volver a cobrar ni postergar', async () => {
    vi.mocked(reprogrammingService.status).mockResolvedValue({ id: 1, invoice_id: 75447, source_trip_id: 30, reason: 'Fecha por confirmar', created_at: '', series: 'B006', number: 16956, total_payable: '110', sunat_status: 'ERROR' });
    vi.mocked(tripsService.search).mockResolvedValue([{ id: 31, trip_name: 'Nuevo viaje', departure_datetime: '2099-10-10T22:00:00Z' }] as Awaited<ReturnType<typeof tripsService.search>>);
    vi.mocked(tripsService.getById).mockResolvedValue({ id: 31, stops: [] } as unknown as Awaited<ReturnType<typeof tripsService.getById>>);
    vi.mocked(reprogrammingService.schedule).mockResolvedValue({});
    const close = show();
    await screen.findByText('Pendiente de nueva fecha: Fecha por confirmar');
    expect(screen.queryByRole('button', { name: 'Aún no tiene fecha' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nuevo viaje'), { target: { value: '31' } });
    const confirm = screen.getByRole('button', { name: 'Confirmar reprogramación' });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(reprogrammingService.schedule).toHaveBeenCalledWith(75447, { new_trip_id: 31 });
    expect(reprogrammingService.postpone).not.toHaveBeenCalled();
  });
});
