import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { useCreateQuotation } from '../hooks/useQuotations';
import { useProductServices } from '../hooks/useProductServices';
import { QuotationCreate, QuotationItemCreate } from '../types';
import { ProductService } from '../../../types';
import { useQuotationSeriesByBranch } from '../hooks/useQuotationSeriesByBranch';
import { 
  QuotationSeriesSelector,
  ClientSelector,
  ServiceSelector,
  QuotationItemsManager,
  QuotationSummary,
  QuotationPreviewModal,
  LocalClient,
  SimpleItem
} from '../components';

// Constants
const QUOTATION_DOCUMENT_TYPE_CODE = 'COT';

export const QuotationNewPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Hook para crear cotización con React Query
  const createQuotationMutation = useCreateQuotation();
  
  // Hook para cargar servicios reales desde la API
  const { services, loading: servicesLoading, error: servicesError } = useProductServices();
  
  // Estados de la nueva estructura dinámica
  const [selectedClient, setSelectedClient] = useState<LocalClient | null>(null);
  // Guardar el objeto completo del servicio seleccionado
  const [selectedService, setSelectedService] = useState<ProductService | null>(null);
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  // Nuevos estados para las funcionalidades agregadas
  const [validUntil, setValidUntil] = useState(() => {
    // Fecha por defecto: 30 días desde hoy
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [includeIGV, setIncludeIGV] = useState(false); // Por defecto desactivado (sin IGV)

  // Estados para el modal de previsualización
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdQuotation, setCreatedQuotation] = useState<any>(null);

  // Hook para series (incluye currentUser)
  const {
    selectedSeries,
    selectedSeriesData,
    quotationSeries,
    loading: seriesLoading,
    error: seriesError,
    handleSeriesChange
  } = useQuotationSeriesByBranch();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSeries) {
      toast.error('Debe seleccionar una serie');
      return;
    }

    if (!selectedClient) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    if (items.length === 0) {
      toast.error('Debe agregar al menos un item');
      return;
    }

    setLoading(true);
    try {
      // Registrar o actualizar cliente si no existe
      let clientId = selectedClient.id;
      if (clientId === 0) {
  // Aquí iría la lógica para registrar el cliente si fuera necesario
        // Aquí deberías llamar a la función para crear el cliente y obtener el nuevo clientId
        // Por ejemplo: clientId = await findOrCreateClient(clientData);
        setSelectedClient({ ...selectedClient, id: clientId });
      }
      
      // Convertir items simplificados al formato que espera el backend
      const quotationItems: QuotationItemCreate[] = items.map(item => ({
        product_id: selectedService?.id || 0, // Usar el ID del servicio seleccionado
        quantity: item.cantidad,
        unit_price: parseFloat(item.precio_unitario.toFixed(10)),
        unit_code: item.unidad,
        price_type_code: '01',
        discount: parseFloat(item.descuento.toFixed(10)),
        tax_category_code: includeIGV ? '10' : '20', // 10 = Con IGV, 20 = Sin IGV
        item_description: item.descripcion
      }));
      
      const quotationData: QuotationCreate = {
        client_id: clientId,
        document_type_code: QUOTATION_DOCUMENT_TYPE_CODE,
        series: selectedSeries,
        issue_date: new Date().toISOString().split('T')[0],
        issue_time: new Date().toTimeString().split(' ')[0],
        valid_until: validUntil, // Usar la fecha seleccionada por el usuario
        operation_type_code: '0101',
        currency_code: 'PEN',
        exchange_rate: 1.0,
        payment_terms: 'Contado',
        payment_method_code: '001',
        notes: observations,
        internal_notes: `Servicio: ${selectedService?.name || 'No especificado'} | IGV: ${includeIGV ? 'Incluido' : 'No incluido'}`,
        items: quotationItems
      };

      createQuotationMutation.mutate(quotationData, {
        onSuccess: (quotation) => {
          setCreatedQuotation(quotation);
          setShowPreviewModal(true);
          setLoading(false);
          // No navegamos, solo abrimos el modal
        },
        onError: (error) => {
          console.error('Error creating quotation:', error);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error('Error al crear la cotización');
      setLoading(false);
    }
  };

  // Funciones para el modal
  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setCreatedQuotation(null);
    // Navegar a la lista de cotizaciones
    navigate('/sales/quotations');
  };

  const handleNewQuotation = () => {
    // Limpiar formulario
    setSelectedClient(null);
    setSelectedService(null);
    setItems([]);
    setObservations('');
    
    // Resetear la serie seleccionada
    handleSeriesChange('');
    
    // Resetear nuevos campos
    const newValidDate = new Date();
    newValidDate.setDate(newValidDate.getDate() + 30);
    setValidUntil(newValidDate.toISOString().split('T')[0]);
    setIncludeIGV(false); // Por defecto sin IGV
    
    setShowPreviewModal(false);
    setCreatedQuotation(null);
    
    // Mantenerse en la página de creación con formulario limpio
    toast.info('Formulario limpio para nueva cotización');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/sales/quotations')}
        >
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Alerta de error al cargar servicios */}
        {servicesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error al cargar servicios
                </h3>
                <p className="mt-1 text-sm text-red-700">{servicesError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Información Básica */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-100">
            Información Básica
          </h3>
          <div className="grid grid-cols-12 gap-6">
            {/* Serie - Columna pequeña */}
            <div className="col-span-12 md:col-span-2">
              <QuotationSeriesSelector
                selectedSeries={selectedSeries}
                quotationSeries={quotationSeries}
                seriesLoading={seriesLoading}
                seriesError={seriesError}
                selectedSeriesData={selectedSeriesData}
                onSeriesChange={handleSeriesChange}
              />
            </div>

            {/* Servicio - Columna mediana */}
            <div className="col-span-12 md:col-span-3">
              <ServiceSelector
                selectedService={selectedService}
                serviceOptions={services}
                onServiceSelect={setSelectedService}
                loading={servicesLoading}
              />
            </div>

            {/* Cliente - Columna más grande, más hacia la izquierda */}
            <div className="col-span-12 md:col-span-7">
              <ClientSelector
                selectedClient={selectedClient}
                onClientSelect={setSelectedClient}
              />
            </div>
          </div>

          {/* Segunda fila: Controles adicionales */}
          <div className="grid grid-cols-12 gap-6 mt-6 pt-6 border-t border-gray-100">
            {/* Fecha de Validez */}
            <div className="col-span-12 md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Válida hasta *
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Switch IGV */}
            <div className="col-span-12 md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IGV
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIncludeIGV(!includeIGV)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    includeIGV ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      includeIGV ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600">
                  {includeIGV ? 'Con IGV (18%)' : 'Sin IGV'}
                </span>
              </div>
            </div>

            {/* Espacio para futuros controles */}
            <div className="col-span-12 md:col-span-6">
              {/* Espacio reservado para controles adicionales */}
            </div>
          </div>
        </div>

        {/* Items de Cotización */}
        <QuotationItemsManager
          items={items}
          onItemsChange={setItems}
          selectedService={selectedService}
        />

        {/* Observaciones y Total */}
        <QuotationSummary
          items={items}
          observations={observations}
          onObservationsChange={setObservations}
        />

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/sales/quotations')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || seriesLoading || !selectedSeries || !selectedClient || items.length === 0}
          >
            {loading ? <Spinner /> : 'Crear Cotización'}
          </Button>
        </div>
      </form>

      {/* Modal de Previsualización */}
      {showPreviewModal && createdQuotation && (
        <QuotationPreviewModal
          isOpen={showPreviewModal}
          onClose={handleClosePreview}
          onNewQuotation={handleNewQuotation}
          quotation={createdQuotation}
        />
      )}
    </div>
  );
};
