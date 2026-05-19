// src/features/fluvial/pages/ScheduleTripsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from '@/utils/sileo-toast';
import { useTripsView } from '../hooks/useTripsView';
import { useTripMutations } from '../hooks/useTrips';
import { useScheduledTemplates } from '../hooks/useScheduledTemplates';
import { authService } from '../../../services/auth.service';
import { User, ScheduledRouteTemplate } from '../../../types';
import { UnifiedTripViewItem } from '../hooks/useTripsView';
import { useCities } from '../../../hooks/useCitiesPortsData';

import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { ScheduledTemplatesTable } from '../components/schedule/ScheduledTemplatesTable';
import { TripsTable } from '../components/schedule/TripsTable';
import { ScheduledTemplateFormModal } from '../components/schedule/ScheduledTemplateFormModal';
import { TripFormModal } from '../components/schedule/TripFormModal';
import { TripFilters, TripAdvancedFilters } from '../components/schedule/TripFilters';
import { CalendarView } from '../components/schedule/CalendarView';
import { ManifestGenerationModal } from '../components/schedule/ManifestGenerationModal';
import { ManifestPreviewModal } from '../../manifests/components/ManifestPreviewModal';
import { Manifest } from '../../manifests/types/manifest.types';

type ViewFilterMode = 'upcoming' | 'week' | 'history';

const VIEW_FILTER_LABELS: Record<ViewFilterMode, string> = {
  upcoming: 'Proximos Viajes',
  week: 'Vista Semanal',
  history: 'Historial',
};

export const ScheduleTripsPage: React.FC = () => {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduledRouteTemplate | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<UnifiedTripViewItem | null>(null);
  const [selectedTripForManifest, setSelectedTripForManifest] = useState<UnifiedTripViewItem | null>(null);
  const [createdManifest, setCreatedManifest] = useState<Manifest | null>(null);
  const [initialDateForNewTrip, setInitialDateForNewTrip] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [viewFilter, setViewFilter] = useState<ViewFilterMode>('upcoming');
  const [weekDate, setWeekDate] = useState(new Date());
  const [advancedFilters, setAdvancedFilters] = useState<TripAdvancedFilters>({
    origin_city_id: undefined,
    destination_city_id: undefined,
    status: undefined,
    search: undefined,
  });

  const COMPANY_ID = 1;

  const { isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => authService.getProfile(),
  });

  const { data: rawTrips = [], isLoading: isLoadingTrips, refetch } = useTripsView({
    viewMode: viewFilter,
    weekDate,
    companyId: COMPANY_ID,
    filters: advancedFilters,
  });

  const { data: cities = [] } = useCities();

  // Filtros frontend: status, search, y ciudades de origen/destino
  const trips = useMemo(() => {
    let result = rawTrips;
    
    if (advancedFilters.origin_city_id || advancedFilters.destination_city_id) {
      const originCity = cities.find(c => c.id === advancedFilters.origin_city_id);
      const destCity = cities.find(c => c.id === advancedFilters.destination_city_id);

      const originName = (originCity?.name || '').toLowerCase().trim();
      const destName = (destCity?.name || '').toLowerCase().trim();

      result = result.filter(t => {
        // Los nombres de origen/destino ya vienen en origin_port_name / destination_port_name
        // del UnifiedTripViewItem. Usamos el trip_name como fallback por si el endpoint
        // no rellena esos campos.
        const oPort = (t.origin_port_name || '').toLowerCase();
        const dPort = (t.destination_port_name || '').toLowerCase();
        const tName = (t.trip_name || '').toLowerCase();

        let matchOrigin = !advancedFilters.origin_city_id;
        let matchDest   = !advancedFilters.destination_city_id;

        if (advancedFilters.origin_city_id && originName) {
          matchOrigin = oPort.includes(originName) || tName.includes(originName);
        }
        if (advancedFilters.destination_city_id && destName) {
          matchDest = dPort.includes(destName) || tName.includes(destName);
        }

        return matchOrigin && matchDest;
      });
    }

    if (advancedFilters.status) {
      result = result.filter((t) => t.status === advancedFilters.status);
    }
    if (advancedFilters.search) {
      const q = advancedFilters.search.toLowerCase();
      result = result.filter(
        (t) =>
          (t.trip_name ?? '').toLowerCase().includes(q) ||
          (t.vessel_name ?? '').toLowerCase().includes(q) ||
          String(t.trip_id).includes(q)
      );
    }
    return result;
  }, [rawTrips, advancedFilters.status, advancedFilters.search, advancedFilters.origin_city_id, advancedFilters.destination_city_id, cities]);

  const { templates: scheduledTemplates, isLoading: isLoadingTemplates } = useScheduledTemplates(COMPANY_ID);

  const { createTemplate, updateTemplate, deactivateTemplate } = useScheduledTemplates(COMPANY_ID);
  const { createTrip, updateTrip, cancelTrip, isCreating: isCreatingTrip, isUpdating: isUpdatingTrip } = useTripMutations();

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const handleEditTemplate = (template: ScheduledRouteTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateModalOpen(true);
  };

  const handleDeleteTemplate = (template: ScheduledRouteTemplate) => {
    if (window.confirm(`¿Está seguro de desactivar la plantilla "${template.template_name}"?`)) {
      deactivateTemplate(template.id);
    }
  };

  const handleSaveTemplate = (data: any) => {
    if (selectedTemplate) {
      const { company_id, ...updateData } = data;
      updateTemplate({ id: selectedTemplate.id, data: updateData });
    } else {
      createTemplate({ ...data, company_id: COMPANY_ID });
    }
    setIsTemplateModalOpen(false);
  };

  const handleCreateTrip = () => {
    setSelectedTrip(null);
    setInitialDateForNewTrip(null);
    setIsTripModalOpen(true);
  };

  const handleDateClickFromCalendar = (date: Date) => {
    setSelectedTrip(null);
    setInitialDateForNewTrip(date);
    setIsTripModalOpen(true);
  };

  const handleEditTrip = (trip: UnifiedTripViewItem) => {
    setSelectedTrip(trip);
    setInitialDateForNewTrip(null);
    setIsTripModalOpen(true);
  };

  const handleCancelTrip = async (trip: UnifiedTripViewItem) => {
    const reason = window.prompt('Ingrese el motivo de cancelación (mínimo 10 caracteres):');
    if (reason && reason.length >= 10) {
      try {
        await cancelTrip({ id: trip.trip_id, data: { reason } });
        refetch();
      } catch (error) {
        toast.error('Error al cancelar el viaje');
      }
    } else if (reason !== null) {
      toast.warn('El motivo debe tener al menos 10 caracteres.');
    }
  };

  const handleSaveTrip = async (data: any) => {
    try {
      if (selectedTrip) {
        await updateTrip({ id: selectedTrip.trip_id, data });
      } else {
        await createTrip({ ...data, company_id: COMPANY_ID });
      }
      setIsTripModalOpen(false);
      refetch();
    } catch (error) {
      toast.error('Error al guardar el viaje');
    }
  };

  const handleGenerateManifest = (trip: UnifiedTripViewItem) => {
    setSelectedTripForManifest(trip);
    setIsManifestModalOpen(true);
  };

  const handleManifestGenerated = () => {
    refetch();
  };

  const handleManifestCreated = (manifest: Manifest, _type: 'PASSENGER' | 'CARGO') => {
    setCreatedManifest(manifest);
    setIsManifestModalOpen(false);
    setIsPreviewModalOpen(true);
  };

  const mapManifestToManifestData = (manifest: Manifest): Manifest => {
    const result = {
      ...manifest,
      vessel_name: selectedTripForManifest?.vessel_name || undefined,
      route_name: undefined,
      departure_datetime: selectedTripForManifest?.departure_datetime || manifest.generation_date,
      total_passengers: manifest.total_passengers || 0,
      total_cargo_weight_kg: manifest.total_cargo_weight_kg || 0,
      items: manifest.items || []
    };
    return result;
  };

  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    setCreatedManifest(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Encabezado de pagina ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programar Viajes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestione las plantillas de viajes recurrentes y los viajes programados
        </p>
      </div>

      {/* ── Seccion: Plantillas de Viajes Recurrentes ────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Plantillas de Viajes Recurrentes</h2>
            {!isLoadingTemplates && (
              <p className="text-xs text-gray-400 mt-0.5">
                {scheduledTemplates?.length ?? 0}{' '}
                {(scheduledTemplates?.length ?? 0) === 1 ? 'plantilla configurada' : 'plantillas configuradas'}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleCreateTemplate}
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>

        {isLoadingTemplates ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <ScheduledTemplatesTable
            templates={scheduledTemplates || []}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
          />
        )}
      </div>

      {/* ── Seccion: Viajes Programados ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header de la seccion */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Titulo + contador */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900">Viajes Programados</h2>
              {!isLoadingTrips && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {trips.length} {trips.length === 1 ? 'viaje encontrado' : 'viajes encontrados'}
                </p>
              )}
            </div>

            {/* Controles de accion */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Toggle tabla / calendario */}
              <div className="flex bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    viewMode === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                  Calendario
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Actualizar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateTrip}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                >
                  <PlusIcon className="h-4 w-4" />
                  Nuevo Viaje
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs de modo de vista */}
          <div className="mt-4 flex gap-1 p-1 bg-gray-100 rounded-xl w-full sm:w-fit">
            {(Object.keys(VIEW_FILTER_LABELS) as ViewFilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewFilter(mode)}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  viewFilter === mode
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {VIEW_FILTER_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="px-5 py-4 border-b border-gray-100">
          <TripFilters
            currentDate={weekDate}
            onDateChange={setWeekDate}
            filters={advancedFilters}
            onFiltersChange={(filters) => setAdvancedFilters(prev => ({ ...prev, ...filters }))}
            viewMode={viewFilter}
          />
        </div>

        {/* Contenido principal */}
        {isLoadingTrips ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : viewMode === 'table' ? (
          <TripsTable
            trips={trips}
            onEdit={handleEditTrip}
            onCancel={handleCancelTrip}
            onGenerateManifest={handleGenerateManifest}
          />
        ) : (
          <div className="p-4">
            <CalendarView
              trips={trips as unknown as any[]}
              onTripClick={(trip) => {
                const unifiedTrip: UnifiedTripViewItem = {
                  ...trip,
                  trip_name: trip.trip_name ?? null,
                  original_data: trip,
                  origin_port_name: null,
                  destination_port_name: null,
                  total_seats: null,
                  available_seats: null,
                  manifest_generated: false
                };
                handleEditTrip(unifiedTrip);
              }}
              onDateClick={handleDateClickFromCalendar}
            />
          </div>
        )}
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      {isTemplateModalOpen && (
        <ScheduledTemplateFormModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          template={selectedTemplate}
          onSave={handleSaveTemplate}
        />
      )}

      {isTripModalOpen && (
        <TripFormModal
          isOpen={isTripModalOpen}
          onClose={() => setIsTripModalOpen(false)}
          trip={selectedTrip}
          onSave={handleSaveTrip}
          isLoading={isCreatingTrip || isUpdatingTrip}
          initialDate={initialDateForNewTrip}
        />
      )}

      {isManifestModalOpen && selectedTripForManifest && (
        <ManifestGenerationModal
          isOpen={isManifestModalOpen}
          onClose={() => setIsManifestModalOpen(false)}
          trip={selectedTripForManifest}
          onManifestGenerated={handleManifestGenerated}
          onManifestCreated={handleManifestCreated}
        />
      )}

      {isPreviewModalOpen && createdManifest && selectedTripForManifest && (
        <ManifestPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreview}
          manifestData={mapManifestToManifestData(createdManifest)}
        />
      )}
    </div>
  );
};
