import { describe, it, expect } from 'vitest';
import { calculatePriceDetails, validateDiscount } from './priceCalculations';
import { SunatDocType } from '../../../types/sunat.types';
import type { Representative, PassengerData } from '../core/types';

describe('factura con distintos tramos y tarifas', () => {
  const reps = [...Array.from({ length: 9 }, () => ({ unit_price: 200 })), { unit_price: 180 }, { unit_price: 180 }] as Representative[];
  it('suma 11 pasajeros sin multiplicar una tarifa única', () => {
    expect(calculatePriceDetails(200, 1, 0, { docType: SunatDocType.RUC } as PassengerData, reps, false, 0).finalTicketPrice).toBe(2160);
  });
  it('valida descuentos contra el importe real de todos los pasajes', () => {
    expect(validateDiscount(2200, 200, 1, 0, reps).isValid).toBe(false);
    expect(validateDiscount(2160, 200, 1, 0, reps).isValid).toBe(true);
  });
  it('mantiene el precio común para representantes antiguos sin tarifa individual', () => {
    expect(calculatePriceDetails(200, 1, 0, { docType: SunatDocType.RUC } as PassengerData, [{} as Representative, {} as Representative], false, 0).finalTicketPrice).toBe(400);
  });
});
