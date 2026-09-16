// src/features/fluvial/quick-sales/pages/QuickSalePage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from '@/utils/sileo-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, 
  User,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { SplitPaymentForm, SplitPaymentData } from '../../../../components/common/SplitPaymentForm';
import { PassengerDataForm } from '../../components/sales-point/PassengerDataForm';
import { BranchSelector } from '../../components/sales-point/BranchSelector';
import { ConfirmSaleModal } from '../../components/sales-point/ConfirmSaleModal';
import { TicketPreviewModal } from '../../components/sales-point/TicketPreviewModal';
import { BackendInvoiceData } from '../../components/sales-point/tickets/types/backend.types';

import { ServiceSelector, RouteSection, ServiceDetailsForm } from '../components';
import { useProducts } from '../hooks/useProducts';
import { useRouteHistory } from '../hooks/useRouteHistory';
import { initialQuickSaleFormData } from '../types/quickSale.types';

import { mobileInvoicesService, MobileInvoiceCreateData } from '../../../../services/mobileInvoices.service';
import { invoicesService } from '../../../../services/invoices.service';
import { useDocumentSeriesForBranch } from '../../hooks/useDocumentSeriesForBranch';
import { useClientManager } from '../../hooks/useClientManager';
import { useBranchOffices } from '../../../../hooks/useBranchOffices';
import { useCompanyInfo } from '../../../../hooks/useCompanyInfo';

import { PassengerData, initialPassengerData } from '../../components/sales-point/core/types';
import { RecipientForm, RecipientData as RecipientFormData } from '../../../cargo/components/RecipientForm';
import { SunatDocType, SunatInvoiceType } from '../../types/sunat.types';
import { BranchOffice, CreateClientData } from '../../../../types';

export const QuickSalePage: React.FC = () => {
  const queryClient = useQueryClient();

  // Estado de sucursal
  const { data: companyInfo } = useCompanyInfo();
  const { data: branchOffices, isLoading: isLoadingBranches } = useBranchOffices(companyInfo?.id);
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);

  // Estado del cliente
  const [passengerData, setPassengerData] = useState<PassengerData>(initialPassengerData);
  
  // Estado del formulario de venta rápida
  const [formData, setFormData] = useState(initialQuickSaleFormData);
  
  // Estado de comprobante
  const [selectedBoletaSeries, setSelectedBoletaSeries] = useState<string>('');
  const [selectedFacturaSeries, setSelectedFacturaSeries] = useState<string>('');
  
  // Estado de pago dividido
  const [splitPaymentData, setSplitPaymentData] = useState<SplitPaymentData>({
    isSplitPayment: false,
    paymentMethod1: 'EFE',
    operationCode1: '',
    amount1: 0,
    paymentMethod2: 'YAP',
    operationCode2: '',
    amount2: 0,
  });
  const [isSplitPaymentValid, setIsSplitPaymentValid] = useState(true);
  
  // Estado de contraentrega
  const [isContraentrega, setIsContraentrega] = useState<boolean>(false);
  
  // Estado para controlar si se agrega destinatario
  const [showRecipientForm, setShowRecipientForm] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<RecipientFormData>({
    isSameAsSender: true,
    name: '',
    docType: '1',
    docNumber: '',
    phone: '',
  });
  
  // Estados para modales
  const [isConfirmSaleModalOpen, setIsConfirmSaleModalOpen] = useState(false);
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [ticketBackendData, setTicketBackendData] = useState<BackendInvoiceData | null>(null);

  // Hooks de datos
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { findOrCreateClient, isProcessingClient } = useClientManager();
  const {
    availableBoletaSeries,
    availableFacturaSeries,
    isLoading: isLoadingSeries,
  } = useDocumentSeriesForBranch(selectedBranch?.id || null);
  const { saveRoute, getOriginSuggestions, getDestinationSuggestions } = useRouteHistory();

  // Mutación para crear factura
  const { mutateAsync: createInvoice, isPending: isCreatingInvoice } = useMutation({
    mutationFn: (data: MobileInvoiceCreateData) => mobileInvoicesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Cargar sucursal desde localStorage
  useEffect(() => {
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      try {
        const savedBranch = JSON.parse(savedBranchJson) as BranchOffice;
        if (branchOffices) {
          const branchExists = branchOffices.find(b => b.id === savedBranch.id);
          if (branchExists) {
            setSelectedBranch(branchExists);
            return;
          }
        } else {
          setSelectedBranch(savedBranch);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved branch office", e);
      }
    }
  }, [branchOffices]);

  // Configurar series de documentos
  useEffect(() => {
    if (availableBoletaSeries.length > 0) {
      const cachedBoleta = localStorage.getItem('lastUsedBoletaSeries');
      if (cachedBoleta && availableBoletaSeries.some(s => s.series_code === cachedBoleta)) {
        setSelectedBoletaSeries(cachedBoleta);
      } else {
        setSelectedBoletaSeries(availableBoletaSeries[0].series_code);
      }
    }

    if (availableFacturaSeries.length > 0) {
      const cachedFactura = localStorage.getItem('lastUsedFacturaSeries');
      if (cachedFactura && availableFacturaSeries.some(s => s.series_code === cachedFactura)) {
        setSelectedFacturaSeries(cachedFactura);
      } else {
        setSelectedFacturaSeries(availableFacturaSeries[0].series_code);
      }
    }
  }, [availableBoletaSeries.length, availableFacturaSeries.length]);

  // Handlers para series
  const handleBoletaSeriesChange = (seriesCode: string) => {
    setSelectedBoletaSeries(seriesCode);
    localStorage.setItem('lastUsedBoletaSeries', seriesCode);
  };

  const handleFacturaSeriesChange = (seriesCode: string) => {
    setSelectedFacturaSeries(seriesCode);
    localStorage.setItem('lastUsedFacturaSeries', seriesCode);
  };

  // Calcular montos
  const calculatedAmounts = useMemo(() => {
    if (!formData.selectedProduct) {
      return { baseAmount: 0, igvAmount: 0, totalAmount: 0 };
    }

    // El precio ahora es obligatorio, no hay precio base por defecto
    const unitPrice = formData.customPrice ? parseFloat(formData.customPrice) : 0;
    
    const baseAmount = unitPrice * formData.quantity;
    let igvAmount = 0;
    let totalAmount = baseAmount;

    if (formData.isIgvGravado) {
      igvAmount = baseAmount * 0.18;
      totalAmount = baseAmount + igvAmount;
    }

    return { baseAmount, igvAmount, totalAmount };
  }, [formData.selectedProduct, formData.customPrice, formData.quantity, formData.isIgvGravado]);

  // Determinar si es RUC
  const isRuc = passengerData.docType === SunatDocType.RUC;
  const hasClientData = passengerData.docNumber.trim() !== '' && passengerData.name.trim() !== '';
  const requiresClientData = isRuc;

  // Validar formulario
  const isFormValid = useMemo(() => {
    // Validar producto seleccionado
    if (!formData.selectedProduct) return false;
    
    // Validar cantidad
    if (formData.quantity <= 0) return false;
    
    // Validar precio ingresado manualmente
    const priceValue = parseFloat(formData.customPrice);
    if (!formData.customPrice || isNaN(priceValue) || priceValue <= 0) return false;
    
    // Validar cliente solo si es RUC (factura)
    if (isRuc) {
      if (!passengerData.docNumber.trim() || !passengerData.name.trim()) {
        return false;
      }
    }
    
    // Validar serie seleccionada
    const selectedSeries = isRuc ? selectedFacturaSeries : selectedBoletaSeries;
    if (!selectedSeries) return false;
    
    // Validar pago dividido solo si está activo y NO es contraentrega
    if (!isContraentrega && splitPaymentData.isSplitPayment && !isSplitPaymentValid) {
      return false;
    }
    
    return true;
  }, [
    formData.selectedProduct,
    formData.quantity,
    formData.customPrice,
    isRuc,
    passengerData.docNumber,
    passengerData.name,
    selectedFacturaSeries,
    selectedBoletaSeries,
    isContraentrega,
    splitPaymentData.isSplitPayment,
    isSplitPaymentValid,
    recipient,
  ]);

  // Handler para pago dividido
  const handleSplitPaymentChange = useCallback((data: SplitPaymentData) => {
    setSplitPaymentData(data);
  }, []);

  const handleSplitPaymentValidationChange = useCallback((isValid: boolean) => {
    setIsSplitPaymentValid(isValid);
  }, []);

  // Handler para abrir modal de confirmación
  const handleOpenConfirmModal = () => {
    if (!isFormValid) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    if (!selectedBranch) {
      toast.error('Seleccione una sucursal');
      return;
    }
    
    setIsConfirmSaleModalOpen(true);
  };
  
  // Handler para confirmar venta
  const handleConfirmSale = async () => {
    setIsConfirmSaleModalOpen(false);

    if (!selectedBranch || !formData.selectedProduct) {
      toast.error('Faltan datos necesarios para completar la venta');
      return;
    }

    try {
      let clientId: number;
      
      // Si hay datos de cliente, buscar o crear
      if (hasClientData) {
        const clientData: CreateClientData = {
          doc_type: passengerData.docType,
          doc_number: passengerData.docNumber,
          name: passengerData.name,
          email: passengerData.email || undefined,
          phone: passengerData.phone || undefined,
          address_line: passengerData.address || undefined,
          country_code: passengerData.countryCode || 'PE',
        };
        
        const client = await findOrCreateClient(clientData);
        clientId = client.id;
      } else {
        clientId = 1; // Cliente genérico
      }

      // Construir el campo notes
      let notesContent = `Venta Rápida - ${formData.selectedProduct.name}`;
      if (formData.origin.trim() && formData.destination.trim()) {
        notesContent = `${formData.origin.trim()} > ${formData.destination.trim()}`;
        saveRoute(formData.origin, formData.destination);
      }

      // Calcular precio unitario (obligatorio, ingresado manualmente)
      const unitPrice = parseFloat(formData.customPrice);
      
      // Preparar datos de la factura
      const invoiceData: MobileInvoiceCreateData = {
        client_id: clientId,
        client_doc_type: hasClientData ? passengerData.docType : SunatDocType.DNI,
        client_doc_number: hasClientData ? passengerData.docNumber : '00000000',
        client_name: hasClientData ? passengerData.name : 'Cliente General',
        client_email: hasClientData ? passengerData.email || undefined : undefined,
        
        document_type_code: isRuc ? SunatInvoiceType.FACTURA : SunatInvoiceType.BOLETA,
        series: isRuc ? selectedFacturaSeries : selectedBoletaSeries,
        
        is_credit_sale: isContraentrega,
        total_discount: 0,
        notes: notesContent,
        
        // Método de pago: solo enviar si NO es contraentrega
        ...(!isContraentrega && {
          payment_method_code: splitPaymentData.paymentMethod1,
          payment_operation_code: splitPaymentData.operationCode1 || undefined,
          pago_yape_id: splitPaymentData.pagoYapeId || undefined,
        }),
        
        items: [
          (() => {
            const baseItem: any = {
              product_id: formData.selectedProduct.id,
              quantity: formData.quantity,
              unit_price: unitPrice,
              unit_code: formData.selectedProduct.unit_code,
              tax_category_code: formData.isIgvGravado ? '10' : '20',
              discount: 0,
              item_description: formData.description
                ? `${formData.selectedProduct.name} - ${formData.description}`
                : formData.selectedProduct.name,
            };

            // Si es una encomienda Y se activó agregar destinatario, adjuntar datos del destinatario
            if (formData.selectedProduct.name.toLowerCase().includes('encomienda') && showRecipientForm) {
              // Verificar si hay datos del destinatario
              const hasRecipientData = recipient.isSameAsSender
                ? (passengerData.docNumber.trim() && passengerData.name.trim())
                : (recipient.docNumber.trim() && recipient.name.trim());
              
              // Solo enviar datos si están completos
              if (hasRecipientData) {
                baseItem.recipient_name = recipient.isSameAsSender ? passengerData.name : recipient.name;
                baseItem.recipient_doc_type = recipient.isSameAsSender ? passengerData.docType : recipient.docType;
                baseItem.recipient_doc_number = recipient.isSameAsSender ? passengerData.docNumber : recipient.docNumber;
                baseItem.recipient_phone = recipient.isSameAsSender ? (passengerData.phone || '') : recipient.phone;
              }
            }

            return baseItem;
          })(),
        ],
      };

      // Agregar datos de pago dividido si está activo y NO es contraentrega
      if (!isContraentrega && splitPaymentData.isSplitPayment) {
        invoiceData.payment_amount_1 = splitPaymentData.amount1;
        invoiceData.payment_method_code_2 = splitPaymentData.paymentMethod2;
        invoiceData.payment_operation_code_2 = splitPaymentData.operationCode2 || undefined;
        invoiceData.payment_amount_2 = splitPaymentData.amount2;
      }

      // Crear factura
      const response = await createInvoice(invoiceData);
      
      // Obtener datos completos de la factura
      const fullInvoiceData = await invoicesService.getById(response.invoice_id);
      
      // Mostrar modal de preview
      setTicketBackendData(fullInvoiceData as unknown as BackendInvoiceData);
      setShowTicketPreview(true);
      
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      toast.error(
        error.response?.data?.detail || 
        error.message || 
        'Error al procesar la venta'
      );
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setPassengerData(initialPassengerData);
    setFormData(initialQuickSaleFormData);
    setShowRecipientForm(false);
    setRecipient({
      isSameAsSender: true,
      name: '',
      docType: '1',
      docNumber: '',
      phone: '',
    });
    setSplitPaymentData({
      isSplitPayment: false,
      paymentMethod1: 'EFE',
      operationCode1: '',
      amount1: 0,
      paymentMethod2: 'YAP',
      operationCode2: '',
      amount2: 0,
    });
    setIsContraentrega(false);
    setTicketBackendData(null);
    setShowTicketPreview(false);
  };
  
  const handleTicketPreviewClose = () => {
    setShowTicketPreview(false);
    setTicketBackendData(null);
    window.location.reload();
  };
  
  const handleTicketSuccess = () => {
    toast.success('Venta registrada exitosamente');
    resetForm();
  };

  // Loading state
  if (isLoadingBranches) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Handler para seleccionar sucursal inline
  const handleBranchSelect = (branch: BranchOffice) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
  };

  // Si no hay sucursal seleccionada, mostrar selector inline
  if (!selectedBranch) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dm-text-primary">Venta Rápida</h1>
              <p className="text-sm text-dm-text-secondary">
                Registre ventas de servicios y productos sin asociar a un viaje específico
              </p>
            </div>
          </div>
        </div>
        <BranchSelector onBranchSelect={handleBranchSelect} />
      </div>
    );
  }

  const isProcessing = isProcessingClient || isCreatingInvoice;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dm-text-primary">Venta Rápida</h1>
            <p className="text-sm text-dm-text-secondary">
              Registre ventas de servicios y productos sin asociar a un viaje específico
            </p>
          </div>
        </div>
        
        {/* Sucursal actual */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium">Sucursal:</span> {selectedBranch.name}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Formularios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selector de Servicio/Producto */}
          <ServiceSelector
            products={products || []}
            selectedProduct={formData.selectedProduct}
            onSelectProduct={(product) => setFormData({ ...formData, selectedProduct: product })}
            disabled={isProcessing}
            isLoading={isLoadingProducts}
          />

          {/* Datos del Cliente */}
          <div className="bg-dm-bg-primary p-6 rounded-lg shadow-sm border border-dm-border-primary">
            <h3 className="font-semibold text-lg text-dm-text-primary mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-dm-text-secondary" />
              Datos del Cliente (Opcional)
            </h3>
            
            {isRuc && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    Los datos del cliente son obligatorios para Facturas
                  </span>
                </div>
              </div>
            )}
            
            {!isRuc && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-sm">
                  <span className="text-sm">
                    Si no completa los datos del cliente, se usará un cliente genérico
                  </span>
                </div>
              </div>
            )}
            
            <PassengerDataForm
              passengerData={passengerData}
              setPassengerData={setPassengerData}
              disabled={isProcessing}
            />
          </div>

          {/* Agregar Destinatario - solo para Encomienda Fluvial */}
          {formData.selectedProduct?.name.toLowerCase().includes('encomienda') && (
            <div className="bg-dm-bg-primary p-6 rounded-lg shadow-sm border border-dm-border-primary">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-dm-text-primary flex items-center">
                    <User className="h-5 w-5 mr-2 text-dm-text-secondary" />
                    Agregar Destinatario
                  </h3>
                  <p className="text-sm text-dm-text-muted mt-1">
                    Opcional - Active para registrar datos del destinatario
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showRecipientForm}
                  onClick={() => setShowRecipientForm(!showRecipientForm)}
                  disabled={isProcessing}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    showRecipientForm ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-dm-bg-primary shadow-md transition-transform duration-200 ease-in-out ${
                      showRecipientForm ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {showRecipientForm && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-md p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Complete los datos del destinatario o marque si es el mismo que envía
                    </p>
                  </div>
                  <RecipientForm
                    recipient={recipient}
                    setRecipient={setRecipient}
                    remitter={{
                      name: passengerData.name,
                      docType: passengerData.docType,
                      docNumber: passengerData.docNumber,
                      phone: passengerData.phone,
                    }}
                    disabled={isProcessing}
                  />
                </div>
              )}
            </div>
          )}

          {/* Ruta */}
          <RouteSection
            origin={formData.origin}
            destination={formData.destination}
            onOriginChange={(value) => setFormData({ ...formData, origin: value })}
            onDestinationChange={(value) => setFormData({ ...formData, destination: value })}
            originSuggestions={getOriginSuggestions(formData.origin)}
            destinationSuggestions={getDestinationSuggestions(formData.destination)}
            disabled={isProcessing}
          />

          {/* Detalles del Servicio */}
          <ServiceDetailsForm
            selectedProduct={formData.selectedProduct}
            quantity={formData.quantity}
            customPrice={formData.customPrice}
            description={formData.description}
            isIgvGravado={formData.isIgvGravado}
            onQuantityChange={(value) => setFormData({ ...formData, quantity: value })}
            onCustomPriceChange={(value) => setFormData({ ...formData, customPrice: value })}
            onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
            onIgvGravadoChange={(value) => setFormData({ ...formData, isIgvGravado: value })}
            disabled={isProcessing}
          />
        </div>

        {/* Columna derecha: Resumen y Acción */}
        <div className="lg:col-span-1">
          <div className="bg-dm-bg-primary p-6 rounded-lg shadow-sm border border-dm-border-primary sticky top-6">
            <h3 className="font-semibold text-lg text-dm-text-primary mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-dm-text-secondary" />
              Resumen de Venta
            </h3>

            {/* Tipo de Comprobante */}
            <div className="mb-4 p-3 bg-dm-bg-secondary rounded-lg">
              <p className="text-xs text-dm-text-secondary mb-1">Tipo de Comprobante</p>
              <p className="text-sm font-medium text-dm-text-primary">
                {isRuc ? 'Factura Electrónica' : 'Boleta de Venta'}
              </p>
            </div>

            {/* Serie de Comprobante */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-dm-text-secondary mb-2">
                Serie *
              </label>
              {isRuc ? (
                <select
                  value={selectedFacturaSeries}
                  onChange={(e) => handleFacturaSeriesChange(e.target.value)}
                  disabled={isProcessing || isLoadingSeries}
                  className="w-full px-3 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-dm-bg-secondary"
                >
                  {availableFacturaSeries.map((series) => (
                    <option key={series.id} value={series.series_code}>
                      {series.series_code}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedBoletaSeries}
                  onChange={(e) => handleBoletaSeriesChange(e.target.value)}
                  disabled={isProcessing || isLoadingSeries}
                  className="w-full px-3 py-2 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-dm-bg-secondary"
                >
                  {availableBoletaSeries.map((series) => (
                    <option key={series.id} value={series.series_code}>
                      {series.series_code}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Alerta de contraentrega */}
            {isContraentrega && (
              <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                  Pago pendiente - Se cobrará al entregar
                </p>
              </div>
            )}

            {/* Método de Pago - Solo visible cuando NO es contraentrega */}
            {!isContraentrega && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-dm-text-secondary mb-2">
                  Método de Pago
                </label>
                <SplitPaymentForm
                  totalAmount={calculatedAmounts.totalAmount}
                  currencySymbol="S/"
                  disabled={isProcessing}
                  onPaymentDataChange={handleSplitPaymentChange}
                  onValidationChange={handleSplitPaymentValidationChange}
                  customerName={passengerData.name}
                />
              </div>
            )}

            {/* Switch de Contraentrega - Solo visible para Encomienda Fluvial */}
            {formData.selectedProduct?.name.toLowerCase().includes('encomienda') && (
              <div className="mb-4 bg-dm-bg-secondary p-4 rounded-lg border border-dm-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-dm-text-secondary mb-1">Contraentrega</p>
                    <p className="text-xs text-dm-text-muted">El pago se realizará al entregar</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isContraentrega}
                    onClick={() => setIsContraentrega(!isContraentrega)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isContraentrega ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-dm-bg-primary shadow-md transition-transform duration-200 ease-in-out ${isContraentrega ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Desglose de montos */}
            <div className="border-t border-dm-border-primary pt-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dm-text-secondary">Base:</span>
                <span className="font-medium">S/ {calculatedAmounts.baseAmount.toFixed(2)}</span>
              </div>
              
              {formData.isIgvGravado && (
                <div className="flex justify-between text-sm">
                  <span className="text-dm-text-secondary">IGV (18%):</span>
                  <span className="font-medium">S/ {calculatedAmounts.igvAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t border-dm-border-primary pt-2">
                <span>Total:</span>
                <span className="text-purple-600">
                  S/ {calculatedAmounts.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validaciones */}
            {!isFormValid && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2 text-red-800 dark:text-red-300 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Complete los campos requeridos:</p>
                    <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                      {!formData.selectedProduct && (
                        <li>Seleccione un servicio o producto</li>
                      )}
                      {formData.quantity <= 0 && (
                        <li>Ingrese una cantidad válida</li>
                      )}
                      {(!formData.customPrice || parseFloat(formData.customPrice) <= 0) && (
                        <li>Ingrese el precio de venta</li>
                      )}
                      {requiresClientData && (!passengerData.docNumber.trim() || !passengerData.name.trim()) && (
                        <li>Complete los datos del cliente</li>
                      )}
                      {!isContraentrega && splitPaymentData.isSplitPayment && !isSplitPaymentValid && (
                        <li>Verifique los montos del pago dividido</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de confirmar */}
            <Button
              onClick={handleOpenConfirmModal}
              disabled={!isFormValid || isProcessing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 dark:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirmar Venta
                </>
              )}
            </Button>

            {/* Botón de limpiar */}
            <Button
              onClick={resetForm}
              disabled={isProcessing}
              variant="outline"
              className="w-full mt-3"
            >
              Limpiar Formulario
            </Button>
          </div>
        </div>
      </div>
      
      {/* Modal de Confirmación de Venta */}
      <ConfirmSaleModal
        isOpen={isConfirmSaleModalOpen}
        onClose={() => setIsConfirmSaleModalOpen(false)}
        onConfirm={handleConfirmSale}
        isLoading={isProcessing}
        totalAmount={calculatedAmounts.totalAmount}
        currencySymbol="S/"
        passengerName={passengerData.name || 'Cliente'}
        saleType="normal"
      />
      
      {/* Modal de Preview de Ticket */}
      {ticketBackendData && (
        <TicketPreviewModal
          isOpen={showTicketPreview}
          onClose={handleTicketPreviewClose}
          backendData={ticketBackendData}
          onSuccess={handleTicketSuccess}
          initialPhoneNumber={passengerData.phone || ''}
          onClearForm={resetForm}
        />
      )}
    </div>
  );
};

export default QuickSalePage;
