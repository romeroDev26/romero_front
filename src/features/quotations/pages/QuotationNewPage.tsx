import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { useQuotations } from '../hooks/useQuotations';
import { QuotationCreate, QuotationItemCreate } from '../types';
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
import type { ServiceOption } from '../components/ServiceSelector';

// Constants
const QUOTATION_DOCUMENT_TYPE_CODE = 'COT';

export const QuotationNewPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Hook para cotizaciones (incluye createQuotation)
  const { createQuotation } = useQuotations();
  
  // Estados de la nueva estructura dinámica
  const [selectedClient, setSelectedClient] = useState<LocalClient | null>(null);
  // Guardar el objeto completo del servicio seleccionado
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
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

  // Lista estática de servicios reales
  const serviceOptions: ServiceOption[] = [
    {
      id: 1,
      internal_code: "SRV-PAS-001",
      name: "Servicio de Transporte de Pasajeros",
      description: "Servicio de Transporte de Pasajeros.",
      item_type: "SERVICE",
      service_category: "PASAJES",
      unit_code: "NIU",
      purchase_price: "0.0000",
      sale_price: "132.6000",
      currency_code: "PEN",
      tax_category_code: "20",
      unspcs_code: "78111804",
      specific_route_id: null,
      is_active: true,
      created_at: "2025-06-13 08:27:57.356503-05",
      updated_at: "2025-07-31 22:52:02.895876-05"
    },
    {
      id: 7,
      internal_code: "SRV-EXT-001",
      name: "Exceso de Equipaje",
      description: "Cobro por bulto o maleta adicional que excede la franquicia permitida por pasajero",
      item_type: "SERVICE",
      service_category: "OTROS",
      unit_code: "NIU",
      purchase_price: "0.0000",
      sale_price: "40.2200",
      currency_code: "PEN",
      tax_category_code: "20",
      unspcs_code: null,
      specific_route_id: null,
      is_active: true,
      created_at: "2025-07-18 12:14:48.089203-05",
      updated_at: "2025-07-31 22:52:03.146683-05"
    },
    {
      id: 3,
      internal_code: "SRV-CAR-001",
      name: "Servicio de Transporte de Carga General",
      description: "Servicio de Transporte de Carga General.",
      item_type: "SERVICE",
      service_category: "CARGA_GENERAL_KGM",
      unit_code: "KGM",
      purchase_price: "0.0000",
      sale_price: "31.5700",
      currency_code: "PEN",
      tax_category_code: "20",
      unspcs_code: "78121603",
      specific_route_id: null,
      is_active: true,
      created_at: "2025-06-13 08:28:55.489316-05",
      updated_at: "2025-07-31 22:52:03.395911-05"
    },
    {
      id: 2,
      internal_code: "SRV-ENC-001",
      name: "Servicio de Envío de Encomienda",
      description: "Servicio de Envío de Encomienda.",
      item_type: "SERVICE",
      service_category: "ENCOMIENDA",
      unit_code: "NIU",
      purchase_price: "0.0000",
      sale_price: "13.1300",
      currency_code: "PEN",
      tax_category_code: "20",
      unspcs_code: "78121600",
      specific_route_id: null,
      is_active: true,
      created_at: "2025-06-13 08:28:15.689698-05",
      updated_at: "2025-07-31 22:52:03.64463-05"
    }
  ];

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

      const quotation = await createQuotation(quotationData);
      if (quotation) {
        setCreatedQuotation(quotation);
        setShowPreviewModal(true);
        // No navegamos, solo abrimos el modal
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error('Error al crear la cotización');
    } finally {
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
                  serviceOptions={serviceOptions}
                  onServiceSelect={setSelectedService}
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
