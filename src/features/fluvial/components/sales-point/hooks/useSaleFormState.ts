// src/features/fluvial/components/sales-point/hooks/useSaleFormState.ts

import { useState, useEffect } from "react";
import { SaleFormState, initialPassengerData, Representative } from "../core/types";
import { SunatDocType } from "../../../types/sunat.types";

/** Solo se usa su presencia, para entrar en modo confirmacion de reserva. */
export const useSaleFormState = (reservationToConfirm?: unknown) => {
  const [state, setState] = useState<SaleFormState>({
    selectedBoardingStopId: null,
    selectedDisembarkingStopId: null,
    selectedSeat: null,
    passengerData: initialPassengerData,
    extraCost: 0,
    extraCostDescription: "",
    discount: 0,
    isIgvGravado: false,
    selectedBoletaSeries: "",
    selectedFacturaSeries: "",
    isReservationModalOpen: false,
    isConfirmingMode: !!reservationToConfirm,
    canSellWithoutSeats: false,
    showSeatMap: true,
    representatives: [],
    showRepresentatives: false,
    maxPassengers: 1,
    showAddForm: false,
    selectedSeatForRepresentative: null,
  });

  // Función helper para actualizar estado parcialmente
  const updateState = (updates: Partial<SaleFormState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Funciones específicas para manejar representantes
  const addRepresentative = (representative: Representative) => {
    setState(prev => ({
      ...prev,
      representatives: [...prev.representatives, representative],
      showAddForm: false,
    }));
  };

  const removeRepresentative = (index: number) => {
    setState(prev => ({
      ...prev,
      representatives: prev.representatives.filter((_, i) => i !== index),
    }));
  };

  // Efecto para mostrar representantes cuando es RUC
  useEffect(() => {
    const isRuc = state.passengerData.docType === SunatDocType.RUC;
    const hasBasicInfo = Boolean(
      state.passengerData.docNumber.trim() && 
      state.passengerData.name.trim()
    );
    
    updateState({ showRepresentatives: isRuc && hasBasicInfo });
  }, [state.passengerData.docType, state.passengerData.docNumber, state.passengerData.name]);

  return {
    state,
    updateState,
    addRepresentative,
    removeRepresentative,
  };
};
