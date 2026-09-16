// src/features/fluvial/components/sales-point/hooks/useSaleForm.ts
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from '@/utils/sileo-toast';
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { SplitPaymentData } from "../../../../../components/common/SplitPaymentForm";
import {
  BackendInvoiceData,
  BackendCompanyInvoiceData,
} from "../tickets/types/backend.types";
import { useVesselDetection } from "../vessel-detection";
import { useCurrencyManager } from "./useCurrencyManager";
import {
  PassengerData,
  Representative,
  SaleFormProps,
  initialPassengerData,
  Infant,
} from "../core/types";
import {
  calculatePriceDetails,
  validateDiscount,
} from "../utils/priceCalculations";
import {
  detectKnownVesselWithoutSeats,
  detectVesselTypeFromName,
} from "../utils/vesselSeatMapFallbacks";
import { useSaleBusinessLogic } from "./useSaleBusinessLogic";
import { invoicesService } from "../../../../../services/invoices.service";

import { ServiceCategory, SeatMapItem, User } from "../../../../../types";
import { SunatDocType, SunatTaxCategory } from "../../../types/sunat.types";

import { useFindFare } from "../../../hooks/useFindFare";
import { useTripDetails } from "../../../hooks/useTripDetails";
import { useVessel } from "../../../hooks/useVesselsData";
import { usePassengerService } from "../../../hooks/usePassengerService";
import { useDocumentSeriesForBranch } from "../../../hooks/useDocumentSeriesForBranch";
import { useCreateInvoice } from "../../../hooks/useInvoices";
import { useClientManager } from "../../../hooks/useClientManager";
import { useSeatReservations } from "../../../hooks/useSeatReservations";
import { useCreateSeatAssignment } from "../../../hooks/useSeatAssignments";
import { useUpdateReservation } from "../../../hooks/useReservations";
import { useRepresentantes } from "../../../hooks/useRepresentantes";
import { seatValidationService } from "../../../../../services/seatValidation.service";
import { authService } from "../../../../../services/auth.service";
import api from "../../../../../config/api";
import { useReservationConfirmation } from "../reservation-confirmation";
import type { SeatSelection } from '../../../types/websocket.types';

export function useSaleForm({
  trip,
  branch,
  reservationToConfirm,
}: SaleFormProps) {
  const queryClient = useQueryClient();

  // Estados para PDF
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [ticketBackendData, setTicketBackendData] = useState<
    BackendInvoiceData | BackendCompanyInvoiceData | null
  >(null);

  // Función para mostrar modal de preview de ticket
  // Eliminar función de mock, ahora el preview se activa solo con datos reales

  // Estados para representantes
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [showRepresentatives, setShowRepresentatives] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  // Infantes del pasajero principal (boleta)
  const [boletaInfants, setBoletaInfants] = useState<Infant[]>([]);
  const [selectedSeatForRepresentative, setSelectedSeatForRepresentative] =
    useState<any>(null);

  // Estados para selección de paradas y asiento
  const [selectedBoardingStopId, setSelectedBoardingStopId] = useState<number | null>(null);
  const [selectedDisembarkingStopId, setSelectedDisembarkingStopId] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatMapItem | null>(null);

  // Estados para datos del pasajero
  const [passengerData, setPassengerData] = useState<PassengerData>(initialPassengerData);

  // Estados para precios y costos
  const [extraCost, setExtraCost] = useState(0);
  const [extraCostDescription, setExtraCostDescription] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isIgvGravado, setIsIgvGravado] = useState(false);
  
  // NUEVO: Estados para precio manual cuando no existe tarifa
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const [isManualPriceMode, setIsManualPriceMode] = useState(false);
  
  // NUEVO: Estado para precio base editable (siempre disponible)
  const [editableBasePrice, setEditableBasePrice] = useState<number | null>(null);

  // Estados para series de documentos
  const [selectedBoletaSeries, setSelectedBoletaSeries] = useState("");
  const [selectedFacturaSeries, setSelectedFacturaSeries] = useState("");

  // Estados para descripcion opcional
  const [itemDescription, setItemDescription] = useState("");
  
  // Estado para pago dividido
  const [splitPaymentData, setSplitPaymentData] = useState<SplitPaymentData>({
    isSplitPayment: false,
    paymentMethod1: 'EFE',
    operationCode1: '',
    amount1: 0,
    paymentMethod2: 'YAP',
    operationCode2: '',
    amount2: 0,
  });
  
  // NUEVO: Estado para validación del pago dividido
  const [isSplitPaymentValid, setIsSplitPaymentValid] = useState(true);

  // Estados para modales y confirmación
  const [isReservationModalOpen, setReservationModalOpen] = useState(false);
  const [isConfirmingMode, setIsConfirmingMode] = useState(false);
  
  // NUEVO: Estado para bloquear la interfaz durante el proceso de venta
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  
  // NUEVO: Estado para el modal de confirmación de venta
  const [isConfirmSaleModalOpen, setIsConfirmSaleModalOpen] = useState(false);

  // NUEVO: Hook para manejo de moneda
  const {
    selectedCurrency,
    isUSD,
    setCurrency,
    getCurrencySymbol,
  } = useCurrencyManager();

  // NUEVO: Usar sistema centralizado de detección de embarcaciones
  const {
    canSellWithoutSeats: detectedCanSellWithoutSeats,
    showSeatMap: detectedShowSeatMap,
    isLoading: isDetectingVessel
  } = useVesselDetection({
    tripId: trip.id,
    vesselName: trip.vessel_name,
    enabled: !!trip.id
  });

  // Estados para detección de tipo de embarcación (actualizados por el hook centralizado)
  const [canSellWithoutSeats, setCanSellWithoutSeats] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(true);

  // Actualizar estados locales cuando cambie la detección
  useEffect(() => {
    if (!isDetectingVessel) {
      setCanSellWithoutSeats(detectedCanSellWithoutSeats);
      setShowSeatMap(detectedShowSeatMap);
    }
  }, [detectedCanSellWithoutSeats, detectedShowSeatMap, isDetectingVessel]);

  // Hooks de servicios
  const { createCompanyInvoiceWithRepresentatives, isCreating } =
    useRepresentantes();
  const { reserveSeat, releaseSeat, getReservedSeatNumbers, isReserving, reservedSeats, releaseAllReservations } =
    useSeatReservations(trip.id);

  // Hook de usuario actual
  const { data: currentUser } = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: async (): Promise<User> => {
      const data = await authService.getProfile();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { data: tripDetails } = useTripDetails(trip.id);

  // Detectar tipo de embarcación con respaldo
  useQuery({
    queryKey: ["seatMap", trip.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/operations/trips/${trip.id}/seat-map`);

        if (response.status === 204) {
          setCanSellWithoutSeats(true);
          setShowSeatMap(false);
          return { hasSeats: false }; // Retornar objeto válido en lugar de null
        } else if (response.status === 200) {
          const data = response.data;
          setCanSellWithoutSeats(false);
          setShowSeatMap(true);
          return data;
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      } catch {
        // RESPALDO: Intentar detectar por nombre de embarcación y listas conocidas
        if (trip.vessel_name) {
          // Primero verificar listas conocidas
          const knownDetection = detectKnownVesselWithoutSeats(trip.id, trip.vessel_name);
          if (knownDetection !== null) {
            setCanSellWithoutSeats(knownDetection);
            setShowSeatMap(!knownDetection);
            return { hasSeats: !knownDetection }; // Retornar objeto válido
          }

          // Si no está en listas conocidas, usar detección por nombre
          const detectedWithoutSeats = detectVesselTypeFromName(trip.vessel_name);
          setCanSellWithoutSeats(detectedWithoutSeats);
          setShowSeatMap(!detectedWithoutSeats);
          return { hasSeats: !detectedWithoutSeats }; // Retornar objeto válido
        } else {
          // Fallback por defecto
          setCanSellWithoutSeats(false);
          setShowSeatMap(true);
          return { hasSeats: true }; // Retornar objeto válido
        }
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: !!trip.id, // Asegurar que se ejecute cuando hay trip.id
  });

  const vesselId = tripDetails?.vessel?.id;
  const { data: vesselDetails } = useVessel(vesselId || null);

  // Efectos para inicializar datos
  useEffect(() => {
    if (branch.port_id && tripDetails?.stops) {
      const initialBoardingStop = tripDetails.stops.find(
        (stop) => stop.port_id === branch.port_id
      );
      if (initialBoardingStop) {
        setSelectedBoardingStopId(initialBoardingStop.id);
      }
    }
  }, [branch.port_id, tripDetails?.id]); // Ya optimizado

  // Función para limpiar el formulario después de una venta exitosa
  const clearFormAfterSale = () => {
    // Limpiar datos del pasajero
    setPassengerData(initialPassengerData);

    // Limpiar selecciones de paradas y asiento
    setSelectedSeat(null);
    // No limpiar selectedBoardingStopId porque se basa en la sucursal del usuario
    setSelectedDisembarkingStopId(null);

    // Limpiar costos adicionales y descuentos
    setExtraCost(0);
    setExtraCostDescription("");
    setDiscount(0);

    // Limpiar descripcion opcional
    setItemDescription("");

    // Limpiar datos de pago dividido
    setSplitPaymentData({
      isSplitPayment: false,
      paymentMethod1: 'EFE',
      operationCode1: '',
      amount1: 0,
      paymentMethod2: 'YAP',
      operationCode2: '',
      amount2: 0,
    });
    
    // NUEVO: Limpiar precio manual y editable
    setManualPrice(null);
    setIsManualPriceMode(false);
    setEditableBasePrice(null);
    // Limpiar infantes del pasajero (boleta)
    setBoletaInfants([]);
  };
  const clearStateForVesselChange = () => {
    // Limpiar datos del pasajero (mantener solo datos básicos)
    setPassengerData(initialPassengerData);

    // Limpiar selecciones de paradas y asiento
    setSelectedSeat(null);
    setSelectedDisembarkingStopId(null);
    // selectedBoardingStopId se mantiene porque depende de la sucursal

    // Limpiar costos adicionales y descuentos
    setExtraCost(0);
    setExtraCostDescription("");
    setDiscount(0);

    // Limpiar descripción opcional
    setItemDescription("");

    // CRÍTICO: Limpiar completamente el sistema de representantes
    setRepresentatives([]);
    setShowRepresentatives(false);
    setShowAddForm(false);
    setSelectedSeatForRepresentative(null);

    // Limpiar estados de modal y confirmacion
    setReservationModalOpen(false);
    setIsConfirmingMode(false);

    // Limpiar datos del ticket
    setShowTicketPreview(false);
    setTicketBackendData(null);

    // Limpiar series de documentos (forzar re-seleccion)
    setSelectedBoletaSeries("");
    setSelectedFacturaSeries("");

    // Limpiar datos de pago dividido
    setSplitPaymentData({
      isSplitPayment: false,
      paymentMethod1: 'EFE',
      operationCode1: '',
      amount1: 0,
      paymentMethod2: 'YAP',
      operationCode2: '',
      amount2: 0,
    });
    
    // NUEVO: Limpiar precio manual y editable
    setManualPrice(null);
    setIsManualPriceMode(false);
    setEditableBasePrice(null);

    // NOTA: No resetear canSellWithoutSeats ni showSeatMap aqui
    // Estos valores deben ser determinados por la consulta de la API del seat-map
    // que se ejecuta automaticamente cuando cambia trip.id
    // Limpiar infantes del pasajero (boleta)
    setBoletaInfants([]);
  };

  // Helper functions
  const getPortIdFromStopId = (stopId: number | null): number | null => {
    if (!stopId || !tripDetails?.stops) return null;
    const stop = tripDetails.stops.find((s) => s.id === stopId);
    return stop?.port_id || null;
  };

  const getBoardingPortId = () => getPortIdFromStopId(selectedBoardingStopId);
  const getDisembarkingPortId = () =>
    getPortIdFromStopId(selectedDisembarkingStopId);

  // Efecto para limpiar estado cuando cambia la embarcación - Optimizado
  useEffect(() => {
    // Limpiar estado cuando cambia el trip.id (nueva embarcación)
    clearStateForVesselChange();

    // Invalidar caché de React Query para forzar nueva consulta del seat-map
    // Esto asegura que se detecte correctamente el tipo de embarcación
    queryClient.invalidateQueries({ queryKey: ["seatMap", trip.id] });
  }, [trip.id]); // Ya optimizado

  // Hooks de datos
  const { data: passengerService } = usePassengerService();

  const serviceCategory = useMemo(() => {
    const category = canSellWithoutSeats
      ? ("OTROS" as ServiceCategory)
      : ("PASAJES" as ServiceCategory);

    return category;
  }, [canSellWithoutSeats, trip.id]); // Ya optimizado // Ya está optimizado

  const { data: foundFare } = useFindFare({
    originPortId: getBoardingPortId(),
    destinationPortId: getDisembarkingPortId(),
    serviceCategory: serviceCategory,
  });

  const {
    availableBoletaSeries,
    availableFacturaSeries,
    isLoading: isLoadingSeries,
  } = useDocumentSeriesForBranch(branch.id);

  const { findOrCreateClient, isProcessingClient } = useClientManager();
  const { mutateAsync: createInvoice, isPending: isCreatingInvoice } =
    useCreateInvoice();
  const { mutateAsync: createSeatAssignment, isPending: isAssigningSeat } =
    useCreateSeatAssignment();
  const { mutateAsync: updateReservation, isPending: isUpdatingReservation } =
    useUpdateReservation();

  // Efectos para configurar IGV y representantes
  useEffect(() => {
    if (passengerService) {
      setIsIgvGravado(
        passengerService.tax_category_code === SunatTaxCategory.GRAVADO
      );
    }
  }, [passengerService?.tax_category_code]); // Ya optimizado

  useEffect(() => {
    const isRuc = passengerData.docType === SunatDocType.RUC;
    const hasBasicInfo = Boolean(
      passengerData.docNumber.trim() && passengerData.name.trim()
    );
    setShowRepresentatives(isRuc && hasBasicInfo);
  }, [passengerData.docType, passengerData.docNumber, passengerData.name]); // Ya optimizado

  // Callback para manejar cambios en el pago dividido
  const handleSplitPaymentChange = useCallback((data: SplitPaymentData) => {
    setSplitPaymentData(data);
  }, []);
  
  // NUEVO: Callback para validación del pago dividido
  const handleSplitPaymentValidationChange = useCallback((isValid: boolean) => {
    setIsSplitPaymentValid(isValid);
  }, []);

  // Efectos para series de documentos
  useEffect(() => {
    const cachedBoleta = localStorage.getItem("lastUsedBoletaSeries");
    const cachedFactura = localStorage.getItem("lastUsedFacturaSeries");

    if (availableBoletaSeries.length > 0) {
      if (
        cachedBoleta &&
        availableBoletaSeries.some((s) => s.series_code === cachedBoleta)
      ) {
        setSelectedBoletaSeries(cachedBoleta);
      } else {
        setSelectedBoletaSeries(availableBoletaSeries[0].series_code);
      }
    }

    if (availableFacturaSeries.length > 0) {
      if (
        cachedFactura &&
        availableFacturaSeries.some((s) => s.series_code === cachedFactura)
      ) {
        setSelectedFacturaSeries(cachedFactura);
      } else {
        setSelectedFacturaSeries(availableFacturaSeries[0].series_code);
      }
    }
  }, [availableBoletaSeries.length, availableFacturaSeries.length]); // Ya optimizado con longitudes

  // Handlers para series
  const handleBoletaSeriesChange = (seriesCode: string) => {
    setSelectedBoletaSeries(seriesCode);
    localStorage.setItem("lastUsedBoletaSeries", seriesCode);
  };

  const handleFacturaSeriesChange = (seriesCode: string) => {
    setSelectedFacturaSeries(seriesCode);
    localStorage.setItem("lastUsedFacturaSeries", seriesCode);
  };

  // ← NUEVO: Hook de lógica de negocio (sin confirmPurchase por ahora)
  const {
    enrichSeatWithType,
    handleCompanyInvoiceWithRepresentatives,
    handleRegularSale,
  } = useSaleBusinessLogic({
    findOrCreateClient,
    createInvoice,
    createSeatAssignment,
    updateReservation,
    createCompanyInvoiceWithRepresentatives,
    seatValidationService,
    currentUser,
    tripDetails,
    passengerService,
    vesselDetails,
    // confirmPurchase se pasará después cuando esté disponible
  });

  // NUEVO: Hook para manejo de confirmación de reservas
  const { processReservationForConfirmation } = useReservationConfirmation();

  // ← NUEVO: Cálculos de precios usando el módulo
  const { basePrice, seatMultiplier } = useMemo(() => {
    const price = foundFare?.price ?? null;
    const enrichedSeat = selectedSeat ? enrichSeatWithType(selectedSeat) : null;
    const multiplier = enrichedSeat?.seat_type?.price_multiplier || 1.0;

    return { basePrice: price, seatMultiplier: multiplier };
  }, [foundFare?.price, selectedSeat?.id, enrichSeatWithType]); // Ya optimizado
  
  // NUEVO: Detectar modo de precio manual - MEJORADO
  useEffect(() => {
    // Para USD: SIEMPRE modo manual
    if (isUSD) {
      setIsManualPriceMode(true);
      return;
    }
    
    // Para PEN: Solo activar modo manual si:
    // 1. Se ha seleccionado origen Y destino
    // 2. No hay precio disponible (null, 0, o undefined)
    const hasBothStopsSelected = !!selectedBoardingStopId && !!selectedDisembarkingStopId;
    const shouldUseManualPrice = hasBothStopsSelected && (!basePrice || basePrice === 0);
    
    // Solo actualizar el modo si cambió
    setIsManualPriceMode(prev => {
      // Si antes NO era manual y ahora SÍ debe serlo, activar modo manual
      if (!prev && shouldUseManualPrice) {
        return true;
      }
      // Si antes era manual y ahora NO debe serlo, desactivar y limpiar precio
      if (prev && !shouldUseManualPrice) {
        setManualPrice(null);
        return false;
      }
      return prev;
    });
  }, [basePrice, selectedBoardingStopId, selectedDisembarkingStopId, isUSD]); // Incluir isUSD en las dependencias
  
  // NUEVO: Sincronizar precio editable con precio de tarifa
  useEffect(() => {
    // Si hay un precio base de la tarifa, sincronizarlo con el precio editable
    if (basePrice !== null && basePrice > 0) {
      setEditableBasePrice(basePrice);
    } else {
      // Si no hay precio base, limpiar el precio editable
      setEditableBasePrice(null);
    }
  }, [basePrice]);
  
  // NUEVO: Obtener el precio efectivo (editable, manual o automático)
  const effectiveBasePrice = useMemo(() => {
    // Prioridad 1: Si hay precio editable modificado por el usuario
    if (editableBasePrice !== null && editableBasePrice !== basePrice) {
      return editableBasePrice;
    }
    // Prioridad 2: Si está en modo manual (USD o sin tarifa)
    if (isManualPriceMode) {
      return manualPrice || 0;
    }
    // Prioridad 3: Precio base de la tarifa o precio editable sincronizado
    return editableBasePrice ?? basePrice ?? 0;
  }, [editableBasePrice, basePrice, isManualPriceMode, manualPrice]);

  const priceCalculation = useMemo(() => {
    return calculatePriceDetails(
      effectiveBasePrice, // CAMBIADO: Usar precio efectivo en lugar de basePrice
      seatMultiplier,
      extraCost,
      passengerData,
      representatives,
      isIgvGravado,
      discount
    );
  }, [
    effectiveBasePrice, // CAMBIADO
    seatMultiplier,
    extraCost,
    passengerData.name, // Ya optimizado
    passengerData.docType,
    representatives.length, // Ya optimizado
    isIgvGravado,
    discount,
  ]);

  const { subtotal, igvAmount, finalTicketPrice } = priceCalculation;

  // Handler para descuento con validación del módulo
  const handleDiscountChange = (newDiscount: number) => {
    const validation = validateDiscount(
      newDiscount,
      effectiveBasePrice, // CAMBIADO: Usar precio efectivo
      seatMultiplier,
      extraCost,
      representatives
    );
    if (!validation.isValid) {
      toast.error(validation.errorMessage);
      return;
    }
    setDiscount(newDiscount);
  };
  
  // NUEVO: Handler para precio manual
  const handleManualPriceChange = (newPrice: number) => {
    if (newPrice < 0) {
      toast.error("El precio no puede ser negativo");
      return;
    }
    if (newPrice > 10000) {
      toast.error("El precio no puede exceder S/ 10,000");
      return;
    }
    setManualPrice(newPrice);
  };
  
  // NUEVO: Handler para precio base editable
  const handleEditableBasePriceChange = (newPrice: number) => {
    if (newPrice < 0) {
      toast.error("El precio no puede ser negativo");
      return;
    }
    if (newPrice > 10000) {
      toast.error("El precio no puede exceder S/ 10,000");
      return;
    }
    setEditableBasePrice(newPrice);
  };

  // Funciones para gestionar representantes
  /** Actualiza la lista de infantes de un representante por índice */
  const handleUpdateRepresentativeInfants = (repIndex: number, infants: Infant[]) => {
    setRepresentatives((prev) =>
      prev.map((rep, i) => (i === repIndex ? { ...rep, infants } : rep))
    );
  };

  // NUEVO: Función para reservar asiento inmediatamente cuando se selecciona en el mapa
  // Esta función usa SOLO WebSocket ya que el endpoint de API REST no existe
  const handleSeatReserveForRepresentative = async (seatNumber: string, representativeIndex: number): Promise<boolean> => {
    try {
      // Buscar el seatId correspondiente al seatNumber
      const seat = seatMap.find(s => s.seat_number === seatNumber);

      if (!seat) {
        toast.error('No se encontró el asiento seleccionado');
        return false;
      }

      // Verificar que el asiento no esté siendo usado por otro vendedor
      const existingSelection = activeSeatSelections?.get(seat.id);
      if (existingSelection) {
        const existingBaseUserId = existingSelection.userId.split('-company-')[0];
        if (existingBaseUserId !== currentUser?.id) {
          toast.error(`El asiento ${seatNumber} está siendo usado por otro vendedor`);
          return false;
        }
      }

      // Reservar vía WebSocket (esto notifica a otros vendedores)
      if (isWebSocketConnected && selectSeatForRepresentative) {
        const success = selectSeatForRepresentative(
          seat.id,
          representativeIndex,
          `Representante ${representativeIndex + 1}` // Placeholder temporal
        );

        if (!success) {
          toast.error('No se pudo reservar el asiento. Intente con otro.');
          return false;
        }

        // Registrar localmente la reserva CON el seatId correcto
        await reserveSeat(seatNumber, representativeIndex, seat.id);

        toast.success(`Asiento ${seatNumber} reservado temporalmente`);
        return true;
      } else {
        // Si no hay WebSocket, solo registrar localmente
        await reserveSeat(seatNumber, representativeIndex, 0);
        toast.success(`Asiento ${seatNumber} seleccionado`);
        return true;
      }
    } catch (error) {
      console.error('Error al reservar asiento para representante:', error);
      toast.error('Error al reservar el asiento');
      return false;
    }
  };

  // NUEVO: Función para liberar asiento de representante (SOLO WebSocket)
  const handleSeatReleaseForRepresentative = async (representativeIndex: number) => {
    // Buscar la reserva local
    const reservation = reservedSeats.find(r => r.representativeIndex === representativeIndex);
    
    if (reservation && reservation.seatId) {
      // Liberar vía WebSocket
      if (isWebSocketConnected && releaseSeatForRepresentative) {
        releaseSeatForRepresentative(reservation.seatId, representativeIndex);
      }
    }

    // Liberar localmente
    await releaseSeat(representativeIndex);
  };

  const handleAddRepresentative = async (representative: Representative) => {
    // Ya no necesitamos reservar aquí porque se hizo inmediatamente en handleSeatReserveForRepresentative
    // Solo actualizamos el nombre en WebSocket si es posible
    if (selectedSeatForRepresentative && isWebSocketConnected && selectSeatForRepresentative) {
      // Reenviar con el nombre correcto del representante para actualizar la visualización
      selectSeatForRepresentative(
        selectedSeatForRepresentative.id,
        representatives.length,
        representative.name
      );
    }

    // Luego, agregar el representante a la lista local
    setRepresentatives((prev) => [...prev, representative]);
    setSelectedSeatForRepresentative(null); // Limpiar la selección temporal
    setShowAddForm(false);
    toast.success("Representante agregado exitosamente");
  };

  const handleRemoveRepresentative = async (index: number) => {
    const representativeToRemove = representatives[index];

    if (
      representativeToRemove.seat_number &&
      representativeToRemove.seat_number !== "Elección libre"
    ) {
      // Usar la nueva función combinada para liberar (API + WebSocket)
      await handleSeatReleaseForRepresentative(index);
    }

    setRepresentatives((prev) => prev.filter((_, i) => i !== index));
    toast.success("Representante eliminado");
  };

  // Handler para manejar el cambio de estado del formulario de agregar representante
  const handleShowAddFormChange = (show: boolean) => {
    setShowAddForm(show);
    if (!show) {
      // Limpiar la selección temporal cuando se cancela la adición
      setSelectedSeatForRepresentative(null);
    }
  };

  const existingDocuments = representatives.map((rep) => rep.document_number);
  const usedSeatNumbers = representatives
    .map((rep) => rep.seat_number)
    .filter(
      (seat): seat is string => seat != null && seat !== "Elección libre"
    );

  // Crear lista completa de asientos ocupados incluyendo reservas WebSocket
  const getAllOccupiedSeatNumbers = () => {
    const reservedNumbers = getReservedSeatNumbers();

    // Obtener asientos reservados temporalmente por otros usuarios vía WebSocket
    const webSocketReservedNumbers: string[] = [];
    activeSeatSelections.forEach((selection, seatId) => {
      // Solo incluir selecciones de otros usuarios
      if (selection.userId !== currentUser?.id) {
        const seat = seatMap.find((s) => s.id === seatId);
        if (seat) {
          webSocketReservedNumbers.push(seat.seat_number);
        }
      }
    });

    return [
      ...usedSeatNumbers,
      ...reservedNumbers,
      ...webSocketReservedNumbers,
    ];
  };

  const isRuc = passengerData.docType === SunatDocType.RUC;

  // Estado para las funciones del WebSocket obtenidas del SeatAndFareSelector
  const [webSocketFunctions, setWebSocketFunctions] = useState<{
    selectSeatForRepresentative: (seatId: number, representativeIndex: number, representativeName: string) => boolean;
    releaseSeatForRepresentative: (seatId: number, representativeIndex?: number) => boolean;
    confirmPurchase: (seatIds?: number[]) => boolean;
    activeSeatSelections: Map<number, SeatSelection>;
    seatMap: SeatMapItem[];
    isWebSocketConnected: boolean;
  } | null>(null);

  // Callback para recibir las funciones del hook desde SeatAndFareSelector
  const handleWebSocketReady = useCallback((functions: {
    selectSeatForRepresentative: (seatId: number, representativeIndex: number, representativeName: string) => boolean;
    releaseSeatForRepresentative: (seatId: number, representativeIndex?: number) => boolean;
    confirmPurchase: (seatIds?: number[]) => boolean;
    activeSeatSelections: Map<number, SeatSelection>;
    seatMap: SeatMapItem[];
    isWebSocketConnected: boolean;
  }) => {
    setWebSocketFunctions(functions);
  }, []);

  // Extraer las funciones para usarlas en el componente
  const selectSeatForRepresentative = webSocketFunctions?.selectSeatForRepresentative;
  const releaseSeatForRepresentative = webSocketFunctions?.releaseSeatForRepresentative;
  const confirmPurchase = webSocketFunctions?.confirmPurchase;
  const activeSeatSelections = webSocketFunctions?.activeSeatSelections || new Map();
  const seatMap = webSocketFunctions?.seatMap || [];
  const isWebSocketConnected = webSocketFunctions?.isWebSocketConnected || false;

  // Refs para detectar cambio de RUC a no-RUC sin dependencias circulares
  const prevDocTypeRef = useRef(passengerData.docType);
  const releaseAllReservationsRef = useRef(releaseAllReservations);
  const wsCleanupRef = useRef({
    isWebSocketConnected,
    releaseSeatForRepresentative,
    seatMap,
    representatives,
  });

  // Sincronizar refs con valores actuales en cada render
  releaseAllReservationsRef.current = releaseAllReservations;
  wsCleanupRef.current = {
    isWebSocketConnected,
    releaseSeatForRepresentative,
    seatMap,
    representatives,
  };

  useEffect(() => {
    const prevDocType = prevDocTypeRef.current;
    const currentDocType = passengerData.docType;
    const wasRuc = prevDocType === SunatDocType.RUC;
    const isCurrentlyRuc = currentDocType === SunatDocType.RUC;

    // Cambio de RUC a no-RUC: limpiar representantes y sus asientos
    if (wasRuc && !isCurrentlyRuc) {
      const ws = wsCleanupRef.current;

      // 1. Liberar reservas locales
      releaseAllReservationsRef.current();

      // 2. Liberar vía WebSocket cualquier asiento asignado a representantes
      //    (respaldo por si hay desincronización entre reservedSeats y representatives)
      if (ws.isWebSocketConnected && ws.releaseSeatForRepresentative) {
        ws.representatives.forEach((rep) => {
          if (rep.seat_number && rep.seat_number !== "Elección libre") {
            const seat = ws.seatMap.find((s) => s.seat_number === rep.seat_number);
            if (seat) {
              ws.releaseSeatForRepresentative!(seat.id);
            }
          }
        });
      }

      // 3. Limpiar estado de representantes
      setRepresentatives([]);
      setSelectedSeatForRepresentative(null);
      setShowAddForm(false);
    }

    // Cambio de no-RUC a RUC: limpiar asiento del pasajero principal e infantes
    if (!wasRuc && isCurrentlyRuc) {
      setSelectedSeat(null);
      setBoletaInfants([]);
    }

    prevDocTypeRef.current = currentDocType;
  }, [passengerData.docType]);

  // NUEVO: useEffect para manejo de confirmación de reservas (ahora después de definir seatMap)
  useEffect(() => {
    if (reservationToConfirm && tripDetails && seatMap.length > 0) {
      // NUEVO: Usar el hook especializado para procesar la confirmación de reserva
      const result = processReservationForConfirmation(reservationToConfirm, seatMap);
      
      if (result) {
        // Establecer datos del pasajero
        setPassengerData(result.passengerData);
        
        // Configurar paradas
        setSelectedBoardingStopId(result.boardingStopId);
        setSelectedDisembarkingStopId(result.disembarkingStopId);
        
        // Configurar asiento si se encontró
        if (result.reservedSeat) {
          setSelectedSeat(result.reservedSeat);
        }
        
        // Activar modo de confirmación
        setIsConfirmingMode(true);
        
        // Mostrar información sobre pago pendiente si corresponde
        if (result.remainingAmount > 0) {
          toast.info(`Pago pendiente: S/ ${result.remainingAmount.toFixed(2)}`);
        }
      }
    }
  }, [reservationToConfirm?.id, tripDetails?.id, seatMap.length, processReservationForConfirmation]);

  // Configurar asiento automáticamente cuando se carga una reservación - Optimizado
  React.useEffect(() => {
    if (
      reservationToConfirm &&
      seatMap &&
      seatMap.length > 0 &&
      !selectedSeat
    ) {
      const reservationSeat = seatMap.find(
        (seat) => seat.id === reservationToConfirm.trip_seat_id
      );
      if (reservationSeat) {
        setSelectedSeat(reservationSeat);
      }
    }
  }, [reservationToConfirm, seatMap.length]); // Remover selectedSeat de dependencias para evitar bucles

  // NUEVA función para obtener IDs de asientos seleccionados por representantes - Optimizada
  const representativeSelectedSeatIds = useMemo((): number[] => {
    if (!representatives.length || !seatMap.length) return [];

    const seatIds = representatives
      .map((rep) => {
        if (!rep.seat_number) return undefined;
        // Buscar el asiento por número en el mapa de asientos
        const seat = seatMap.find((s) => s.seat_number === rep.seat_number);
        return seat?.id;
      })
      .filter((id): id is number => id !== undefined);

    return seatIds;
  }, [representatives.length, seatMap.length]); // Ya optimizado con longitudes

  // NUEVO: Handler para abrir el modal de confirmación
  const handleOpenConfirmModal = useCallback(() => {
    // Validacion critica para precio manual
    if (isManualPriceMode && (!manualPrice || manualPrice <= 0)) {
      toast.error(
        "Debe ingresar un precio manual válido antes de confirmar la venta."
      );
      return;
    }
    
    // Abrir modal de confirmación
    setIsConfirmSaleModalOpen(true);
  }, [
    isManualPriceMode,
    manualPrice,
  ]);

  // Tras crear la venta, obtener el detalle completo (GET por ID) para que el
  // modal post-venta reciba el mismo shape que el detalle (campos de pago incl.).
  // Si la consulta falla, degrada con la respuesta del create (el preview sigue
  // funcionando) sin bloquear la venta ya emitida.
  const openTicketPreviewWithFullData = useCallback(async (createdData: unknown) => {
    const data = createdData as BackendInvoiceData | BackendCompanyInvoiceData;
    const createdId = 'invoice' in data ? data.invoice.id : data.id;
    try {
      const fullInvoice = await invoicesService.getById(createdId);
      setTicketBackendData(fullInvoice as unknown as BackendInvoiceData);
    } catch (error) {
      console.error('[TicketPreview] No se pudo obtener el detalle completo de la venta; usando la respuesta del create.', error);
      setTicketBackendData(data);
    } finally {
      setShowTicketPreview(true);
    }
  }, []);

  // Handler principal de venta usando el hook de logica de negocio
  const handleConfirmSale = useCallback(async () => {
    try {
      // Cerrar modal de confirmación
      setIsConfirmSaleModalOpen(false);
      
      // NUEVO: Activar estado de procesamiento de venta
      setIsProcessingSale(true);
      
      if (isRuc) {
        await handleCompanyInvoiceWithRepresentatives(
          trip.id,
          selectedBoardingStopId!,
          selectedDisembarkingStopId!,
          passengerData,
          representatives,
          branch.name,
          (invoiceData) => {
            // Callback de exito: obtener el detalle completo y abrir el preview
            void openTicketPreviewWithFullData(invoiceData);
          },
          seatMap,
          confirmPurchase,
          effectiveBasePrice,
          seatMultiplier,
          extraCost,
          extraCostDescription,
          discount,
          isIgvGravado,
          selectedFacturaSeries,
          selectedSeat,
          splitPaymentData.paymentMethod1,
          splitPaymentData.operationCode1,
          selectedCurrency,
          // Datos de pago dividido
          splitPaymentData.isSplitPayment ? {
            isSplitPayment: true,
            paymentAmount1: splitPaymentData.amount1,
            paymentMethodCode2: splitPaymentData.paymentMethod2,
            paymentOperationCode2: splitPaymentData.operationCode2,
            paymentAmount2: splitPaymentData.amount2,
            pagoYapeId: splitPaymentData.pagoYapeId,
          } : { isSplitPayment: false, pagoYapeId: splitPaymentData.pagoYapeId }
        );
        return;
      }

      await handleRegularSale(
        trip.id,
        selectedBoardingStopId!,
        selectedDisembarkingStopId!,
        selectedSeat,
        passengerData,
        representatives,
        showSeatMap,
        isRuc ? selectedFacturaSeries : selectedBoletaSeries,
        branch.name,
        effectiveBasePrice,
        seatMultiplier,
        extraCost,
        extraCostDescription,
        discount,
        isIgvGravado,
        isConfirmingMode,
        reservationToConfirm,
        (invoiceData) => {
          void openTicketPreviewWithFullData(invoiceData);
        },
        itemDescription,
        confirmPurchase,
        splitPaymentData.paymentMethod1,
        splitPaymentData.operationCode1,
        selectedCurrency,
        // Datos de pago dividido
        splitPaymentData.isSplitPayment ? {
          isSplitPayment: true,
          paymentAmount1: splitPaymentData.amount1,
          paymentMethodCode2: splitPaymentData.paymentMethod2,
          paymentOperationCode2: splitPaymentData.operationCode2,
          paymentAmount2: splitPaymentData.amount2,
          pagoYapeId: splitPaymentData.pagoYapeId,
        } : { isSplitPayment: false, pagoYapeId: splitPaymentData.pagoYapeId },
        boletaInfants.length > 0 ? boletaInfants : undefined
      );
    } catch {
      // Los errores ya son manejados por toast en los hooks internos
    } finally {
      // Asegura cerrar el overlay incluso si los hooks internos capturan errores sin relanzarlos
      setIsProcessingSale(false);
    }
  }, [
    isRuc,
    handleCompanyInvoiceWithRepresentatives,
    trip.id,
    selectedBoardingStopId,
    selectedDisembarkingStopId,
    passengerData.name,
    passengerData.docType,
    representatives, // ← Dependencia completa: los infantes viven dentro de cada representante
    branch.name,
    confirmPurchase,
    effectiveBasePrice,
    seatMultiplier,
    extraCost,
    extraCostDescription,
    handleRegularSale,
    selectedSeat?.id,
    itemDescription,
    seatMap.length,
    showSeatMap,
    selectedFacturaSeries,
    selectedBoletaSeries,
    isIgvGravado,
    discount,
    isConfirmingMode,
    reservationToConfirm?.id,
    splitPaymentData,
    selectedCurrency,
    boletaInfants,
  ]);

  // NUEVO: Verificar si el destino está seleccionado para mostrar la barra lateral
  const canShowPriceSidebar = useMemo(() => {
    return !!selectedBoardingStopId && !!selectedDisembarkingStopId;
  }, [selectedBoardingStopId, selectedDisembarkingStopId]);

  // Optimización: Memoizar areActionsEnabled para evitar recálculos
  const areActionsEnabled = useMemo(() => {
    const hasValidPrice = isManualPriceMode 
      ? (manualPrice !== null && manualPrice > 0) 
      : true; // Si no es modo manual, siempre es válido (puede ser que no haya destino seleccionado)
    
    // CRÍTICO: Validar que el monto final sea mayor a 0 (previene facturas de S/ 0.00)
    const hasFinalPriceGreaterThanZero = finalTicketPrice > 0;
    
    // NUEVO: Validar que el pago dividido cuadre con el total
    const isSplitPaymentOk = !splitPaymentData.isSplitPayment || isSplitPaymentValid;
    
    return !!selectedBoardingStopId &&
      !!selectedDisembarkingStopId &&
      !!passengerData.docNumber.trim() &&
      !!passengerData.name.trim() &&
      hasValidPrice && // NUEVO: Validar que haya precio manual si se requiere
      hasFinalPriceGreaterThanZero && // CRÍTICO: El monto final debe ser > 0
      isSplitPaymentOk && // NUEVO: El pago dividido debe cuadrar
      (isRuc ? representatives.length > 0 : !showSeatMap || !!selectedSeat);
  }, [
    selectedBoardingStopId,
    selectedDisembarkingStopId,
    passengerData.docNumber,
    passengerData.name,
    isRuc,
    representatives.length,
    showSeatMap,
    selectedSeat?.id, // Ya optimizado
    isManualPriceMode, // NUEVO
    manualPrice, // NUEVO
    finalTicketPrice, // CRÍTICO: Agregar finalTicketPrice como dependencia
    splitPaymentData.isSplitPayment, // NUEVO: Dependencia del pago dividido
    isSplitPaymentValid, // NUEVO: Dependencia de validación del pago dividido
  ]);
  return {
    showTicketPreview,
    setShowTicketPreview,
    ticketBackendData,
    setTicketBackendData,
    representatives,
    setRepresentatives,
    showRepresentatives,
    setShowRepresentatives,
    showAddForm,
    setShowAddForm,
    boletaInfants,
    setBoletaInfants,
    selectedSeatForRepresentative,
    setSelectedSeatForRepresentative,
    selectedBoardingStopId,
    setSelectedBoardingStopId,
    selectedDisembarkingStopId,
    setSelectedDisembarkingStopId,
    selectedSeat,
    setSelectedSeat,
    passengerData,
    setPassengerData,
    extraCost,
    setExtraCost,
    extraCostDescription,
    setExtraCostDescription,
    discount,
    isIgvGravado,
    setIsIgvGravado,
    manualPrice,
    isManualPriceMode,
    editableBasePrice,
    selectedBoletaSeries,
    setSelectedBoletaSeries,
    selectedFacturaSeries,
    setSelectedFacturaSeries,
    itemDescription,
    setItemDescription,
    splitPaymentData,
    isSplitPaymentValid,
    isReservationModalOpen,
    setReservationModalOpen,
    isConfirmingMode,
    setIsConfirmingMode,
    isProcessingSale,
    setIsProcessingSale,
    isConfirmSaleModalOpen,
    setIsConfirmSaleModalOpen,
    selectedCurrency,
    setCurrency,
    getCurrencySymbol,
    showSeatMap,
    isCreating,
    reserveSeat,
    releaseSeat,
    getReservedSeatNumbers,
    isReserving,
    currentUser,
    tripDetails,
    passengerService,
    availableBoletaSeries,
    availableFacturaSeries,
    isLoadingSeries,
    isProcessingClient,
    isCreatingInvoice,
    isAssigningSeat,
    isUpdatingReservation,
    basePrice,
    seatMultiplier,
    subtotal,
    igvAmount,
    finalTicketPrice,
    handleDiscountChange,
    handleManualPriceChange,
    handleEditableBasePriceChange,
    handleUpdateRepresentativeInfants,
    handleAddRepresentative,
    handleRemoveRepresentative,
    handleSeatReserveForRepresentative,
    handleSeatReleaseForRepresentative,
    handleShowAddFormChange,
    existingDocuments,
    usedSeatNumbers,
    getAllOccupiedSeatNumbers,
    isRuc,
    handleWebSocketReady,
    seatMap,
    representativeSelectedSeatIds,
    handleOpenConfirmModal,
    handleConfirmSale,
    canShowPriceSidebar,
    areActionsEnabled,
    clearFormAfterSale,
    clearStateForVesselChange,
    handleSplitPaymentChange,
    handleSplitPaymentValidationChange,
    handleBoletaSeriesChange,
    handleFacturaSeriesChange,
  };
}
