//src/features/fluvial/components/sales-point/SaleForm.tsx
import React, { useState, useMemo, useEffect, useCallback, memo } from "react";
import {
  ArrowLeft,
  Ship,
  Clock,
  AlertTriangle,
  CreditCard,
  Baby,
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
// ACTUALIZADO: Usar nuevo modal de preview de tickets (ahora usa backend)
import { TicketPreviewModal } from "./TicketPreviewModal";
// NUEVO: Modal de confirmación de venta
import { ConfirmSaleModal } from "./ConfirmSaleModal";
// NUEVO: Importar sistema de confirmación de reservas
import { 
  ReservationConfirmationHandler, 
  useReservationConfirmation 
} from "./reservation-confirmation";
import {
  BackendInvoiceData,
  BackendCompanyInvoiceData,
} from "./tickets/types/backend.types";
// NUEVO: Importar sistema centralizado de detección de embarcaciones
import { useVesselDetection } from "./vessel-detection";
// NUEVO: Importar sistema de monedas
import { useCurrencyManager } from './hooks/useCurrencyManager';
import { CurrencySelector } from './components/CurrencySelector';
// NUEVO: Importar componente de pago dividido
import { SplitPaymentForm, SplitPaymentData } from '../../../../components/common/SplitPaymentForm';

// ← NUEVO: Importar módulos refactorizados
import {
  PassengerData,
  Representative,
  SaleFormProps,
  initialPassengerData,
  Infant,
} from "./core/types";
import { InfantManager } from './infants';
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

  // NOTA: Las funciones de detección manual fueron movidas a vessel-detection/
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

  const isRuc = passengerData.docType === SunatDocType.RUC;

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

  // Funcion para encontrar el seatId a partir del seat_number - Memoizada
  const findSeatIdBySeatNumber = useCallback((seatNumber: string): number | null => {
    const seat = seatMap.find((seat) => seat.seat_number === seatNumber);
    return seat ? seat.id : null;
  }, [seatMap.length]); // Ya optimizado con longitud

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
            // Callback de exito: mostrar modal de preview de ticket con datos reales
            setTicketBackendData(invoiceData);
            setShowTicketPreview(true);
            // Desactivar estado de procesamiento cuando se muestra el modal
            setIsProcessingSale(false);
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
          itemDescription,
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
          } : undefined
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
          setTicketBackendData(invoiceData);
          setShowTicketPreview(true);
          // Desactivar estado de procesamiento cuando se muestra el modal
          setIsProcessingSale(false);
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
        } : undefined,
        boletaInfants.length > 0 ? boletaInfants : undefined
      );
    } catch (error) {
      // Desactivar estado de procesamiento en caso de error
      setIsProcessingSale(false);
      // Los errores ya son manejados por toast en los hooks internos
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

  return (
    <>
      {/* NUEVO: Overlay de carga global durante el procesamiento de venta */}
      {isProcessingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center space-y-4">
            <Spinner />
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Procesando Venta...
              </h3>
              <p className="text-gray-600">
                Por favor espere mientras se genera el comprobante
              </p>
              <p className="text-sm text-gray-500 mt-2">
                No cierre esta ventana ni realice otras acciones
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4 lg:mb-6 pb-4 border-b">
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
              Registrar Venta de Pasaje
            </h1>
            <p className="text-sm lg:text-base text-gray-600">
              Desde: <span className="font-semibold">{branch.name}</span>
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            // Limpiar completamente el estado antes de volver
            clearStateForVesselChange();
            onBack();
          }} disabled={isProcessingSale} className="w-full sm:w-auto justify-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-2 flex-1">
              <Ship className="h-5 w-5 text-blue-700 shrink-0" />
              <span className="font-semibold">
                {trip.trip_name} ({trip.vessel_name})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 shrink-0" />
              <span>
                {format(
                  new Date(trip.estimated_departure_time),
                  "dd/MM/yyyy hh:mm a"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* NUEVO: Mostrar información de confirmación de reserva */}
        {reservationToConfirm && isConfirmingMode && (
          <ReservationConfirmationHandler
            reservation={reservationToConfirm}
            tripDetails={tripDetails}
            seatMap={seatMap}
            onPassengerDataChange={setPassengerData}
            onBoardingStopChange={setSelectedBoardingStopId}
            onDisembarkingStopChange={setSelectedDisembarkingStopId}
            onSelectedSeatChange={setSelectedSeat}
            onConfirmingModeChange={setIsConfirmingMode}
          />
        )}

        <div className="grid lg:grid-cols-5 gap-4 lg:gap-8">
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border">
              <PassengerDataForm
                passengerData={passengerData}
                setPassengerData={setPassengerData}
                disabled={isConfirmingMode || isProcessingSale}
              />

              {/* Infantes del pasajero principal — solo boleta */}
              {!isRuc && passengerData.name.trim() && (
                <InfantManager
                  infants={boletaInfants}
                  responsibleName={passengerData.name}
                  onAdd={(infant) =>
                    setBoletaInfants((prev) => [...prev, infant])
                  }
                  onRemove={(idx) =>
                    setBoletaInfants((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                  collapsible
                />
              )}
            </div>

            {/* Sección de Representantes para RUC */}
            {showRepresentatives && (
              <>
                <RepresentativesManager
                  representatives={representatives}
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
                  onUpdateRepresentativeInfants={handleUpdateRepresentativeInfants}
                />
              </>
            )}

            <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border">
              {showAddForm && (
                <div className="mb-4 p-2.5 lg:p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-xs lg:text-sm font-medium text-blue-800">
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
                <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border">
                  <h3 className="font-semibold text-base lg:text-lg text-gray-800 mb-3 lg:mb-4 flex items-center">
                    <Ship className="h-5 w-5 lg:h-6 lg:w-6 mr-2 text-gray-500" />
                    Tramo y Asiento
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3 lg:gap-4 mb-4">
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
            <div className="lg:sticky lg:top-24 max-h-none lg:max-h-[calc(100vh-1rem)] overflow-y-auto lg:pr-2 space-y-4 lg:space-y-6 pb-4 lg:pb-56 lg:scroll-pb-64">
              {/* Mostrar mensaje de espera si no hay destino seleccionado */}
              {!canShowPriceSidebar ? (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                      <Ship className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-700 mb-2">
                        Complete los pasos anteriores
                      </h3>
                      <p className="text-sm text-gray-500">
                        Para ver el resumen de venta y generar el comprobante, primero:
                      </p>
                    </div>
                    <div className="text-left bg-white p-4 rounded-lg border space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          passengerData.docNumber.trim() && passengerData.name.trim()
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {passengerData.docNumber.trim() && passengerData.name.trim() ? '✓' : '1'}
                        </div>
                        <span className={`text-sm ${
                          passengerData.docNumber.trim() && passengerData.name.trim()
                            ? 'text-green-700 font-medium'
                            : 'text-gray-600'
                        }`}>
                          Ingrese los datos del pasajero
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedBoardingStopId
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {selectedBoardingStopId ? '✓' : '2'}
                        </div>
                        <span className={`text-sm ${
                          selectedBoardingStopId
                            ? 'text-green-700 font-medium'
                            : 'text-gray-600'
                        }`}>
                          Seleccione el origen (embarque)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedDisembarkingStopId
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white animate-pulse'
                        }`}>
                          {selectedDisembarkingStopId ? '✓' : '3'}
                        </div>
                        <span className={`text-sm ${
                          selectedDisembarkingStopId
                            ? 'text-green-700 font-medium'
                            : 'text-blue-700 font-medium'
                        }`}>
                          Seleccione el destino (desembarque)
                        </span>
                      </div>
                      {showSeatMap && !isRuc && (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gray-300 text-gray-600">
                            4
                          </div>
                          <span className="text-sm text-gray-600">
                            Seleccione un asiento
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
              /* Contenido normal de la barra lateral cuando hay destino seleccionado */
              <>
              <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-base lg:text-lg text-gray-800 mb-2 flex items-center">
                  <ClipboardDocumentListIcon className="h-5 w-5 lg:h-6 lg:w-6 mr-2 text-gray-500" />
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
                    Descripcion (opcional)
                  </label>
                  <textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Ingrese una descripcion adicional para el comprobante..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                  />
                </div>

                {/* Selector de moneda */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <CurrencySelector
                    selectedCurrency={selectedCurrency}
                    onCurrencyChange={setCurrency}
                    disabled={isProcessingSale}
                  />
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
                // NUEVO: Props para precio manual
                isManualPriceMode={isManualPriceMode}
                manualPrice={manualPrice}
                onManualPriceChange={handleManualPriceChange}
                // NUEVO: Props para precio base editable
                editableBasePrice={editableBasePrice}
                onEditableBasePriceChange={handleEditableBasePriceChange}
                // NUEVO: Props para moneda
                currencySymbol={getCurrencySymbol()}
              />

              {/* Sección de Método de Pago - Después del resumen de precios */}
              <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-base lg:text-lg text-gray-800 mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 lg:h-6 lg:w-6 mr-2 text-gray-500" />
                  Método de Pago
                </h3>
                <SplitPaymentForm
                  totalAmount={finalTicketPrice}
                  currencySymbol={getCurrencySymbol()}
                  disabled={isProcessingSale}
                  onPaymentDataChange={handleSplitPaymentChange}
                  onValidationChange={handleSplitPaymentValidationChange}
                />
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border space-y-2.5 lg:space-y-3">
                <h3 className="font-semibold text-sm lg:text-base text-center text-gray-700">
                  Acciones
                </h3>

                <Button
                  onClick={handleOpenConfirmModal}
                  className={`w-full text-base lg:text-lg py-2.5 lg:py-3 ${
                    areActionsEnabled && !isProcessingSale
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  isLoading={
                    isProcessingClient ||
                    isCreatingInvoice ||
                    isAssigningSeat ||
                    isUpdatingReservation ||
                    isCreating ||
                    isProcessingSale
                  }
                  disabled={!areActionsEnabled || isProcessingSale}
                >
                  <CreditCard className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                  <span className="hidden sm:inline">
                    {isConfirmingMode
                      ? "Confirmar y Cobrar"
                      : isRuc
                      ? "Crear Factura Empresarial con Representantes"
                      : "Generar y Cobrar"}
                  </span>
                  <span className="sm:hidden">
                    {isConfirmingMode
                      ? "Confirmar"
                      : isRuc
                      ? "Factura Empresarial"
                      : "Generar"}
                  </span>
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
                    className="w-full text-base lg:text-lg py-2.5 lg:py-3"
                    disabled={!areActionsEnabled || isProcessingSale}
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    Reservar Asiento
                  </Button>
                )}

                {isRuc && (
                  <Button
                    onClick={() => setShowRepresentatives(!showRepresentatives)}
                    variant="outline"
                    className="w-full text-base lg:text-lg py-2.5 lg:py-3 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    {showRepresentatives ? "Ocultar" : "Gestionar"}{" "}
                    Representantes
                  </Button>
                )}
              </div>

              {!basePrice && !isManualPriceMode && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Seleccione un destino para ver el precio.</span>
                </div>
              )}
              
              {isManualPriceMode && (!manualPrice || manualPrice === 0) && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Ingrese un precio manual para continuar con la venta.</span>
                </div>
              )}
              
              {finalTicketPrice === 0 && (basePrice || manualPrice) && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">El monto total no puede ser S/ 0.00. Ajuste el precio o el descuento.</span>
                </div>
              )}
              
              {/* NUEVO: Advertencia cuando el pago dividido no cuadra */}
              {splitPaymentData.isSplitPayment && !isSplitPaymentValid && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Los montos del pago dividido deben sumar exactamente el total ({getCurrencySymbol()} {finalTicketPrice.toFixed(2)})</span>
                </div>
              )}
              </>
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

      {/* Modal de preview de ticket - Simplificado */}
      {showTicketPreview && ticketBackendData && (
        <TicketPreviewModal
          isOpen={showTicketPreview}
          onClose={() => {
            setShowTicketPreview(false);
            setTicketBackendData(null);
          }}
          backendData={ticketBackendData}
          onSuccess={() => {
            setShowTicketPreview(false);
            setTicketBackendData(null);
            onSaleSuccess();
          }}
          initialPhoneNumber={passengerData.phone}
          onClearForm={clearFormAfterSale}
        />
      )}

      {/* NUEVO: Modal de confirmación de venta */}
      <ConfirmSaleModal
        isOpen={isConfirmSaleModalOpen}
        onClose={() => setIsConfirmSaleModalOpen(false)}
        onConfirm={handleConfirmSale}
        isLoading={isProcessingSale}
        totalAmount={finalTicketPrice}
        currencySymbol={getCurrencySymbol()}
        passengerName={passengerData.name}
        saleType={isRuc ? "company" : "normal"}
        tripName={trip.trip_name}
        representativesCount={representatives.length}
      />
    </>
  );
});

// Añadir displayName para mejor debugging
SaleForm.displayName = 'SaleForm';
