//src/features/fluvial/components/sales-point/SaleForm.tsx
import React, { useState, useMemo, useEffect, useCallback, memo } from "react";
import {
  ArrowLeft,
  Ship,
  Clock,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import {
  ClipboardDocumentListIcon,
  HashtagIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Components & Utils
import { Button } from "../../../../components/common/Button";
import { PassengerDataForm } from "./PassengerDataForm";
import { SeatAndFareSelector } from "./SeatAndFareSelector";
import { PriceSummary } from "./PriceSummary";
import { Spinner } from "../../../../components/common/Spinner";
import { SearchableSelect } from "../../../../components/common/SearchableSelect";
import { ReservationModal } from "./ReservationModal";
import { RepresentativesManager } from "./representatives";
// ACTUALIZADO: Usar nuevo modal de preview de tickets
import { TicketPreviewModal } from "./TicketPreviewModal";
import {
  BackendInvoiceData,
  BackendCompanyInvoiceData,
} from "./tickets/types/backend.types";
import { CompanySaleTransformer } from "./tickets/transformers/companySale.transformer";
import { CompanyTicketTemplate } from "./tickets/templates/companyTicket.template";
// NUEVO: Importar sistema especializado para compañías sin asientos
import { NoSeatsCompanyTicketGenerator } from "./tickets/generators/noSeatsCompanyTicket.generator";
import { isVesselWithoutSeats } from "./tickets/utils/ticketHelpers";

// ← NUEVO: Importar módulos refactorizados
import {
  PassengerData,
  Representative,
  SaleFormProps,
  initialPassengerData,
} from "./core/types";
import {
  calculatePriceDetails,
  validateDiscount,
} from "./utils/priceCalculations";
import { useSaleBusinessLogic } from "./hooks/useSaleBusinessLogic";

// Types & Enums
import { ServiceCategory, SeatMapItem, User } from "../../../../types";
import { SunatDocType, SunatTaxCategory } from "../../types/sunat.types";

// Hooks
import { useFindFare } from "../../hooks/useFindFare";
import { useTripDetails } from "../../hooks/useTripDetails";
import { useVessel } from "../../hooks/useVesselsData";
import { usePassengerService } from "../../hooks/usePassengerService";
import { useDocumentSeriesForBranch } from "../../hooks/useDocumentSeriesForBranch";
import { useCreateInvoice } from "../../hooks/useInvoices";
import { useClientManager } from "../../hooks/useClientManager";
import { useSeatReservations } from "../../hooks/useSeatReservations";
import { useCreateSeatAssignment } from "../../hooks/useSeatAssignments";
import { useUpdateReservation } from "../../hooks/useReservations";
import { useRepresentantes } from "../../hooks/useRepresentantes";
import { seatValidationService } from "../../../../services/seatValidation.service";

// Services
import { authService } from "../../../../services/auth.service";
import api from "../../../../config/api";

export const SaleForm: React.FC<SaleFormProps> = memo(({
  trip,
  branch,
  onBack,
  onSaleSuccess,
  reservationToConfirm,
}) => {
  const queryClient = useQueryClient();

  // Estados para PDF
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [ticketBackendData, setTicketBackendData] = useState<
    BackendInvoiceData | BackendCompanyInvoiceData | null
  >(null);
  const [isCompanyTicket, setIsCompanyTicket] = useState(false); // Guarda el tipo de ticket

  // Función para mostrar modal de preview de ticket
  // Eliminar función de mock, ahora el preview se activa solo con datos reales

  // Estados para representantes
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [showRepresentatives, setShowRepresentatives] = useState(false);
  const [maxPassengers, setMaxPassengers] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
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

  // Estados para series de documentos
  const [selectedBoletaSeries, setSelectedBoletaSeries] = useState("");
  const [selectedFacturaSeries, setSelectedFacturaSeries] = useState("");

  // Estados para descripción opcional
  const [itemDescription, setItemDescription] = useState("");

  // Estados para método de pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("EFE");

  // Opciones para método de pago
  const paymentMethodOptions = [
    { value: 'EFE', label: 'Efectivo' },
    { value: 'TRF', label: 'Transferencia Bancaria' },
    { value: 'YAP', label: 'Yape' },
    { value: 'PLI', label: 'Plin' },
    { value: 'TDB', label: 'Tarjeta de Débito' },
    { value: 'TCR', label: 'Tarjeta de Crédito' },
    { value: 'DEP', label: 'Depósito en Cuenta' },
    { value: 'OTR', label: 'Otros' },
  ];

  // Estados para modales y confirmación
  const [isReservationModalOpen, setReservationModalOpen] = useState(false);
  const [isConfirmingMode, setIsConfirmingMode] = useState(false);

  // Estados para detección de tipo de embarcación
  const [canSellWithoutSeats, setCanSellWithoutSeats] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(true);

  // Hooks de servicios
  const { createCompanyInvoiceWithRepresentatives, isCreating } =
    useRepresentantes();
  const { reserveSeat, releaseSeat, getReservedSeatNumbers, isReserving } =
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

  // Función mejorada de respaldo para detectar embarcaciones sin asientos
  const detectVesselTypeFromName = (vesselName: string): boolean => {
    if (!vesselName) return false;

    // Convertir a minúsculas para comparación insensible a mayúsculas
    const lowerName = vesselName.toLowerCase();

    // Lista expandida de keywords para embarcaciones sin asientos
    const keywordsWithoutSeats = [
      'colectivo', 'combi', 'bus', 'ómnibus', 'lancha colectiva',
      'barco colectivo', 'embarcación colectiva', 'transporte colectivo',
      'pasajeros', 'sin asientos', 'elección libre', 'libre',
      'común', 'compartido', 'compartida', 'compartido',
      'turismo', 'excursión', 'excursion', 'viaje grupal',
      'grupo', 'masivo', 'masiva', 'público', 'pública'
    ];

    // Lista de keywords que indican CON asientos (para evitar falsos positivos)
    const keywordsWithSeats = [
      'asientos', 'numerados', 'numerado', 'asiento', 'butaca',
      'silla', 'vip', 'premium', 'ejecutivo', 'primera clase',
      'business', 'turista plus', 'económico plus'
    ];

    // Primero verificar si tiene keywords de "con asientos" - si los tiene, devolver false
    const hasSeatsKeywords = keywordsWithSeats.some(keyword => lowerName.includes(keyword));
    if (hasSeatsKeywords) {
      return false;
    }

    // Luego verificar si tiene keywords de "sin asientos"
    const hasNoSeatsKeywords = keywordsWithoutSeats.some(keyword => lowerName.includes(keyword));
    if (hasNoSeatsKeywords) {
      return true;
    }

    // Si no hay keywords claros, asumir que tiene asientos (comportamiento conservador)
    return false;
  };

  // Función para detectar embarcaciones problemáticas conocidas (hardcoded fallback)
  const detectKnownVesselWithoutSeats = (vesselId: number, vesselName: string): boolean | null => {
    // Lista de embarcaciones conocidas que NO tienen asientos
    const knownWithoutSeats: Array<{id: number, name: string}> = [
      { id: 10, name: 'embarcacion sin asientos' }, // Embarcación específica problemática
      // Agregar más embarcaciones conocidas aquí según se identifiquen
    ];

    // Lista de embarcaciones conocidas que SÍ tienen asientos
    const knownWithSeats: Array<{id: number, name: string}> = [
      // Agregar embarcaciones que definitivamente tienen asientos
    ];

    // Verificar si está en la lista de sin asientos
    const withoutSeatsMatch = knownWithoutSeats.find(v => v.id === vesselId || v.name.toLowerCase() === vesselName.toLowerCase());
    if (withoutSeatsMatch) {
      return true;
    }

    // Verificar si está en la lista de con asientos
    const withSeatsMatch = knownWithSeats.find(v => v.id === vesselId || v.name.toLowerCase() === vesselName.toLowerCase());
    if (withSeatsMatch) {
      return false;
    }

    return null; // No está en listas conocidas
  };

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
      } catch (error) {
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

  useEffect(() => {
    if (reservationToConfirm && tripDetails) {
      setIsConfirmingMode(true);
      setPassengerData({
        docType: reservationToConfirm.customer_doc_type,
        docNumber: reservationToConfirm.customer_doc_number,
        name: reservationToConfirm.customer_name,
        phone: reservationToConfirm.customer_phone || "",
        email: reservationToConfirm.customer_email || "",
        address: "",
        countryCode: "PE",
        countryName: "Peru",
      });

      setSelectedBoardingStopId(reservationToConfirm.boarding_stop_id);
      setSelectedDisembarkingStopId(reservationToConfirm.disembarking_stop_id);
    }
  }, [reservationToConfirm?.id, tripDetails?.id]); // Ya optimizado

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

    // Limpiar descripción opcional
    setItemDescription("");

    // Limpiar método de pago
    setSelectedPaymentMethod("EFE");
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
    setMaxPassengers(1);
    setShowAddForm(false);
    setSelectedSeatForRepresentative(null);

    // Limpiar estados de modal y confirmación
    setReservationModalOpen(false);
    setIsConfirmingMode(false);

    // Limpiar datos del ticket
    setShowTicketPreview(false);
    setTicketBackendData(null);
    setIsCompanyTicket(false);

    // Limpiar series de documentos (forzar re-selección)
    setSelectedBoletaSeries("");
    setSelectedFacturaSeries("");

    // Limpiar método de pago
    setSelectedPaymentMethod("EFE");

    // NOTA: No resetear canSellWithoutSeats ni showSeatMap aquí
    // Estos valores deben ser determinados por la consulta de la API del seat-map
    // que se ejecuta automáticamente cuando cambia trip.id
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

  // ← NUEVO: Cálculos de precios usando el módulo
  const { basePrice, seatMultiplier } = useMemo(() => {
    const price = foundFare?.price ?? null;
    const enrichedSeat = selectedSeat ? enrichSeatWithType(selectedSeat) : null;
    const multiplier = enrichedSeat?.seat_type?.price_multiplier || 1.0;

    return { basePrice: price, seatMultiplier: multiplier };
  }, [foundFare?.price, selectedSeat?.id, enrichSeatWithType]); // Ya optimizado

  const priceCalculation = useMemo(() => {
    return calculatePriceDetails(
      basePrice,
      seatMultiplier,
      extraCost,
      passengerData,
      representatives,
      isIgvGravado,
      discount
    );
  }, [
    basePrice,
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
      basePrice || 0,
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

  // Funciones para gestionar representantes
  const handleAddRepresentative = async (representative: Representative) => {
    // Primero, reservar el asiento vía WebSocket si hay uno seleccionado
    if (selectedSeatForRepresentative && isWebSocketConnected && selectSeatForRepresentative) {
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

  const handleRemoveRepresentative = (index: number) => {
    const representativeToRemove = representatives[index];

    if (
      representativeToRemove.seat_number &&
      representativeToRemove.seat_number !== "Elección libre"
    ) {
      // Encontrar el seatId correcto basado en el seat_number
      const seatId = findSeatIdBySeatNumber(representativeToRemove.seat_number);

      if (seatId) {
        // Usar las funciones correctas con el seatId y el índice del representante
      if (releaseSeatForRepresentative) {
        releaseSeatForRepresentative(seatId, index);
      }
      // Remover referencia a releaseSeatWebSocket que ya no existe
      }
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

  // Helper function para verificar si los datos son de venta empresarial
  const isCompanyInvoiceData = (
    data: BackendInvoiceData | BackendCompanyInvoiceData
  ): data is BackendCompanyInvoiceData => {
    return "invoice" in data && "representatives" in data && "summary" in data;
  };

  const isRuc = passengerData.docType === SunatDocType.RUC;

  // Hook de WebSocket para notificar selecciones de representantes - Memoizado
  // CORRECCIÓN: Solo usar passengerData.name cuando sea RUC y esté definido
  // const companyNameForWS = useMemo(() => {
  //   return isRuc && passengerData.name?.trim() ? passengerData.name.trim() : undefined;
  // }, [isRuc, passengerData.name]);
  
  // Estabilizar configuración WebSocket para evitar reconexiones innecesarias
  // const stableWebSocketConfig = useMemo(() => {
  //   const config = {
  //     tripId: trip.id,
  //     userId: currentUser?.id || "unknown",
  //     userName: currentUser?.full_name || currentUser?.first_name || "Usuario",
  //     enabled: true,
  //     companyName: companyNameForWS,
  //     isCompanyMode: isRuc,
  //     enableDebugLogs: false,
  //   };
  //   
  //   // Solo recrear si los valores críticos realmente cambiaron
  //   return config;
  // }, [trip.id, currentUser?.id, currentUser?.full_name, currentUser?.first_name, isRuc, companyNameForWS]);

  // Estado para las funciones del WebSocket obtenidas del SeatAndFareSelector
  const [webSocketFunctions, setWebSocketFunctions] = useState<{
    selectSeatForRepresentative: (seatId: number, representativeIndex: number, representativeName: string) => boolean;
    releaseSeatForRepresentative: (seatId: number, representativeIndex?: number) => boolean;
    confirmPurchase: (seatIds?: number[]) => boolean;
    activeSeatSelections: Map<number, any>;
    seatMap: SeatMapItem[];
    isWebSocketConnected: boolean;
  } | null>(null);

  // Callback para recibir las funciones del hook desde SeatAndFareSelector
  const handleWebSocketReady = useCallback((functions: {
    selectSeatForRepresentative: (seatId: number, representativeIndex: number, representativeName: string) => boolean;
    releaseSeatForRepresentative: (seatId: number, representativeIndex?: number) => boolean;
    confirmPurchase: (seatIds?: number[]) => boolean;
    activeSeatSelections: Map<number, any>;
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

  // Función para encontrar el seatId a partir del seat_number - Memoizada
  const findSeatIdBySeatNumber = useCallback((seatNumber: string): number | null => {
    const seat = seatMap.find((seat) => seat.seat_number === seatNumber);
    return seat ? seat.id : null;
  }, [seatMap.length]); // Ya optimizado con longitud

  // ← NUEVO: Handler principal de venta usando el hook de lógica de negocio - Optimizado
  const handleConfirmSale = useCallback(async () => {
    try {
      // Validación: si se agrega un costo adicional, la descripción debe ser obligatoria
      if (
        (extraCost || 0) > 0 &&
        (!extraCostDescription || !extraCostDescription.trim())
      ) {
        toast.error(
          "Ingrese una descripción para el costo adicional antes de confirmar la venta."
        );
        return;
      }
      if (isRuc) {
        await handleCompanyInvoiceWithRepresentatives(
          trip.id,
          selectedBoardingStopId!,
          selectedDisembarkingStopId!,
          passengerData,
          representatives,
          branch.name,
          (invoiceData) => {
            // Callback de éxito: mostrar modal de preview de ticket con datos reales
            setTicketBackendData(invoiceData);
            setIsCompanyTicket(true); // ← NUEVO: Marcar como ticket empresarial
            setShowTicketPreview(true);
          },
          seatMap,
          confirmPurchase,
          basePrice || 0,
          seatMultiplier,
          extraCost,
          extraCostDescription,
          discount,
          isIgvGravado,
          selectedFacturaSeries, // ← NUEVO: pasar la serie seleccionada para facturas
          itemDescription, // ← NUEVO: pasar la descripción opcional
          selectedSeat, // ← NUEVO: pasar asiento seleccionado
          selectedPaymentMethod // ← NUEVO: pasar método de pago
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
        basePrice || 0,
        seatMultiplier,
        extraCost,
        extraCostDescription,
        discount,
        isIgvGravado,
        isConfirmingMode,
        reservationToConfirm,
        (invoiceData) => {
          setTicketBackendData(invoiceData);
          setIsCompanyTicket(false); // ← NUEVO: Marcar como ticket regular
          setShowTicketPreview(true);
        },
        itemDescription, // ← NUEVO: pasar la descripción opcional
        confirmPurchase, // ← NUEVO: pasar confirmPurchase para actualizar WebSocket
        selectedPaymentMethod // ← NUEVO: pasar método de pago
      );
    } catch (error) {
      // Los errores ya son manejados por toast en los hooks internos
    }
  }, [
    extraCost,
    extraCostDescription,
    isRuc,
    handleCompanyInvoiceWithRepresentatives,
    trip.id,
    selectedBoardingStopId,
    selectedDisembarkingStopId,
    passengerData.name, // Ya optimizado
    passengerData.docType,
    representatives.length, // Ya optimizado
    branch.name,
    confirmPurchase,
    basePrice,
    seatMultiplier,
    handleRegularSale,
    selectedSeat?.id, // Ya optimizado
    itemDescription,
    seatMap.length, // Ya optimizado
    showSeatMap,
    selectedFacturaSeries,
    selectedBoletaSeries,
    isIgvGravado,
    discount,
    isConfirmingMode,
    reservationToConfirm?.id, // Ya optimizado
  ]);

  // Optimización: Memoizar areActionsEnabled para evitar recálculos
  const areActionsEnabled = useMemo(() => {
    return !!selectedBoardingStopId &&
      !!selectedDisembarkingStopId &&
      !!passengerData.docNumber.trim() &&
      !!passengerData.name.trim() &&
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
  ]);

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Registrar Venta de Pasaje
            </h1>
            <p className="text-gray-600">
              Desde: <span className="font-semibold">{branch.name}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            // Limpiar completamente el estado antes de volver
            clearStateForVesselChange();
            onBack();
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6 flex items-center gap-4 text-sm">
          <Ship className="h-5 w-5 text-blue-700" />
          <span className="font-semibold">
            {trip.trip_name} ({trip.vessel_name})
          </span>
          <Clock className="h-5 w-5 text-blue-700 ml-auto" />
          <span>
            {format(
              new Date(trip.estimated_departure_time),
              "dd/MM/yyyy hh:mm a"
            )}
          </span>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <PassengerDataForm
                passengerData={passengerData}
                setPassengerData={setPassengerData}
                disabled={isConfirmingMode}
              />
            </div>

            {/* Sección de Representantes para RUC */}
            {showRepresentatives && (
              <>
                <RepresentativesManager
                  representatives={representatives}
                  maxPassengers={maxPassengers}
                  onMaxPassengersChange={setMaxPassengers}
                  onAddRepresentative={handleAddRepresentative}
                  onRemoveRepresentative={handleRemoveRepresentative}
                  showAddForm={showAddForm}
                  onShowAddFormChange={handleShowAddFormChange}
                  isReserving={isReserving}
                  existingDocuments={existingDocuments}
                  tripId={trip.id}
                  usedSeatNumbers={usedSeatNumbers}
                  selectedSeatForRepresentative={selectedSeatForRepresentative}
                  onSeatSelectForRepresentative={
                    setSelectedSeatForRepresentative
                  }
                  onSeatReserve={reserveSeat}
                  onSeatRelease={releaseSeat}
                  getReservedSeatNumbers={getReservedSeatNumbers}
                />
              </>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              {showAddForm && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm font-medium text-blue-800">
                    Modo: Selección de asiento para representante
                  </div>
                  <div className="text-xs text-blue-600">
                    Haga clic en un asiento del mapa para asignarlo al
                    representante
                  </div>
                </div>
              )}
              {showSeatMap ? (
                <SeatAndFareSelector
                  tripId={trip.id}
                  selectedBoardingStopId={selectedBoardingStopId}
                  onBoardingStopChange={setSelectedBoardingStopId}
                  selectedDisembarkingStopId={selectedDisembarkingStopId}
                  onDisembarkingStopChange={setSelectedDisembarkingStopId}
                  selectedSeat={
                    showAddForm ? selectedSeatForRepresentative : selectedSeat
                  }
                  onSeatSelect={
                    showAddForm
                      ? setSelectedSeatForRepresentative
                      : setSelectedSeat
                  }
                  isConfirmingMode={isConfirmingMode}
                  reservationToConfirm={reservationToConfirm}
                  userId={currentUser?.id || "unknown"}
                  userName={
                    currentUser?.full_name || currentUser?.first_name || "Usuario"
                  }
                  occupiedSeatNumbers={getAllOccupiedSeatNumbers()}
                  isCompanyMode={isRuc} // NUEVA: Pasar modo empresa basado en RUC
                  representativeSelectedSeatIds={representativeSelectedSeatIds} // CORRECCIÓN: Usar useMemo
                  onWebSocketReady={handleWebSocketReady}
                />
              ) : (
                // UI alternativa para embarcaciones sin asientos
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                    <Ship className="h-6 w-6 mr-2 text-gray-500" />
                    Tramo y Asiento
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <SearchableSelect
                      label="Origen (Embarque)"
                      value={selectedBoardingStopId}
                      onChange={(value) => setSelectedBoardingStopId(value ? Number(value) : null)}
                      options={tripDetails?.stops?.map(stop => ({
                        value: stop.id,
                        label: stop.port?.name || 'Sin nombre'
                      })) || []}
                      placeholder="Seleccione embarque..."
                      disabled={isConfirmingMode}
                    />
                    <SearchableSelect
                      label="Destino (Desembarque)"
                      value={selectedDisembarkingStopId}
                      onChange={(value) => setSelectedDisembarkingStopId(value ? Number(value) : null)}
                      options={tripDetails?.stops
                        ?.filter(stop => {
                          if (!selectedBoardingStopId) return false;
                          const boardingStop = tripDetails.stops.find(s => s.id === selectedBoardingStopId);
                          const boardingStopOrder = boardingStop?.stop_order ?? -1;
                          return stop.stop_order > boardingStopOrder;
                        })
                        .map(stop => ({
                          value: stop.id,
                          label: stop.port?.name || 'Sin nombre'
                        })) || []}
                      placeholder="Seleccione desembarque..."
                      disabled={!selectedBoardingStopId || isConfirmingMode}
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-700">
                      <Ship className="h-5 w-5" />
                      <span className="font-medium">Embarcación sin asientos numerados</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Esta embarcación utiliza sistema de elección libre de asientos
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 max-h-[calc(100vh-1rem)] overflow-y-auto pr-2 space-y-6 pb-56 scroll-pb-64">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-lg text-gray-800 mb-2 flex items-center">
                  <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-gray-500" />
                  Comprobante
                </h3>
                {isLoadingSeries ? (
                  <Spinner />
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isRuc ? "Serie de Factura" : "Serie de Boleta"}
                      </label>
                      <select
                        value={
                          isRuc ? selectedFacturaSeries : selectedBoletaSeries
                        }
                        onChange={(e) =>
                          isRuc
                            ? handleFacturaSeriesChange(e.target.value)
                            : handleBoletaSeriesChange(e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded-md bg-white"
                        disabled={
                          (isRuc
                            ? availableFacturaSeries.length
                            : availableBoletaSeries.length) <= 1
                        }
                      >
                        {(isRuc
                          ? availableFacturaSeries
                          : availableBoletaSeries
                        ).map((s) => (
                          <option key={s.id} value={s.series_code}>
                            {s.series_code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Siguiente N°
                      </label>
                      <div className="relative">
                        <HashtagIcon className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Autogenerado"
                          disabled
                          className="w-full p-2 pl-7 border-gray-200 bg-gray-100 rounded-md text-sm text-center placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Campo de descripción opcional */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={itemDescription}
                    onChange={(e) => {
                      if (e.target.value.length <= 85) {
                        setItemDescription(e.target.value);
                      }
                    }}
                    placeholder="Ingrese una descripción adicional para el comprobante..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    maxLength={85}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {itemDescription.length}/85 caracteres
                  </div>
                </div>

                {/* Campo de método de pago */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                  >
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <PriceSummary
                basePrice={basePrice}
                seatMultiplier={seatMultiplier}
                extraCost={extraCost}
                onExtraCostChange={setExtraCost}
                extraCostDescription={extraCostDescription}
                onExtraCostDescriptionChange={setExtraCostDescription}
                isIgvGravado={isIgvGravado}
                onIgvGravadoChange={setIsIgvGravado}
                taxCategoryCodeDefault={
                  passengerService?.tax_category_code ?? null
                }
                subtotal={subtotal}
                igvAmount={igvAmount}
                discount={discount}
                onDiscountChange={handleDiscountChange}
                finalTotal={finalTicketPrice}
                isRuc={isRuc}
                representativesCount={representatives.length}
              />

              <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                <h3 className="font-semibold text-center text-gray-700">
                  Acciones
                </h3>

                <Button
                  onClick={handleConfirmSale}
                  className={`w-full text-lg py-3 ${
                    areActionsEnabled
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  isLoading={
                    isProcessingClient ||
                    isCreatingInvoice ||
                    isAssigningSeat ||
                    isUpdatingReservation ||
                    isCreating
                  }
                  disabled={!areActionsEnabled}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {isConfirmingMode
                    ? "Confirmar y Cobrar"
                    : isRuc
                    ? "Crear Factura Empresarial con Representantes"
                    : "Generar y Cobrar"}
                  {!areActionsEnabled && (
                    <span className="ml-2 text-xs opacity-75">
                      (Desactivado)
                    </span>
                  )}
                </Button>
                {!isConfirmingMode && showSeatMap && !isRuc && (
                  <Button
                    onClick={() => setReservationModalOpen(true)}
                    variant="outline"
                    className="w-full text-lg py-3"
                    disabled={!areActionsEnabled}
                  >
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                    Reservar Asiento
                  </Button>
                )}

                {isRuc && (
                  <Button
                    onClick={() => setShowRepresentatives(!showRepresentatives)}
                    variant="outline"
                    className="w-full text-lg py-3 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                    {showRepresentatives ? "Ocultar" : "Gestionar"}{" "}
                    Representantes
                  </Button>
                )}
              </div>

              {!basePrice && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Seleccione un destino para ver el precio.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedSeat && tripDetails && areActionsEnabled && showSeatMap && (
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => setReservationModalOpen(false)}
          reservationData={{
            trip: tripDetails,
            tripStops: tripDetails.stops,
            selectedSeat,
            passengerData,
            boardingStopId: selectedBoardingStopId!,
            disembarkingStopId: selectedDisembarkingStopId!,
            totalPrice: finalTicketPrice,
          }}
          onSuccess={onSaleSuccess}
        />
      )}

      {/* Modal de preview de ticket */}
      {showTicketPreview &&
        ticketBackendData &&
        (isCompanyTicket ? (
          <TicketPreviewModal
            isOpen={showTicketPreview}
            onClose={() => {
              setShowTicketPreview(false);
              setTicketBackendData(null);
              setIsCompanyTicket(false); // ← NUEVO: Limpiar tipo de ticket
            }}
            backendData={
              isCompanyInvoiceData(ticketBackendData)
                ? ticketBackendData.invoice
                : ticketBackendData
            }
            onSuccess={() => {
              setShowTicketPreview(false);
              setTicketBackendData(null);
              setIsCompanyTicket(false); // Limpiar tipo de ticket
              onSaleSuccess();
            }}
            // NUEVO: Props para empresa
            customGeneratePDF={async () => {
              // Verificar que los datos sean de tipo empresarial
              if (!isCompanyInvoiceData(ticketBackendData)) {
                throw new Error(
                  "Los datos no corresponden a una venta empresarial válida"
                );
              }

              // Verificar que los datos sean válidos para venta empresarial
              if (
                !ticketBackendData.invoice ||
                !ticketBackendData.representatives ||
                ticketBackendData.representatives.length === 0
              ) {
                throw new Error(
                  "Los datos no corresponden a una venta empresarial válida"
                );
              }

              // NUEVA LÓGICA: Detectar si es embarcación sin asientos y usar el generador especializado
              const hasVesselWithoutSeats = isVesselWithoutSeats(
                ticketBackendData.invoice.items
              );

              if (hasVesselWithoutSeats) {
                // Usar el nuevo generador especializado para compañías sin asientos
                return await NoSeatsCompanyTicketGenerator.generate(
                  ticketBackendData
                );
              } else {
                // Usar el generador tradicional para compañías con asientos numerados
                const summaryData =
                  CompanySaleTransformer.transformSummary(ticketBackendData);
                return await CompanyTicketTemplate.generatePDF(summaryData);
              }
            }}
            initialPhoneNumber={passengerData.phone}
            onClearForm={clearFormAfterSale}
          />
        ) : (
          <TicketPreviewModal
            isOpen={showTicketPreview}
            onClose={() => {
              setShowTicketPreview(false);
              setTicketBackendData(null);
              setIsCompanyTicket(false); // Limpiar tipo de ticket
            }}
            backendData={
              isCompanyInvoiceData(ticketBackendData)
                ? ticketBackendData.invoice
                : ticketBackendData
            }
            onSuccess={() => {
              setShowTicketPreview(false);
              setTicketBackendData(null);
              setIsCompanyTicket(false); // Limpiar tipo de ticket
              onSaleSuccess();
            }}
            initialPhoneNumber={passengerData.phone}
            onClearForm={clearFormAfterSale}
          />
        ))}
    </>
  );
});

// Añadir displayName para mejor debugging
SaleForm.displayName = 'SaleForm';
