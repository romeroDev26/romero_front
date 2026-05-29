import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSaleForm } from './useSaleForm';
import { SunatDocType, SunatTaxCategory } from '../../../types/sunat.types';

// ─── Mocks ───

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('@/utils/sileo-toast', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
    info: (...args: any[]) => mockToastInfo(...args),
    warning: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
    useQuery: vi.fn(({ queryFn, ...options }: any) => {
      if (options.queryKey?.[0] === 'currentUser') {
        return { data: { id: 'user-123', name: 'Test User' }, isLoading: false };
      }
      if (options.queryKey?.[0] === 'seatMap') {
        return { data: { hasSeats: true }, isLoading: false };
      }
      return { data: null, isLoading: false };
    }),
  };
});

vi.mock('./useCurrencyManager', () => ({
  useCurrencyManager: () => ({
    selectedCurrency: 'PEN',
    isUSD: false,
    setCurrency: vi.fn(),
    getCurrencySymbol: () => 'S/',
    formatAmount: (amount: number) => `S/ ${amount.toFixed(2)}`,
  }),
}));

vi.mock('../vessel-detection', () => ({
  useVesselDetection: () => ({
    canSellWithoutSeats: false,
    showSeatMap: true,
    isLoading: false,
  }),
}));

vi.mock('../../../hooks/useRepresentantes', () => ({
  useRepresentantes: () => ({
    createCompanyInvoiceWithRepresentatives: vi.fn().mockResolvedValue({ id: 600 }),
    isCreating: false,
  }),
}));

vi.mock('../../../hooks/useSeatReservations', () => ({
  useSeatReservations: () => ({
    reserveSeat: vi.fn().mockResolvedValue(true),
    releaseSeat: vi.fn().mockResolvedValue(true),
    getReservedSeatNumbers: vi.fn().mockReturnValue([]),
    isReserving: false,
    reservedSeats: [],
    updateReservationSeatId: vi.fn(),
    releaseAllReservations: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('../../../hooks/useTripDetails', () => ({
  useTripDetails: () => ({
    data: {
      id: 1,
      vessel: { id: 10, name: 'Test Vessel' },
      stops: [{ id: 1, port_id: 1, name: 'Origen' }, { id: 2, port_id: 2, name: 'Destino' }],
    },
    isLoading: false,
  }),
}));

vi.mock('../../../hooks/useVesselsData', () => ({
  useVessel: () => ({
    data: {
      id: 10,
      seat_configurations: [{ id: 1, seat_type: { id: 1, name: 'VIP', price_multiplier: 1.5 } }],
    },
  }),
}));

vi.mock('../../../hooks/usePassengerService', () => ({
  usePassengerService: () => ({
    data: { id: 1, tax_category_code: SunatTaxCategory.EXONERADO },
    isLoading: false,
  }),
}));

vi.mock('../../../hooks/useFindFare', () => ({
  useFindFare: () => ({
    data: { price: 100 },
    isLoading: false,
  }),
}));

vi.mock('../../../hooks/useDocumentSeriesForBranch', () => ({
  useDocumentSeriesForBranch: () => ({
    availableBoletaSeries: [{ series_code: 'B001' }, { series_code: 'B002' }],
    availableFacturaSeries: [{ series_code: 'F001' }],
    isLoading: false,
  }),
}));

vi.mock('../../../hooks/useClientManager', () => ({
  useClientManager: () => ({
    findOrCreateClient: vi.fn().mockResolvedValue({ id: 99 }),
    isProcessingClient: false,
  }),
}));

vi.mock('../../../hooks/useInvoices', () => ({
  useCreateInvoice: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 500, series: 'B001', number: 42, items: [{ id: 1 }] }),
    isPending: false,
  }),
}));

vi.mock('../../../hooks/useSeatAssignments', () => ({
  useCreateSeatAssignment: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock('../../../hooks/useReservations', () => ({
  useUpdateReservation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

const mockHandleCompanyInvoice = vi.fn().mockResolvedValue(undefined);
const mockHandleRegularSale = vi.fn().mockResolvedValue(undefined);
const mockEnrichSeatWithType = vi.fn((seat: any) => seat);
const mockProcessReservationForConfirmation = vi.fn().mockReturnValue({
  passengerData: {
    docType: SunatDocType.DNI,
    docNumber: '12345678',
    name: 'Reservado',
    address: '',
    phone: '',
    email: '',
  },
  boardingStopId: 1,
  disembarkingStopId: 2,
  reservedSeat: { id: 5, seat_number: 'B2', status: 'RESERVED' },
  remainingAmount: 0,
});

vi.mock('./useSaleBusinessLogic', () => ({
  useSaleBusinessLogic: () => ({
    enrichSeatWithType: mockEnrichSeatWithType,
    handleCompanyInvoiceWithRepresentatives: mockHandleCompanyInvoice,
    handleRegularSale: mockHandleRegularSale,
  }),
}));

vi.mock('../reservation-confirmation', () => ({
  useReservationConfirmation: () => ({
    processReservationForConfirmation: mockProcessReservationForConfirmation,
  }),
}));

vi.mock('../../../../../services/seatValidation.service', () => ({
  seatValidationService: {
    validateSeatAvailability: vi.fn().mockResolvedValue({ isAvailable: true }),
    releaseSeatReservation: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../../../services/auth.service', () => ({
  authService: {
    getProfile: vi.fn().mockResolvedValue({ id: 'user-123', name: 'Test' }),
  },
}));

vi.mock('../../../../../config/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ status: 200, data: [] }),
    post: vi.fn(),
    patch: vi.fn(),
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

const baseTrip = {
  id: 1,
  vessel_name: 'Test Vessel',
  vessel_id: 10,
};

const baseBranch = {
  id: 1,
  name: 'Sucursal Central',
  port_id: 1,
};

const mockWebSocketFunctions = {
  selectSeatForRepresentative: vi.fn(),
  releaseSeatForRepresentative: vi.fn(),
  confirmPurchase: vi.fn(),
  activeSeatSelections: new Map(),
  seatMap: [{ id: 5, seat_number: 'B2', status: 'RESERVED' }],
  isWebSocketConnected: false,
};

describe('useSaleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(
      () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
      { wrapper: createWrapper() }
    );

    expect(result.current.passengerData.docType).toBe(SunatDocType.DNI);
    expect(result.current.selectedCurrency).toBe('PEN');
    expect(result.current.representatives).toEqual([]);
    expect(result.current.selectedSeat).toBeNull();
    expect(result.current.isConfirmingMode).toBe(false);
    expect(result.current.areActionsEnabled).toBe(false);
  });

  it('sets isConfirmingMode when reservationToConfirm is provided', () => {
    const { result } = renderHook(
      () => useSaleForm({
        trip: baseTrip as any,
        branch: baseBranch as any,
        onBack: vi.fn(),
        onSaleSuccess: vi.fn(),
        reservationToConfirm: { id: 99, trip_id: 1 } as any,
      }),
      { wrapper: createWrapper() }
    );

    // seatMap starts empty; trigger handleWebSocketReady so the effect runs
    act(() => {
      result.current.handleWebSocketReady(mockWebSocketFunctions as any);
    });

    expect(result.current.isConfirmingMode).toBe(true);
    expect(result.current.selectedSeat).toEqual(expect.objectContaining({ seat_number: 'B2' }));
  });

  describe('areActionsEnabled logic', () => {
    it('is false when stops are not selected', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      expect(result.current.areActionsEnabled).toBe(false);
    });

    it('is false when passenger data is incomplete', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setSelectedBoardingStopId(1);
        result.current.setSelectedDisembarkingStopId(2);
      });
      expect(result.current.areActionsEnabled).toBe(false);
    });

    it('is true for complete regular sale with seat', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setSelectedBoardingStopId(1);
        result.current.setSelectedDisembarkingStopId(2);
        result.current.setPassengerData({
          docType: SunatDocType.DNI,
          docNumber: '12345678',
          name: 'Juan Perez',
          address: '',
          phone: '',
          email: '',
        });
        result.current.setSelectedSeat({ id: 1, seat_number: 'A1', status: 'AVAILABLE' } as any);
      });
      expect(result.current.areActionsEnabled).toBe(true);
    });

    it('requires representatives for RUC sale', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setSelectedBoardingStopId(1);
        result.current.setSelectedDisembarkingStopId(2);
        result.current.setPassengerData({
          docType: SunatDocType.RUC,
          docNumber: '20123456789',
          name: 'Empresa SAC',
          address: '',
          phone: '',
          email: '',
        });
      });
      expect(result.current.areActionsEnabled).toBe(false);

      act(() => {
        result.current.setRepresentatives([{
          document_type: '1',
          document_number: '11111111',
          name: 'Rep1',
          phone: null,
        }]);
      });
      expect(result.current.areActionsEnabled).toBe(true);
    });
  });

  describe('price handlers', () => {
    it('handleManualPriceChange sets valid price', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => result.current.handleManualPriceChange(250));
      expect(result.current.manualPrice).toBe(250);
    });

    it('handleManualPriceChange rejects negative price', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => result.current.handleManualPriceChange(-10));
      expect(mockToastError).toHaveBeenCalledWith('El precio no puede ser negativo');
      expect(result.current.manualPrice).toBeNull();
    });

    it('handleManualPriceChange rejects price over 10000', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => result.current.handleManualPriceChange(15000));
      expect(mockToastError).toHaveBeenCalledWith('El precio no puede exceder S/ 10,000');
    });

    it('handleDiscountChange rejects invalid discount', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setSelectedBoardingStopId(1);
        result.current.setSelectedDisembarkingStopId(2);
        result.current.setPassengerData({
          docType: SunatDocType.DNI,
          docNumber: '12345678',
          name: 'Juan',
          address: '',
          phone: '',
          email: '',
        });
      });
      act(() => result.current.handleDiscountChange(99999));
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  describe('representative handlers', () => {
    it('handleAddRepresentative adds to list', async () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      const rep = {
        document_type: '1',
        document_number: '11111111',
        name: 'Rep1',
        phone: null,
      };
      await act(async () => {
        await result.current.handleAddRepresentative(rep as any);
      });
      expect(result.current.representatives).toHaveLength(1);
      expect(result.current.representatives[0].name).toBe('Rep1');
    });

    it('handleRemoveRepresentative removes by index', async () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      const rep1 = { document_type: '1', document_number: '11111111', name: 'R1', phone: null };
      const rep2 = { document_type: '1', document_number: '22222222', name: 'R2', phone: null };
      await act(async () => {
        await result.current.handleAddRepresentative(rep1 as any);
        await result.current.handleAddRepresentative(rep2 as any);
      });
      await act(async () => {
        await result.current.handleRemoveRepresentative(0);
      });
      expect(result.current.representatives).toHaveLength(1);
      expect(result.current.representatives[0].name).toBe('R2');
    });
  });

  describe('docType change effects', () => {
    it('clears seat and infants when switching to RUC', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setSelectedSeat({ id: 1, seat_number: 'A1' } as any);
        result.current.setBoletaInfants([{ full_name: 'Baby', birth_date: '2020-01-01', gender: 'M', relationship: 'SON' }] as any);
        result.current.setPassengerData({
          docType: SunatDocType.RUC,
          docNumber: '20123456789',
          name: 'Empresa',
          address: '',
          phone: '',
          email: '',
        });
      });
      expect(result.current.selectedSeat).toBeNull();
      expect(result.current.boletaInfants).toHaveLength(0);
    });

    it('clears representatives when switching from RUC to DNI', async () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setPassengerData({
          docType: SunatDocType.RUC,
          docNumber: '20123456789',
          name: 'Empresa',
          address: '',
          phone: '',
          email: '',
        });
        result.current.setRepresentatives([{ name: 'R1' } as any]);
      });
      expect(result.current.representatives).toHaveLength(1);

      act(() => {
        result.current.setPassengerData({
          docType: SunatDocType.DNI,
          docNumber: '12345678',
          name: 'Juan',
          address: '',
          phone: '',
          email: '',
        });
      });

      await waitFor(() => {
        expect(result.current.representatives).toHaveLength(0);
      });
    });
  });

  describe('document series', () => {
    it('caches boleta series in localStorage', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => result.current.handleBoletaSeriesChange('B002'));
      expect(localStorage.getItem('lastUsedBoletaSeries')).toBe('B002');
      expect(result.current.selectedBoletaSeries).toBe('B002');
    });

    it('caches factura series in localStorage', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => result.current.handleFacturaSeriesChange('F001'));
      expect(localStorage.getItem('lastUsedFacturaSeries')).toBe('F001');
    });
  });

  describe('sale confirmation flow', () => {
    it('handleOpenConfirmModal opens modal when valid', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setSelectedBoardingStopId(1);
        result.current.setSelectedDisembarkingStopId(2);
        result.current.setPassengerData({
          docType: SunatDocType.DNI,
          docNumber: '12345678',
          name: 'Juan',
          address: '',
          phone: '',
          email: '',
        });
        result.current.setSelectedSeat({ id: 1, seat_number: 'A1' } as any);
      });
      act(() => result.current.handleOpenConfirmModal());
      expect(result.current.isConfirmSaleModalOpen).toBe(true);
    });

    it('handleConfirmSale calls handleRegularSale for non-RUC', async () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setSelectedBoardingStopId(1);
        result.current.setSelectedDisembarkingStopId(2);
        result.current.setPassengerData({
          docType: SunatDocType.DNI,
          docNumber: '12345678',
          name: 'Juan',
          address: '',
          phone: '',
          email: '',
        });
        result.current.setSelectedSeat({ id: 1, seat_number: 'A1' } as any);
        result.current.setSelectedBoletaSeries('B001');
      });
      await act(async () => {
        await result.current.handleConfirmSale();
      });
      expect(mockHandleRegularSale).toHaveBeenCalled();
    });

    it('handleConfirmSale calls handleCompanyInvoice for RUC', async () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setSelectedBoardingStopId(1);
        result.current.setSelectedDisembarkingStopId(2);
        result.current.setPassengerData({
          docType: SunatDocType.RUC,
          docNumber: '20123456789',
          name: 'Empresa',
          address: '',
          phone: '',
          email: '',
        });
        result.current.setRepresentatives([{ name: 'R1', document_type: '1', document_number: '11111111', phone: null }]);
        result.current.setSelectedFacturaSeries('F001');
      });
      await act(async () => {
        await result.current.handleConfirmSale();
      });
      expect(mockHandleCompanyInvoice).toHaveBeenCalled();
    });
  });

  describe('cleanup functions', () => {
    it('clearFormAfterSale resets passenger data and selections', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setPassengerData({
          docType: SunatDocType.DNI,
          docNumber: '12345678',
          name: 'Juan',
          address: 'Lima',
          phone: '999',
          email: 'a@b.com',
        });
        result.current.setSelectedSeat({ id: 1 } as any);
        result.current.setExtraCost(50);
      });
      act(() => result.current.clearFormAfterSale());
      expect(result.current.passengerData.docNumber).toBe('');
      expect(result.current.selectedSeat).toBeNull();
      expect(result.current.extraCost).toBe(0);
    });

    it('clearStateForVesselChange resets representatives and modals', () => {
      const { result } = renderHook(
        () => useSaleForm({ trip: baseTrip as any, branch: baseBranch as any, onBack: vi.fn(), onSaleSuccess: vi.fn() }),
        { wrapper: createWrapper() }
      );
      act(() => {
        result.current.setRepresentatives([{ name: 'R1' } as any]);
        result.current.setShowAddForm(true);
        result.current.setReservationModalOpen(true);
        result.current.setSelectedBoletaSeries('B001');
      });
      act(() => result.current.clearStateForVesselChange());
      expect(result.current.representatives).toHaveLength(0);
      expect(result.current.showAddForm).toBe(false);
      expect(result.current.isReservationModalOpen).toBe(false);
      expect(result.current.selectedBoletaSeries).toBe('');
    });
  });
});
