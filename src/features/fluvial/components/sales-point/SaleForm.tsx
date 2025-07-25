//src/features/fluvial/components/sales-point/SaleForm.tsx
import React, { useState, useMemo, useEffect } from "react";
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
import { useQuery } from "@tanstack/react-query";
// Components & Utils
import { Button } from "../../../../components/common/Button";
import { PassengerDataForm } from "./PassengerDataForm";
import { SeatAndFareSelector } from "./SeatAndFareSelector";
import { PriceSummary } from "./PriceSummary";
import { Spinner } from "../../../../components/common/Spinner";
import { ReservationModal } from "./ReservationModal";
import { 
  RepresentativesManager
} from "./representatives";
// Types & Enums
import {
  BranchOffice,
  ServiceCategory,
  SeatMapItem,
  SeatReservation,
  User,
} from "../../../../types";
import { AvailableTripByPort } from "../../../../services/trips.service";
import {
  SunatDocType,
  SunatInvoiceType,
  SunatTaxCategory,
} from "../../types/sunat.types";
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

interface PassengerData {
  docType: string;
  docNumber: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  countryCode?: string; // Código del país (PE, US, etc.)
  countryName?: string; // Nombre del país para mostrar
}

interface SaleFormProps {
  trip: AvailableTripByPort;
  branch: BranchOffice;
  onBack: () => void;
  onSaleSuccess: () => void;
  reservationToConfirm?: SeatReservation;
}

export const SaleForm: React.FC<SaleFormProps> = ({
  trip,
  branch,
  onBack,
  onSaleSuccess,
  reservationToConfirm,
}) => {
  // NUEVO: Usar stop IDs en lugar de port IDs
  const [selectedBoardingStopId, setSelectedBoardingStopId] = useState<number | null>(null);
  const [selectedDisembarkingStopId, setSelectedDisembarkingStopId] = useState<
    number | null
  >(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatMapItem | null>(null);
  const [passengerData, setPassengerData] = useState<PassengerData>({
    docType: SunatDocType.DNI,
    docNumber: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    countryCode: "PE", // Por defecto Perú para DNI/RUC
    countryName: "Peru",
  });
  const [extraCost, setExtraCost] = useState(0);
  const [extraCostDescription, setExtraCostDescription] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isIgvGravado, setIsIgvGravado] = useState(false);
  const [selectedBoletaSeries, setSelectedBoletaSeries] = useState<string>("");
  const [selectedFacturaSeries, setSelectedFacturaSeries] =
    useState<string>("");
  const [isReservationModalOpen, setReservationModalOpen] = useState(false);
  const [isConfirmingMode, setIsConfirmingMode] = useState(
    !!reservationToConfirm
  );
  const [canSellWithoutSeats, setCanSellWithoutSeats] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(true);
  
  // Estados para el sistema de representantes - NUEVO ENFOQUE BACKEND
  const [representatives, setRepresentatives] = useState<Array<{
    document_type: string;
    document_number: string;
    name: string;
    phone: string;
    seat_number?: string;
  }>>([]);
  const [showRepresentatives, setShowRepresentatives] = useState(false);
  const [maxPassengers, setMaxPassengers] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSeatForRepresentative, setSelectedSeatForRepresentative] = useState<any>(null);
  
  // Hook para crear factura empresarial con representantes
  const { createCompanyInvoiceWithRepresentatives, isCreating } = useRepresentantes();

  // NUEVO: Hook para manejar reservas temporales de asientos
  const {
    reserveSeat,
    releaseSeat,
    confirmAllReservations,
    releaseAllReservations,
    getReservedSeatNumbers,
    isReserving
  } = useSeatReservations(trip.id);

  // Funciones para gestionar representantes
  const handleAddRepresentative = (representative: {
    document_type: string;
    document_number: string;
    name: string;
    phone: string;
    seat_number?: string;
  }) => {
    setRepresentatives(prev => [...prev, representative]);
    setShowAddForm(false);
    toast.success('Representante agregado exitosamente');
  };

  const handleRemoveRepresentative = (index: number) => {
    // Liberar asiento reservado antes de eliminar representante
    releaseSeat(index);
    
    setRepresentatives(prev => prev.filter((_, i) => i !== index));
    toast.success('Representante eliminado');
  };

  const existingDocuments = representatives.map(rep => rep.document_number);
  const usedSeatNumbers = representatives
    .map(rep => rep.seat_number)
    .filter((seat): seat is string => seat != null && seat !== "Elección libre");

  // Hook para obtener información del usuario actual
  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const data = await authService.getProfile();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1
  });

  const { data: tripDetails } = useTripDetails(trip.id);
  
  // Establecer el stop de embarque inicial basado en el puerto de la sucursal
  useEffect(() => {
    if (branch.port_id && tripDetails?.stops) {
      const initialBoardingStop = tripDetails.stops.find(
        stop => stop.port_id === branch.port_id
      );
      if (initialBoardingStop) {
        setSelectedBoardingStopId(initialBoardingStop.id);
      }
    }
  }, [branch.port_id, tripDetails?.stops]);
  
  // Detectar tipo de embarcación (con/sin asientos configurados)
  useQuery({
    queryKey: ['seatMap', trip.id],
    queryFn: async () => {
      try {
        const response = await api.get(`/operations/trips/${trip.id}/seat-map`);
        
        if (response.status === 204) {
          // Embarcación sin asientos configurados
          setCanSellWithoutSeats(true);
          setShowSeatMap(false);
          return null;
        } else if (response.status === 200) {
          // Embarcación con asientos configurados
          const data = response.data;
          setCanSellWithoutSeats(false);
          setShowSeatMap(true);
          return data;
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        setCanSellWithoutSeats(false);
        setShowSeatMap(true);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    retry: 1
  });
  
  // Obtener información de la embarcación para enriquecer los asientos con seat_type
  const vesselId = tripDetails?.vessel?.id;
  const { data: vesselDetails } = useVessel(vesselId || null);

  // Función para enriquecer asientos con información de seat_type
  const enrichSeatWithType = (seat: SeatMapItem): SeatMapItem => {
    if (!vesselDetails?.seat_configurations || !seat.vessel_seat_config_id) {
      return seat;
    }

    const seatConfig = vesselDetails.seat_configurations.find(
      config => config.id === seat.vessel_seat_config_id
    );

    if (seatConfig && seatConfig.seat_type) {
      return {
        ...seat,
        seat_type: seatConfig.seat_type
      };
    }

    return seat;
  };

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
        countryCode: "PE", // Valor por defecto, se puede mejorar si tienes este dato en la reserva
        countryName: "Peru",
      });

      // NUEVO: Usar directamente los stop IDs de la reserva
      setSelectedBoardingStopId(reservationToConfirm.boarding_stop_id);
      setSelectedDisembarkingStopId(reservationToConfirm.disembarking_stop_id);
    }
  }, [reservationToConfirm, tripDetails]);

  // NUEVO: Funciones helper para obtener port IDs desde stop IDs
  const getPortIdFromStopId = (stopId: number | null): number | null => {
    if (!stopId || !tripDetails?.stops) return null;
    const stop = tripDetails.stops.find(s => s.id === stopId);
    return stop?.port_id || null;
  };

  const getBoardingPortId = () => getPortIdFromStopId(selectedBoardingStopId);
  const getDisembarkingPortId = () => getPortIdFromStopId(selectedDisembarkingStopId);

  const { data: passengerService } = usePassengerService();
  
  // Determinar categoría de servicio basada en el tipo de embarcación
  const serviceCategory = useMemo(() => {
    return canSellWithoutSeats ? "OTROS" as ServiceCategory : "PASAJES" as ServiceCategory;
  }, [canSellWithoutSeats]);
  
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

  useEffect(() => {
    if (passengerService) {
      setIsIgvGravado(
        passengerService.tax_category_code === SunatTaxCategory.GRAVADO
      );
    }
  }, [passengerService]);
  
  // Mostrar sección de representantes cuando sea RUC y se haya completado la información básica
  useEffect(() => {
    const isRuc = passengerData.docType === SunatDocType.RUC;
    const hasBasicInfo = Boolean(passengerData.docNumber.trim() && passengerData.name.trim());
    setShowRepresentatives(isRuc && hasBasicInfo);
  }, [passengerData.docType, passengerData.docNumber, passengerData.name]);

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
  }, [availableBoletaSeries, availableFacturaSeries]);

  const handleBoletaSeriesChange = (seriesCode: string) => {
    setSelectedBoletaSeries(seriesCode);
    localStorage.setItem("lastUsedBoletaSeries", seriesCode);
  };

  const handleFacturaSeriesChange = (seriesCode: string) => {
    setSelectedFacturaSeries(seriesCode);
    localStorage.setItem("lastUsedFacturaSeries", seriesCode);
  };

  const { basePrice, seatMultiplier } = useMemo(() => {
    const price = foundFare?.price ?? null;
    
    // Enriquecer el asiento antes de obtener el multiplicador
    const enrichedSeat = selectedSeat ? enrichSeatWithType(selectedSeat) : null;
    const multiplier = enrichedSeat?.seat_type?.price_multiplier || 1.0;
    
    return { basePrice: price, seatMultiplier: multiplier };
  }, [foundFare, selectedSeat, vesselDetails]);

  // Calculamos el subtotal (precio base sin IGV)
  const subtotal = useMemo(() => {
    if (!basePrice) return 0;
    const isRuc = passengerData.docType === SunatDocType.RUC;
    const quantity = isRuc ? Math.max(1, representatives.length) : 1;
    return (basePrice * seatMultiplier + extraCost) * quantity;
  }, [basePrice, seatMultiplier, extraCost, passengerData.docType, representatives.length]);

  // Calculamos el IGV (18% del subtotal solo si está gravado)
  const igvAmount = useMemo(() => {
    return isIgvGravado ? subtotal * 0.18 : 0;
  }, [subtotal, isIgvGravado]);

  // Función para manejar el cambio de descuento con validación
  const handleDiscountChange = (newDiscount: number) => {
    const maxDiscount = subtotal + igvAmount;
    if (newDiscount > maxDiscount) {
      const isRuc = passengerData.docType === SunatDocType.RUC;
      const quantityText = isRuc ? ` para ${representatives.length} representante${representatives.length !== 1 ? 's' : ''}` : '';
      toast.error(`El descuento no puede ser mayor a S/ ${maxDiscount.toFixed(2)} (monto total sin descuento${quantityText})`);
      return;
    }
    setDiscount(newDiscount);
  };

  // El precio final incluye el IGV adicional y descuenta el descuento manual
  const finalTicketPrice = useMemo(() => {
    const baseTotal = subtotal + igvAmount;
    return Math.max(0, baseTotal - discount); // No permitir totales negativos
  }, [subtotal, igvAmount, discount]);

  const handleConfirmSale = async () => {
    const isRuc = passengerData.docType === SunatDocType.RUC;
    
    // Para RUC, manejar factura empresarial con representantes
    if (isRuc) {
      await handleCompanyInvoiceWithRepresentatives();
      return;
    }
    
    // Para no-RUC, proceder con venta normal
    await handleRegularSale();
  };

  const handleCompanyInvoiceWithRepresentatives = async () => {
    if (
      !selectedBoardingStopId ||
      !selectedDisembarkingStopId ||
      !passengerData.docNumber.trim() ||
      !passengerData.name.trim() ||
      !passengerService ||
      representatives.length === 0
    ) {
      toast.error(
        "Complete todos los campos: Cliente, Origen, Destino y al menos un representante."
      );
      return;
    }
    
    const series = selectedFacturaSeries;
    if (!series) {
      toast.error("Por favor, seleccione una serie de Factura.");
      return;
    }

    try {
      // Preparar datos para la factura empresarial con representantes
      const companyInvoiceData = {
        // Datos de la empresa
        company_data: {
          client_doc_type: passengerData.docType, // Siempre "6" para RUC
          client_doc_number: passengerData.docNumber,
          client_name: passengerData.name,
          client_address: passengerData.address,
          client_phone: passengerData.phone,
          client_email: passengerData.email,
        },
        
        // Datos del viaje - NUEVO: Usar stop IDs directamente
        trip_id: trip.id,
        boarding_stop_id: selectedBoardingStopId,
        disembarking_stop_id: selectedDisembarkingStopId,
        
        // Lista de representantes
        representatives: representatives.map(rep => ({
          passenger_name: rep.name,
          passenger_doc_type: rep.document_type,
          passenger_doc_number: rep.document_number,
          passenger_phone: rep.phone,
          seat_number: rep.seat_number || "Elección libre",
        })),
        
        // Notas especiales
        special_notes: `Punto de Venta: ${branch.name} - Factura Empresarial`
      };

      // Llamar al nuevo endpoint transaccional
      const result = await createCompanyInvoiceWithRepresentatives(companyInvoiceData);
      
      // NUEVO: Confirmar reservas de asientos tras venta exitosa
      const reservationsConfirmed = await confirmAllReservations();
      if (!reservationsConfirmed) {
        console.warn('No se pudieron confirmar algunas reservas de asientos');
      }
      
      // Mostrar éxito y navegar
      toast.success(
        `Factura empresarial creada con ${(result as any).representatives.length} representantes`,
        { autoClose: 5000 }
      );
      
      onSaleSuccess();

    } catch (error: any) {
      console.error("Error creando factura empresarial:", error);
      
      // NUEVO: Liberar reservas en caso de error
      await releaseAllReservations();
      
      toast.error(
        error.response?.data?.detail ||
          "Ocurrió un error al crear la factura empresarial."
      );
    }
  };

  const handleRegularSale = async () => {
    // Para embarcaciones sin asientos, no validar selección de asiento
    if (showSeatMap && !selectedSeat) {
      toast.error("Por favor, seleccione un número de asiento.");
      return;
    }
    
    if (
      !selectedBoardingStopId ||
      !selectedDisembarkingStopId ||
      !passengerData.docNumber.trim() ||
      !passengerData.name.trim() ||
      !passengerService
    ) {
      toast.error(
        "Complete todos los campos: Cliente, Origen y Destino."
      );
      return;
    }
    
    // Validación del descuento
    const maxDiscount = subtotal + igvAmount;
    if (discount > maxDiscount) {
      toast.error(`El descuento no puede ser mayor a S/ ${maxDiscount.toFixed(2)}`);
      return;
    }
    
    const isRuc = passengerData.docType === SunatDocType.RUC;
    const series = isRuc ? selectedFacturaSeries : selectedBoletaSeries;
    if (!series) {
      toast.error(
        `Por favor, seleccione una serie de ${isRuc ? "Factura" : "Boleta"}.`
      );
      return;
    }

    try {
      // ===== VALIDACIÓN DE ASIENTO (solo para embarcaciones con asientos) =====
      if (showSeatMap && selectedSeat) {
        const seatValidation = await seatValidationService.validateSeatAvailability({
          tripId: trip.id,
          seatId: selectedSeat.id,
          userId: currentUser?.id || 'unknown'
        });

        if (!seatValidation.isAvailable) {
          const errorMessage = seatValidation.reason || 'El asiento seleccionado ya no está disponible';
          
          if (seatValidation.conflictDetails) {
            toast.error(
              `${errorMessage}. Ocupado por: ${seatValidation.conflictDetails.occupiedBy} 
              ${seatValidation.conflictDetails.invoiceNumber ? 
                `(Factura: ${seatValidation.conflictDetails.invoiceNumber})` : ''
              }`
            );
          } else {
            toast.error(errorMessage);
          }
          return;
        }
      }

      // ===== PROCESO DE VENTA =====
      // 1. Crear/encontrar el cliente (esto es común para ambos flujos)
      const clientData = {
        doc_type: passengerData.docType,
        doc_number: passengerData.docNumber,
        name: passengerData.name,
        address_line: passengerData.address,
        phone: passengerData.phone,
        email: passengerData.email,
        country_code: passengerData.countryCode || "PE", // Incluir código de país
        country_name: passengerData.countryName || "Peru", // Incluir nombre de país
      };
      
      const client = await findOrCreateClient(clientData);

      // 2. Crear la factura (también es común)
      // NUEVO: Obtener nombres de puertos desde stop IDs
      const boardingStop = tripDetails?.stops.find(s => s.id === selectedBoardingStopId);
      const disembarkingStop = tripDetails?.stops.find(s => s.id === selectedDisembarkingStopId);
      const originPortName = boardingStop?.port?.name || "";
      const destinationPortName = disembarkingStop?.port?.name || "";


      // Preparar los items de la factura
      const invoiceItems = [];
      
      // Calcular cantidad según tipo de documento
      const isRucSale = passengerData.docType === SunatDocType.RUC;
      const quantity = isRucSale ? Math.max(1, representatives.length) : 1;
      
      // Precio del servicio base sin costo adicional (por unidad)
      const baseServicePrice = (basePrice || 0) * seatMultiplier;
      const baseServiceWithIgv = isIgvGravado 
        ? baseServicePrice * 1.18 
        : baseServicePrice;

      // Item principal: Servicio de transporte
      const seatDescription = selectedSeat ? `Asiento: ${selectedSeat.seat_number}` : "Elección libre de ubicación";
      const quantityDescription = quantity > 1 ? ` (${quantity} pasajeros)` : "";
      
      invoiceItems.push({
        product_id: passengerService.id,
        quantity: quantity,
        unit_price: baseServiceWithIgv,
        discount: discount, // Incluir el descuento en el item principal
        tax_category_code: isIgvGravado
          ? SunatTaxCategory.GRAVADO
          : SunatTaxCategory.EXONERADO,
        item_description: `Servicio de Transporte Fluvial. Tramo: ${originPortName} - ${destinationPortName}. ${seatDescription}${quantityDescription}`,
        unit_code: "NIU",
        trip_id: trip.id,
        // NUEVO: Agregar stop IDs para facturas normales según documentación
        boarding_trip_stop_id: selectedBoardingStopId,
        disembarking_trip_stop_id: selectedDisembarkingStopId,
      });

      // Item adicional: Costo adicional (si existe y tiene descripción)
      if (extraCost > 0 && extraCostDescription.trim()) {
        const extraCostWithIgv = isIgvGravado 
          ? extraCost * 1.18 
          : extraCost;
          
        invoiceItems.push({
          product_id: 7, // ID específico para exceso de equipaje/costos adicionales
          quantity: 1,
          unit_price: extraCostWithIgv,
          discount: 0, // Los costos adicionales no tienen descuento
          tax_category_code: isIgvGravado
            ? SunatTaxCategory.GRAVADO
            : SunatTaxCategory.EXONERADO,
          item_description: extraCostDescription.trim(),
          unit_code: "NIU",
          trip_id: trip.id,
          // NUEVO: Agregar stop IDs también para costos adicionales
          boarding_trip_stop_id: selectedBoardingStopId,
          disembarking_trip_stop_id: selectedDisembarkingStopId,
        });
      }

      const invoicePayload = {
        client_id: client.id,
        document_type_code: isRuc
          ? SunatInvoiceType.FACTURA
          : SunatInvoiceType.BOLETA,
        series: series,
        issue_date: format(new Date(), "yyyy-MM-dd"),
        issue_time: format(new Date(), "HH:mm:ss"),
        operation_type_code: "0101",
        currency_code: "PEN",
        notes: `Punto de Venta: ${branch.name}`,
        items: invoiceItems,
      };
      const createdInvoice = await createInvoice({
        invoiceData: invoicePayload,
        tripId: trip.id,
      });

      // ================== BIFURCACIÓN LÓGICA ==================
      if (isConfirmingMode && reservationToConfirm) {
        // --- ESTAMOS CONFIRMANDO UNA RESERVA EXISTENTE ---

        await updateReservation({
          reservationId: reservationToConfirm.id,
          tripId: reservationToConfirm.trip_id,
          data: {
            status: "CONFIRMED",
            // Usamos el número de factura como referencia de pago
            payment_reference: `${createdInvoice.series}-${createdInvoice.number}`,
          },
        });

        // La API debería manejar la creación de la asignación internamente
        // o la vinculación de la factura a la reserva.
      } else {
        // --- ESTAMOS HACIENDO UNA VENTA DIRECTA NUEVA ---

        if (
          !createdInvoice ||
          !createdInvoice.items ||
          createdInvoice.items.length === 0
        ) {
          throw new Error(
            "La respuesta de la creación de la factura no incluyó los items necesarios."
          );
        }
        const invoiceItemId = createdInvoice.items[0].id;
        // NUEVO: Usar directamente los stop IDs seleccionados
        const boardingStopId = selectedBoardingStopId;
        const disembarkingStopId = selectedDisembarkingStopId;

        if (!boardingStopId || !disembarkingStopId) {
          throw new Error(
            "No se pudieron encontrar los IDs de las paradas de embarque/desembarque."
          );
        }

        const assignmentPayload = {
          trip_id: trip.id,
          client_id: client.id,
          seat_type_id: selectedSeat?.seat_type?.id || 1, // Default seat type ID
          trip_seat_id: selectedSeat?.id || -1, // -1 para embarcaciones sin asientos (indicador especial)
          boarding_stop_id: boardingStopId,
          disembarking_stop_id: disembarkingStopId,
          passenger_name: passengerData.name,
          passenger_doc_type: passengerData.docType,
          passenger_doc_number: passengerData.docNumber,
          seat_number: selectedSeat?.seat_number || "Elección libre", // Para embarcaciones sin asientos
          invoice_item_id: invoiceItemId,
        };
        await createSeatAssignment(assignmentPayload);
      }

      // Toast único y consolidado al final del proceso exitoso
      const documentType = isRuc ? "Factura" : "Boleta";
      const documentNumber = `${createdInvoice.series}-${String(createdInvoice.number).padStart(8, '0')}`;
      const operationType = isConfirmingMode ? "Reserva confirmada" : "Venta registrada";
      const seatInfo = selectedSeat ? `Asiento: ${selectedSeat.seat_number}` : "Elección libre";
      
      toast.success(
        `${operationType} exitosamente. ${documentType}: ${documentNumber} | ${seatInfo}`
      );

      // Liberar la reserva temporal al completar exitosamente (solo si hay asiento seleccionado)
      if (selectedSeat) {
        await seatValidationService.releaseSeatReservation({
          tripId: trip.id,
          seatId: selectedSeat.id,
          userId: currentUser?.id || 'unknown'
        });
      }

      onSaleSuccess();
    } catch (error: any) {
      console.error("Fallo en el proceso de venta:", error);
      
      // Liberar la reserva temporal en caso de error
      // Nota: El backend maneja esto internamente, pero mantenemos por compatibilidad
      if (selectedSeat) {
        await seatValidationService.releaseSeatReservation({
          tripId: trip.id,
          seatId: selectedSeat.id,
          userId: currentUser?.id || 'unknown'
        });
      }
      
      // Manejar errores específicos de asiento ocupado
      if (error.response?.status === 409) {
        toast.error(
          "El asiento seleccionado acaba de ser vendido por otro vendedor. Por favor, seleccione otro asiento."
        );
        return;
      }
      
      // Aquí podrías añadir una lógica para anular la factura si la segunda parte falla.
      if (!error.message.includes("asignar el asiento")) {
        toast.error(
          error.response?.data?.detail ||
            "Ocurrió un error inesperado durante la venta."
        );
      }
    }
  };

  const isRuc = passengerData.docType === SunatDocType.RUC;

  const areActionsEnabled =
    !!selectedBoardingStopId &&
    !!selectedDisembarkingStopId &&
    !!passengerData.docNumber.trim() &&
    !!passengerData.name.trim() &&
    // Para RUC, requiere al menos un representante
    // Para no-RUC, requiere asiento seleccionado (si aplica)
    (isRuc ? representatives.length > 0 : (!showSeatMap || !!selectedSeat));

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
          <Button variant="outline" onClick={onBack}>
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
              <RepresentativesManager
                representatives={representatives}
                maxPassengers={maxPassengers}
                onMaxPassengersChange={setMaxPassengers}
                onAddRepresentative={handleAddRepresentative}
                onRemoveRepresentative={handleRemoveRepresentative}
                showAddForm={showAddForm}
                onShowAddFormChange={setShowAddForm}
                isReserving={isReserving}
                existingDocuments={existingDocuments}
                tripId={trip.id}
                usedSeatNumbers={usedSeatNumbers}
                selectedSeatForRepresentative={selectedSeatForRepresentative}
                onSeatSelectForRepresentative={setSelectedSeatForRepresentative}
                onSeatReserve={reserveSeat}
                onSeatRelease={releaseSeat}
                getReservedSeatNumbers={getReservedSeatNumbers}
              />
            )}            <div className="bg-white p-6 rounded-lg shadow-sm border">
              {showAddForm && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm font-medium text-blue-800">
                    Modo: Selección de asiento para representante
                  </div>
                  <div className="text-xs text-blue-600">
                    Haga clic en un asiento del mapa para asignarlo al representante
                  </div>
                </div>
              )}
              <SeatAndFareSelector
                tripId={trip.id}
                selectedBoardingStopId={selectedBoardingStopId}
                onBoardingStopChange={setSelectedBoardingStopId}
                selectedDisembarkingStopId={selectedDisembarkingStopId}
                onDisembarkingStopChange={setSelectedDisembarkingStopId}
                selectedSeat={showAddForm ? selectedSeatForRepresentative : selectedSeat}
                onSeatSelect={showAddForm ? setSelectedSeatForRepresentative : setSelectedSeat}
                isConfirmingMode={isConfirmingMode}
                reservationToConfirm={reservationToConfirm}
                userId={currentUser?.id || 'unknown'}
                userName={currentUser?.full_name || currentUser?.first_name || 'Usuario'}
                occupiedSeatNumbers={[...usedSeatNumbers, ...getReservedSeatNumbers()]}
              />
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
                taxCategoryCodeDefault={passengerService?.tax_category_code ?? null}
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
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
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
                      : "Generar y Cobrar"
                  }
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
                
                {/* Botón adicional para mostrar/ocultar gestión de representantes en RUC */}
                {isRuc && (
                  <Button
                    onClick={() => setShowRepresentatives(!showRepresentatives)}
                    variant="outline"
                    className="w-full text-lg py-3 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                    {showRepresentatives ? "Ocultar" : "Gestionar"} Representantes
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
    </>
  );
};