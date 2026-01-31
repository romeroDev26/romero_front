// src/features/fluvial/pages/ExtraBaggageSalePage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase, 
  DollarSign, 
  User,
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { SplitPaymentForm, SplitPaymentData } from '../../../components/common/SplitPaymentForm';
import { PassengerDataForm } from '../components/sales-point/PassengerDataForm';
import { ConfirmSaleModal } from '../components/sales-point/ConfirmSaleModal';
import { TicketPreviewModal } from '../components/sales-point/TicketPreviewModal';
import { BackendInvoiceData } from '../components/sales-point/tickets/types/backend.types';

import { mobileInvoicesService, MobileInvoiceCreateData } from '../../../services/mobileInvoices.service';
import { invoicesService } from '../../../services/invoices.service';
import { useDocumentSeriesForBranch } from '../hooks/useDocumentSeriesForBranch';
import { useClientManager } from '../hooks/useClientManager';
import { useBranchOffices } from '../../../hooks/useBranchOffices';
import { useCompanyInfo } from '../../../hooks/useCompanyInfo';

import { PassengerData, initialPassengerData } from '../components/sales-point/core/types';
import { SunatDocType, SunatInvoiceType } from '../types/sunat.types';
import { BranchOffice, CreateClientData } from '../../../types';

const EXTRA_BAGGAGE_PRODUCT_ID = 7;
const DEFAULT_UNIT_CODE = 'NIU';

export const ExtraBaggageSalePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado de sucursal
  const { data: companyInfo } = useCompanyInfo();
  const { data: branchOffices, isLoading: isLoadingBranches } = useBranchOffices(companyInfo?.id);
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(null);

  // Estado del cliente
  const [passengerData, setPassengerData] = useState<PassengerData>(initialPassengerData);
  
  // Estado del formulario
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isIgvGravado, setIsIgvGravado] = useState<boolean>(false); // Por defecto Exonerado (20)
  
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
  
  // Estados para modales
  const [isConfirmSaleModalOpen, setIsConfirmSaleModalOpen] = useState(false);
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [ticketBackendData, setTicketBackendData] = useState<BackendInvoiceData | null>(null);

  // Hooks de datos
  const { findOrCreateClient, isProcessingClient } = useClientManager();
  const {
    availableBoletaSeries,
    availableFacturaSeries,
    isLoading: isLoadingSeries,
  } = useDocumentSeriesForBranch(selectedBranch?.id || null);

  // Mutación para crear factura
  const { mutateAsync: createInvoice, isPending: isCreatingInvoice } = useMutation({
    mutationFn: (data: MobileInvoiceCreateData) => mobileInvoicesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Cargar sucursal desde localStorage (mismo cache que SalesPointPage)
  useEffect(() => {
    // Intentar cargar desde el cache del punto de venta (selectedSalesBranch)
    const savedBranchJson = localStorage.getItem('selectedSalesBranch');
    if (savedBranchJson) {
      try {
        const savedBranch = JSON.parse(savedBranchJson) as BranchOffice;
        // Verificar que la sucursal guardada existe en las sucursales disponibles
        if (branchOffices) {
          const branchExists = branchOffices.find(b => b.id === savedBranch.id);
          if (branchExists) {
            setSelectedBranch(branchExists);
            return;
          }
        } else {
          // Si aun no se cargaron las sucursales, usar el objeto guardado
          setSelectedBranch(savedBranch);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved branch office", e);
      }
    }
    
    // Fallback: Si no hay cache valido y hay sucursales disponibles
    // no seleccionar automaticamente ninguna para forzar al usuario a ir al punto de venta
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
  const priceNumber = useMemo(() => parseFloat(price) || 0, [price]);
  
  const calculatedAmounts = useMemo(() => {
    const baseAmount = priceNumber;
    let igvAmount = 0;
    let totalAmount = baseAmount;

    if (isIgvGravado) {
      // IGV 18%
      igvAmount = baseAmount * 0.18;
      totalAmount = baseAmount + igvAmount;
    }

    return {
      baseAmount,
      igvAmount,
      totalAmount,
    };
  }, [priceNumber, isIgvGravado]);

  // Determinar si es RUC
  const isRuc = passengerData.docType === SunatDocType.RUC;
  
  // Para equipaje extra, los datos del cliente son opcionales
  // Si no se proporcionan, se usa el cliente especial ID 1
  const hasClientData = passengerData.docNumber.trim() !== '' && passengerData.name.trim() !== '';
  const requiresClientData = isRuc; // Solo facturas requieren datos obligatorios

  // Validar formulario
  const isFormValid = useMemo(() => {
    // Validar precio
    if (!price || priceNumber <= 0) return false;
    
    // Validar cliente solo si es RUC (factura)
    if (isRuc) {
      if (!passengerData.docNumber.trim() || !passengerData.name.trim()) {
        return false;
      }
    }
    
    // Validar serie seleccionada
    const selectedSeries = isRuc ? selectedFacturaSeries : selectedBoletaSeries;
    if (!selectedSeries) return false;
    
    // Validar pago dividido si está activo
    if (splitPaymentData.isSplitPayment && !isSplitPaymentValid) {
      return false;
    }
    
    return true;
  }, [
    price,
    priceNumber,
    isRuc,
    passengerData.docNumber,
    passengerData.name,
    selectedFacturaSeries,
    selectedBoletaSeries,
    splitPaymentData.isSplitPayment,
    isSplitPaymentValid,
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
  
  // Handler para confirmar venta (después de confirmación en modal)
  const handleConfirmSale = async () => {
    // Cerrar modal de confirmación
    setIsConfirmSaleModalOpen(false);

    if (!selectedBranch) {
      toast.error('Seleccione una sucursal');
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
        // Sin datos de cliente, usar cliente especial ID 1
        clientId = 1;
      }

      // 2. Preparar datos de la factura
      const invoiceData: MobileInvoiceCreateData = {
        client_id: clientId,
        client_doc_type: hasClientData ? passengerData.docType : SunatDocType.DNI,
        client_doc_number: hasClientData ? passengerData.docNumber : '00000000',
        client_name: hasClientData ? passengerData.name : 'Cliente General',
        client_email: hasClientData ? passengerData.email || undefined : undefined,
        
        document_type_code: isRuc ? SunatInvoiceType.FACTURA : SunatInvoiceType.BOLETA,
        series: isRuc ? selectedFacturaSeries : selectedBoletaSeries,
        
        is_credit_sale: false,
        total_discount: 0,
        notes: `Venta de Equipaje Extra - Sucursal: ${selectedBranch.name}`,
        
        // Método de pago principal
        payment_method_code: splitPaymentData.paymentMethod1,
        payment_operation_code: splitPaymentData.operationCode1 || undefined,
        
        items: [
          {
            product_id: EXTRA_BAGGAGE_PRODUCT_ID,
            quantity: 1,
            unit_price: priceNumber,
            unit_code: DEFAULT_UNIT_CODE,
            tax_category_code: isIgvGravado ? '10' : '20',
            discount: 0,
            item_description: description 
              ? `Equipaje Extra - ${description}` 
              : 'Equipaje Extra',
          },
        ],
      };

      // Agregar datos de pago dividido si está activo
      if (splitPaymentData.isSplitPayment) {
        invoiceData.payment_amount_1 = splitPaymentData.amount1;
        invoiceData.payment_method_code_2 = splitPaymentData.paymentMethod2;
        invoiceData.payment_operation_code_2 = splitPaymentData.operationCode2 || undefined;
        invoiceData.payment_amount_2 = splitPaymentData.amount2;
      }

      // 3. Crear factura
      const response = await createInvoice(invoiceData);
      
      // 4. Obtener los datos completos de la factura usando el invoice_id
      const fullInvoiceData = await invoicesService.getById(response.invoice_id);
      
      // 5. Mostrar modal de preview de ticket con los datos completos
      setTicketBackendData(fullInvoiceData as unknown as BackendInvoiceData);
      setShowTicketPreview(true);
      
    } catch (error: any) {
      console.error('Error al crear factura de equipaje:', error);
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
    setPrice('');
    setDescription('');
    setIsIgvGravado(false);
    setSplitPaymentData({
      isSplitPayment: false,
      paymentMethod1: 'EFE',
      operationCode1: '',
      amount1: 0,
      paymentMethod2: 'YAP',
      operationCode2: '',
      amount2: 0,
    });
    setTicketBackendData(null);
    setShowTicketPreview(false);
  };
  
  // Handler para cuando se cierra el modal de ticket
  const handleTicketPreviewClose = () => {
    setShowTicketPreview(false);
    setTicketBackendData(null);
    // Recargar la página para limpiar todos los datos
    window.location.reload();
  };
  
  // Handler para cuando el ticket se genera exitosamente
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

  // Si no hay sucursal seleccionada
  if (!selectedBranch) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">No hay sucursal seleccionada</p>
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            Por favor, seleccione una sucursal desde el punto de venta principal.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/fluvial/operations/sales-point')}
            className="mt-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ir a Punto de Venta
          </Button>
        </div>
      </div>
    );
  }

  const isProcessing = isProcessingClient || isCreatingInvoice;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Briefcase className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Venta de Equipaje Extra</h1>
            <p className="text-sm text-gray-600">
              Registre ventas de exceso de equipaje sin asociar a un viaje específico
            </p>
          </div>
        </div>
        
        {/* Sucursal actual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Sucursal:</span> {selectedBranch.name}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Formularios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del Cliente */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-600" />
              Datos del Cliente (Opcional)
            </h3>
            
            {isRuc && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    Los datos del cliente son obligatorios para Facturas
                  </span>
                </div>
              </div>
            )}
            
            {!isRuc && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
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

          {/* Detalles del Equipaje */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
              Detalles del Equipaje
            </h3>

            <div className="space-y-4">
              {/* Precio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (Monto a Cobrar) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    S/
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={isProcessing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Descripción opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Maleta adicional, Bicicleta, Caja grande..."
                  maxLength={100}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/100 caracteres
                </p>
              </div>

              {/* Switch IGV */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Aplicar IGV (18%)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isIgvGravado 
                        ? 'Gravado - Se aplicará IGV al monto ingresado' 
                        : 'Exonerado - Sin IGV'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isIgvGravado}
                    onClick={() => setIsIgvGravado(!isIgvGravado)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isIgvGravado ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                        isIgvGravado ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: Resumen y Accion */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-600" />
              Resumen de Venta
            </h3>

            {/* Tipo de Comprobante */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Tipo de Comprobante</p>
              <p className="text-sm font-medium text-gray-800">
                {isRuc ? 'Factura Electrónica' : 'Boleta de Venta'}
              </p>
            </div>

            {/* Serie de Comprobante */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serie *
              </label>
              {isRuc ? (
                <select
                  value={selectedFacturaSeries}
                  onChange={(e) => handleFacturaSeriesChange(e.target.value)}
                  disabled={isProcessing || isLoadingSeries}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                >
                  {availableBoletaSeries.map((series) => (
                    <option key={series.id} value={series.series_code}>
                      {series.series_code}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Método de Pago */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <SplitPaymentForm
                totalAmount={calculatedAmounts.totalAmount}
                currencySymbol="S/"
                disabled={isProcessing}
                onPaymentDataChange={handleSplitPaymentChange}
                onValidationChange={handleSplitPaymentValidationChange}
              />
            </div>

            {/* Desglose de montos */}
            <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base:</span>
                <span className="font-medium">S/ {calculatedAmounts.baseAmount.toFixed(2)}</span>
              </div>
              
              {isIgvGravado && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGV (18%):</span>
                  <span className="font-medium">S/ {calculatedAmounts.igvAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-purple-600">
                  S/ {calculatedAmounts.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validaciones */}
            {!isFormValid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2 text-red-800 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Complete los campos requeridos:</p>
                    <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                      {(!price || priceNumber <= 0) && (
                        <li>Ingrese un precio válido</li>
                      )}
                      {requiresClientData && (!passengerData.docNumber.trim() || !passengerData.name.trim()) && (
                        <li>Complete los datos del cliente</li>
                      )}
                      {splitPaymentData.isSplitPayment && !isSplitPaymentValid && (
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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
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
          showOnly80mm={true}
        />
      )}
    </div>
  );
};

export default ExtraBaggageSalePage;
