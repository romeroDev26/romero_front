// src/features/fluvial/components/sales-point/services/invoiceCreationService.ts

import { format } from "date-fns";
import { PassengerData, Representative } from "../core/types";
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
    });

  // Item adicional: Costo adicional (si existe)
  if (extraCost > 0 && extraCostDescription.trim()) {
      const extraCostWithIgv = isIgvGravado ? extraCost * 1.18 : extraCost;
      // Intentar obtener el nombre del producto/servicio con id 7 y componer la descripción
      let extraProductName = '';
      try {
        const prod = await productsServicesService.getById(7);
        extraProductName = prod?.name || '';
      } catch (e) {
        extraProductName = '';
      }

      const composedExtraDescription = extraProductName
        ? `${extraProductName} - ${extraCostDescription.trim()}`
        : extraCostDescription.trim();

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
      });
    }

    return items;
  },

  createInvoicePayload: (
    clientId: number,
    passengerData: PassengerData,
    series: string,
    branchName: string,
    items: InvoiceItemData[]
  ): InvoiceCreationData => {
    const isRuc = passengerData.docType === "6"; // RUC
    
    return {
      client_id: clientId,
      document_type_code: isRuc ? SunatInvoiceType.FACTURA : SunatInvoiceType.BOLETA,
      series: series,
      issue_date: format(new Date(), "yyyy-MM-dd"),
      issue_time: format(new Date(), "HH:mm:ss"),
      operation_type_code: "0101",
      currency_code: "PEN",
      notes: `Punto de Venta: ${branchName}`,
      items: items,
    };
  },

  calculateQuantity: (
    passengerData: PassengerData,
    representatives: Representative[]
  ): number => {
    const isRuc = passengerData.docType === "6"; // RUC
    return isRuc ? Math.max(1, representatives.length) : 1;
  },
};
