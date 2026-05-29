import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSaleBusinessLogic } from './useSaleBusinessLogic';
import { SunatDocType } from '../../../types/sunat.types';

// ─── Mocks ───
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockSaleNotifyError = vi.fn();
const mockSaleNotifySuccess = vi.fn();

vi.mock('@/utils/sileo-toast', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
    info: vi.fn(),
    warning: vi.fn(),
  },
  saleNotify: {
    error: (...args: any[]) => mockSaleNotifyError(...args),
    success: (...args: any[]) => mockSaleNotifySuccess(...args),
  },
}));

vi.mock('../../../../../services/products-services.service', () => ({
  productsServicesService: {
    getById: vi.fn().mockResolvedValue({ name: 'Equipaje Extra' }),
  },
}));

describe('useSaleBusinessLogic', () => {
  const createMocks = () => ({
    findOrCreateClient: vi.fn().mockResolvedValue({ id: 100, name: 'Cliente' }),
    createInvoice: vi.fn().mockResolvedValue({
      id: 500,
      series: 'B001',
      number: 42,
      items: [{ id: 999 }],
    }),
    createSeatAssignment: vi.fn().mockResolvedValue({}),
    updateReservation: vi.fn().mockResolvedValue({}),
    createCompanyInvoiceWithRepresentatives: vi.fn().mockResolvedValue({
      id: 600,
      representatives: [{ name: 'R1' }, { name: 'R2' }],
    }),
    seatValidationService: {
      validateSeatAvailability: vi.fn().mockResolvedValue({ isAvailable: true }),
      releaseSeatReservation: vi.fn().mockResolvedValue({}),
    },
    currentUser: { id: 'user-123' },
    tripDetails: { id: 1 },
    passengerService: { id: 1, name: 'Servicio' },
    vesselDetails: {
      seat_configurations: [
        { id: 10, seat_type: { id: 1, name: 'VIP' } },
      ],
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const passengerData = {
    docType: SunatDocType.DNI,
    docNumber: '12345678',
    name: 'Juan Perez',
    address: 'Lima 123',
    phone: '999888777',
    email: 'juan@test.com',
  };

  const baseSeat = {
    id: 55,
    seat_number: 'A1',
    status: 'AVAILABLE',
    vessel_seat_config_id: 10,
    seat_type: { id: 1, name: 'VIP' },
  } as any;

  describe('enrichSeatWithType', () => {
    it('enriches seat with type from vessel config', () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));
      const enriched = result.current.enrichSeatWithType({
        ...baseSeat,
        seat_type: undefined,
      });
      expect(enriched.seat_type).toEqual({ id: 1, name: 'VIP' });
    });

    it('returns seat unchanged if no vessel config', () => {
      const mocks = createMocks();
      (mocks as any).vesselDetails = null;
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));
      const enriched = result.current.enrichSeatWithType(baseSeat);
      expect(enriched).toEqual(baseSeat);
    });
  });

  describe('handleCompanyInvoiceWithRepresentatives', () => {
    it('shows error when no representatives', async () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      await result.current.handleCompanyInvoiceWithRepresentatives(
        1, 1, 2, passengerData, [], 'Sucursal', vi.fn()
      );

      expect(mockToastError).toHaveBeenCalledWith(
        'Agregue al menos un representante para ventas empresariales'
      );
    });

    it('shows error when basic validation fails', async () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      await result.current.handleCompanyInvoiceWithRepresentatives(
        1, null as any, 2, { ...passengerData, name: '' }, [{ name: 'Rep' } as any], 'Sucursal', vi.fn()
      );

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Ingrese nombre'));
    });

    it('creates company invoice successfully', async () => {
      const mocks = createMocks();
      const onSuccess = vi.fn();
      const confirmPurchase = vi.fn(() => true);
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      const reps = [
        { name: 'Rep1', document_type: '1', document_number: '11111111', seat_number: 'A1', phone: null },
        { name: 'Rep2', document_type: '1', document_number: '22222222', seat_number: 'B2', phone: null },
      ];

      await result.current.handleCompanyInvoiceWithRepresentatives(
        1, 1, 2, { ...passengerData, docType: SunatDocType.RUC },
        reps, 'Sucursal', onSuccess,
        [{ id: 55, seat_number: 'A1' }, { id: 66, seat_number: 'B2' }],
        confirmPurchase,
        100, 1, 0, '', 0, true, 'F001',
        { id: 55, seat_number: 'A1' },
        '009', '000'
      );

      expect(mocks.createCompanyInvoiceWithRepresentatives).toHaveBeenCalled();
      expect(confirmPurchase).toHaveBeenCalledWith([55, 66]);
      expect(mockToastSuccess).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it('releases seats on 409 error', async () => {
      const mocks = createMocks();
      mocks.createCompanyInvoiceWithRepresentatives.mockRejectedValue({
        response: { status: 409, data: { detail: 'Asiento ocupado' } },
      });

      const { result } = renderHook(() => useSaleBusinessLogic(mocks));
      const reps = [{ name: 'Rep1', document_type: '1', document_number: '11111111', seat_number: 'A1', phone: null }];

      await result.current.handleCompanyInvoiceWithRepresentatives(
        1, 1, 2, { ...passengerData, docType: SunatDocType.RUC },
        reps, 'Sucursal', vi.fn(),
        [{ id: 55, seat_number: 'A1' }],
        undefined, 100, 1, 0, '', 0, true
      );

      expect(mocks.seatValidationService.releaseSeatReservation).toHaveBeenCalled();
      expect(mockSaleNotifyError).toHaveBeenCalledWith(
        'No se puede completar la venta',
        'Asiento ocupado'
      );
    });
  });

  describe('handleRegularSale', () => {
    it('shows validation errors when data incomplete', async () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      await result.current.handleRegularSale(
        1, null as any, 2, baseSeat, passengerData, [], true,
        '', 'Sucursal', 100, 1, 0, '', 0, false, false, null, vi.fn()
      );

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Seleccione'));
    });

    it('blocks sale when seat is not available', async () => {
      const mocks = createMocks();
      mocks.seatValidationService.validateSeatAvailability.mockResolvedValue({
        isAvailable: false,
        reason: 'Asiento ya vendido',
      });

      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      await result.current.handleRegularSale(
        1, 1, 2, baseSeat, passengerData, [], true,
        'B001', 'Sucursal', 100, 1, 0, '', 0, false, false, null, vi.fn()
      );

      expect(mockToastError).toHaveBeenCalledWith('Asiento ya vendido');
    });

    it('completes direct sale successfully', async () => {
      const mocks = createMocks();
      const onSuccess = vi.fn();
      const confirmPurchase = vi.fn(() => true);
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      await result.current.handleRegularSale(
        1, 1, 2, baseSeat, passengerData, [], true,
        'B001', 'Sucursal', 100, 1, 0, '', 0, false, false, null,
        onSuccess, undefined, confirmPurchase
      );

      expect(mocks.findOrCreateClient).toHaveBeenCalled();
      expect(mocks.createInvoice).toHaveBeenCalled();
      expect(mocks.createSeatAssignment).toHaveBeenCalled();
      expect(confirmPurchase).toHaveBeenCalledWith([55]);
      expect(mockSaleNotifySuccess).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it('confirms existing reservation in confirming mode', async () => {
      const mocks = createMocks();
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      const reservation = { id: 77, trip_id: 1, status: 'RESERVED' };

      await result.current.handleRegularSale(
        1, 1, 2, baseSeat, passengerData, [], true,
        'B001', 'Sucursal', 100, 1, 0, '', 0, true, true, reservation,
        onSuccess
      );

      expect(mocks.updateReservation).toHaveBeenCalledWith(expect.objectContaining({
        reservationId: 77,
        data: expect.objectContaining({ status: 'CONFIRMED' }),
      }));
      expect(mocks.createSeatAssignment).not.toHaveBeenCalled();
    });

    it('releases seat on 409 error', async () => {
      const mocks = createMocks();
      mocks.createInvoice.mockRejectedValue({
        response: { status: 409, data: { detail: 'Conflicto' } },
      });

      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      await result.current.handleRegularSale(
        1, 1, 2, baseSeat, passengerData, [], true,
        'B001', 'Sucursal', 100, 1, 0, '', 0, false, false, null, vi.fn()
      );

      expect(mocks.seatValidationService.releaseSeatReservation).toHaveBeenCalledWith({
        tripId: 1,
        seatId: 55,
        userId: 'user-123',
      });
      expect(mockSaleNotifyError).toHaveBeenCalledWith(
        'Asiento no disponible',
        'Conflicto'
      );
    });

    it('releases seat on generic error', async () => {
      const mocks = createMocks();
      mocks.createInvoice.mockRejectedValue(new Error('Network'));

      const { result } = renderHook(() => useSaleBusinessLogic(mocks));

      await result.current.handleRegularSale(
        1, 1, 2, baseSeat, passengerData, [], true,
        'B001', 'Sucursal', 100, 1, 0, '', 0, false, false, null, vi.fn()
      );

      expect(mocks.seatValidationService.releaseSeatReservation).toHaveBeenCalled();
      expect(mockSaleNotifyError).toHaveBeenCalledWith(
        'Error en la venta',
        expect.any(String)
      );
    });
  });
});
