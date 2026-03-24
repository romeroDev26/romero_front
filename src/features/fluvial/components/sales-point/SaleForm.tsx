// src/features/fluvial/components/sales-point/SaleForm.tsx
import React, { memo } from "react";
import {
  ArrowLeft,
  Ship,
  Clock,
  AlertTriangle,
  CreditCard,
  ChevronDown,
  Info,
} from "lucide-react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

import { Button } from "../../../../components/common/Button";
import { PassengerDataForm } from "./PassengerDataForm";
import { SeatAndFareSelector } from "./SeatAndFareSelector";
import { PriceSummary } from "./PriceSummary";
import { Spinner } from "../../../../components/common/Spinner";
import { SearchableSelect } from "../../../../components/common/SearchableSelect";
import { ReservationModal } from "./ReservationModal";
import { RepresentativesManager } from "./representatives";
import { TicketPreviewModal } from "./TicketPreviewModal";
import { ConfirmSaleModal } from "./ConfirmSaleModal";
import {
  ReservationConfirmationHandler,
} from "./reservation-confirmation";
import { CurrencySelector } from "./components/CurrencySelector";
import { SplitPaymentForm } from "../../../../components/common/SplitPaymentForm";

import { SaleFormProps } from "./core/types";
import { InfantManager } from "./infants";

import { useSaleForm } from "./hooks/useSaleForm";

export const SaleForm: React.FC<SaleFormProps> = memo(
  ({ trip, branch, onBack, onSaleSuccess, reservationToConfirm }) => {
    const sf = useSaleForm({
      trip,
      branch,
      onBack,
      onSaleSuccess,
      reservationToConfirm,
    });

    const {
      showTicketPreview,
      setShowTicketPreview,
      ticketBackendData,
      setTicketBackendData,
      representatives,
      showRepresentatives,
      setShowRepresentatives,
      showAddForm,
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
      isIgvGravado,
      setIsIgvGravado,
      discount,
      manualPrice,
      isManualPriceMode,
      editableBasePrice,
      selectedBoletaSeries,
      selectedFacturaSeries,
      itemDescription,
      setItemDescription,
      splitPaymentData,
      isSplitPaymentValid,
      isReservationModalOpen,
      setReservationModalOpen,
      isConfirmingMode,
      setIsConfirmingMode,
      isProcessingSale,
      isConfirmSaleModalOpen,
      setIsConfirmSaleModalOpen,
      selectedCurrency,
      setCurrency,
      getCurrencySymbol,
      showSeatMap,
      isReserving,
      reserveSeat,
      releaseSeat,
      getReservedSeatNumbers,
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
      isCreating,
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
      handleShowAddFormChange,
      existingDocuments,
      usedSeatNumbers,
      getAllOccupiedSeatNumbers,
      isRuc,
      handleWebSocketReady,
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
      seatMap,
    } = sf;

    return (
      <>
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

        <div className="w-full p-4 pb-8 lg:p-6 lg:pb-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4 lg:mb-6 pb-4 border-b">
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
                Registrar Venta de Pasaje
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                Desde: <span className="font-semibold">{branch.name}</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                clearStateForVesselChange();
                onBack();
              }}
              disabled={isProcessingSale}
              className="w-full sm:w-auto justify-center"
            >
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
                    onUpdateRepresentativeInfants={
                      handleUpdateRepresentativeInfants
                    }
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
                      currentUser?.full_name ||
                      currentUser?.first_name ||
                      "Usuario"
                    }
                    occupiedSeatNumbers={getAllOccupiedSeatNumbers()}
                    isCompanyMode={isRuc}
                    representativeSelectedSeatIds={
                      representativeSelectedSeatIds
                    }
                    onWebSocketReady={handleWebSocketReady}
                  />
                ) : (
                  <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-base lg:text-lg text-gray-800 mb-3 lg:mb-4 flex items-center">
                      <Ship className="h-5 w-5 lg:h-6 lg:w-6 mr-2 text-gray-500" />
                      Tramo y Asiento
                    </h3>

                    <div className="grid grid-cols-1 gap-3 lg:gap-4 mb-4">
                      <SearchableSelect
                        label="Origen (Embarque)"
                        value={selectedBoardingStopId}
                        onChange={(value) =>
                          setSelectedBoardingStopId(
                            value ? Number(value) : null
                          )
                        }
                        options={
                          tripDetails?.stops?.map((stop) => ({
                            value: stop.id,
                            label: stop.port?.name || "Sin nombre",
                          })) || []
                        }
                        placeholder="Seleccione embarque..."
                        disabled={isConfirmingMode}
                      />
                      <SearchableSelect
                        label="Destino (Desembarque)"
                        value={selectedDisembarkingStopId}
                        onChange={(value) =>
                          setSelectedDisembarkingStopId(
                            value ? Number(value) : null
                          )
                        }
                        options={
                          tripDetails?.stops
                            ?.filter((stop) => {
                              if (!selectedBoardingStopId) return false;
                              const boardingStop = tripDetails.stops.find(
                                (s) => s.id === selectedBoardingStopId
                              );
                              const boardingStopOrder =
                                boardingStop?.stop_order ?? -1;
                              return stop.stop_order > boardingStopOrder;
                            })
                            .map((stop) => ({
                              value: stop.id,
                              label: stop.port?.name || "Sin nombre",
                            })) || []
                        }
                        placeholder="Seleccione desembarque..."
                        disabled={
                          !selectedBoardingStopId || isConfirmingMode
                        }
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 text-blue-700">
                        <Ship className="h-5 w-5" />
                        <span className="font-medium">
                          Embarcación sin asientos numerados
                        </span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Esta embarcación utiliza sistema de elección libre de
                        asientos
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 max-h-none lg:max-h-[calc(100vh-1rem)] overflow-y-auto lg:pr-2 space-y-4 lg:space-y-6 pb-4 lg:pb-56 lg:scroll-pb-64">
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
                          Para ver el resumen de venta y generar el comprobante,
                          primero:
                        </p>
                      </div>
                      <div className="text-left bg-white p-4 rounded-lg border space-y-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              passengerData.docNumber.trim() &&
                              passengerData.name.trim()
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600"
                            }`}
                          >
                            {passengerData.docNumber.trim() &&
                            passengerData.name.trim()
                              ? "✓"
                              : "1"}
                          </div>
                          <span
                            className={`text-sm ${
                              passengerData.docNumber.trim() &&
                              passengerData.name.trim()
                                ? "text-green-700 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            Ingrese los datos del pasajero
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              selectedBoardingStopId
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600"
                            }`}
                          >
                            {selectedBoardingStopId ? "✓" : "2"}
                          </div>
                          <span
                            className={`text-sm ${
                              selectedBoardingStopId
                                ? "text-green-700 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            Seleccione el origen (embarque)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              selectedDisembarkingStopId
                                ? "bg-green-500 text-white"
                                : "bg-blue-500 text-white animate-pulse"
                            }`}
                          >
                            {selectedDisembarkingStopId ? "✓" : "3"}
                          </div>
                          <span
                            className={`text-sm ${
                              selectedDisembarkingStopId
                                ? "text-green-700 font-medium"
                                : "text-blue-700 font-medium"
                            }`}
                          >
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
                  <>
                    <section className="space-y-4 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dbe1ff]">
                          <ClipboardDocumentListIcon className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight text-gray-900">
                          Comprobante
                        </h2>
                      </div>

                      <div className="space-y-4">
                        {isLoadingSeries ? (
                          <Spinner />
                        ) : (
                          <div>
                            <label className="mb-1.5 ml-1 block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                              Serie del documento
                            </label>
                            <div className="relative isolate">
                              <select
                                value={
                                  isRuc
                                    ? selectedFacturaSeries
                                    : selectedBoletaSeries
                                }
                                onChange={(e) =>
                                  isRuc
                                    ? handleFacturaSeriesChange(e.target.value)
                                    : handleBoletaSeriesChange(e.target.value)
                                }
                                className="w-full min-w-0 appearance-none rounded-lg border-0 bg-gray-100 py-3 pl-4 pr-11 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    {s.series_code} —{" "}
                                    {isRuc
                                      ? "Factura electrónica"
                                      : "Boleta de venta"}
                                  </option>
                                ))}
                              </select>
                              <span
                                className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg border-l border-gray-200/60 bg-gray-100/95"
                                aria-hidden
                              >
                                <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                              </span>
                            </div>
                            <p className="ml-1 mt-1.5 text-[10px] text-gray-500">
                              Correlativo asignado automáticamente al emitir
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="mb-1.5 ml-1 block text-[11px] font-medium uppercase tracking-wider text-gray-500">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={itemDescription}
                            onChange={(e) =>
                              setItemDescription(e.target.value)
                            }
                            placeholder="Ej. Servicio de transporte"
                            className="w-full rounded-lg border-0 bg-gray-100 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <CurrencySelector
                          selectedCurrency={selectedCurrency}
                          onCurrencyChange={setCurrency}
                          disabled={isProcessingSale}
                          variant="pills"
                        />
                      </div>
                    </section>

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
                      isManualPriceMode={isManualPriceMode}
                      manualPrice={manualPrice}
                      onManualPriceChange={handleManualPriceChange}
                      editableBasePrice={editableBasePrice}
                      onEditableBasePriceChange={handleEditableBasePriceChange}
                      currencySymbol={getCurrencySymbol()}
                    />

                    <section className="space-y-4 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                      <h2 className="text-lg font-bold tracking-tight text-gray-900">
                        Método de Pago
                      </h2>
                      <SplitPaymentForm
                        variant="billing"
                        totalAmount={finalTicketPrice}
                        currencySymbol={getCurrencySymbol()}
                        disabled={isProcessingSale}
                        onPaymentDataChange={handleSplitPaymentChange}
                        onValidationChange={handleSplitPaymentValidationChange}
                      />
                    </section>

                    <div className="space-y-2.5 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm lg:space-y-3">
                      <h3 className="text-center text-sm font-semibold text-gray-700 lg:text-base">
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
                          onClick={() =>
                            setShowRepresentatives(!showRepresentatives)
                          }
                          variant="outline"
                          className="w-full text-base lg:text-lg py-2.5 lg:py-3 border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                          {showRepresentatives ? "Ocultar" : "Gestionar"}{" "}
                          Representantes
                        </Button>
                      )}
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-gradient-to-br from-slate-50/90 to-white p-4 shadow-sm">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dbe1ff]/90">
                          <Info
                            className="h-5 w-5 text-primary"
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900">
                            Información
                          </p>
                          <p className="mt-1 text-[11px] leading-snug text-gray-600">
                            Verifique pasajero, tramo y total antes de cobrar.
                            El comprobante usará la serie indicada y el
                            correlativo se asignará al confirmar. Viaje:{" "}
                            <span className="font-medium text-gray-800">
                              {trip.trip_name}
                            </span>
                            .
                          </p>
                        </div>
                      </div>
                    </div>

                    {!basePrice && !isManualPriceMode && (
                      <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Seleccione un destino para ver el precio.</span>
                      </div>
                    )}

                    {isManualPriceMode &&
                      (!manualPrice || manualPrice === 0) && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">
                            Ingrese un precio manual para continuar con la
                            venta.
                          </span>
                        </div>
                      )}

                    {finalTicketPrice === 0 && (basePrice || manualPrice) && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">
                          El monto total no puede ser S/ 0.00. Ajuste el precio
                          o el descuento.
                        </span>
                      </div>
                    )}

                    {splitPaymentData.isSplitPayment &&
                      !isSplitPaymentValid && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">
                            Los montos del pago dividido deben sumar exactamente
                            el total ({getCurrencySymbol()}{" "}
                            {finalTicketPrice.toFixed(2)})
                          </span>
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
  }
);

SaleForm.displayName = "SaleForm";
