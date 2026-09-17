import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSearchReservations,
  useReservationsByTrip,
  useCreateReservation,
  useUpdateReservation,
} from './useReservations';
import { reservationsService } from '../../../services/reservations.service';
import type { SeatReservation } from '../../../types';
import type { ReservationCreateData } from '../../../services/reservations.service';

// ─── Mocks ───
const mockToastError = vi.fn();

vi.mock('@/utils/sileo-toast', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../../../services/reservations.service', () => ({
  reservationsService: {
    search: vi.fn(),
    getByTrip: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};


/**
 * Fabrica de reservas para los tests: completa los campos obligatorios de
 * SeatReservation y deja sobrescribir solo los que importan en cada caso. Asi
 * el test no necesita `as any` ni repetir veinte campos.
 */
const makeReservation = (
  overrides: Partial<SeatReservation> = {}
): SeatReservation => ({
  id: 1,
  trip_id: 1,
  trip_seat_id: 1,
  seat_type_id: 1,
  boarding_stop_id: 1,
  disembarking_stop_id: 2,
  customer_name: 'Cliente de prueba',
  customer_doc_type: '1',
  customer_doc_number: '12345678',
  total_price: 100,
  advance_amount: 0,
  remaining_amount: 100,
  currency_code: 'PEN',
  status: 'PENDING' as SeatReservation['status'],
  reserved_at: '2026-01-01T00:00:00Z',
  reserved_by: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});


/**
 * Payload minimo para las pruebas de creacion. Estas verifican que lo recibido
 * llegue TAL CUAL al servicio, asi que el objeto tiene que quedar parcial a
 * proposito: completarlo invalidaria la asercion.
 */
const minimalCreateData = { trip_id: 5 } as ReservationCreateData;

describe('useReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSearchReservations', () => {
    it('returns empty array when branch_office_id is missing', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchReservations({ start_date: '2024-01-01' }),
        { wrapper }
      );

      // Should be disabled and return no data
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches reservations when branch_office_id is provided', async () => {
      const mockData = [
        makeReservation({ id: 1, customer_name: 'John', status: 'CONFIRMED' }),
      ];
      vi.mocked(reservationsService.search).mockResolvedValue(mockData);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchReservations({ branch_office_id: 1, start_date: '2024-01-01' }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(reservationsService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          branch_office_id: 1,
          company_id: 1,
          start_date: '2024-01-01',
        })
      );
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useReservationsByTrip', () => {
    it('does not fetch when tripId is null', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useReservationsByTrip(null), { wrapper });
      expect(result.current.isLoading).toBe(false);
    });

    it('fetches reservations by tripId', async () => {
      const mockData = [makeReservation(makeReservation({ id: 2, trip_id: 42 }))];
      vi.mocked(reservationsService.getByTrip).mockResolvedValue(mockData);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReservationsByTrip(42), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(reservationsService.getByTrip).toHaveBeenCalledWith(42);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useCreateReservation', () => {
    it('creates reservation and invalidates queries on success', async () => {
      const newReservation = makeReservation({ id: 10, trip_id: 5 });
      vi.mocked(reservationsService.create).mockResolvedValue(newReservation);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateReservation(), { wrapper });

      await result.current.mutateAsync(minimalCreateData);

      expect(reservationsService.create).toHaveBeenCalledWith({ trip_id: 5 });
      // Query invalidation happens internally; we verify no error toast
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('shows 409 conflict toast on conflict error', async () => {
      const error = {
        response: { status: 409, data: { detail: 'Asiento no disponible' } },
      };
      vi.mocked(reservationsService.create).mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateReservation(), { wrapper });

      await result.current.mutateAsync(minimalCreateData).catch(() => {});

      expect(mockToastError).toHaveBeenCalledWith('Asiento no disponible');
    });

    it('shows generic error toast on other errors', async () => {
      const error = { response: { status: 500, data: {} } };
      vi.mocked(reservationsService.create).mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateReservation(), { wrapper });

      await result.current.mutateAsync(minimalCreateData).catch(() => {});

      expect(mockToastError).toHaveBeenCalledWith('Error al crear la reserva.');
    });
  });

  describe('useUpdateReservation', () => {
    it('updates reservation and invalidates queries on success', async () => {
      const updated = makeReservation({ id: 3, status: 'CONFIRMED' });
      vi.mocked(reservationsService.update).mockResolvedValue(updated);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReservation(), { wrapper });

      await result.current.mutateAsync({
        reservationId: 3,
        data: { status: 'CONFIRMED' },
        tripId: 7,
      });

      expect(reservationsService.update).toHaveBeenCalledWith(3, { status: 'CONFIRMED' });
    });

    it('shows 409 toast when reservation was already sold', async () => {
      const error = {
        response: { status: 409, data: { detail: 'Ya fue vendida' } },
      };
      vi.mocked(reservationsService.update).mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReservation(), { wrapper });

      await result.current.mutateAsync({
        reservationId: 3,
        data: { status: 'CONFIRMED' },
        tripId: 7,
      }).catch(() => {});

      expect(mockToastError).toHaveBeenCalledWith('Ya fue vendida');
    });

    it('shows generic error on update failure', async () => {
      const error = new Error('Network');
      vi.mocked(reservationsService.update).mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateReservation(), { wrapper });

      await result.current.mutateAsync({
        reservationId: 3,
        data: { status: 'CONFIRMED' },
        tripId: 7,
      }).catch(() => {});

      expect(mockToastError).toHaveBeenCalledWith('Error al actualizar la reserva.');
    });
  });
});
