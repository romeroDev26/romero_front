import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoiceCreationService } from './invoiceCreationService';
import { SunatDocType } from '../../../types/sunat.types';

vi.mock('../../../../../services/products-services.service', () => ({
  productsServicesService: {
    getById: vi.fn(),
  },
}));

import { productsServicesService } from '../../../../../services/products-services.service';

describe('invoiceCreationService', () => {
  const passengerData = {
    docType: SunatDocType.DNI,
    docNumber: '12345678',
    name: 'Juan Perez',
    address: 'Lima',
    phone: '999888777',
    email: 'juan@test.com',
    countryCode: 'PE',
    countryName: 'Peru',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateQuantity', () => {
    it('returns 1 for non-RUC passenger', () => {
      const qty = invoiceCreationService.calculateQuantity(passengerData, []);
      expect(qty).toBe(1);
    });

    it('returns representatives length for RUC passenger', () => {
      const rucPassenger = { ...passengerData, docType: SunatDocType.RUC };
      const reps = [{ name: 'R1' }, { name: 'R2' }] as any;
      expect(invoiceCreationService.calculateQuantity(rucPassenger, reps)).toBe(2);
    });

    it('returns at least 1 for RUC even with empty reps', () => {
      const rucPassenger = { ...passengerData, docType: SunatDocType.RUC };
      expect(invoiceCreationService.calculateQuantity(rucPassenger, [])).toBe(1);
    });
  });

  describe('createInvoiceItems', () => {
    it('creates transport item with correct fields', async () => {
      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1.5,
        0,
        '',
        0,
        false,
        42,
        1,
        2,
        null
      );

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        product_id: 1,
        quantity: 1,
        unit_price: 150, // 100 * 1.5
        discount: 0,
        tax_category_code: '20', // Exonerado
        item_description: 'Servicio de Transporte Fluvial',
        unit_code: 'ZZ',
        trip_id: 42,
        boarding_trip_stop_id: 1,
        disembarking_trip_stop_id: 2,
      });
    });

    it('applies IGV when isIgvGravado is true', async () => {
      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1.0,
        0,
        '',
        0,
        true,
        1,
        1,
        2,
        null
      );

      expect(items[0].unit_price).toBeCloseTo(118, 5);
      expect(items[0].tax_category_code).toBe('10'); // Gravado
    });

    it('includes seat info when selectedSeat is provided', async () => {
      const seat = { id: 55, seat_number: 'A1' };
      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1,
        0,
        '',
        0,
        false,
        1,
        1,
        2,
        seat
      );

      expect(items[0].trip_seat_id).toBe(55);
      expect(items[0].seat_number).toBe('A1');
    });

    it('includes optional item description', async () => {
      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1,
        0,
        '',
        0,
        false,
        1,
        1,
        2,
        null,
        'VIP Service'
      );

      expect(items[0].item_description).toBe('Servicio de Transporte Fluvial - VIP Service');
    });

    it('creates extra cost item when extraCost > 0', async () => {
      (productsServicesService.getById as any).mockResolvedValue({ name: 'Equipaje Extra' });

      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1,
        20,
        'Bulto adicional',
        0,
        false,
        1,
        1,
        2,
        null
      );

      expect(items).toHaveLength(2);
      expect(items[1]).toMatchObject({
        product_id: 7,
        quantity: 1,
        unit_price: 20,
        discount: 0,
        unit_code: 'ZZ',
      });
      expect(items[1].item_description).toBe('Equipaje Extra - Bulto adicional');
    });

    it('uses default description when extra cost product fetch fails', async () => {
      (productsServicesService.getById as any).mockRejectedValue(new Error('Not found'));

      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1,
        15,
        '',
        0,
        false,
        1,
        1,
        2,
        null
      );

      expect(items[1].item_description).toBe('Equipaje en exceso');
    });

    it('uses default description when no extraCostDescription provided', async () => {
      (productsServicesService.getById as any).mockResolvedValue(null);

      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1,
        10,
        '',
        0,
        false,
        1,
        1,
        2,
        null
      );

      expect(items[1].item_description).toBe('Equipaje en exceso');
    });

    it('does not include trip_seat_id for extra cost item', async () => {
      (productsServicesService.getById as any).mockResolvedValue(null);

      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1,
        10,
        'Extra',
        0,
        false,
        1,
        1,
        2,
        { id: 1, seat_number: 'A1' }
      );

      expect(items[1].trip_seat_id).toBeUndefined();
      expect(items[1].seat_number).toBeUndefined();
    });

    it('applies IGV to extra cost when isIgvGravado is true', async () => {
      (productsServicesService.getById as any).mockResolvedValue(null);

      const items = await invoiceCreationService.createInvoiceItems(
        passengerData,
        [],
        100,
        1,
        50,
        'Extra',
        0,
        true,
        1,
        1,
        2,
        null
      );

      expect(items[1].unit_price).toBeCloseTo(59, 5);
    });

    it('calculates RUC quantity correctly', async () => {
      const rucPassenger = { ...passengerData, docType: SunatDocType.RUC };
      const reps = [{ name: 'R1' }, { name: 'R2' }, { name: 'R3' }] as any;

      const items = await invoiceCreationService.createInvoiceItems(
        rucPassenger,
        reps,
        100,
        1,
        0,
        '',
        0,
        false,
        1,
        1,
        2,
        null
      );

      expect(items[0].quantity).toBe(3);
    });
  });

  describe('createInvoicePayload', () => {
    it('creates boleta payload correctly', () => {
      const items = [{ product_id: 1 }] as any;
      const payload = invoiceCreationService.createInvoicePayload(
        99,
        passengerData,
        'B001',
        'Sucursal Central',
        items
      );

      expect(payload).toMatchObject({
        client_id: 99,
        document_type_code: '03', // Boleta
        series: 'B001',
        operation_type_code: '0101',
        currency_code: 'PEN',
        notes: 'Punto de Venta: Sucursal Central',
        items,
      });
      expect(payload.issue_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(payload.issue_time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('creates factura payload for RUC', () => {
      const rucPassenger = { ...passengerData, docType: SunatDocType.RUC };
      const items = [{ product_id: 1 }] as any;
      const payload = invoiceCreationService.createInvoicePayload(
        99,
        rucPassenger,
        'F001',
        'Sucursal Central',
        items
      );

      expect(payload.document_type_code).toBe('01'); // Factura
      expect(payload.series).toBe('F001');
    });

    it('includes payment method when provided', () => {
      const payload = invoiceCreationService.createInvoicePayload(
        99,
        passengerData,
        'B001',
        'Sucursal',
        [],
        '009', // Yape
        '000'
      );

      expect(payload.payment_method_code).toBe('009');
      expect(payload.payment_operation_code).toBe('000');
    });

    it('includes split payment data when provided', () => {
      const payload = invoiceCreationService.createInvoicePayload(
        99,
        passengerData,
        'B001',
        'Sucursal',
        [],
        undefined,
        undefined,
        'PEN',
        {
          isSplitPayment: true,
          paymentAmount1: 50,
          paymentMethodCode2: '001',
          paymentOperationCode2: '000',
          paymentAmount2: 50,
        }
      );

      expect(payload.payment_amount_1).toBe(50);
      expect(payload.payment_method_code_2).toBe('001');
      expect(payload.payment_operation_code_2).toBe('000');
      expect(payload.payment_amount_2).toBe(50);
    });

    it('includes infants when provided', () => {
      const infants = [{ name: 'Baby', age: 1 }] as any;
      const payload = invoiceCreationService.createInvoicePayload(
        99,
        passengerData,
        'B001',
        'Sucursal',
        [],
        undefined,
        undefined,
        'PEN',
        undefined,
        infants
      );

      expect(payload.infants).toEqual(infants);
    });

    it('uses USD currency when specified', () => {
      const payload = invoiceCreationService.createInvoicePayload(
        99,
        passengerData,
        'B001',
        'Sucursal',
        [],
        undefined,
        undefined,
        'USD'
      );

      expect(payload.currency_code).toBe('USD');
    });
  });
});
