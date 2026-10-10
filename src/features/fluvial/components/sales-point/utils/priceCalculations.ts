// src/features/fluvial/components/sales-point/utils/priceCalculations.ts

import { PassengerData, Representative, PriceCalculation } from "../core/types";
import { SunatDocType } from "../../../types/sunat.types";

export const calculatePriceDetails = (
  basePrice: number | null,
  seatMultiplier: number,
  extraCost: number,
  passengerData: PassengerData,
  representatives: Representative[],
  isIgvGravado: boolean,
  discount: number
): PriceCalculation => {
  if (!basePrice) {
    return {
      basePrice: null,
      seatMultiplier,
      subtotal: 0,
      igvAmount: 0,
      finalTicketPrice: 0,
    };
  }

  const isRuc = passengerData.docType === SunatDocType.RUC;
  const quantity = isRuc ? Math.max(1, representatives.length) : 1;
  
  // LÓGICA DEL BACKEND - PASO 1: Precio Unitario Base (sin IGV)
  const baseSubtotal = isRuc && representatives.length
    ? representatives.reduce((sum, rep) => sum + (rep.unit_price ?? basePrice * seatMultiplier), 0)
    : (basePrice * seatMultiplier) * quantity;
  const totalBeforeDiscount = baseSubtotal + extraCost;
  
  // LÓGICA DEL BACKEND - PASO 2: Aplicar descuentos para obtener el Subtotal Imponible
  const subtotal = Math.max(0, totalBeforeDiscount - discount);
  
  // LÓGICA DEL BACKEND - PASO 3: Calcular Monto del IGV (18% del Subtotal Imponible)
  const igvAmount = isIgvGravado ? subtotal * 0.18 : 0;
  
  // LÓGICA DEL BACKEND - PASO 4: Total a Pagar = Subtotal Imponible + Monto del IGV
  const finalTicketPrice = subtotal + igvAmount;

  return {
    basePrice,
    seatMultiplier,
    subtotal,
    igvAmount,
    finalTicketPrice,
  };
};

export const validateDiscount = (
  discount: number,
  basePrice: number,
  seatMultiplier: number,
  extraCost: number,
  representatives: Representative[]
): { isValid: boolean; errorMessage?: string } => {
  // Calcular el máximo descuento posible (precio total antes de descuentos)
  const isRuc = representatives.length > 0;
  const quantity = isRuc ? Math.max(1, representatives.length) : 1;
  const baseSubtotal = isRuc && representatives.length
    ? representatives.reduce((sum, rep) => sum + (rep.unit_price ?? basePrice * seatMultiplier), 0)
    : (basePrice * seatMultiplier) * quantity;
  const totalBeforeDiscount = baseSubtotal + extraCost;
  
  if (discount > totalBeforeDiscount) {
    const quantityText = representatives.length > 0 
      ? ` para ${representatives.length} representante${representatives.length !== 1 ? 's' : ''}` 
      : '';
    
    return {
      isValid: false,
      errorMessage: `El descuento no puede ser mayor a S/ ${totalBeforeDiscount.toFixed(2)} (monto total sin descuento${quantityText})`
    };
  }
  
  return { isValid: true };
};

export const calculateQuantityByDocumentType = (
  passengerData: PassengerData,
  representatives: Representative[]
): number => {
  const isRuc = passengerData.docType === SunatDocType.RUC;
  return isRuc ? Math.max(1, representatives.length) : 1;
};
