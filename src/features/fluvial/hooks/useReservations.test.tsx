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

// ─── Mocks ───
const mockToastError = vi.fn();

vi.mock('@/utils/sileo-toast', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
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

describe('useReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSearchReservations', () => {
    it('returns empty array when branch_office_id is missing', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchReservations({ start_date: '2024-01-01' } as any),
        { wrapper }
      );

      // Should be disabled and return no data
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches reservations when branch_office_id is provided', async () => {
      const mockData = [
        { id: 1, customer_name: 'John', status: 'CONFIRMED' },
      ];
      (reservationsService.search as any).mockResolvedValue(mockData);

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useSearchReservations({ branch_office_id: 1, start_date: '2024-01-01' } as any),
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
      const mockData = [{ id: 2, trip_id: 42 }];
      (reservationsService.getByTrip as any).mockResolvedValue(mockData);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReservationsByTrip(42), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(reservationsService.getByTrip).toHaveBeenCalledWith(42);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useCreateReservation', () => {
    it('creates reservation and invalidates queries on success', async () => {
      const newReservation = { id: 10, trip_id: 5 };
      (reservationsService.create as any).mockResolvedValue(newReservation);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateReservation(), { wrapper });

      await result.current.mutateAsync({ trip_id: 5 } as any);

      expect(reservationsService.create).toHaveBeenCalledWith({ trip_id: 5 });
      // Query invalidation happens internally; we verify no error toast
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('shows 409 conflict toast on conflict error', async () => {
      const error = {
        response: { status: 409, data: { detail: 'Asiento no disponible' } },
      };
      (reservationsService.create as any).mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateReservation(), { wrapper });

      await result.current.mutateAsync({ trip_id: 5 } as any).catch(() => {});

      expect(mockToastError).toHaveBeenCalledWith('Asiento no disponible');
    });

    it('shows generic error toast on other errors', async () => {
      const error = { response: { status: 500, data: {} } };
      (reservationsService.create as any).mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateReservation(), { wrapper });

      await result.current.mutateAsync({ trip_id: 5 } as any).catch(() => {});

      expect(mockToastError).toHaveBeenCalledWith('Error al crear la reserva.');
    });
  });

  describe('useUpdateReservation', () => {
    it('updates reservation and invalidates queries on success', async () => {
      const updated = { id: 3, status: 'CONFIRMED' };
      (reservationsService.update as any).mockResolvedValue(updated);

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
      (reservationsService.update as any).mockRejectedValue(error);

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
      (reservationsService.update as any).mockRejectedValue(error);

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
