import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/utils/sileo-toast';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import {
  InformationCircleIcon,
  UserGroupIcon,
  Bars3BottomLeftIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useCreateQuotation } from '../hooks/useQuotations';
import { useProductServices } from '../hooks/useProductServices';
import { QuotationCreate, QuotationItemCreate, Quotation } from '../types';
import { BranchOffice } from '../../../types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { useQuotationSeriesByBranch } from '../hooks/useQuotationSeriesByBranch';
import {
  QuotationSeriesSelector,
  ClientSelector,
  QuotationItemsManager,
  QuotationSummary,
  QuotationPreviewModal,
  LocalClient,
  SimpleItem
} from '../components';
import { QuotationBranchStep } from '../components/QuotationBranchStep';
import { QuotationTripStep } from '../components/QuotationTripStep';

// Constants
const QUOTATION_DOCUMENT_TYPE_CODE = 'COT';

type QuotationStep = 'branch' | 'trip' | 'form';

export const QuotationNewPage: React.FC = () => {
  const navigate = useNavigate();

  // ---- Flujo por pasos ----
  const [step, setStep] = useState<QuotationStep>(() => {
    const saved = localStorage.getItem('selectedSalesBranch');
    return saved ? 'trip' : 'branch';
  });
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice | null>(() => {
    const saved = localStorage.getItem('selectedSalesBranch');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });
  const [selectedTrip, setSelectedTrip] = useState<AvailableTripByPort | null>(null);

  const handleBranchSelect = (branch: BranchOffice) => {
    localStorage.setItem('selectedSalesBranch', JSON.stringify(branch));
    setSelectedBranch(branch);
    setStep('trip');
  };

  const handleTripSelect = (trip: AvailableTripByPort) => {
    setSelectedTrip(trip);
    setStep('form');
  };

  const handleChangeBranch = () => {
    localStorage.removeItem('selectedSalesBranch');
    setSelectedBranch(null);
    setSelectedTrip(null);
    setStep('branch');
  };

  const handleChangeTrip = () => {
    setSelectedTrip(null);
    setStep('trip');
  };

  // ---- Hooks del formulario ----
  // Hook para crear cotización con React Query
  const createQuotationMutation = useCreateQuotation();
  
  // Hook para cargar servicios reales desde la API
  const { services, loading: servicesLoading, error: servicesError } = useProductServices();
  
  // Estados de la nueva estructura dinámica
  const [selectedClient, setSelectedClient] = useState<LocalClient | null>(null);
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  // Nuevos estados para las funcionalidades agregadas
  const [validUntil, setValidUntil] = useState<Date | null>(() => {
    // Fecha por defecto: 30 días desde hoy
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  const [includeIGV, setIncludeIGV] = useState(false); // Por defecto desactivado (sin IGV)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Estados para el modal de previsualización
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdQuotation, setCreatedQuotation] = useState<Quotation | null>(null);

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
  const handleCreate = async () => {
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
      const clientId = selectedClient.id;
      if (clientId === 0) {
  // Aquí iría la lógica para registrar el cliente si fuera necesario
        // Aquí deberías llamar a la función para crear el cliente y obtener el nuevo clientId
        // Por ejemplo: clientId = await findOrCreateClient(clientData);
        setSelectedClient({ ...selectedClient, id: clientId });
      }
      
      // Convertir items simplificados al formato que espera el backend
      const quotationItems: QuotationItemCreate[] = items.map(item => ({
        product_id: item.service_id || 0,
        quantity: item.cantidad,
        unit_price: parseFloat(item.precio_unitario.toFixed(10)),
        unit_code: item.unidad,
        price_type_code: '01',
        discount: parseFloat(item.descuento.toFixed(10)),
        tax_category_code: includeIGV ? '10' : '20',
        item_description: item.descripcion,
        // Incluir el ID del viaje seleccionado si existe
        ...(selectedTrip ? { trip_id: selectedTrip.id } : {}),
      }));
      
      const tripNotes = selectedTrip
        ? ` | Viaje: ${selectedTrip.trip_name} | Embarcacion: ${selectedTrip.vessel_name}`
        : '';

      const quotationData: QuotationCreate = {
        client_id: clientId,
        document_type_code: QUOTATION_DOCUMENT_TYPE_CODE,
        series: selectedSeries,
        issue_date: new Date().toISOString().split('T')[0],
        issue_time: new Date().toTimeString().split(' ')[0],
        valid_until: validUntil ? validUntil.toISOString().split('T')[0] : '',
        operation_type_code: '0101',
        currency_code: 'PEN',
        exchange_rate: 1.0,
        payment_terms: 'Contado',
        payment_method_code: '001',
        notes: observations,
        internal_notes: `Servicios: ${items.map(i => i.service_name || 'N/A').join(', ')} | IGV: ${includeIGV ? 'Incluido' : 'No incluido'}${tripNotes}`,
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
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
    setItems([]);
    setObservations('');
    
    // Resetear la serie seleccionada
    handleSeriesChange('');
    
    // Resetear nuevos campos
    const newValidDate = new Date();
    newValidDate.setDate(newValidDate.getDate() + 30);
    setValidUntil(newValidDate);
    setIncludeIGV(false);
    
    setShowPreviewModal(false);
    setCreatedQuotation(null);

    // Volver a la selección de viaje (misma sucursal)
    setSelectedTrip(null);
    setStep('trip');
  };

  // ── Paso 1: Selección de sucursal ──────────────────────────────────────────
  if (step === 'branch') {
    return <QuotationBranchStep onBranchSelect={handleBranchSelect} />;
  }

  // ── Paso 2: Selección de viaje ──────────────────────────────────────────────
  if (step === 'trip' && selectedBranch) {
    return (
      <QuotationTripStep
        branch={selectedBranch}
        onTripSelect={handleTripSelect}
        onChangeBranch={handleChangeBranch}
      />
    );
  }

  // ── Paso 3: Formulario de cotización ────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="-mx-4 md:-mx-6 -mt-6">
        {/* Page header */}
        <header className="bg-dm-bg-primary/90 border-b border-dm-border-primary px-4 md:px-6 py-2.5 md:py-4 mb-4 md:mb-8">
        <div className="flex items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <div className="bg-primary p-1.5 md:p-2 rounded-lg text-white shrink-0">
              <DocumentTextIcon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold tracking-tight text-dm-text-primary">Nueva Cotización</h1>
              {selectedTrip && (
                <p className="text-xs md:text-sm text-dm-text-muted flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="text-dm-text-muted">Paso 3 de 3 —</span>
                  <span className="text-primary font-medium truncate hidden sm:inline">
                    {selectedTrip.trip_name} · {selectedTrip.vessel_name}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 md:gap-3 shrink-0">
            {selectedTrip && (
              <button
                type="button"
                onClick={handleChangeTrip}
                className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-dm-text-secondary border border-dm-border-primary hover:bg-dm-bg-hover rounded-lg transition-colors"
              >
                Cambiar viaje
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/sales/quotations')}
              className="px-2.5 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-dm-text-secondary hover:bg-dm-bg-hover rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 pb-8 space-y-6">
        {/* Alert de error */}
        {servicesError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex gap-3">
            <svg className="h-5 w-5 text-red-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error al cargar servicios</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{servicesError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">

            {/* ── Columna izquierda ── */}
            <div className="space-y-8 min-w-0">

              {/* Información Básica */}
              <section className="bg-dm-bg-primary rounded-xl border border-dm-border-primary shadow-sm">
                <div className="bg-dm-bg-secondary px-4 md:px-6 py-3 border-b border-dm-border-secondary">
                  <h3 className="flex items-center gap-2 text-base md:text-lg font-semibold text-dm-text-primary">
                    <InformationCircleIcon className="h-5 w-5 text-primary" />
                    Información Básica
                  </h3>
                </div>
                <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <QuotationSeriesSelector
                    selectedSeries={selectedSeries}
                    quotationSeries={quotationSeries}
                    seriesLoading={seriesLoading}
                    seriesError={seriesError}
                    selectedSeriesData={selectedSeriesData}
                    onSeriesChange={handleSeriesChange}
                  />
                  <div className="flex flex-col justify-center relative" ref={datePickerRef}>
                    <label className="block text-sm font-medium text-dm-text-secondary mb-2">
                      Fecha de Vencimiento
                    </label>
                    {/* Trigger button */}
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="inline-flex items-center w-full px-4 py-2 bg-dm-bg-primary border border-dm-border-primary rounded-lg text-sm font-medium text-dm-text-secondary hover:bg-dm-bg-hover transition-colors shadow-sm cursor-pointer"
                    >
                      <CalendarDaysIcon className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="flex-1 text-left">
                        {validUntil
                          ? validUntil.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Selecciona una fecha'}
                      </span>
                      <ChevronDownIcon className={`w-4 h-4 ml-2 shrink-0 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                    </button>
                    {/* Dropdown calendar panel — mismo estilo que DateRangeFilter */}
                    {showDatePicker && (
                      <div className="absolute top-full left-0 z-50 mt-2 bg-dm-bg-primary rounded-xl shadow-2xl border border-dm-border-primary p-4">
                        <div className="custom-datepicker-wrapper">
                          <DatePicker
                            selected={validUntil}
                            onChange={(date: Date | null) => {
                              setValidUntil(date);
                              setShowDatePicker(false);
                            }}
                            minDate={new Date()}
                            locale={es}
                            inline
                            calendarClassName="custom-datepicker"
                            dayClassName={(date) => {
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isSelected = validUntil && date.toDateString() === validUntil.toDateString();
                              if (isSelected) return 'bg-indigo-600 text-white rounded-full';
                              if (isToday) return 'border-2 border-indigo-600 rounded-full';
                              return '';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* IGV toggle — card style */}
                  <div
                    className="flex items-center justify-between p-4 bg-dm-bg-secondary rounded-lg border border-dm-border-primary cursor-pointer h-full"
                    onClick={() => setIncludeIGV(!includeIGV)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-dm-text-muted font-semibold text-base">%</span>
                      <span className="text-sm font-medium text-dm-text-secondary">Aplicar IGV (18%)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIncludeIGV(!includeIGV); }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        includeIGV ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-dm-bg-primary border border-dm-border-primary transition-transform ${
                          includeIGV ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                </div>
              </section>

              {/* Datos del Cliente */}
              <section className="bg-dm-bg-primary rounded-xl border border-dm-border-primary shadow-sm overflow-hidden">
                <div className="bg-dm-bg-secondary px-4 md:px-6 py-3 border-b border-dm-border-secondary">
                  <h3 className="flex items-center gap-2 text-base md:text-lg font-semibold text-dm-text-primary">
                    <UserGroupIcon className="h-5 w-5 text-primary" />
                    Datos del Cliente
                  </h3>
                </div>
                <div className="p-4 md:p-6">
                  <ClientSelector
                    selectedClient={selectedClient}
                    onClientSelect={setSelectedClient}
                  />
                </div>
              </section>

              {/* Aviso de seguridad en mobile */}
              <section className="lg:hidden bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">Seguridad</p>
                  <p className="text-[11px] text-dm-text-secondary leading-relaxed mt-0.5">
                    Esta cotización cumple con los estándares fiscales vigentes.
                  </p>
                </div>
              </section>

              {/* Ítems */}
              <QuotationItemsManager
                items={items}
                onItemsChange={setItems}
                serviceOptions={services}
                servicesLoading={servicesLoading}
              />

              {/* Observaciones */}
              <section className="bg-dm-bg-primary rounded-xl border border-dm-border-primary shadow-sm overflow-hidden">
                <div className="bg-dm-bg-secondary px-4 md:px-6 py-3 border-b border-dm-border-secondary">
                  <h3 className="flex items-center gap-2 text-base md:text-lg font-semibold text-dm-text-primary">
                    <Bars3BottomLeftIcon className="h-5 w-5 text-primary" />
                    Observaciones
                  </h3>
                </div>
                <div className="p-4 md:p-6">
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={4}
                    className="w-full border border-dm-border-primary rounded-lg px-3 py-2.5 text-sm text-dm-text-secondary placeholder:text-dm-text-muted bg-dm-bg-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    placeholder="Escriba aquí notas adicionales, términos o condiciones..."
                  />
                </div>
              </section>

            </div>

            {/* ── Columna derecha: Resumen (sticky en desktop) ── */}
            <div className="hidden lg:block h-full">
              <QuotationSummary
                items={items}
                includeIGV={includeIGV}
                isLoading={loading || seriesLoading}
                isDisabled={!selectedSeries || !selectedClient || items.length === 0}
                onSubmit={handleCreate}
                onCancel={() => navigate('/sales/quotations')}
                showSecurity
                stickySidebar
              />
            </div>

            {/* Resumen en mobile (al final del flujo) */}
            <div className="lg:hidden col-span-1">
              <QuotationSummary
                items={items}
                includeIGV={includeIGV}
                isLoading={loading || seriesLoading}
                isDisabled={!selectedSeries || !selectedClient || items.length === 0}
                onSubmit={handleCreate}
                onCancel={() => navigate('/sales/quotations')}
                showSecurity
              />
            </div>

          </div>
        </form>
      </div>

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
    </div>
  );
};
