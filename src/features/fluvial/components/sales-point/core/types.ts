// src/features/fluvial/components/sales-point/core/types.ts

import { BranchOffice, SeatMapItem, SeatReservation } from "../../../../../types";
import { AvailableTripByPort } from "../../../../../services/trips.service";
import { SunatDocType } from "../../../types/sunat.types";

export interface PassengerData {
  docType: string;
  docNumber: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  countryCode?: string;
  countryName?: string;
}

export interface Representative {
  document_type: string;
  document_number: string;
  name: string;
  phone: string;
  email?: string; // ← NUEVO: Campo email para representante
  seat_number?: string;
  special_notes?: string; // ← NUEVO: Campo notas especiales
}

export interface SaleFormProps {
  trip: AvailableTripByPort;
  branch: BranchOffice;
  onBack: () => void;
  onSaleSuccess: () => void;
  reservationToConfirm?: SeatReservation;
}

export interface PriceCalculation {
  basePrice: number | null;
  seatMultiplier: number;
  subtotal: number;
  igvAmount: number;
  finalTicketPrice: number;
}

export interface SaleFormState {
  selectedBoardingStopId: number | null;
  selectedDisembarkingStopId: number | null;
  selectedSeat: SeatMapItem | null;
  passengerData: PassengerData;
  extraCost: number;
  extraCostDescription: string;
  discount: number;
  isIgvGravado: boolean;
  selectedBoletaSeries: string;
  selectedFacturaSeries: string;
  isReservationModalOpen: boolean;
  isConfirmingMode: boolean;
  canSellWithoutSeats: boolean;
  showSeatMap: boolean;
  representatives: Representative[];
  showRepresentatives: boolean;
  maxPassengers: number;
  showAddForm: boolean;
  selectedSeatForRepresentative: any;
}

export const initialPassengerData: PassengerData = {
  docType: SunatDocType.DNI,
  docNumber: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  countryCode: "PE",
  countryName: "Peru",
};
