// src/features/cargo/pages/CargoSalePage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, set } from 'date-fns';
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
import { CargoItemData } from '../types/cargo-ui.types';
import { BranchOffice } from '../../../types';
import { SunatDocType, SunatInvoiceType } from '../../fluvial/types/sunat.types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { useTripDetails } from '../../fluvial/hooks/useTripDetails';

type CargoSaleView = 'clientSelection' | 'tripSelection' | 'itemsDefinition';

interface ClientData {
  docType: string; docNumber: string; name: string;
  address: string; phone: string; email: string;
}

export const CargoSalePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<CargoSaleView>('clientSelection');
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);
  
  const [remitter, setRemitter] = useState<ClientData>({ docType: SunatDocType.DNI, docNumber: '', name: '', address: '', phone: '', email: '' });
  const [selectedTrip, setSelectedTrip] = useState<AvailableTripByPort | null>(null);
  const [cargoItems, setCargoItems] = useState<CargoItemData[]>([]);

  // Hook para obtener los detalles del viaje seleccionado (incluye stops)
  const { data: tripDetails } = useTripDetails(selectedTrip ? selectedTrip.id : null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoItemData | null>(null);

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

    // Obtener los trip stops del viaje seleccionado
    // Usamos el hook useTripDetails para obtener los stops
    // Pero aquí, para asegurar que siempre tenemos los datos, podemos obtenerlos directamente antes de enviar
    // Si ya tienes los stops en el estado, usa eso; si no, deberías obtenerlos aquí
    // Suponiendo que tienes un hook useTripDetails
    // Si no, puedes agregarlo arriba:
    // const { data: tripDetails } = useTripDetails(selectedTrip?.id);
    // Y usar tripDetails?.stops
    // Aquí asumo que tienes tripDetails en el scope
    // Si no, deberás agregar el hook y pasarlo como prop o contexto
    // ---
    // Para este edit, asumo que tienes tripDetails
    // Si no, dime y lo ajusto
    // ---
    // Si tripDetails no está disponible, no se puede continuar
    // Si está, obtenemos los stops
    // ---
    // Si no tienes tripDetails, agrega:
    // const { data: tripDetails } = useTripDetails(selectedTrip?.id);
    // Y usa tripDetails?.stops
    // ---
    // Aquí agrego la lógica suponiendo que tienes tripDetails
    // ---
    // Si no, dime y lo ajusto
    // ---
    // Obtener los stops del viaje seleccionado
    // Si no hay stops, no se puede continuar
    // ---
    // Aquí va la lógica:
    // const boardingStopId = tripDetails?.stops?.[0]?.id;
    // const disembarkingStopId = tripDetails?.stops?.[tripDetails.stops.length - 1]?.id;
    // ---
    // Si no hay stops, mostrar error
    // ---
    // Si todo bien, agregar estos IDs a cada item antes de enviarlos
    // ---
    // Si tienes dudas, dime y lo ajusto
    // ---
    // Aquí va el código real:
    // ---
    // Obtener detalles del viaje
    if (!tripDetails || !tripDetails.stops || tripDetails.stops.length < 2) {
      toast.error('No se pudieron obtener las paradas del viaje.');
      return;
    }
    const boardingStopId = tripDetails.stops[0].id;
    const disembarkingStopId = tripDetails.stops[tripDetails.stops.length - 1].id;

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
        notes: `Venta de Encomiendas. Sucursal: ${selectedBranch.name}`,
        items: cargoItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.price,
          tax_category_code: item.product.tax_category_code,
          item_description: item.description,
          unit_code: item.product.unit_code,
          trip_id: selectedTrip.id,
          recipient_name: item.recipient.isSameAsSender ? remitter.name : item.recipient.name,
          recipient_doc_type: item.recipient.isSameAsSender ? remitter.docType : item.recipient.docType,
          recipient_doc_number: item.recipient.isSameAsSender ? remitter.docNumber : item.recipient.docNumber,
          recipient_phone: item.recipient.isSameAsSender ? remitter.phone : item.recipient.phone,
          boarding_trip_stop_id: boardingStopId,
          disembarking_trip_stop_id: disembarkingStopId,
        })),
      };

      await createInvoice({
        invoiceData: invoicePayload,
        tripId: selectedTrip.id
      });
      toast.success('¡Venta de encomienda completada!');
      // Resetear para una nueva venta
      setRemitter({ docType: SunatDocType.DNI, docNumber: '', name: '', address: '', phone: '', email: '' });
      setSelectedTrip(null);
      setCargoItems([]);
      setCurrentView('clientSelection');

    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al procesar la venta.');
    }
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

  const steps = ['Datos del Remitente', 'Seleccionar Viaje', 'Definir Encomiendas'];
  const currentStepIndex = useMemo(() => {
    switch (currentView) {
      case 'clientSelection': return 0;
      case 'tripSelection': return 1;
      case 'itemsDefinition': return 2;
      default: return 0;
    }
  }, [currentView]);

  const renderContent = () => {
    if (!selectedBranch) return <div className="p-6 text-center text-gray-500">Cargando...</div>;
    
    switch (currentView) {
      case 'clientSelection':
        return (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border">
            <p className="text-gray-500 mb-6 text-center">Complete la información de la persona o empresa que realiza el envío.</p>
            <PassengerDataForm passengerData={remitter} setPassengerData={setRemitter} />
            <div className="mt-6 flex justify-end">
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
              onTripSelect={(trip) => { setSelectedTrip(trip); handleNextStep('itemsDefinition'); }}
              onChangeBranch={() => navigate('/fluvial/operations/sales-point')}
            />
             <div className="mt-6"><Button variant="outline" onClick={() => setCurrentView('clientSelection')}>Volver a Datos del Remitente</Button></div>
          </div>
        );

      case 'itemsDefinition':
        return (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header con información del paso */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              {/* Fila superior con botón volver y selector de comprobante */}
              <div className="flex justify-between items-start mb-4">
                {/* Botón volver - lado izquierdo */}
                <Button 
                  variant="outline" 
                  onClick={() => { setSelectedTrip(null); setCurrentView('tripSelection'); }}
                >
                  Volver a Seleccionar Viaje
                </Button>

                {/* Selector de comprobante - lado derecho */}
                <div className="bg-gray-50 p-4 rounded-lg border min-w-[300px]">
                  <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center">
                    <ClipboardListIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Comprobante
                  </h3>
                  {isLoadingSeries ? (
                    <Spinner />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Siguiente N°
                        </label>
                        <div className="relative">
                          <HashIcon className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            value={currentSeriesNumber || '...'} 
                            disabled 
                            className="w-full p-2 pl-7 border-gray-200 bg-gray-100 rounded-md text-sm text-center" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Título y información del paso */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    Remitente: <span className="font-semibold">{remitter.name}</span> | 
                    Viaje: <span className="font-semibold">{selectedTrip?.trip_name}</span>
                  </p>
                </div>
                <Button 
                  onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} 
                  size="md"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="w-5 h-5 mr-2" /> Añadir Encomienda
                </Button>
              </div>
            </div>

            {/* Tabla de encomiendas */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio/Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destinatario
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
                      <td colSpan={4} className="text-center py-12 text-gray-500">
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
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.recipient.isSameAsSender ? 'Mismo Remitente' : item.recipient.name}
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

            {/* Total y botón de finalizar */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-lg text-gray-600 mb-2">Total a Pagar:</p>
                  <p className="text-3xl font-bold text-gray-800 mb-4">S/ {totalSaleAmount.toFixed(2)}</p>
                  <Button 
                    onClick={handleFinalizeSale} 
                    size="lg"
                    isLoading={isProcessingClient || isCreatingInvoice} 
                    disabled={cargoItems.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
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
        />
      </Modal>
    </div>
  );
};