import { makeRepresentative, makeSeat } from '../../../../../test/factories';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSaleBusinessLogic } from './useSaleBusinessLogic';
import type { UseSaleBusinessLogicProps } from './useSaleBusinessLogic';
import type { SeatMapItem } from '../../../../../types';
import { SunatDocType } from '../../../types/sunat.types';

// ─── Mocks ───
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockSaleNotifyError = vi.fn();
const mockSaleNotifySuccess = vi.fn();

vi.mock('@/utils/sileo-toast', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    info: vi.fn(),
    warning: vi.fn(),
  },
  saleNotify: {
    error: (...args: unknown[]) => mockSaleNotifyError(...args),
    success: (...args: unknown[]) => mockSaleNotifySuccess(...args),
  },
}));

vi.mock('../../../../../services/products-services.service', () => ({
  productsServicesService: {
    getById: vi.fn().mockResolvedValue({ name: 'Equipaje Extra' }),
  },
}));

describe('useSaleBusinessLogic', () => {
  // SeatType completo: enrichSeatWithType lo propaga al asiento, asi que debe
  // ser un SeatType real y no un objeto parcial.
  const vipSeatType = {
    id: 1,
    name: 'VIP',
    code: 'VIP',
    price_multiplier: 1.5,
    is_active: true,
    display_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  };

  const createMocks = (): UseSaleBusinessLogicProps => ({
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
    // ProductService completo: el hook lo pasa a saleValidationService y a
    // invoiceCreationService, que si leen estos campos.
    passengerService: {
      id: 1,
      name: 'Servicio',
      item_type: 'SERVICE' as const,
      unit_code: 'NIU',
      sale_price: 50,
      currency_code: 'PEN',
      tax_category_code: 'S',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    vesselDetails: {
      seat_configurations: [{ id: 10, seat_type: vipSeatType }],
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

  const baseSeat = makeSeat({
    id: 55,
    vessel_seat_config_id: 10,
    seat_type: vipSeatType,
  });

  describe('enrichSeatWithType', () => {
    it('enriches seat with type from vessel config', () => {
      const mocks = createMocks();
      const { result } = renderHook(() => useSaleBusinessLogic(mocks));
      // seat_type ausente a proposito: es justo lo que enrichSeatWithType debe
      // completar a partir de la configuracion de la embarcacion.
      const enriched = result.current.enrichSeatWithType({
        ...baseSeat,
        seat_type: undefined as unknown as SeatMapItem['seat_type'],
      });
      expect(enriched.seat_type).toEqual(vipSeatType);
    });

    it('returns seat unchanged if no vessel config', () => {
      const mocks = createMocks();
      mocks.vesselDetails = null;
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
        // null a proposito: se verifica el rechazo cuando falta la parada
        1, null as unknown as number, 2, { ...passengerData, name: '' }, [makeRepresentative({ name: 'Rep' })], 'Sucursal', vi.fn()
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
      vi.mocked(mocks.createCompanyInvoiceWithRepresentatives).mockRejectedValue({
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
        // null a proposito: se verifica el rechazo cuando falta la parada
        1, null as unknown as number, 2, baseSeat, passengerData, [], true,
        '', 'Sucursal', 100, 1, 0, '', 0, false, false, null, vi.fn()
      );

      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Seleccione'));
    });

    it('blocks sale when seat is not available', async () => {
      const mocks = createMocks();
      vi.mocked(mocks.seatValidationService.validateSeatAvailability).mockResolvedValue({
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
      vi.mocked(mocks.createInvoice).mockRejectedValue({
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
      vi.mocked(mocks.createInvoice).mockRejectedValue(new Error('Network'));

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
