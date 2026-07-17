// src/features/cargo/pages/CargoSalePage.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast, saleNotify } from '@/utils/sileo-toast';
import { AnimatePresence, motion } from 'motion/react';
import { CreditCard, PlusIcon, PencilIcon, TrashIcon, ClipboardListIcon, HashIcon, ArrowRightIcon, PackageIcon, UserIcon, MapPinIcon, ReceiptTextIcon, UsersRound } from 'lucide-react';

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
import { BranchSelector } from '../../fluvial/components/sales-point/BranchSelector';
import { BranchOffice } from '../../../types';
import { SunatDocType, SunatInvoiceType } from '../../fluvial/types/sunat.types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { useTripDetails } from '../../fluvial/hooks/useTripDetails';
import { TicketPreviewModal } from '../../fluvial/components/sales-point/TicketPreviewModal';
import { invoicesService } from '../../../services/invoices.service';
import { BackendInvoiceData } from '../../fluvial/components/sales-point/tickets/types/backend.types';

const CARGO_SALE_DRAFT_KEY = 'cargoSaleWizardDraft_v1';

type CargoSaleView = 'clientSelection' | 'tripSelection' | 'tripSegmentSelection' | 'itemsDefinition';

const STEP_VIEWS: CargoSaleView[] = ['clientSelection', 'tripSelection', 'tripSegmentSelection', 'itemsDefinition'];

interface ClientData {
  docType: string; docNumber: string; name: string;
  address: string; phone: string; email: string;
  countryCode?: string; countryName?: string;
}

export const CargoSalePage: React.FC = () => {
  const navigate = useNavigate();
  const [draftReady, setDraftReady] = useState(false);
  const [isClientEditModalOpen, setIsClientEditModalOpen] = useState(false);
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
  /** Incrementa al abrir "Añadir ítem" para remontar el formulario y aplicar el servicio por defecto */
  const [cargoItemFormKey, setCargoItemFormKey] = useState(0);

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
  
  const handleBranchSelect = (branch: BranchOffice) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
  };

  useEffect(() => {
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      const branch = JSON.parse(savedBranchJson) as BranchOffice;
      setSelectedBranch(branch);
      try {
        const raw = sessionStorage.getItem(CARGO_SALE_DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw) as Record<string, unknown>;
          if (d.v === 1 && d.branchId === branch.id) {
            if (d.remitter && typeof d.remitter === 'object') setRemitter(d.remitter as ClientData);
            if (d.recipient && typeof d.recipient === 'object') setRecipient(d.recipient as RecipientFormData);
            if ('selectedTrip' in d) setSelectedTrip((d.selectedTrip as AvailableTripByPort | null) ?? null);
            if (typeof d.selectedOriginId === 'number' || d.selectedOriginId === null)
              setSelectedOriginId(d.selectedOriginId as number | null);
            if (typeof d.selectedDestinationId === 'number' || d.selectedDestinationId === null)
              setSelectedDestinationId(d.selectedDestinationId as number | null);
            if (Array.isArray(d.cargoItems)) setCargoItems(d.cargoItems as CargoItemData[]);
            if (typeof d.isContraentrega === 'boolean') setIsContraentrega(d.isContraentrega);
            if (d.splitPaymentData && typeof d.splitPaymentData === 'object')
              setSplitPaymentData(d.splitPaymentData as SplitPaymentData);
            let view = d.currentView as CargoSaleView;
            if (view === 'tripSegmentSelection' && !d.selectedTrip) view = 'tripSelection';
            if (view === 'itemsDefinition' && !d.selectedTrip) view = 'tripSelection';
            if (STEP_VIEWS.includes(view)) setCurrentView(view);
          }
        }
      } catch {
        sessionStorage.removeItem(CARGO_SALE_DRAFT_KEY);
      }
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady || !selectedBranch) return;
    const handle = window.setTimeout(() => {
      try {
        sessionStorage.setItem(
          CARGO_SALE_DRAFT_KEY,
          JSON.stringify({
            v: 1,
            branchId: selectedBranch.id,
            currentView,
            remitter,
            recipient,
            selectedTrip,
            selectedOriginId,
            selectedDestinationId,
            cargoItems,
            isContraentrega,
            splitPaymentData,
          }),
        );
      } catch (e) {
        console.warn('No se pudo guardar el borrador de venta de encomienda', e);
      }
    }, 450);
    return () => window.clearTimeout(handle);
  }, [
    draftReady,
    selectedBranch,
    currentView,
    remitter,
    recipient,
    selectedTrip,
    selectedOriginId,
    selectedDestinationId,
    cargoItems,
    isContraentrega,
    splitPaymentData,
  ]);
  
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

  const clearCargoSaleDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(CARGO_SALE_DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const handleStepperStepClick = useCallback((index: number) => {
    const idx = STEP_VIEWS.indexOf(currentView);
    if (index === idx) return;
    if (index > idx) {
      toast.info('Avance con el botón «Siguiente» en cada paso.');
      return;
    }
    setCurrentView(STEP_VIEWS[index]);
  }, [currentView]);

  const closeClientEditModal = useCallback(() => {
    if (!remitter.docNumber || !remitter.name) {
      toast.error('Complete los datos del remitente antes de continuar.');
      return;
    }
    if (!recipient.isSameAsSender && (!recipient.docNumber || !recipient.name)) {
      toast.error('Complete DNI y nombre del destinatario, o indique que es el mismo remitente.');
      return;
    }
    if (cargoItems.length > 0) {
      toast.info(
        'Si cambió el destinatario general, use Editar en cada encomienda para alinear el destinatario del envío con el comprobante.',
        { autoClose: 7000 },
      );
    }
    setIsClientEditModalOpen(false);
  }, [remitter.docNumber, remitter.name, recipient, cargoItems.length]);
  
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

      // Obtener el detalle completo (GET por ID) para que el modal post-venta
      // reciba el mismo shape que el detalle (campos de pago incl.).
      // Si falla, degrada con la respuesta del create (el preview sigue funcionando).
      try {
        const fullInvoice = await invoicesService.getById(createdInvoice.id);
        setTicketBackendData(fullInvoice as unknown as BackendInvoiceData);
      } catch (fetchError) {
        console.error('[TicketPreview] No se pudo obtener el detalle completo de la venta; usando la respuesta del create.', fetchError);
        setTicketBackendData(createdInvoice as unknown as BackendInvoiceData);
      } finally {
        setShowTicketPreview(true);
        setIsProcessingSale(false);
      }
      
    } catch (error: any) {
      console.error('Error creando venta de encomienda:', error);
      toast.error(error.response?.data?.detail || 'Error al crear la venta');
      setIsProcessingSale(false);
    }
  };

  const handleTicketSuccess = () => {
    clearCargoSaleDraft();
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
    
    saleNotify.success('Venta de encomienda completada', 'El ticket ha sido generado correctamente.');
  };

  // Función para limpiar el formulario cuando se cierre el modal (sin éxito)
  const clearCargoFormAfterSale = () => {
    clearCargoSaleDraft();
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
    if (!selectedBranch) {
      return (
        <div className="max-w-7xl mx-auto px-4 pt-4 md:px-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-dm-text-primary mb-2">Seleccione una sucursal</h2>
            <p className="text-dm-text-secondary">Elija la sucursal desde la cual registrará la encomienda.</p>
          </div>
          <BranchSelector onBranchSelect={handleBranchSelect} />
        </div>
      );
    }
    
    switch (currentView) {
      case 'clientSelection':
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Datos del Remitente */}
            <div className="bg-dm-bg-primary p-4 md:p-8 rounded-lg shadow-sm border border-dm-border-primary">
              <h2 className="text-xl font-semibold text-dm-text-primary mb-6">Datos del Remitente</h2>
              <p className="text-dm-text-muted mb-6">Complete la información de la persona o empresa que realiza el envío.</p>
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
          <div className="bg-dm-bg-primary p-4 md:p-8 rounded-lg shadow-sm border border-dm-border-primary">
            <p className="text-dm-text-muted mb-6 text-center">Seleccione el viaje en el que se transportará la encomienda.</p>
            <TripSelection 
              branch={selectedBranch}
              onTripSelect={(trip) => { 
                if (selectedTrip && trip.id !== selectedTrip.id && cargoItems.length > 0) {
                  toast.info('Cambió el viaje: confirme el tramo y revise la encomienda antes de emitir el comprobante.', {
                    autoClose: 6000,
                  });
                }
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
          <div className="max-w-4xl mx-auto bg-dm-bg-primary p-4 md:p-8 rounded-lg shadow-sm border border-dm-border-primary">
            <p className="text-dm-text-muted mb-6 text-center">Seleccione el tramo específico para la encomienda.</p>
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
              <Button variant="outline" className="w-full md:w-auto" onClick={() => setCurrentView('tripSelection')}>
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
            <section className="overflow-hidden rounded-[28px] border border-dm-border-primary bg-dm-bg-primary shadow-sm">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-6 md:px-8">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="inline-flex items-center rounded-full border border-white/15 bg-dm-bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                      Paso 4 de 4
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Definir encomienda y cierre de venta</h2>
                      <p className="mt-2 max-w-2xl text-sm text-dm-text-muted">
                        Revise los datos del envío, agregue la encomienda y deje listo el cobro sin alterar el flujo actual del sistema.
                      </p>
                    </div>
                  </div>

                  <div className="w-full rounded-2xl border border-dm-border-primary bg-dm-bg-secondary/80 p-4 backdrop-blur xl:max-w-md">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dm-text-muted">Comprobante</p>
                        <p className="mt-1 text-sm font-semibold text-white">Configuración de serie activa</p>
                      </div>
                      <ReceiptTextIcon className="h-5 w-5 text-dm-text-muted" />
                    </div>
                    {isLoadingSeries ? (
                      <Spinner />
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_104px]">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-dm-text-muted">
                            Serie de {documentLabel}
                          </label>
                          <select
                            value={selectedSeriesValue}
                            onChange={(e) => isRuc ? handleFacturaSeriesChange(e.target.value) : handleBoletaSeriesChange(e.target.value)}
                            className="w-full rounded-xl border border-dm-border-primary bg-dm-bg-primary px-3 py-2 text-sm text-dm-text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                          <label className="mb-1 block text-xs font-medium text-dm-text-muted">
                            Siguiente N°
                          </label>
                          <div className="relative">
                            <HashIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dm-text-muted" />
                            <input
                              type="text"
                              value={currentSeriesNumber || '...'}
                              disabled
                              className="w-full rounded-xl border border-dm-border-primary bg-dm-bg-secondary py-2 pl-9 pr-3 text-center text-sm font-semibold text-dm-text-secondary"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-dm-border-primary bg-dm-bg-secondary/80 px-5 py-5 md:px-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
                    <div className="mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <UserIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Remitente</p>
                    </div>
                    <p className="text-sm font-semibold text-dm-text-primary">{remitter.name}</p>
                    <p className="mt-1 text-xs text-dm-text-secondary">{remitter.docType}: {remitter.docNumber}</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                    <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <UserIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Destinatario</p>
                    </div>
                    <p className="text-sm font-semibold text-dm-text-primary">{recipient.isSameAsSender ? 'Mismo remitente' : recipient.name}</p>
                    <p className="mt-1 text-xs text-dm-text-secondary">
                      {recipient.isSameAsSender ? remitter.docType : recipient.docType}: {recipient.isSameAsSender ? remitter.docNumber : recipient.docNumber}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-4">
                    <div className="mb-3 flex items-center gap-2 text-violet-700 dark:text-violet-300">
                      <PackageIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Viaje</p>
                    </div>
                    <p className="text-sm font-semibold text-dm-text-primary">{selectedTrip?.trip_name}</p>
                    <p className="mt-1 text-xs text-dm-text-secondary">Sucursal: {selectedBranch.name}</p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-4">
                    <div className="mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <MapPinIcon className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">Tramo</p>
                    </div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-dm-text-primary">
                      <span>{selectedOriginName}</span>
                      <ArrowRightIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span>{selectedDestinationName}</span>
                    </p>
                    <p className="mt-1 text-xs text-dm-text-secondary">Viaje listo para asignar encomienda</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-dm-border-primary/80 bg-dm-bg-secondary/80 px-5 py-3 md:px-8">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-dm-border-primary text-dm-text-secondary hover:bg-dm-bg-primary"
                    onClick={() => setIsClientEditModalOpen(true)}
                  >
                    <UsersRound className="mr-2 h-4 w-4 shrink-0" />
                    Editar remitente o destinatario
                  </Button>
                  <span className="text-xs text-dm-text-muted">
                    Sin salir del paso 4; las encomiendas añadidas se conservan
                  </span>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="space-y-6">
                <div className="rounded-[28px] border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm md:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-dm-text-muted">Gestión de encomienda</p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-dm-text-primary">Detalle del envío</h3>
                      <p className="mt-2 text-sm text-dm-text-muted">Agregue una encomienda, revise su información y edítela desde esta misma vista.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        className="w-full justify-center rounded-xl border-dm-border-primary px-4 py-3 text-dm-text-secondary hover:bg-dm-bg-hover sm:w-auto"
                        onClick={() => { setSelectedDestinationId(null); setCurrentView('tripSegmentSelection'); }}
                      >
                        Volver a Seleccionar Tramo
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingItem(null);
                          setCargoItemFormKey((k) => k + 1);
                          setIsItemModalOpen(true);
                        }}
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
                    <div className="rounded-[28px] border-2 border-dashed border-dm-border-primary bg-dm-bg-primary px-6 py-12 text-center shadow-sm">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted">
                        <ClipboardListIcon className="h-8 w-8" />
                      </div>
                      <h4 className="mt-5 text-lg font-semibold text-dm-text-primary">Todavía no hay encomiendas cargadas</h4>
                      <p className="mx-auto mt-2 max-w-md text-sm text-dm-text-muted">Use el botón principal para registrar la encomienda. La venta conserva la restricción actual de una encomienda por operación.</p>
                    </div>
                  ) : (
                    cargoItems.map((item, index) => (
                      <article key={item.id} className="rounded-[28px] border border-dm-border-primary bg-dm-bg-primary p-5 shadow-sm transition hover:border-primary/40 md:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-dm-bg-secondary text-dm-text-muted">
                              <PackageIcon className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-700 dark:bg-slate-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                                  Encomienda {index + 1}
                                </span>
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                                  {item.product.name}
                                </span>
                              </div>
                              <h4 className="mt-3 text-lg font-semibold text-dm-text-primary">{item.description}</h4>
                              <p className="mt-1 text-sm text-dm-text-muted">Unidad: {item.unitOfMeasure} · Cantidad: {item.quantity} · Precio unitario: S/ {item.price.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start lg:ml-4">
                            <button
                              onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                              className="rounded-xl border border-dm-border-primary p-2.5 text-dm-text-muted transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setCargoItems(items => items.filter(i => i.id !== item.id))}
                              className="rounded-xl border border-dm-border-primary p-2.5 text-dm-text-muted transition hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:text-red-400"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-dm-bg-secondary p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dm-text-muted">Destinatario aplicado</p>
                            <p className="mt-2 text-sm font-semibold text-dm-text-primary">{item.recipient.isSameAsSender ? remitter.name : item.recipient.name}</p>
                            <p className="mt-1 text-xs text-dm-text-muted">{item.recipient.isSameAsSender ? remitter.docType : item.recipient.docType}: {item.recipient.isSameAsSender ? remitter.docNumber : item.recipient.docNumber}</p>
                          </div>
                          <div className="rounded-2xl bg-dm-bg-secondary p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dm-text-muted">Tramo operativo</p>
                            <p className="mt-2 text-sm font-semibold text-dm-text-primary">{selectedOriginName} → {selectedDestinationName}</p>
                            <p className="mt-1 text-xs text-dm-text-muted">Viaje: {selectedTrip?.trip_name}</p>
                          </div>
                          <div className="rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Subtotal</p>
                            <p className="mt-2 text-2xl font-bold text-dm-text-primary">S/ {(item.quantity * item.price).toFixed(2)}</p>
                            <p className="mt-1 text-xs text-dm-text-muted">Se mantiene la lógica actual de cálculo</p>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                <section className="overflow-hidden rounded-[28px] border border-dm-border-primary bg-dm-bg-primary shadow-sm">
                  <div className="border-b border-dm-border-primary bg-gradient-to-br from-primary/10 via-amber-50 to-white dark:from-primary/20 dark:via-amber-900/30 dark:to-amber-950/20 px-6 py-6">
                    <p className="text-sm font-semibold text-dm-text-muted">Total a Pagar</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-dm-text-primary">S/ {totalSaleAmount.toFixed(2)}</p>
                    <p className="mt-2 text-sm text-dm-text-muted">
                      {cargoItems.length} {cargoItems.length === 1 ? 'encomienda registrada' : 'encomiendas registradas'}
                    </p>
                    {isContraentrega && (
                      <p className="mt-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                        Pago pendiente. Se cobrará al entregar la encomienda.
                      </p>
                    )}
                  </div>

                  <div className="space-y-5 px-6 py-6">
                    <div className="rounded-2xl bg-dm-bg-secondary p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-dm-text-primary">Contraentrega</p>
                          <p className="mt-1 text-xs text-dm-text-muted">Actívelo si el pago se realizará en destino.</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isContraentrega}
                          onClick={() => setIsContraentrega(!isContraentrega)}
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isContraentrega ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-dm-bg-primary shadow-md transition-transform duration-200 ease-in-out ${isContraentrega ? 'translate-x-5' : 'translate-x-0'}`} />
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

                    <div className="space-y-3 rounded-2xl border border-dm-border-primary p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dm-text-muted">Documento</span>
                        <span className="font-semibold text-dm-text-primary">{documentLabel}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dm-text-muted">Serie</span>
                        <span className="font-semibold text-dm-text-primary">{selectedSeriesValue || 'Sin serie'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dm-text-muted">Siguiente correlativo</span>
                        <span className="font-semibold text-dm-text-primary">{currentSeriesNumber || '...'}</span>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-dm-bg-primary rounded-lg p-8 shadow-2xl border border-dm-border-primary flex flex-col items-center space-y-4">
            <Spinner />
            <div className="text-center">
              <h3 className="text-xl font-bold text-dm-text-primary mb-2">
                Procesando Venta...
              </h3>
              <p className="text-dm-text-secondary">
                Por favor espere mientras se genera el comprobante
              </p>
              <p className="text-sm text-dm-text-muted mt-2">
                No cierre esta ventana ni realice otras acciones
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="-mx-4 w-full min-h-[calc(100vh-10rem)] pb-8 md:pb-10 lg:-mx-6">
        <div className="mx-auto mb-8 max-w-7xl px-4 pt-4 md:px-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-dm-text-primary text-center mb-2">
            Venta de Encomiendas y Carga
          </h1>
          <p className="text-center text-dm-text-secondary mb-2 max-w-xl mx-auto">
            El borrador se guarda automáticamente en esta sesión: puede volver atrás o recargar la página sin perder la encomienda en curso.
          </p>
          <p className="text-center text-dm-text-muted text-sm mb-6">Siga los pasos para registrar un nuevo envío.</p>
          <Stepper steps={steps} currentStep={currentStepIndex} onStepClick={handleStepperStepClick} />
        </div>
        <div className="px-4 md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <Modal
        isOpen={isClientEditModalOpen}
        onClose={() => setIsClientEditModalOpen(false)}
        title="Editar remitente y destinatario"
        maxWidth="4xl"
      >
        <p className="mb-4 text-sm text-dm-text-secondary">
          Los datos se actualizan al instante. Cada línea de encomienda puede tener su propio destinatario hasta que la edite desde la lista.
        </p>
        <div className="space-y-6 max-h-[min(70vh,640px)] overflow-y-auto pr-1">
          <div className="rounded-xl border border-dm-border-primary bg-dm-bg-primary p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dm-text-secondary">Remitente</h3>
            <PassengerDataForm passengerData={remitter} setPassengerData={setRemitter} />
          </div>
          <RecipientForm recipient={recipient} setRecipient={setRecipient} remitter={remitter} />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-dm-border-secondary pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsClientEditModalOpen(false)}>
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto" onClick={closeClientEditModal}>
            Listo
          </Button>
        </div>
      </Modal>

      <Modal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        title={editingItem ? 'Editar Item de Encomienda' : 'Añadir Item de Encomienda'} 
        maxWidth="3xl"
      >
        <CargoItemForm
          key={editingItem ? editingItem.id : `new-${cargoItemFormKey}`}
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
