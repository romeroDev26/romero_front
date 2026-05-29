import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSaleFormState } from './useSaleFormState';
import { SunatDocType } from '../../../types/sunat.types';

describe('useSaleFormState', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useSaleFormState());
    expect(result.current.state.passengerData.docType).toBe(SunatDocType.DNI);
    expect(result.current.state.representatives).toEqual([]);
    expect(result.current.state.isConfirmingMode).toBe(false);
    expect(result.current.state.showRepresentatives).toBe(false);
  });

  it('sets isConfirmingMode when reservationToConfirm is provided', () => {
    const { result } = renderHook(() => useSaleFormState({ id: 1 }));
    expect(result.current.state.isConfirmingMode).toBe(true);
  });

  it('updateState merges partial updates', () => {
    const { result } = renderHook(() => useSaleFormState());
    act(() => result.current.updateState({ extraCost: 50 }));
    expect(result.current.state.extraCost).toBe(50);
    expect(result.current.state.discount).toBe(0); // unchanged
  });

  it('addRepresentative appends to list', () => {
    const { result } = renderHook(() => useSaleFormState());
    const rep = { name: 'Rep1', document_type: '1', document_number: '11111111' } as any;
    act(() => result.current.addRepresentative(rep));
    expect(result.current.state.representatives).toHaveLength(1);
    expect(result.current.state.representatives[0].name).toBe('Rep1');
    expect(result.current.state.showAddForm).toBe(false);
  });

  it('removeRepresentative filters by index', () => {
    const { result } = renderHook(() => useSaleFormState());
    const rep1 = { name: 'R1' } as any;
    const rep2 = { name: 'R2' } as any;
    act(() => {
      result.current.addRepresentative(rep1);
      result.current.addRepresentative(rep2);
    });
    act(() => result.current.removeRepresentative(0));
    expect(result.current.state.representatives).toHaveLength(1);
    expect(result.current.state.representatives[0].name).toBe('R2');
  });

  it('shows representatives when RUC and basic info filled', () => {
    const { result } = renderHook(() => useSaleFormState());
    act(() => {
      result.current.updateState({
        passengerData: {
          docType: SunatDocType.RUC,
          docNumber: '20123456789',
          name: 'Empresa SAC',
          address: '',
          phone: '',
          email: '',
        },
      });
    });
    expect(result.current.state.showRepresentatives).toBe(true);
  });

  it('does not show representatives when docType is not RUC', () => {
    const { result } = renderHook(() => useSaleFormState());
    act(() => {
      result.current.updateState({
        passengerData: {
          docType: SunatDocType.DNI,
          docNumber: '12345678',
          name: 'Juan',
          address: '',
          phone: '',
          email: '',
        },
      });
    });
    expect(result.current.state.showRepresentatives).toBe(false);
  });

  it('does not show representatives when basic info is incomplete', () => {
    const { result } = renderHook(() => useSaleFormState());
    act(() => {
      result.current.updateState({
        passengerData: {
          docType: SunatDocType.RUC,
          docNumber: '',
          name: '',
          address: '',
          phone: '',
          email: '',
        },
      });
    });
    expect(result.current.state.showRepresentatives).toBe(false);
  });
});
