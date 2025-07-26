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
  
  // Subtotal (precio base sin IGV)
  const subtotal = (basePrice * seatMultiplier + extraCost) * quantity;
  
  // IGV (18% del subtotal solo si está gravado)
  const igvAmount = isIgvGravado ? subtotal * 0.18 : 0;
  
  // Precio final incluye IGV y descuenta el descuento manual
  const finalTicketPrice = Math.max(0, subtotal + igvAmount - discount);

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
  subtotal: number,
  igvAmount: number,
  representatives: Representative[]
): { isValid: boolean; errorMessage?: string } => {
  const maxDiscount = subtotal + igvAmount;
  
  if (discount > maxDiscount) {
    const quantityText = representatives.length > 0 
      ? ` para ${representatives.length} representante${representatives.length !== 1 ? 's' : ''}` 
      : '';
    
    return {
      isValid: false,
      errorMessage: `El descuento no puede ser mayor a S/ ${maxDiscount.toFixed(2)} (monto total sin descuento${quantityText})`
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
