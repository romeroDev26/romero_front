// src/features/fluvial/components/sales-point/services/invoiceCreationService.ts

import { format } from "date-fns";
import { PassengerData, Representative, Infant } from "../core/types";
import { SunatInvoiceType, SunatTaxCategory } from "../../../types/sunat.types";
import { productsServicesService } from '../../../../../services/products-services.service';

export interface InvoiceItemData {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_category_code: string;
  item_description: string;
  unit_code: string;
  trip_id: number;
  boarding_trip_stop_id: number;
  disembarking_trip_stop_id: number;
  // Campos para asientos
  trip_seat_id?: number; // ID del asiento en la embarcación
  seat_number?: string; // Número del asiento seleccionado por el vendedor
}

export interface InvoiceCreationData {
  client_id: number;
  document_type_code: string;
  series: string;
  issue_date: string;
  issue_time: string;
  operation_type_code: string;
  currency_code: string;
  notes: string;
  items: InvoiceItemData[];
  // Infantes acompañantes (solo para boletas)
  infants?: Infant[];
  // Campos de pago principal
  payment_method_code?: string;
  payment_operation_code?: string;
  // Campos para pago dividido
  payment_amount_1?: number;
  payment_method_code_2?: string;
  payment_operation_code_2?: string;
  payment_amount_2?: number;
}

export const invoiceCreationService = {
  createInvoiceItems: async (
    passengerData: PassengerData,
    representatives: Representative[],
    basePrice: number,
    seatMultiplier: number,
    extraCost: number,
    extraCostDescription: string,
    discount: number,
    isIgvGravado: boolean,
    tripId: number,
    selectedBoardingStopId: number,
    selectedDisembarkingStopId: number,
    selectedSeat?: any, // Asiento seleccionado para obtener seat_number y trip_seat_id
    itemDescription?: string // ← Descripción opcional del usuario
  ): Promise<InvoiceItemData[]> => {
    const items: InvoiceItemData[] = [];
    
    // Calcular cantidad según tipo de documento
    const quantity = invoiceCreationService.calculateQuantity(passengerData, representatives);
    
    // Precio del servicio base
    const baseServicePrice = basePrice * seatMultiplier;
    const baseServiceWithIgv = isIgvGravado ? baseServicePrice * 1.18 : baseServicePrice;

    // Item principal: Servicio de transporte
    // SOLO incluir el nombre del servicio y la descripción opcional del usuario
    // La detección de embarcaciones sin asientos se hace por trip_seat_id y seat_number null
    const optionalDescription = itemDescription?.trim() ? ` - ${itemDescription.trim()}` : "";
    
    items.push({
      product_id: 1, // ID fijo del servicio de transporte
      quantity: quantity,
      unit_price: parseFloat(baseServiceWithIgv.toFixed(10)),
      discount: discount,
      tax_category_code: isIgvGravado
        ? SunatTaxCategory.GRAVADO
        : SunatTaxCategory.EXONERADO,
      item_description: `Servicio de Transporte Fluvial${optionalDescription}`,
      unit_code: "ZZ", // ZZ = Servicio (CORREGIDO de NIU)
      trip_id: tripId,
      boarding_trip_stop_id: selectedBoardingStopId,
      disembarking_trip_stop_id: selectedDisembarkingStopId,
      // Agregar información del asiento si está disponible
      trip_seat_id: selectedSeat?.id || null,
      seat_number: selectedSeat?.seat_number || null,
    });

  // Item adicional: Costo adicional (si existe)
  if (extraCost > 0) {
      const extraCostWithIgv = isIgvGravado ? extraCost * 1.18 : extraCost;
      // Intentar obtener el nombre del producto/servicio con id 7 y componer la descripción
      let extraProductName = '';
      try {
        const prod = await productsServicesService.getById(7);
        extraProductName = prod?.name || '';
      } catch (e) {
        extraProductName = '';
      }

      const descriptionText = extraCostDescription?.trim() || 'Equipaje en exceso';
      const composedExtraDescription = extraProductName
        ? `${extraProductName} - ${descriptionText}`
        : descriptionText;

      items.push({
        product_id: 7, // ID específico para exceso de equipaje/costos adicionales
        quantity: 1,
        unit_price: parseFloat(extraCostWithIgv.toFixed(10)),
        discount: 0,
        tax_category_code: isIgvGravado
          ? SunatTaxCategory.GRAVADO
          : SunatTaxCategory.EXONERADO,
        item_description: composedExtraDescription,
        unit_code: "ZZ", // ZZ = Servicio (CORREGIDO de NIU)
        trip_id: tripId,
        boarding_trip_stop_id: selectedBoardingStopId,
        disembarking_trip_stop_id: selectedDisembarkingStopId,
        // NO se envía trip_seat_id ni seat_number para costos adicionales (bultos)
      });
    }

    return items;
  },

  createInvoicePayload: (
    clientId: number,
    passengerData: PassengerData,
    series: string,
    branchName: string,
    items: InvoiceItemData[],
    selectedPaymentMethod?: string,
    paymentOperationCode?: string,
    currencyCode: 'PEN' | 'USD' = 'PEN',
    // Parametros para pago dividido
    splitPaymentData?: {
      isSplitPayment: boolean;
      paymentAmount1?: number;
      paymentMethodCode2?: string;
      paymentOperationCode2?: string;
      paymentAmount2?: number;
    },
    infants?: Infant[]
  ): InvoiceCreationData => {
    const isRuc = passengerData.docType === "6"; // RUC
    
    const basePayload: InvoiceCreationData = {
      client_id: clientId,
      document_type_code: isRuc ? SunatInvoiceType.FACTURA : SunatInvoiceType.BOLETA,
      series: series,
      issue_date: format(new Date(), "yyyy-MM-dd"),
      issue_time: format(new Date(), "HH:mm:ss"),
      operation_type_code: "0101",
      currency_code: currencyCode,
      notes: `Punto de Venta: ${branchName}`,
      items: items,
    };

    // Agregar metodo de pago principal si esta disponible
    if (selectedPaymentMethod) {
      basePayload.payment_method_code = selectedPaymentMethod;
      basePayload.payment_operation_code = paymentOperationCode || undefined;
    }

    // Agregar datos de pago dividido si aplica
    if (splitPaymentData?.isSplitPayment) {
      basePayload.payment_amount_1 = splitPaymentData.paymentAmount1;
      basePayload.payment_method_code_2 = splitPaymentData.paymentMethodCode2;
      basePayload.payment_operation_code_2 = splitPaymentData.paymentOperationCode2 || undefined;
      basePayload.payment_amount_2 = splitPaymentData.paymentAmount2;
    }

    // Agregar infantes si existen (solo aplica para boletas)
    if (infants && infants.length > 0) {
      basePayload.infants = infants;
    }

    return basePayload;
  },

  calculateQuantity: (
    passengerData: PassengerData,
    representatives: Representative[]
  ): number => {
    const isRuc = passengerData.docType === "6"; // RUC
    return isRuc ? Math.max(1, representatives.length) : 1;
  },
};
