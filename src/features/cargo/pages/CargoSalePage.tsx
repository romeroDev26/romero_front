// src/features/cargo/pages/CargoSalePage.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { CreditCard, PlusIcon, PencilIcon, TrashIcon, ClipboardListIcon, HashIcon, ArrowRightIcon, PackageIcon, UserIcon, MapPinIcon, ReceiptTextIcon } from 'lucide-react';

import { PassengerDataForm } from '../../fluvial/components/sales-point/PassengerDataForm';
import { TripSelection } from '../../fluvial/components/sales-point/TripSelection';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useClientManager } from '../../fluvial/hooks/useClientManager';
import { useCreateInvoice } from '../../fluvial/hooks/useInvoices';
import { Spinner } from '../../../components/common/Spinner';
import { useDocumentSeriesForBranch } from '../../fluvial/hooks/useDocumentSeriesForBranch';
import { Stepper } from '../../../components/common/Stepper.tsx';
import { SplitPaymentForm, SplitPaymentData } from '../../../components/common/SplitPaymentForm';

import { CargoItemForm } from '../components/CargoItemForm';
import { RecipientForm, RecipientData as RecipientFormData } from '../components/RecipientForm';
import { CargoTripSelector } from '../components/CargoTripSelector';
import { CargoItemData } from '../types/cargo-ui.types';
import { ConfirmSaleModal } from '../../fluvial/components/sales-point/ConfirmSaleModal';
import { BranchOffice } from '../../../types';
import { SunatDocType, SunatInvoiceType } from '../../fluvial/types/sunat.types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { useTripDetails } from '../../fluvial/hooks/useTripDetails';
import { TicketPreviewModal } from '../../fluvial/components/sales-point/TicketPreviewModal';
import { BackendInvoiceData } from '../../fluvial/components/sales-point/tickets/types/backend.types';

type CargoSaleView = 'clientSelection' | 'tripSelection' | 'tripSegmentSelection' | 'itemsDefinition';

interface ClientData {
  docType: string; docNumber: string; name: string;
  address: string; phone: string; email: string;
  countryCode?: string; countryName?: string;
}

export const CargoSalePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<CargoSaleView>('clientSelection');
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [isContraentrega, setIsContraentrega] = useState<boolean>(false);
  
  const [remitter, setRemitter] = useState<ClientData>({ docType: SunatDocType.DNI, docNumber: '', name: '', address: '', phone: '', email: '', countryCode: 'PE', countryName: 'Peru' });
  const [recipient, setRecipient] = useState<RecipientFormData>({
    isSameAsSender: true,
    name: '',
    docType: SunatDocType.DNI,
    docNumber: '',
    phone: '',
  });
  const [selectedTrip, setSelectedTrip] = useState<AvailableTripByPort | null>(null);
  const [selectedOriginId, setSelectedOriginId] = useState<number | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [cargoItems, setCargoItems] = useState<CargoItemData[]>([]);

  // Hook para obtener los detalles del viaje seleccionado (incluye stops)
  const { data: tripDetails } = useTripDetails(selectedTrip ? selectedTrip.id : null);

  // Establecer el origen por defecto cuando se selecciona un viaje
  useEffect(() => {
    if (selectedTrip && selectedBranch) {
      setSelectedOriginId(selectedBranch.port_id);
    }
  }, [selectedTrip, selectedBranch]);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoItemData | null>(null);

  // Estados para el modal de ticket
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [ticketBackendData, setTicketBackendData] = useState<BackendInvoiceData | null>(null);
  
  // Estado para el modal de confirmación de venta
  const [isConfirmSaleModalOpen, setIsConfirmSaleModalOpen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

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

  // --- INICIO: Logica de Series Replicada ---
  const [selectedBoletaSeries, setSelectedBoletaSeries] = useState<string>("");
  const [selectedFacturaSeries, setSelectedFacturaSeries] = useState<string>("");
  
  const { findOrCreateClient, isProcessingClient } = useClientManager();
  const { mutateAsync: createInvoice, isPending: isCreatingInvoice } = useCreateInvoice();
  
  useEffect(() => {
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      setSelectedBranch(JSON.parse(savedBranchJson));
    } else {
      toast.warn("Seleccione una sucursal en 'Punto de Venta (Pasajes)' para empezar.");
      navigate('/fluvial/operations/sales-point');
    }
  }, [navigate]);
  
  const { availableBoletaSeries, availableFacturaSeries, isLoading: isLoadingSeries } = useDocumentSeriesForBranch(selectedBranch?.id || null);

  // Callback para manejar cambios en el pago dividido
  const handleSplitPaymentChange = useCallback((data: SplitPaymentData) => {
    setSplitPaymentData(data);
  }, []);

  useEffect(() => {
    const cachedBoleta = localStorage.getItem("lastUsedBoletaSeries");
    const cachedFactura = localStorage.getItem("lastUsedFacturaSeries");
    if (availableBoletaSeries.length > 0) {
      if (cachedBoleta && availableBoletaSeries.some(s => s.series_code === cachedBoleta)) {
        setSelectedBoletaSeries(cachedBoleta);
      } else {
        setSelectedBoletaSeries(availableBoletaSeries[0].series_code);
      }
    }
    if (availableFacturaSeries.length > 0) {
      if (cachedFactura && availableFacturaSeries.some(s => s.series_code === cachedFactura)) {
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
  // --- FIN: Lógica de Series Replicada ---

  const handleNextStep = (nextView: CargoSaleView) => {
    if (currentView === 'clientSelection' && (!remitter.docNumber || !remitter.name)) {
      toast.error('Por favor, complete y busque los datos del remitente.');
      return;
    }
    if (currentView === 'clientSelection' && !recipient.isSameAsSender && (!recipient.docNumber || !recipient.name)) {
      toast.error('Por favor, complete los datos obligatorios del destinatario: DNI y nombre completo.');
      return;
    }
    if (currentView === 'tripSelection' && !selectedTrip) {
      toast.error('Por favor, seleccione un viaje.');
      return;
    }
    if (currentView === 'tripSegmentSelection' && (!selectedOriginId || !selectedDestinationId)) {
      toast.error('Por favor, seleccione el origen y destino del tramo.');
      return;
    }
    setCurrentView(nextView);
  };
  
  const handleItemSubmit = (item: CargoItemData) => {
    setCargoItems(currentItems => {
      const existingIndex = currentItems.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        const updatedItems = [...currentItems];
        updatedItems[existingIndex] = item;
        return updatedItems;
      }
      return [...currentItems, item];
    });
    setIsItemModalOpen(false);
    setEditingItem(null);
  };
  
  const totalSaleAmount = useMemo(() => {
    return cargoItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  }, [cargoItems]);
  
  // Handler para abrir el modal de confirmación
  const handleOpenConfirmModal = () => {
    if (cargoItems.length === 0 || !selectedTrip || !selectedBranch) {
      toast.error('Debe agregar al menos una encomienda para continuar.');
      return;
    }
    
    setIsConfirmSaleModalOpen(true);
  };
  
  const handleFinalizeSale = async () => {
    // Cerrar modal de confirmación
    setIsConfirmSaleModalOpen(false);
    setIsProcessingSale(true);
    
    if (cargoItems.length === 0 || !selectedTrip || !selectedBranch) return;

    if (!tripDetails || !tripDetails.stops || tripDetails.stops.length < 2) {
      toast.error('No se pudieron obtener las paradas del viaje.');
      return;
    }
          const boardingStopId = tripDetails.stops.find(s => s.port_id === selectedOriginId)?.id;
      const disembarkingStopId = tripDetails.stops.find(s => s.port_id === selectedDestinationId)?.id;
      
      if (!boardingStopId || !disembarkingStopId) {
        toast.error('No se pudieron encontrar las paradas del tramo seleccionado.');
        return;
      }

    try {
      const client = await findOrCreateClient({
        doc_type: remitter.docType,
        doc_number: remitter.docNumber,
        name: remitter.name,
        address_line: remitter.address,
        phone: remitter.phone,
        email: remitter.email,
        country_code: remitter.countryCode || 'PE',
        country_name: remitter.countryName || 'Peru',
      });
      
      const isRuc = remitter.docType === SunatDocType.RUC;
      // Usamos el estado en lugar de la lógica hardcodeada
      const series = isRuc ? selectedFacturaSeries : selectedBoletaSeries;
      if (!series) {
        toast.error(`No hay series de ${isRuc ? 'Factura' : 'Boleta'} configuradas.`);
        return;
      }



      const invoicePayload = {
        client_id: client.id,
        document_type_code: isRuc ? SunatInvoiceType.FACTURA : SunatInvoiceType.BOLETA,
        series: series,
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        issue_time: format(new Date(), 'HH:mm:ss'),
        operation_type_code: '0101',
        currency_code: 'PEN',
        is_credit_sale: isContraentrega,
        // Metodo de pago: solo enviar si NO es contraentrega
        ...(!isContraentrega && {
          payment_method_code: splitPaymentData.paymentMethod1,
          payment_operation_code: splitPaymentData.operationCode1 || undefined,
        }),
        // Campos para pago dividido: solo enviar si NO es contraentrega y es pago dividido
        ...(!isContraentrega && splitPaymentData.isSplitPayment && {
          payment_amount_1: splitPaymentData.amount1,
          payment_method_code_2: splitPaymentData.paymentMethod2,
          payment_operation_code_2: splitPaymentData.operationCode2 || undefined,
          payment_amount_2: splitPaymentData.amount2,
        }),
        notes: `Venta de Encomiendas. Sucursal: ${selectedBranch.name}`,
        items: cargoItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.price.toFixed(10)),
          tax_category_code: item.product.tax_category_code,
          item_description: item.description,
          unit_code: item.unitOfMeasure,
          trip_id: selectedTrip.id,
          recipient_name: item.recipient.isSameAsSender ? remitter.name : item.recipient.name,
          recipient_doc_type: item.recipient.isSameAsSender ? remitter.docType : item.recipient.docType,
          recipient_doc_number: item.recipient.isSameAsSender ? remitter.docNumber : item.recipient.docNumber,
          recipient_phone: item.recipient.isSameAsSender ? remitter.phone : item.recipient.phone,
          boarding_trip_stop_id: boardingStopId,
          disembarking_trip_stop_id: disembarkingStopId,
        })),
      };

      const createdInvoice = await createInvoice({
        invoiceData: invoicePayload,
        tripId: selectedTrip.id
      });
      
      // Mostrar modal de ticket con los datos de la factura creada
      setTicketBackendData(createdInvoice as unknown as BackendInvoiceData);
      setShowTicketPreview(true);
      setIsProcessingSale(false);
      
    } catch (error: any) {
      console.error('Error creando venta de encomienda:', error);
      toast.error(error.response?.data?.detail || 'Error al crear la venta');
      setIsProcessingSale(false);
    }
  };

  const handleTicketSuccess = () => {
    // Resetear completamente para una nueva venta despuÃ©s del ticket
    setRemitter({ docType: SunatDocType.DNI, docNumber: '', name: '', address: '', phone: '', email: '' });
    setRecipient({
      isSameAsSender: true,
      name: '',
      docType: SunatDocType.DNI,
      docNumber: '',
      phone: '',
    });
    setSelectedTrip(null);
    setSelectedOriginId(null);
    setSelectedDestinationId(null);
    setCargoItems([]);
    setIsContraentrega(false);
    // Resetear datos de pago dividido
    setSplitPaymentData({
      isSplitPayment: false,
      paymentMethod1: 'EFE',
      operationCode1: '',
      amount1: 0,
      paymentMethod2: 'YAP',
      operationCode2: '',
      amount2: 0,
    });
    setCurrentView('clientSelection');
    
    // Limpiar datos del ticket
    setShowTicketPreview(false);
    setTicketBackendData(null);
    
    toast.success('Venta de encomienda completada y ticket generado!');
  };

  // Función para limpiar el formulario cuando se cierre el modal (sin éxito)
  const clearCargoFormAfterSale = () => {
    // Resetear todos los estados al inicial
    setRemitter({ docType: SunatDocType.DNI, docNumber: '', name: '', address: '', phone: '', email: '' });
    setRecipient({
      isSameAsSender: true,
      name: '',
      docType: SunatDocType.DNI,
      docNumber: '',
      phone: '',
    });
    setSelectedTrip(null);
    setSelectedOriginId(null);
    setSelectedDestinationId(null);
    setCargoItems([]);
    setIsContraentrega(false);
    // Resetear datos de pago dividido
    setSplitPaymentData({
      isSplitPayment: false,
      paymentMethod1: 'EFE',
      operationCode1: '',
      amount1: 0,
      paymentMethod2: 'YAP',
      operationCode2: '',
      amount2: 0,
    });
    
    // Volver al paso inicial
    setCurrentView('clientSelection');
    
    // Limpiar datos del ticket
    setShowTicketPreview(false);
    setTicketBackendData(null);
    
    toast.info('Formulario de encomienda reiniciado');
  };

  const isRuc = remitter.docType === SunatDocType.RUC;
  const currentSeriesNumber = useMemo(() => {
    const seriesList = isRuc ? availableFacturaSeries : availableBoletaSeries;
    const selectedSeriesCode = isRuc ? selectedFacturaSeries : selectedBoletaSeries;
    const seriesData = seriesList.find(s => s.series_code === selectedSeriesCode);
    return seriesData ? seriesData.current_number + 1 : null;
  }, [
    isRuc,
    availableFacturaSeries,
    availableBoletaSeries,
    selectedFacturaSeries,
    selectedBoletaSeries,
  ]);

  const steps = ['Datos del Remitente', 'Seleccionar Viaje', 'Seleccionar Tramo', 'Definir Encomiendas'];
  const currentStepIndex = useMemo(() => {
    switch (currentView) {
      case 'clientSelection': return 0;
      case 'tripSelection': return 1;
      case 'tripSegmentSelection': return 2;
      case 'itemsDefinition': return 3;
      default: return 0;
    }
  }, [currentView]);

  const isNextDisabled = !remitter.docNumber || !remitter.name || (!recipient.isSameAsSender && (!recipient.docNumber || !recipient.name));

  const selectedOriginName = tripDetails?.stops?.find(s => s.port_id === selectedOriginId)?.port?.name || 'Origen pendiente';
  const selectedDestinationName = tripDetails?.stops?.find(s => s.port_id === selectedDestinationId)?.port?.name || 'Destino pendiente';
  const documentLabel = isRuc ? 'Factura' : 'Boleta';
  const selectedSeriesValue = isRuc ? selectedFacturaSeries : selectedBoletaSeries;
  const availableSeries = isRuc ? availableFacturaSeries : availableBoletaSeries;

  const renderContent = () => {
    if (!selectedBranch) return <div className="p-6 text-center text-gray-500">Cargando...</div>;
    
    switch (currentView) {
      case 'clientSelection':
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Datos del Remitente */}
            <div className="bg-white p-4 md:p-8 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Datos del Remitente</h2>
              <p className="text-gray-500 mb-6">Complete la información de la persona o empresa que realiza el envío.</p>
              <PassengerDataForm passengerData={remitter} setPassengerData={setRemitter} />
            </div>
            
            {/* Datos del Destinatario */}
            <RecipientForm recipient={recipient} setRecipient={setRecipient} remitter={remitter} />
            
            {/* Botón de navegación */}
            <div className="flex flex-col md:flex-row justify-end">
              <Button className="w-full md:w-auto" disabled={isNextDisabled} onClick={() => handleNextStep('tripSelection')}>Siguiente: Seleccionar Viaje</Button>
            </div>
          </div>
        );

      case 'tripSelection':
        return (
          <div className="bg-white p-4 md:p-8 rounded-lg shadow-sm border">
            <p className="text-gray-500 mb-6 text-center">Seleccione el viaje en el que se transportará la encomienda.</p>
            <TripSelection 
              branch={selectedBranch}
              onTripSelect={(trip) => { 
                setSelectedTrip(trip); 
                // ===================================================================
                // CAMBIO: Mover la navegación al siguiente paso después de que el estado se actualice
                // ===================================================================
                setTimeout(() => {
                  setCurrentView('tripSegmentSelection');
                }, 0);
              }}
              onChangeBranch={() => navigate('/fluvial/operations/sales-point')}
              className="!p-0"
            />
             <div className="mt-6"><Button variant="outline" className="w-full md:w-auto" onClick={() => setCurrentView('clientSelection')}>Volver a Datos del Remitente</Button></div>
          </div>
        );
      case 'tripSegmentSelection':
        return (
          <div className="max-w-4xl mx-auto bg-white p-4 md:p-8 rounded-lg shadow-sm border">
            <p className="text-gray-500 mb-6 text-center">Seleccione el tramo específico para la encomienda.</p>
            {selectedTrip && (
              <CargoTripSelector
                tripId={selectedTrip.id}
                selectedOriginId={selectedOriginId}
                onOriginChange={setSelectedOriginId}
                selectedDestinationId={selectedDestinationId}
                onDestinationChange={setSelectedDestinationId}
              />
            )}
            <div className="mt-6 flex flex-col-reverse md:flex-row justify-between gap-4">
              <Button variant="outline" className="w-full md:w-auto" onClick={() => { setSelectedTrip(null); setCurrentView('tripSelection'); }}>
                Volver a Seleccionar Viaje
              </Button>
              <Button className="w-full md:w-auto" onClick={() => handleNextStep('itemsDefinition')}>
                Siguiente: Definir Encomiendas
              </Button>
            </div>
          </div>
        );

      case 'itemsDefinition':
        return (
          <div className="max-w-7xl mx-auto space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-6 md:px-8">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                      Paso 4 de 4
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Definir encomienda y cierre de venta</h2>
                      <p className="mt-2 max-w-2xl text-sm text-slate-300">
                        Revise los datos del envío, agregue la encomienda y deje listo el cobro sin alterar el flujo actual del sistema.
                      </p>
                    </div>
                  </div>

                  <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur xl:max-w-md">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Comprobante</p>
                        <p className="mt-1 text-sm font-semibold text-white">Configuración de serie activa</p>
                      </div>
                      <ReceiptTextIcon className="h-5 w-5 text-slate-300" />
                    </div>
                    {isLoadingSeries ? (
                      <Spinner />
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_104px]">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-300">
                            Serie de {documentLabel}
                          </label>
                          <select
                            value={selectedSeriesValue}
                            onChange={(e) => isRuc ? handleFacturaSeriesChange(e.target.value) : handleBoletaSeriesChange(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            disabled={availableSeries.length <= 1}
                          >
                            {availableSeries.map((s) => (
                              <option key={s.id} value={s.series_code}>
                                {s.series_code}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-300">
                            Siguiente N°
                          </label>
                          <div className="relative">
                            <HashIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={currentSeriesNumber || '...'}
                              disabled
                              className="w-full rounded-xl border border-white/10 bg-slate-100 py-2 pl-9 pr-3 text-center text-sm font-semibold text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-5 md:px-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-blue-700">
                      <UserIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Remitente</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{remitter.name}</p>
                    <p className="mt-1 text-xs text-slate-600">{remitter.docType}: {remitter.docNumber}</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-emerald-700">
                      <UserIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Destinatario</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{recipient.isSameAsSender ? 'Mismo remitente' : recipient.name}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {recipient.isSameAsSender ? remitter.docType : recipient.docType}: {recipient.isSameAsSender ? remitter.docNumber : recipient.docNumber}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-violet-700">
                      <PackageIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Viaje</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{selectedTrip?.trip_name}</p>
                    <p className="mt-1 text-xs text-slate-600">Sucursal: {selectedBranch.name}</p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-amber-700">
                      <MapPinIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Tramo</p>
                    </div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span>{selectedOriginName}</span>
                      <ArrowRightIcon className="h-4 w-4 text-amber-600" />
                      <span>{selectedDestinationName}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-600">Viaje listo para asignar encomienda</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Gestión de encomienda</p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Detalle del envío</h3>
                      <p className="mt-2 text-sm text-slate-500">Agregue una encomienda, revise su información y edítela desde esta misma vista.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        className="w-full justify-center rounded-xl border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50 sm:w-auto"
                        onClick={() => { setSelectedDestinationId(null); setCurrentView('tripSegmentSelection'); }}
                      >
                        Volver a Seleccionar Tramo
                      </Button>
                      <Button
                        onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }}
                        size="md"
                        className="w-full justify-center rounded-xl px-5 py-3 shadow-sm sm:w-auto"
                        disabled={cargoItems.length >= 1}
                        title={cargoItems.length >= 1 ? 'Solo se permite una encomienda por venta' : 'Añadir encomienda'}
                      >
                        <PlusIcon className="mr-2 h-5 w-5" /> Añadir Encomienda
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {cargoItems.length === 0 ? (
                    <div className="rounded-[28px] border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <ClipboardListIcon className="h-8 w-8" />
                      </div>
                      <h4 className="mt-5 text-lg font-semibold text-slate-900">Todavía no hay encomiendas cargadas</h4>
                      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Use el botón principal para registrar la encomienda. La venta conserva la restricción actual de una encomienda por operación.</p>
                    </div>
                  ) : (
                    cargoItems.map((item, index) => (
                      <article key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/40 md:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                              <PackageIcon className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                                  Encomienda {index + 1}
                                </span>
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                                  {item.product.name}
                                </span>
                              </div>
                              <h4 className="mt-3 text-lg font-semibold text-slate-900">{item.description}</h4>
                              <p className="mt-1 text-sm text-slate-500">Unidad: {item.unitOfMeasure} · Cantidad: {item.quantity} · Precio unitario: S/ {item.price.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start lg:ml-4">
                            <button
                              onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setCargoItems(items => items.filter(i => i.id !== item.id))}
                              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Destinatario aplicado</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{item.recipient.isSameAsSender ? remitter.name : item.recipient.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.recipient.isSameAsSender ? remitter.docType : item.recipient.docType}: {item.recipient.isSameAsSender ? remitter.docNumber : item.recipient.docNumber}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Tramo operativo</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedOriginName} → {selectedDestinationName}</p>
                            <p className="mt-1 text-xs text-slate-500">Viaje: {selectedTrip?.trip_name}</p>
                          </div>
                          <div className="rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Subtotal</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">S/ {(item.quantity * item.price).toFixed(2)}</p>
                            <p className="mt-1 text-xs text-slate-500">Se mantiene la lógica actual de cálculo</p>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-gradient-to-br from-primary/10 via-amber-50 to-white px-6 py-6">
                    <p className="text-sm font-semibold text-slate-500">Total a Pagar</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">S/ {totalSaleAmount.toFixed(2)}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {cargoItems.length} {cargoItems.length === 1 ? 'encomienda registrada' : 'encomiendas registradas'}
                    </p>
                    {isContraentrega && (
                      <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700">
                        Pago pendiente. Se cobrará al entregar la encomienda.
                      </p>
                    )}
                  </div>

                  <div className="space-y-5 px-6 py-6">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Contraentrega</p>
                          <p className="mt-1 text-xs text-slate-500">Actívelo si el pago se realizará en destino.</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isContraentrega}
                          onClick={() => setIsContraentrega(!isContraentrega)}
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isContraentrega ? 'bg-primary' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${isContraentrega ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    {!isContraentrega && (
                      <SplitPaymentForm
                        totalAmount={totalSaleAmount}
                        currencySymbol="S/"
                        disabled={isProcessingClient || isCreatingInvoice}
                        onPaymentDataChange={handleSplitPaymentChange}
                      />
                    )}

                    <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Documento</span>
                        <span className="font-semibold text-slate-900">{documentLabel}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Serie</span>
                        <span className="font-semibold text-slate-900">{selectedSeriesValue || 'Sin serie'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Siguiente correlativo</span>
                        <span className="font-semibold text-slate-900">{currentSeriesNumber || '...'}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleOpenConfirmModal}
                      size="lg"
                      isLoading={isProcessingClient || isCreatingInvoice || isProcessingSale}
                      disabled={cargoItems.length === 0 || isProcessingSale}
                      className="w-full rounded-2xl py-4 text-base font-semibold shadow-sm"
                    >
                      <CreditCard className="mr-2 h-5 w-5" /> Generar Venta y Comprobante
                    </Button>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Overlay de carga global durante el procesamiento de venta */}
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
      
      <div className="-mx-4 w-full min-h-[calc(100vh-10rem)] pb-8 md:pb-10 lg:-mx-6">
        <div className="mx-auto mb-8 max-w-7xl px-4 pt-4 md:px-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">Venta de Encomiendas y Carga</h1>
          <p className="text-center text-gray-500 mb-8">Siga los pasos para registrar un nuevo enví­o.</p>
          <Stepper steps={steps} currentStep={currentStepIndex} />
        </div>
        <div className="px-4 md:px-6">{renderContent()}</div>
      </div>
      <Modal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        title={editingItem ? 'Editar Item de Encomienda' : 'Añadir Item de Encomienda'} 
        maxWidth="3xl"
      >
        <CargoItemForm 
          onSubmit={handleItemSubmit} 
          onClose={() => setIsItemModalOpen(false)} 
          existingItem={editingItem}
          defaultRecipient={recipient}
        />
      </Modal>

      {/* Modal de preview de ticket para encomiendas */}
      {showTicketPreview && ticketBackendData && (
        <TicketPreviewModal
          isOpen={showTicketPreview}
          onClose={() => {
            setShowTicketPreview(false);
            setTicketBackendData(null);
          }}
          backendData={ticketBackendData}
          onSuccess={handleTicketSuccess}
          initialPhoneNumber={remitter.phone}
          onClearForm={clearCargoFormAfterSale}
        />
      )}

      {/* Modal de confirmación de venta */}
      <ConfirmSaleModal
        isOpen={isConfirmSaleModalOpen}
        onClose={() => setIsConfirmSaleModalOpen(false)}
        onConfirm={handleFinalizeSale}
        isLoading={isProcessingSale}
        totalAmount={totalSaleAmount}
        currencySymbol="S/"
        passengerName={remitter.name}
        saleType="cargo"
        tripName={selectedTrip?.trip_name}
      />
    </>
  );
};
