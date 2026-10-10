import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSaleBusinessLogic } from './useSaleBusinessLogic';
import type { PassengerData, Representative } from '../core/types';
vi.mock('../services/saleValidationService', () => ({ saleValidationService: { validateBasicSaleData: () => ({ isValid: true, errors: [] }) } }));
vi.mock('@/utils/sileo-toast', () => ({ toast: { error: vi.fn(), success: vi.fn() }, saleNotify: { success: vi.fn(), error: vi.fn() } }));

describe('payload empresarial con tramos individuales', () => {
  it('envía tarifa y puertos propios; conserva los predeterminados del representante antiguo', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1, representatives: [{}, {}] });
    const { result } = renderHook(() => useSaleBusinessLogic({ findOrCreateClient: vi.fn(), createInvoice: vi.fn(), createSeatAssignment: vi.fn(), updateReservation: vi.fn(), createCompanyInvoiceWithRepresentatives: create, seatValidationService: {}, currentUser: {}, tripDetails: {}, passengerService: {}, vesselDetails: {} }));
    const reps = [{ name: 'A', document_type: '1', document_number: '12345678', phone: null }, { name: 'B', document_type: '1', document_number: '87654321', phone: null, boarding_stop_id: 22, disembarking_stop_id: 33, unit_price: 180 }] as Representative[];
    await act(async () => {
      await result.current.handleCompanyInvoiceWithRepresentatives(1, 11, 33, { docType: '6', docNumber: '20123456789', name: 'Empresa' } as PassengerData, reps, 'Nauta', vi.fn(), [], undefined, 200, 1, 0, '', 0, false, 'F004');
    });
    const payload = create.mock.calls[0][0];
    expect(payload.representatives[0]).toMatchObject({ boarding_stop_id: 11, disembarking_stop_id: 33 });
    expect(payload.representatives[0].unit_price).toBeUndefined();
    expect(payload.representatives[1]).toMatchObject({ boarding_stop_id: 22, disembarking_stop_id: 33, unit_price: 180 });
    expect(payload.items_config[0]).toMatchObject({ unit_price: 200, quantity: 2, tax_category_code: '20' });
  });
});
