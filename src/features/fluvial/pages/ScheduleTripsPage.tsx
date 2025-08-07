// src/features/fluvial/pages/ScheduleTripsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useTripsView } from '../hooks/useTripsView';
import { useTripMutations } from '../hooks/useTrips';
import { useScheduledTemplates } from '../hooks/useScheduledTemplates';
import { authService } from '../../../services/auth.service';
import { User, ScheduledRouteTemplate } from '../../../types';
import { UnifiedTripViewItem } from '../hooks/useTripsView';

import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { ScheduledTemplatesTable } from '../components/schedule/ScheduledTemplatesTable';
import { TripsTable } from '../components/schedule/TripsTable';
import { ScheduledTemplateFormModal } from '../components/schedule/ScheduledTemplateFormModal';
import { TripFormModal } from '../components/schedule/TripFormModal';
import { TripFilters } from '../components/schedule/TripFilters';
import { CalendarView } from '../components/schedule/CalendarView';
import { ManifestGenerationModal } from '../components/schedule/ManifestGenerationModal';
import { ManifestPreviewModal } from '../../manifests/components/ManifestPreviewModal';
import { Manifest } from '../../manifests/types/manifest.types';

type ViewFilterMode = 'upcoming' | 'week' | 'history';

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
  const [advancedFilters, setAdvancedFilters] = useState({
    origin_city_id: undefined as number | undefined,
    destination_city_id: undefined as number | undefined,
  });

  const COMPANY_ID = 1;

  const { isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => authService.getProfile(),
  });

  const { data: trips = [], isLoading: isLoadingTrips, refetch } = useTripsView({
    viewMode: viewFilter,
    weekDate,
    companyId: COMPANY_ID,
    filters: advancedFilters,
  });

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
    // Actualizar la lista de viajes si es necesario
    refetch();
  };

  const handleManifestCreated = (manifest: Manifest, _type: 'PASSENGER' | 'CARGO') => {
    setCreatedManifest(manifest);
    // Cerrar modal de generación y abrir modal de previsualización
    setIsManifestModalOpen(false);
    setIsPreviewModalOpen(true);
  };

  // Función para mapear Manifest a la estructura esperada
  const mapManifestToManifestData = (manifest: Manifest): Manifest => {
    const result = {
      ...manifest,
      vessel_name: selectedTripForManifest?.vessel_name || undefined,
      route_name: undefined, // No disponible en UnifiedTripViewItem
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Programar Viajes</h1>
        <p className="text-gray-600">
          Gestione las plantillas de viajes recurrentes y los viajes programados
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Plantillas de Viajes Recurrentes
          </h2>
          <Button
            variant="primary"
            onClick={handleCreateTemplate}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Plantilla
          </Button>
        </div>

        {isLoadingTemplates ? (
          <div className="flex justify-center py-8">
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

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Viajes Programados</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Calendario
                </button>
              </div>
              <Button variant="outline" onClick={handleRefresh}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button variant="primary" onClick={handleCreateTrip}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Nuevo Viaje
              </Button>
            </div>
          </div>

          <div className="flex border-b border-gray-200">
            {(['upcoming', 'week', 'history'] as ViewFilterMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewFilter(mode)}
                className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
                  viewFilter === mode
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {mode === 'upcoming' && 'Próximos Viajes'}
                {mode === 'week' && 'Vista Semanal'}
                {mode === 'history' && 'Historial'}
              </button>
            ))}
          </div>

          <TripFilters
            currentDate={weekDate}
            onDateChange={setWeekDate}
            filters={advancedFilters}
            onFiltersChange={(filters) => setAdvancedFilters(prev => ({ ...prev, ...filters }))}
            viewMode={viewFilter}
          />

          {isLoadingTrips ? (
            <div className="flex justify-center py-8">
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
            <CalendarView
              trips={trips as unknown as any[]}
              onTripClick={(trip) => {
                // Adapt AvailableTrip to UnifiedTripViewItem
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
          )}
        </div>
      </div>

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
