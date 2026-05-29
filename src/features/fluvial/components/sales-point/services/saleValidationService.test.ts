import { describe, it, expect } from 'vitest';
import { saleValidationService } from './saleValidationService';
import { SunatDocType } from '../../../types/sunat.types';

describe('saleValidationService', () => {
  const validPassenger = {
    docType: SunatDocType.DNI,
    docNumber: '12345678',
    name: 'Juan Perez',
    address: '',
    phone: '',
    email: '',
  };

  const validSeat = { id: 1, seat_number: 'A1', status: 'AVAILABLE' } as any;

  describe('validateBasicSaleData', () => {
    it('returns valid for complete data', () => {
      const result = saleValidationService.validateBasicSaleData(
        1, 2, validPassenger, { id: 1 }
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when boarding or disembarking stop is missing', () => {
      const result = saleValidationService.validateBasicSaleData(
        null, 2, validPassenger, { id: 1 }
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seleccione origen y destino');
    });

    it('fails when doc number is empty', () => {
      const result = saleValidationService.validateBasicSaleData(
        1, 2, { ...validPassenger, docNumber: '  ' }, { id: 1 }
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ingrese número de documento');
    });

    it('fails when name is empty', () => {
      const result = saleValidationService.validateBasicSaleData(
        1, 2, { ...validPassenger, name: '' }, { id: 1 }
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ingrese nombre del pasajero');
    });

    it('fails when passenger service is missing', () => {
      const result = saleValidationService.validateBasicSaleData(
        1, 2, validPassenger, null
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No se pudo cargar la información del servicio');
    });
  });

  describe('validateSeatSelection', () => {
    it('passes when showSeatMap is false', () => {
      const result = saleValidationService.validateSeatSelection(false, null);
      expect(result.isValid).toBe(true);
    });

    it('passes when showSeatMap is true and seat is selected', () => {
      const result = saleValidationService.validateSeatSelection(true, validSeat);
      expect(result.isValid).toBe(true);
    });

    it('fails when showSeatMap is true but no seat selected', () => {
      const result = saleValidationService.validateSeatSelection(true, null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seleccione un número de asiento');
    });
  });

  describe('validateCompanySale', () => {
    it('passes with at least one representative', () => {
      const result = saleValidationService.validateCompanySale([{ name: 'Rep1' } as any]);
      expect(result.isValid).toBe(true);
    });

    it('fails with no representatives', () => {
      const result = saleValidationService.validateCompanySale([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Agregue al menos un representante para ventas empresariales');
    });
  });

  describe('validateDocumentSeries', () => {
    it('fails for boleta when no boleta series selected', () => {
      const result = saleValidationService.validateDocumentSeries(
        validPassenger, '', 'F001'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seleccione una serie de Boleta');
    });

    it('passes for boleta when series is selected', () => {
      const result = saleValidationService.validateDocumentSeries(
        validPassenger, 'B001', 'F001'
      );
      expect(result.isValid).toBe(true);
    });

    it('fails for RUC when no factura series selected', () => {
      const rucPassenger = { ...validPassenger, docType: SunatDocType.RUC };
      const result = saleValidationService.validateDocumentSeries(
        rucPassenger, 'B001', ''
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seleccione una serie de Factura');
    });

    it('passes for RUC when factura series is selected', () => {
      const rucPassenger = { ...validPassenger, docType: SunatDocType.RUC };
      const result = saleValidationService.validateDocumentSeries(
        rucPassenger, 'B001', 'F001'
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCompleteSale', () => {
    it('returns basic validation errors first', () => {
      const result = saleValidationService.validateCompleteSale(
        null, 2, validPassenger, [], validSeat, true, { id: 1 }, 'B001', 'F001'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seleccione origen y destino');
    });

    it('returns seat validation error when seat missing', () => {
      const result = saleValidationService.validateCompleteSale(
        1, 2, validPassenger, [], null, true, { id: 1 }, 'B001', 'F001'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seleccione un número de asiento');
    });

    it('returns company validation error for RUC without representatives', () => {
      const rucPassenger = { ...validPassenger, docType: SunatDocType.RUC };
      const result = saleValidationService.validateCompleteSale(
        1, 2, rucPassenger, [], validSeat, true, { id: 1 }, 'B001', 'F001'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Agregue al menos un representante para ventas empresariales');
    });

    it('returns series validation error when series missing', () => {
      const result = saleValidationService.validateCompleteSale(
        1, 2, validPassenger, [], validSeat, true, { id: 1 }, '', 'F001'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seleccione una serie de Boleta');
    });

    it('passes for complete valid regular sale', () => {
      const result = saleValidationService.validateCompleteSale(
        1, 2, validPassenger, [], validSeat, true, { id: 1 }, 'B001', 'F001'
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes for complete valid company sale', () => {
      const rucPassenger = { ...validPassenger, docType: SunatDocType.RUC };
      const result = saleValidationService.validateCompleteSale(
        1, 2, rucPassenger, [{ name: 'Rep1' } as any], null, false, { id: 1 }, 'B001', 'F001'
      );
      expect(result.isValid).toBe(true);
    });
  });
});
