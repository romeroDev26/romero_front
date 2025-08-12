import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { useQuotations } from '../hooks/useQuotations';
import { QuotationCreate, QuotationItemCreate } from '../types';
import { useQuotationSeriesByBranch } from '../hooks/useQuotationSeriesByBranch';
import { productsServicesService } from '../../../services/products-services.service';
import { useQuotationClientManager } from '../hooks/useQuotationClientManager';
import { 
  QuotationSeriesSelector,
  ClientSelector,
  ServiceSelector,
  QuotationItemsManager,
  QuotationSummary,
  LocalClient,
  SimpleItem
} from '../components';

// Constants
const QUOTATION_DOCUMENT_TYPE_CODE = 'COT';

export const QuotationNewPage: React.FC = () => {
  // Hook para gestión de clientes
  const { findOrCreateClient } = useQuotationClientManager();
  const navigate = useNavigate();
  
  // Hook para cotizaciones (incluye createQuotation)
  const { createQuotation } = useQuotations();
  
  // Estados de la nueva estructura dinámica
  const [selectedClient, setSelectedClient] = useState<LocalClient | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para servicios dinámicos
  const [serviceOptions, setServiceOptions] = useState<{ id: string; name: string }[]>([]);
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const services = await productsServicesService.getServices();
        setServiceOptions(
          services.map(s => ({ id: String(s.id), name: s.name }))
        );
      } catch (err) {
        setServiceOptions([]);
      }
    };
    fetchServices();
  }, []);

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
        // Construir datos para registro
        const clientData = {
          doc_type: selectedClient.doc_type,
          doc_number: selectedClient.doc_number,
          name: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          address_line: '',
          country_code: 'PE',
        };
        const client = await findOrCreateClient(clientData);
        clientId = client.id;
        setSelectedClient({ ...selectedClient, id: clientId });
      }
      
      // Convertir items simplificados al formato que espera el backend
      const quotationItems: QuotationItemCreate[] = items.map(item => ({
        product_id: 0, // No hay producto específico en este enfoque dinámico
        quantity: item.cantidad,
        unit_price: item.precio_unitario,
        unit_code: item.unidad,
        price_type_code: '01',
        discount: item.descuento,
        tax_category_code: '10',
        item_description: item.descripcion
      }));
      
      const quotationData: QuotationCreate = {
        client_id: clientId,
        document_type_code: QUOTATION_DOCUMENT_TYPE_CODE,
        series: selectedSeries,
        issue_date: new Date().toISOString().split('T')[0],
        issue_time: new Date().toTimeString().split(' ')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
        operation_type_code: '0101',
        currency_code: 'PEN',
        exchange_rate: 1.0,
        payment_terms: 'Contado',
        payment_method_code: '001',
        notes: observations,
        internal_notes: `Servicio: ${serviceOptions.find(s => s.id === selectedService)?.name || 'No especificado'}`,
        items: quotationItems
      };

      const quotation = await createQuotation(quotationData);
      if (quotation) {
        toast.success('Cotización creada exitosamente');
        navigate(`/sales/quotations/${quotation.id}`);
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error('Error al crear la cotización');
    } finally {
      setLoading(false);
    }
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
            {/* Serie - Columna más pequeña */}
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

            {/* Cliente - Columna más grande */}
            <div className="col-span-12 md:col-span-7">
              <ClientSelector
                selectedClient={selectedClient}
                onClientSelect={setSelectedClient}
              />
            </div>
          </div>
        </div>

        {/* Items de Cotización */}
        <QuotationItemsManager
          items={items}
          onItemsChange={setItems}
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
    </div>
  );
};
