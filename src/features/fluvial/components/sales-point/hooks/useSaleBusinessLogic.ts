// src/features/fluvial/components/sales-point/hooks/useSaleBusinessLogic.ts

import { useCallback } from "react";
import { toast, saleNotify } from '@/utils/sileo-toast';
import {
  PassengerData,
  Representative,
  Infant,
  REPRESENTATIVE_ITEM_DESCRIPTION_MAX_CHARS,
} from "../core/types";
import { saleValidationService } from "../services/saleValidationService";
import { invoiceCreationService } from "../services/invoiceCreationService";
import { SeatMapItem } from "../../../../../types";
import { productsServicesService } from "../../../../../services/products-services.service";
import { asApiError, detailToString } from '../../../../../utils/errorHandler';
import type { Invoice, User } from "../../../../../types";
import type {
  CompanyInvoiceResponse,
  CompanyInvoiceWithRepresentatives,
} from "../../../../../services/representantes.service";
import type { useClientManager } from "../../../hooks/useClientManager";
import type { useCreateInvoice } from "../../../hooks/useInvoices";
import type { useCreateSeatAssignment } from "../../../hooks/useSeatAssignments";
import type { useUpdateReservation } from "../../../hooks/useReservations";
import type { useRepresentantes } from "../../../hooks/useRepresentantes";
import type { VesselSeatConfiguration } from "../../../../../types";
import type { usePassengerService } from "../../../hooks/usePassengerService";
import type { seatValidationService } from "../../../../../services/seatValidation.service";

// Las dependencias se inyectan desde useSaleForm. En lugar de redeclarar sus
// tipos a mano (que se desincronizan en silencio), se derivan de los hooks y
// servicios que realmente las producen: si cambia el origen, esto cambia solo.
type ClientManager = ReturnType<typeof useClientManager>;
type InvoiceMutation = ReturnType<typeof useCreateInvoice>;
type SeatAssignmentMutation = ReturnType<typeof useCreateSeatAssignment>;
type ReservationMutation = ReturnType<typeof useUpdateReservation>;
type RepresentantesHook = ReturnType<typeof useRepresentantes>;

export interface UseSaleBusinessLogicProps {
  // Dependencias de hooks externos
  findOrCreateClient: ClientManager['findOrCreateClient'];
  createInvoice: InvoiceMutation['mutateAsync'];
  createSeatAssignment: SeatAssignmentMutation['mutateAsync'];
  updateReservation: ReservationMutation['mutateAsync'];
  createCompanyInvoiceWithRepresentatives: RepresentantesHook['createCompanyInvoiceWithRepresentatives'];
  /**
   * Solo los dos metodos que este hook invoca, no el servicio completo: asi la
   * dependencia es la minima real y los tests pueden mockear solo eso.
   */
  seatValidationService: Pick<
    typeof seatValidationService,
    'validateSeatAvailability' | 'releaseSeatReservation'
  >;
  /** Solo se lee el id; declararlo asi evita exigir un User completo. */
  currentUser: Pick<User, 'id'> | undefined;
  /**
   * No se leen sus campos: entra solo en el array de dependencias de los
   * useCallback, para recrearlos cuando cambia el viaje. Por eso `unknown` en
   * lugar de exigir la forma completa de la respuesta.
   */
  tripDetails: unknown;
  passengerService: ReturnType<typeof usePassengerService>['data'];
  /**
   * De la embarcacion solo se usan las configuraciones de asiento, y de cada
   * una solo su id y su seat_type, para enriquecer el asiento con su tipo.
   */
  vesselDetails:
    | {
        seat_configurations?: Array<
          Pick<VesselSeatConfiguration, 'id' | 'seat_type'>
        >;
      }
    | null
    | undefined;
}

export const useSaleBusinessLogic = ({
  findOrCreateClient,
  createInvoice,
  createSeatAssignment,
  updateReservation,
  createCompanyInvoiceWithRepresentatives,
  seatValidationService: seatValidation,
  currentUser,
  tripDetails,
  passengerService,
  vesselDetails,
}: UseSaleBusinessLogicProps) => {

  const enrichSeatWithType = useCallback((seat: SeatMapItem): SeatMapItem => {
    if (!vesselDetails?.seat_configurations || !seat.vessel_seat_config_id) {
      return seat;
    }

    const seatConfig = vesselDetails.seat_configurations.find(
      (config) => config.id === seat.vessel_seat_config_id
    );

    if (seatConfig && seatConfig.seat_type) {
      return { ...seat, seat_type: seatConfig.seat_type };
    }

    return seat;
  }, [vesselDetails]);

  const handleCompanyInvoiceWithRepresentatives = useCallback(async (
    tripId: number,
    selectedBoardingStopId: number,
    selectedDisembarkingStopId: number,
    passengerData: PassengerData,
    representatives: Representative[],
    branchName: string,
    onSuccess: (invoiceData: CompanyInvoiceResponse) => void,
    /** Solo se buscan asientos por seat_number para leer su id. */
    seatMap?: Array<Pick<SeatMapItem, 'id' | 'seat_number'>>,
    confirmPurchaseCallback?: (seatIds: number[]) => boolean,
    basePrice?: number,
    seatMultiplier?: number,
    extraCost?: number,
    extraCostDescription?: string,
    discount?: number,
    isIgvGravado?: boolean,
    series?: string,
    /** Solo se leen id y seat_number para el item de transporte. */
    selectedSeat?: Pick<SeatMapItem, 'id' | 'seat_number'> | null,
    selectedPaymentMethod?: string,
    paymentOperationCode?: string,
    currencyCode?: 'PEN' | 'USD',
    // Parametros para pago dividido
    splitPaymentData?: {
      isSplitPayment: boolean;
      paymentAmount1?: number;
      paymentMethodCode2?: string;
      paymentOperationCode2?: string;
      paymentAmount2?: number;
      pagoYapeId?: string | null;
    },
  ) => {
    // Validación previa
    const validation = saleValidationService.validateBasicSaleData(
      selectedBoardingStopId,
      selectedDisembarkingStopId,
      passengerData,
      passengerService
    );

    if (!validation.isValid) {
      toast.error(validation.errors.join(", "));
      return;
    }

    if (representatives.length === 0) {
      toast.error("Agregue al menos un representante para ventas empresariales");
      return;
    }

    try {
      // ← ACTUALIZADO: Construir items_config como array según especificación del backend
      // Derivado del payload en lugar de redeclarado: este tipo estaba
      // duplicado a mano y ya se habia desincronizado en trip_seat_id.
      const itemsConfig: NonNullable<
        CompanyInvoiceWithRepresentatives['items_config']
      > = [];
      
      // ITEM 1: Servicio principal de transporte
      if (basePrice !== undefined && basePrice > 0) {
        const baseUnitPrice = basePrice * (seatMultiplier || 1.0);
        // Aplicar IGV al precio unitario si corresponde (misma lógica que invoiceCreationService)
        const baseUnitPriceWithIgv = isIgvGravado ? baseUnitPrice * 1.18 : baseUnitPrice;
        const transportItem = {
          product_id: 1, // ← CLAVE: ID del servicio de transporte
          quantity: representatives.length, // Cantidad de representantes/asientos
          unit_price: parseFloat(baseUnitPriceWithIgv.toFixed(10)),
          discount: discount ? parseFloat(discount.toFixed(10)) : 0,
          tax_category_code: isIgvGravado ? "10" : "20", // 10=Gravado, 20=Exonerado
          item_description: "Servicio de Transporte Fluvial de Pasajeros",
          unit_code: "ZZ", // ZZ = Servicio (CORREGIDO de NIU)
          // Agregar información del asiento si está disponible
          trip_seat_id: selectedSeat?.id || null,
          seat_number: selectedSeat?.seat_number || null,
        };
        itemsConfig.push(transportItem);
      }
      
      // ITEM 2: Costo adicional/equipaje (si existe)
      if (extraCost && extraCost > 0) {
        // Aplicar IGV al costo adicional si corresponde
        const extraCostWithIgv = isIgvGravado ? extraCost * 1.18 : extraCost;
        // Intentar obtener el nombre del producto/servicio desde el catálogo
        let extraProductName = '';
        try {
          const prod = await productsServicesService.getById(7);
          extraProductName = prod?.name || '';
        } catch {
          // Si falla la consulta, usamos la descripción provista o un texto por defecto
          extraProductName = '';
        }

        const descriptionText = extraCostDescription?.trim() || 'Equipaje en exceso';
        const composedExtraDescription = extraProductName
          ? `${extraProductName} - ${descriptionText}`
          : descriptionText;

        const extraItem = {
          product_id: 7, // ← CLAVE: ID del servicio adicional
          quantity: 1, // Siempre 1 para costos adicionales
          unit_price: parseFloat(extraCostWithIgv.toFixed(10)),
          discount: 0,
          tax_category_code: isIgvGravado ? "10" : "20",
          item_description: composedExtraDescription,
          unit_code: "ZZ", // ZZ = Servicio (código SUNAT para servicios)
          // NO se envía trip_seat_id ni seat_number para costos adicionales (bultos)
        };
        itemsConfig.push(extraItem);
      }
      
      // ← NUEVO: Construir invoice_config según especificación del backend
      const invoiceConfig: NonNullable<
        CompanyInvoiceWithRepresentatives['invoice_config']
      > = {};
      
      // Tipo de documento (01=Factura para RUC)
      invoiceConfig.document_type_code = "01";
      
      // Tipo de operación
      invoiceConfig.operation_type_code = "0101";
      
      // Moneda
      invoiceConfig.currency_code = currencyCode || "PEN"; // ← NUEVO: Usar código de moneda dinámico
      invoiceConfig.exchange_rate = null;
      
      // Términos de pago
      invoiceConfig.payment_terms_description = "Contado";
      invoiceConfig.due_date = null;
      
      // Detracción (opcional para transporte)
      invoiceConfig.detraccion_code = null;
      invoiceConfig.detraccion_percentage = null;
      
      // Metodo de pago
      if (selectedPaymentMethod) {
        invoiceConfig.payment_method_code = selectedPaymentMethod;
        invoiceConfig.payment_operation_code = paymentOperationCode || undefined;
      }

      // Datos de pago dividido
      if (splitPaymentData?.isSplitPayment) {
        invoiceConfig.payment_amount_1 = splitPaymentData.paymentAmount1;
        invoiceConfig.payment_method_code_2 = splitPaymentData.paymentMethodCode2;
        invoiceConfig.payment_operation_code_2 = splitPaymentData.paymentOperationCode2 || undefined;
        invoiceConfig.payment_amount_2 = splitPaymentData.paymentAmount2;
      }
      if (splitPaymentData?.pagoYapeId) {
        invoiceConfig.pago_yape_id = splitPaymentData.pagoYapeId;
      }
      
      // Recopilar todos los infantes de todos los representantes
      // JSON segun especificacion exacta del backend
      const companyInvoiceData: CompanyInvoiceWithRepresentatives = {
        company_data: {
          client_doc_type: passengerData.docType,
          client_doc_number: passengerData.docNumber,
          client_name: passengerData.name,
          client_address: passengerData.address || "",
          client_phone: passengerData.phone || "",
          client_email: passengerData.email || "",
        },
        trip_id: tripId,
        boarding_stop_id: selectedBoardingStopId,
        disembarking_stop_id: selectedDisembarkingStopId,
        representatives: representatives.map(rep => {
          // Buscar trip_seat_id basado en seat_number si hay seatMap disponible
          let tripSeatId = null;
          if (seatMap && rep.seat_number && rep.seat_number !== "Elección libre") {
            const seat = seatMap.find(s => s.seat_number === rep.seat_number);
            if (seat) {
              tripSeatId = seat.id;
            }
          }
          
          const repPayload: CompanyInvoiceWithRepresentatives['representatives'][number] = {
            passenger_name: rep.name,
            passenger_doc_type: rep.document_type,
            passenger_doc_number: rep.document_number,
            passenger_phone: rep.phone || "",
            passenger_email: rep.email || "",
            seat_number: rep.seat_number || "Elección libre",
            special_notes: rep.special_notes || "",
            trip_seat_id: tripSeatId,
          };

          const representativeItemDescription = rep.item_description?.trim();
          if (representativeItemDescription) {
            repPayload.item_description = representativeItemDescription.slice(
              0,
              REPRESENTATIVE_ITEM_DESCRIPTION_MAX_CHARS
            );
          }

          // Infantes anidados dentro del representante correspondiente
          if (rep.infants && rep.infants.length > 0) {
            repPayload.infants = rep.infants;
          }

          return repPayload;
        }),
  // ← NUEVO: Incluir la serie si fue proporcionada (requerida para Facturas)
  ...(series ? { series } : {}),
        // ← ACTUALIZADO: Incluir items_config como array
        ...(itemsConfig.length > 0 && { items_config: itemsConfig }),
        // ← NUEVO: Incluir invoice_config
        invoice_config: invoiceConfig,
        special_notes: `Punto de Venta: ${branchName} - Factura Empresarial${extraCost && extraCost > 0 ? ` - Costo adicional: S/. ${extraCost.toFixed(2)}` : ''}`
      };

      const result = await createCompanyInvoiceWithRepresentatives(companyInvoiceData);
      
      if (confirmPurchaseCallback && seatMap && seatMap.length > 0) {
        const seatIds: number[] = [];
        representatives.forEach(rep => {
          if (rep.seat_number && rep.seat_number !== "Elección libre") {
            const seat = seatMap.find(s => s.seat_number === rep.seat_number);
            if (seat) {
              seatIds.push(seat.id);
            }
          }
        });
        if (seatIds.length > 0) {
          confirmPurchaseCallback(seatIds);
        }
      }
      
      toast.success(
        `Factura empresarial creada con ${result.representatives.length} representantes`,
        { autoClose: 5000 }
      );
      
      onSuccess(result);

    } catch (error) {
      const apiError = asApiError(error);
      // Liberar reservas de representantes en caso de error
      if (seatMap && seatMap.length > 0) {
        representatives.forEach(rep => {
          if (rep.seat_number && rep.seat_number !== "Elección libre") {
            const seat = seatMap.find(s => s.seat_number === rep.seat_number);
            if (seat) {
              seatValidation.releaseSeatReservation({
                tripId,
                seatId: seat.id,
                userId: currentUser?.id || 'unknown'
              }).catch(() => { /* silenciar errores de liberación */ });
            }
          }
        });
      }

      const status = apiError.response?.status;
      if (status === 400 || status === 422 || status === 409) {
        const detail = detailToString(apiError.response?.data?.detail);
        saleNotify.error(
          'No se puede completar la venta',
          detail || 'El asiento seleccionado se encuentra reservado por otro usuario o no está disponible.'
        );
        return;
      }

      saleNotify.error(
        'Error en la venta',
        detailToString(apiError.response?.data?.detail) ||
          'Ocurrió un error inesperado. Intente de nuevo.'
      );
    }
  }, [createCompanyInvoiceWithRepresentatives, passengerService, saleValidationService]);

  const handleRegularSale = useCallback(async (
    // Parámetros de la venta
    tripId: number,
    selectedBoardingStopId: number,
    selectedDisembarkingStopId: number,
    selectedSeat: SeatMapItem | null,
    passengerData: PassengerData,
    representatives: Representative[],
    showSeatMap: boolean,
    series: string,
    branchName: string,
    basePrice: number,
    seatMultiplier: number,
    extraCost: number,
    extraCostDescription: string,
    discount: number,
    isIgvGravado: boolean,
    isConfirmingMode: boolean,
    /** Solo se leen id y trip_id para marcar la reserva como confirmada. */
    reservationToConfirm: { id: number; trip_id: number } | null | undefined,
    onSuccess: (invoiceData: Invoice) => void,
    itemDescription?: string,
    confirmPurchaseCallback?: (seatIds: number[]) => boolean,
    selectedPaymentMethod?: string,
    paymentOperationCode?: string,
    currencyCode?: 'PEN' | 'USD',
    // Parametros para pago dividido
    splitPaymentData?: {
      isSplitPayment: boolean;
      paymentAmount1?: number;
      paymentMethodCode2?: string;
      paymentOperationCode2?: string;
      paymentAmount2?: number;
      pagoYapeId?: string | null;
    },
    infants?: Infant[],
  ) => {
    // Validación completa
    const validation = saleValidationService.validateCompleteSale(
      selectedBoardingStopId,
      selectedDisembarkingStopId,
      passengerData,
      representatives,
      selectedSeat,
      showSeatMap,
      passengerService,
      series,
      series // Usar el mismo para ambos tipos por simplicidad
    );

    if (!validation.isValid) {
      toast.error(validation.errors.join(", "));
      return;
    }

    try {
      // Validación de asiento si es necesario
      if (showSeatMap && selectedSeat) {
        const seatValidationResult = await seatValidation.validateSeatAvailability({
          tripId,
          seatId: selectedSeat.id,
          userId: currentUser?.id || 'unknown'
        });

        if (!seatValidationResult.isAvailable) {
          const errorMessage = seatValidationResult.reason || 'El asiento seleccionado ya no está disponible';
          toast.error(errorMessage);
          return;
        }
      }

      // Crear/encontrar cliente
      const clientData = {
        doc_type: passengerData.docType,
        doc_number: passengerData.docNumber,
        name: passengerData.name,
        address_line: passengerData.address,
        phone: passengerData.phone,
        email: passengerData.email,
        country_code: passengerData.countryCode || "PE",
        country_name: passengerData.countryName || "Peru",
      };
      
      const client = await findOrCreateClient(clientData);

      // Crear factura - la detección de embarcaciones sin asientos se hace por trip_seat_id null
      const invoiceItems = await invoiceCreationService.createInvoiceItems(
        passengerData,
        representatives,
        basePrice,
        seatMultiplier,
        extraCost,
        extraCostDescription,
        discount,
        isIgvGravado,
        tripId,
        selectedBoardingStopId,
        selectedDisembarkingStopId,
        selectedSeat, // ← Asiento seleccionado para obtener seat_number y trip_seat_id
        itemDescription // ← Descripción opcional del usuario
      );

      const invoicePayload = invoiceCreationService.createInvoicePayload(
        client.id,
        passengerData,
        series,
        branchName,
        invoiceItems,
        selectedPaymentMethod,
        paymentOperationCode,
        currencyCode,
        splitPaymentData, // Datos de pago dividido
        infants // Infantes acompañantes
      );

      const createdInvoice = await createInvoice({
        invoiceData: invoicePayload,
        tripId: tripId,
      });

      // Manejar confirmación de reserva o venta directa
      if (isConfirmingMode && reservationToConfirm) {
        await updateReservation({
          reservationId: reservationToConfirm.id,
          tripId: reservationToConfirm.trip_id,
          data: {
            status: "CONFIRMED",
            payment_reference: `${createdInvoice.series}-${createdInvoice.number}`,
          },
        });
      } else {
        // Crear asignación de asiento para venta directa
        if (createdInvoice?.items?.[0]?.id) {
          const assignmentPayload = {
            trip_id: tripId,
            client_id: client.id,
            seat_type_id: selectedSeat?.seat_type?.id || 1,
            trip_seat_id: selectedSeat?.id || -1,
            boarding_stop_id: selectedBoardingStopId,
            disembarking_stop_id: selectedDisembarkingStopId,
            passenger_name: passengerData.name,
            passenger_doc_type: passengerData.docType,
            passenger_doc_number: passengerData.docNumber,
            seat_number: selectedSeat?.seat_number || "Eleccion libre",
            invoice_item_id: createdInvoice.items[0].id,
          };
          await createSeatAssignment(assignmentPayload);
        }
      }

      // Confirmar compra via WebSocket para actualizar el mapa de asientos
      if (confirmPurchaseCallback && selectedSeat) {
        confirmPurchaseCallback([selectedSeat.id]);
      }

      // Toast de exito
      const isRuc = passengerData.docType === "6";
      const documentType = isRuc ? "Factura" : "Boleta";
      const documentNumber = `${createdInvoice.series}-${String(createdInvoice.number).padStart(8, '0')}`;
      const operationType = isConfirmingMode ? "Reserva confirmada" : "Venta registrada";
      const seatInfo = selectedSeat ? `Asiento: ${selectedSeat.seat_number}` : "Eleccion libre";
      
      saleNotify.success(
        operationType,
        `${documentType} ${documentNumber} · ${seatInfo}`
      );

      // NOTA: No liberar reserva temporal cuando la venta es exitosa
      // El asiento ya fue vendido, no debe liberarse
      // releaseSeatReservation solo debe llamarse en caso de error/cancelacion

      onSuccess(createdInvoice);

    } catch (error) {
      const apiError = asApiError(error);
      // Liberar reserva en caso de error
      if (selectedSeat) {
        await seatValidation.releaseSeatReservation({
          tripId,
          seatId: selectedSeat.id,
          userId: currentUser?.id || 'unknown'
        });
      }
      
      const status = apiError.response?.status;
      if (status === 400 || status === 422 || status === 409) {
        const detail = detailToString(apiError.response?.data?.detail);
        saleNotify.error(
          'Asiento no disponible',
          detail || 'El asiento seleccionado acaba de ser vendido o reservado por otro vendedor. Seleccione otro.'
        );
        return;
      }

      saleNotify.error(
        'Error en la venta',
        detailToString(apiError.response?.data?.detail) ||
          'Ocurrió un error inesperado. Intente de nuevo.'
      );
    }
  }, [
    saleValidationService,
    seatValidation,
    currentUser,
    passengerService,
    tripDetails,
    findOrCreateClient,
    createInvoice,
    createSeatAssignment,
    updateReservation,
  ]);

  return {
    enrichSeatWithType,
    handleCompanyInvoiceWithRepresentatives,
    handleRegularSale,
  };
};
