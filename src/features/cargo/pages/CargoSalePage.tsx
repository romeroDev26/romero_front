// src/features/cargo/pages/CargoSalePage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { CreditCard, PlusIcon, PencilIcon, TrashIcon, ClipboardListIcon, HashIcon } from 'lucide-react';

import { PassengerDataForm } from '../../fluvial/components/sales-point/PassengerDataForm';
import { TripSelection } from '../../fluvial/components/sales-point/TripSelection';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { useClientManager } from '../../fluvial/hooks/useClientManager';
import { useCreateInvoice } from '../../fluvial/hooks/useInvoices';
import { Spinner } from '../../../components/common/Spinner';
import { useDocumentSeriesForBranch } from '../../fluvial/hooks/useDocumentSeriesForBranch';
import { Stepper } from '../../../components/common/Stepper.tsx';

import { CargoItemForm } from '../components/CargoItemForm';
import { RecipientForm, RecipientData as RecipientFormData } from '../components/RecipientForm';
import { CargoTripSelector } from '../components/CargoTripSelector';
import { CargoItemData } from '../types/cargo-ui.types';
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
}

export const CargoSalePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<CargoSaleView>('clientSelection');
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  const [isContraentrega, setIsContraentrega] = useState<boolean>(false);
  
  const [remitter, setRemitter] = useState<ClientData>({ docType: SunatDocType.DNI, docNumber: '', name: '', address: '', phone: '', email: '' });
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

  // Estados para método de pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("EFE");
  const [paymentOperationCode, setPaymentOperationCode] = useState("");

  // Opciones para método de pago
  const paymentMethodOptions = [
    { value: 'EFE', label: 'Efectivo' },
    { value: 'TRF', label: 'Transferencia Bancaria' },
    { value: 'YAP', label: 'Yape' },
    { value: 'PLN', label: 'Plin' },
    { value: 'DEP', label: 'Depósito en Cuenta' },
    { value: 'OTR', label: 'Otros' },
  ];

  // --- INICIO: Lógica de Series Replicada ---
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

  // Efecto para limpiar código de operación cuando se cambia a efectivo
  useEffect(() => {
    if (selectedPaymentMethod === "EFE") {
      setPaymentOperationCode("");
    }
  }, [selectedPaymentMethod]);

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
  
  const handleFinalizeSale = async () => {
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
        doc_type: remitter.docType, doc_number: remitter.docNumber, name: remitter.name,
        address_line: remitter.address, phone: remitter.phone, email: remitter.email,
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
        payment_method_code: selectedPaymentMethod,
        payment_operation_code: paymentOperationCode || undefined,
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
      
    } catch (error: any) {
      console.error('Error creando venta de encomienda:', error);
      toast.error(error.response?.data?.detail || 'Error al crear la venta');
    }
  };

  const handleTicketSuccess = () => {
    // Resetear completamente para una nueva venta después del ticket
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
    setIsContraentrega(false); // Asegurar que el switch esté desactivado
    setSelectedPaymentMethod("EFE"); // Resetear método de pago
    setPaymentOperationCode(""); // Limpiar código de operación
    setCurrentView('clientSelection');
    
    // Limpiar datos del ticket
    setShowTicketPreview(false);
    setTicketBackendData(null);
    
    toast.success('¡Venta de encomienda completada y ticket generado!');
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
    setIsContraentrega(false); // Asegurar que el switch esté desactivado
    setSelectedPaymentMethod("EFE"); // Resetear método de pago
    setPaymentOperationCode(""); // Limpiar código de operación
    
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

  const renderContent = () => {
    if (!selectedBranch) return <div className="p-6 text-center text-gray-500">Cargando...</div>;
    
    switch (currentView) {
      case 'clientSelection':
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Datos del Remitente */}
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Datos del Remitente</h2>
              <p className="text-gray-500 mb-6">Complete la información de la persona o empresa que realiza el envío.</p>
              <PassengerDataForm passengerData={remitter} setPassengerData={setRemitter} />
            </div>
            
            {/* Datos del Destinatario */}
            <RecipientForm recipient={recipient} setRecipient={setRecipient} remitter={remitter} />
            
            {/* Botón de navegación */}
            <div className="flex justify-end">
              <Button onClick={() => handleNextStep('tripSelection')}>Siguiente: Seleccionar Viaje</Button>
            </div>
          </div>
        );

      case 'tripSelection':
        return (
          <div className="bg-white p-8 rounded-lg shadow-sm border">
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
            />
             <div className="mt-6"><Button variant="outline" onClick={() => setCurrentView('clientSelection')}>Volver a Datos del Remitente</Button></div>
          </div>
        );

      case 'tripSegmentSelection':
        return (
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border">
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
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => { setSelectedTrip(null); setCurrentView('tripSelection'); }}>
                Volver a Seleccionar Viaje
              </Button>
              <Button onClick={() => handleNextStep('itemsDefinition')}>
                Siguiente: Definir Encomiendas
              </Button>
            </div>
          </div>
        );

      case 'itemsDefinition':
        return (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header con información del paso */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => { setSelectedDestinationId(null); setCurrentView('tripSegmentSelection'); }}
                >
                  Volver a Seleccionar Tramo
                </Button>
                <div className="bg-gray-50 p-4 rounded-lg border flex-1 max-w-md">
                  <h3 className="font-semibold text-sm text-gray-800 mb-3 flex items-center">
                    <ClipboardListIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Comprobante
                  </h3>
                  {isLoadingSeries ? (
                    <Spinner />
                  ) : (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {isRuc ? "Serie de Factura" : "Serie de Boleta"}
                        </label>
                        <select
                          value={isRuc ? selectedFacturaSeries : selectedBoletaSeries}
                          onChange={(e) => isRuc ? handleFacturaSeriesChange(e.target.value) : handleBoletaSeriesChange(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                          disabled={(isRuc ? availableFacturaSeries.length : availableBoletaSeries.length) <= 1}
                        >
                          {(isRuc ? availableFacturaSeries : availableBoletaSeries).map((s) => (
                            <option key={s.id} value={s.series_code}>
                              {s.series_code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Siguiente N°
                        </label>
                        <div className="relative">
                          <HashIcon className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            value={currentSeriesNumber || '...'} 
                            disabled 
                            className="w-full p-2 pl-7 border-gray-200 bg-gray-100 rounded-md text-xs text-center" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                  {/* Remitente */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Remitente</p>
                    <p className="font-semibold text-gray-900 text-sm">{remitter.name}</p>
                    <p className="text-xs text-gray-600">{remitter.docType}: {remitter.docNumber}</p>
                  </div>
                  
                  {/* Destinatario */}
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Destinatario</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {recipient.isSameAsSender ? 'Mismo Remitente' : recipient.name}
                    </p>
                    {!recipient.isSameAsSender && (
                      <p className="text-xs text-gray-600">{recipient.docType}: {recipient.docNumber}</p>
                    )}
                  </div>
                  
                  {/* Viaje */}
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Viaje</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedTrip?.trip_name}</p>
                  </div>
                  
                  {/* Tramo */}
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">Tramo</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {tripDetails?.stops?.find(s => s.port_id === selectedOriginId)?.port?.name} → {tripDetails?.stops?.find(s => s.port_id === selectedDestinationId)?.port?.name}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} 
                  size="md"
                  className="bg-blue-600 hover:bg-blue-700 ml-6"
                >
                  <PlusIcon className="w-5 h-5 mr-2" /> Añadir Encomienda
                </Button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio/Descripción
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cargoItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center">
                          <ClipboardListIcon className="h-12 w-12 text-gray-300 mb-2" />
                          <p>Añada una encomienda para empezar</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cargoItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{item.product.name}</div>
                            <div className="text-sm text-gray-600">{item.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          S/ {(item.quantity * item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCargoItems(items => items.filter(i => i.id !== item.id))}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna Izquierda: Total y Método de Pago */}
                <div className="space-y-4">
                  {/* Total a Pagar */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total a Pagar</p>
                    <p className="text-4xl font-bold text-gray-900">S/ {totalSaleAmount.toFixed(2)}</p>
                  </div>

                  {/* Selector de Método de Pago */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-md bg-white"
                    >
                      {paymentMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* Campo de código de operación (solo para métodos diferentes a efectivo) */}
                    {selectedPaymentMethod !== "EFE" && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Código de Operación
                        </label>
                        <input
                          type="text"
                          value={paymentOperationCode}
                          onChange={(e) => {
                            if (e.target.value.length <= 20) {
                              setPaymentOperationCode(e.target.value);
                            }
                          }}
                          placeholder="Ingrese el código de operación..."
                          className="w-full p-2.5 border border-gray-300 rounded-md"
                          maxLength={20}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {paymentOperationCode.length}/20 caracteres
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Opciones y Botón de Acción */}
                <div className="flex flex-col justify-end space-y-4">
                  {/* Switch de Contraentrega */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Contraentrega</p>
                        <p className="text-xs text-gray-500">El pago se realizará al recibir la encomienda</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isContraentrega}
                        onClick={() => setIsContraentrega(!isContraentrega)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isContraentrega ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${isContraentrega ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Botón de Generar Venta */}
                  <Button 
                    onClick={handleFinalizeSale} 
                    size="lg"
                    isLoading={isProcessingClient || isCreatingInvoice} 
                    disabled={cargoItems.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 w-full text-lg py-4"
                  >
                    <CreditCard className="w-5 h-5 mr-2" /> Generar Venta y Comprobante
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Venta de Encomiendas y Carga</h1>
        <p className="text-center text-gray-500 mb-8">Siga los pasos para registrar un nuevo envío.</p>
        <Stepper steps={steps} currentStep={currentStepIndex} />
      </div>
      {renderContent()}
      <Modal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        title={editingItem ? 'Editar Ítem de Encomienda' : 'Añadir Ítem de Encomienda'} 
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
    </div>
  );
};