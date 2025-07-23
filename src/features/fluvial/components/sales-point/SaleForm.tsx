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
  CalendarIcon,
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
// Types & Enums
import {
  BranchOffice,
  ServiceCategory,
  SeatMapItem,
  SeatReservation,
  TripStop,
  User,
} from "../../../../types";
import { AvailableTripByPort } from "../../../../services/trips.service";
import {
  SunatDocType,
  SunatInvoiceType,
  SunatTaxCategory,
} from "../../types/sunat.types";
import { InvoiceCreateData } from "../../../../services/invoices.service";
// Hooks
import { useFindFare } from "../../hooks/useFindFare";
import { useTripDetails } from "../../hooks/useTripDetails";
import { useVessel } from "../../hooks/useVesselsData";
import { usePassengerService } from "../../hooks/usePassengerService";
import { useDocumentSeriesForBranch } from "../../hooks/useDocumentSeriesForBranch";
import { useCreateInvoice } from "../../hooks/useInvoices";
import { useClientManager } from "../../hooks/useClientManager";
import { useCreateSeatAssignment } from "../../hooks/useSeatAssignments";
import { useUpdateReservation } from "../../hooks/useReservations";
import { seatValidationService } from "../../../../services/seatValidation.service";
// Services
import { authService } from "../../../../services/auth.service";

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
  const [selectedOriginId, setSelectedOriginId] = useState<number | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
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

  useEffect(() => {
    if (branch.port_id) {
      setSelectedOriginId(branch.port_id);
    }
  }, [branch.port_id]);

  const { data: tripDetails } = useTripDetails(trip.id);
  
  // Obtener información de la embarcación para enriquecer los asientos con seat_type
  const vesselId = tripDetails?.vessel?.id;
  const { data: vesselDetails } = useVessel(vesselId || null);

  // 🔧 Función para enriquecer asientos con información de seat_type
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

      // Aseguramos que el origen y destino se establezcan correctamente
      // Buscamos el port_id a partir del stop_id de la reserva
      const boardingPortId = tripDetails.stops.find(
        (s) => s.id === reservationToConfirm.boarding_stop_id
      )?.port_id;
      const disembarkingPortId = tripDetails.stops.find(
        (s) => s.id === reservationToConfirm.disembarking_stop_id
      )?.port_id;
      if (boardingPortId) setSelectedOriginId(boardingPortId);
      if (disembarkingPortId) setSelectedDestinationId(disembarkingPortId);
    }
  }, [reservationToConfirm, tripDetails]);

  const { data: passengerService } = usePassengerService();
  const { data: foundFare } = useFindFare({
    originPortId: selectedOriginId,
    destinationPortId: selectedDestinationId,
    serviceCategory: "PASAJES" as ServiceCategory,
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
    return basePrice * seatMultiplier + extraCost;
  }, [basePrice, seatMultiplier, extraCost]);

  // Calculamos el IGV (18% del subtotal solo si está gravado)
  const igvAmount = useMemo(() => {
    return isIgvGravado ? subtotal * 0.18 : 0;
  }, [subtotal, isIgvGravado]);

  // Función para manejar el cambio de descuento con validación
  const handleDiscountChange = (newDiscount: number) => {
    const maxDiscount = subtotal + igvAmount;
    if (newDiscount > maxDiscount) {
      toast.error(`El descuento no puede ser mayor a S/ ${maxDiscount.toFixed(2)} (monto total sin descuento)`);
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
    if (!selectedSeat) {
      toast.error("Por favor, seleccione un número de asiento.");
      return;
    }
    if (
      !selectedOriginId ||
      !selectedDestinationId ||
      !passengerData.docNumber.trim() ||
      !passengerData.name.trim() ||
      !passengerService
    ) {
      toast.error(
        "Complete todos los campos: Cliente, Origen, Destino y Asiento."
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
      // ===== VALIDACIÓN DE ASIENTO =====
      // Validar disponibilidad del asiento antes de proceder
      const seatValidation = await seatValidationService.validateSeatAvailability({
        tripId: trip.id,
        seatId: selectedSeat.id,
        userId: currentUser?.id || 'unknown'
      });

      if (!seatValidation.isAvailable) {
        // El asiento ya no está disponible
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
        
        // Refrescar el mapa de asientos para mostrar el estado actualizado
        return;
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
      const originPortName =
        tripDetails?.stops.find((s) => s.port_id === selectedOriginId)?.port
          ?.name || "";
      const destinationPortName =
        tripDetails?.stops.find((s) => s.port_id === selectedDestinationId)
          ?.port?.name || "";


      // Preparar los items de la factura
      const invoiceItems = [];
      
      // Precio del servicio base sin costo adicional
      const baseServicePrice = (basePrice || 0) * seatMultiplier;
      const baseServiceWithIgv = isIgvGravado 
        ? baseServicePrice * 1.18 
        : baseServicePrice;

      // Item principal: Servicio de transporte
      invoiceItems.push({
        product_id: passengerService.id,
        quantity: 1,
        unit_price: baseServiceWithIgv,
        discount: discount, // Incluir el descuento en el item principal
        tax_category_code: isIgvGravado
          ? SunatTaxCategory.GRAVADO
          : SunatTaxCategory.EXONERADO,
        item_description: `Servicio de Transporte Fluvial. Tramo: ${originPortName} - ${destinationPortName}. Asiento: ${selectedSeat.seat_number}`,
        unit_code: "NIU",
        trip_id: trip.id,
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
        const boardingStopId = tripDetails?.stops.find(
          (s) => s.port_id === selectedOriginId
        )?.id;
        const disembarkingStopId = tripDetails?.stops.find(
          (s) => s.port_id === selectedDestinationId
        )?.id;

        if (!boardingStopId || !disembarkingStopId) {
          throw new Error(
            "No se pudieron encontrar los IDs de las paradas de embarque/desembarque."
          );
        }

        const assignmentPayload = {
          trip_id: trip.id,
          client_id: client.id,
          seat_type_id: selectedSeat.seat_type?.id || 1, // Default seat type ID si es null
          trip_seat_id: selectedSeat.id,
          boarding_stop_id: boardingStopId,
          disembarking_stop_id: disembarkingStopId,
          passenger_name: passengerData.name,
          passenger_doc_type: passengerData.docType,
          passenger_doc_number: passengerData.docNumber,
          seat_number: selectedSeat.seat_number,
          invoice_item_id: invoiceItemId,
        };
        await createSeatAssignment(assignmentPayload);
      }

      // Toast único y consolidado al final del proceso exitoso
      const documentType = isRuc ? "Factura" : "Boleta";
      const documentNumber = `${createdInvoice.series}-${String(createdInvoice.number).padStart(8, '0')}`;
      const operationType = isConfirmingMode ? "Reserva confirmada" : "Venta registrada";
      
      toast.success(
        `${operationType} exitosamente. ${documentType}: ${documentNumber} | Asiento: ${selectedSeat.seat_number}`
      );

      // Liberar la reserva temporal al completar exitosamente
      // Nota: El backend maneja esto internamente, pero mantenemos por compatibilidad
      await seatValidationService.releaseSeatReservation({
        tripId: trip.id,
        seatId: selectedSeat.id,
        userId: currentUser?.id || 'unknown'
      });

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
  const currentSeriesNumber = useMemo(() => {
    const seriesList = isRuc ? availableFacturaSeries : availableBoletaSeries;
    const selectedSeriesCode = isRuc
      ? selectedFacturaSeries
      : selectedBoletaSeries;
    const seriesData = seriesList.find(
      (s) => s.series_code === selectedSeriesCode
    );
    return seriesData ? seriesData.current_number + 1 : null;
  }, [
    isRuc,
    availableFacturaSeries,
    availableBoletaSeries,
    selectedFacturaSeries,
    selectedBoletaSeries,
  ]);

  const areActionsEnabled =
    !!selectedSeat &&
    !!selectedOriginId &&
    !!selectedDestinationId &&
    !!passengerData.docNumber.trim() &&
    !!passengerData.name.trim();

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
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <SeatAndFareSelector
                tripId={trip.id}
                selectedOriginId={selectedOriginId}
                onOriginChange={setSelectedOriginId}
                selectedDestinationId={selectedDestinationId}
                onDestinationChange={setSelectedDestinationId}
                selectedSeat={selectedSeat}
                onSeatSelect={setSelectedSeat}
                isConfirmingMode={isConfirmingMode}
                reservationToConfirm={reservationToConfirm}
                userId={currentUser?.id || 'unknown'}
                userName={currentUser?.full_name || currentUser?.first_name || 'Usuario'}
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
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
                    isUpdatingReservation
                  }
                  disabled={!areActionsEnabled}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {isConfirmingMode ? "Confirmar y Cobrar" : "Generar y Cobrar"}
                </Button>
                {!isConfirmingMode && (
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
      {selectedSeat && tripDetails && areActionsEnabled && (
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => setReservationModalOpen(false)}
          reservationData={{
            trip: tripDetails,
            tripStops: tripDetails.stops,
            selectedSeat,
            passengerData,
            originId: selectedOriginId!,
            destinationId: selectedDestinationId!,
            totalPrice: finalTicketPrice,
          }}
          onSuccess={onSaleSuccess}
        />
      )}
    </>
  );
};