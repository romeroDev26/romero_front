// src/features/fluvial/components/sales-point/services/saleValidationService.ts

import { PassengerData, Representative } from "../core/types";
import { SeatMapItem } from "../../../../../types";
import { SunatDocType } from "../../../types/sunat.types";

export interface SaleValidationResult {
  isValid: boolean;
  errors: string[];
}

export const saleValidationService = {
  validateBasicSaleData: (
    selectedBoardingStopId: number | null,
    selectedDisembarkingStopId: number | null,
    passengerData: PassengerData,
    passengerService: any
  ): SaleValidationResult => {
    const errors: string[] = [];

    if (!selectedBoardingStopId || !selectedDisembarkingStopId) {
      errors.push("Seleccione origen y destino");
    }

    if (!passengerData.docNumber.trim()) {
      errors.push("Ingrese número de documento");
    }

    if (!passengerData.name.trim()) {
      errors.push("Ingrese nombre del pasajero");
    }

    if (!passengerService) {
      errors.push("No se pudo cargar la información del servicio");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateSeatSelection: (
    showSeatMap: boolean,
    selectedSeat: SeatMapItem | null
  ): SaleValidationResult => {
    const errors: string[] = [];

    if (showSeatMap && !selectedSeat) {
      errors.push("Seleccione un número de asiento");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateCompanySale: (
    representatives: Representative[]
  ): SaleValidationResult => {
    const errors: string[] = [];

    if (representatives.length === 0) {
      errors.push("Agregue al menos un representante para ventas empresariales");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateDocumentSeries: (
    passengerData: PassengerData,
    selectedBoletaSeries: string,
    selectedFacturaSeries: string
  ): SaleValidationResult => {
    const errors: string[] = [];
    const isRuc = passengerData.docType === SunatDocType.RUC;
    const series = isRuc ? selectedFacturaSeries : selectedBoletaSeries;

    if (!series) {
      errors.push(`Seleccione una serie de ${isRuc ? "Factura" : "Boleta"}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateCompleteSale: (
    selectedBoardingStopId: number | null,
    selectedDisembarkingStopId: number | null,
    passengerData: PassengerData,
    representatives: Representative[],
    selectedSeat: SeatMapItem | null,
    showSeatMap: boolean,
    passengerService: any,
    selectedBoletaSeries: string,
    selectedFacturaSeries: string
  ): SaleValidationResult => {
    const isRuc = passengerData.docType === SunatDocType.RUC;
    
    // Validar datos básicos
    const basicValidation = saleValidationService.validateBasicSaleData(
      selectedBoardingStopId,
      selectedDisembarkingStopId,
      passengerData,
      passengerService
    );

    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // Validar selección de asiento (solo para embarcaciones con asientos)
    const seatValidation = saleValidationService.validateSeatSelection(
      showSeatMap,
      selectedSeat
    );

    if (!seatValidation.isValid) {
      return seatValidation;
    }

    // Validar representantes para RUC
    if (isRuc) {
      const companyValidation = saleValidationService.validateCompanySale(representatives);
      if (!companyValidation.isValid) {
        return companyValidation;
      }
    }

    // Validar series de documentos
    const seriesValidation = saleValidationService.validateDocumentSeries(
      passengerData,
      selectedBoletaSeries,
      selectedFacturaSeries
    );

    return seriesValidation;
  },
};
