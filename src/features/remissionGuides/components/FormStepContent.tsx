import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/utils/sileo-toast';

// Iconos
import {
  TruckIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

// Componentes y Hooks
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useTripDetails } from '../../fluvial/hooks/useTripDetails';
import { DOCUMENT_TYPES } from '../../fluvial/types/sunat.types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { remissionGuidesService } from '../../../services/remissionGuides.service';
import { remissionGuideTransportistaSchema, RemissionGuideTransportistaFormData } from '../schemas/remissionGuideSchema';
import { useDocumentSeries } from '../../../hooks/useDocumentSeries';
import { AutoGenerateRemissionGuidesResponse } from '../../../types';
import { RemissionGuidePreviewModal } from './RemissionGuidePreviewModal';

// Hook personalizado para series de guías de remisión del transportista
const useRemissionGuideSeries = (branchId: number | null) => {
  const companyId = 1; // Asumiendo que siempre es la compañía 1 por ahora
  const { data: allSeries = [], isLoading, error } = useDocumentSeries(companyId);

  const remissionGuideSeries = allSeries.filter(
    s => s.branch_office_id === branchId && 
         s.document_type_code === '31' && 
         s.is_active
  );

  return {
    availableSeries: remissionGuideSeries,
    isLoading,
    error,
  };
};

interface FormStepContentProps {
  selectedTrip: AvailableTripByPort;
  onBack: () => void;
}

export const FormStepContent: React.FC<FormStepContentProps> = ({
  selectedTrip,
  onBack,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generationResult, setGenerationResult] = useState<AutoGenerateRemissionGuidesResponse | null>(null);

  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(selectedTrip.id);
  
  // Obtener branch_id de localStorage como en SaleForm
  const savedBranch = localStorage.getItem('selectedSalesBranch');
  const branchId = savedBranch ? JSON.parse(savedBranch).id : null;
  
  const { availableSeries, isLoading: isLoadingSeries } = useRemissionGuideSeries(branchId);

  // Efecto para seleccionar automáticamente la primera serie disponible
  useEffect(() => {
    if (availableSeries.length > 0 && !selectedSeries) {
      setSelectedSeries(availableSeries[0].series_code);
    }
  }, [availableSeries, selectedSeries]);

  const { control, setValue, getValues, formState: { errors } } = useForm<RemissionGuideTransportistaFormData>({
    resolver: zodResolver(remissionGuideTransportistaSchema),
    defaultValues: {
      document_type_code: '31',
      series: 'T001',
      issue_date: new Date(),
      transfer_start_date: new Date(),
      transfer_reason_code: '01', // Venta
      transfer_reason_description: 'Venta de mercancías',
      gross_total_weight: 0,
      number_of_packages: 1,
      transport_mode_code: '01', // Transporte público
      trip_id: 0,
      vessel_id: 0,
      sender: {
        document_type_code: '6', // RUC
        document_number: '',
        business_name: '',
      },
      receiver: {
        document_type_code: '1', // DNI
        document_number: '',
        business_name: '',
      },
      origin_address: {
        ubigeo_code: '',
        address: '',
      },
      destination_address: {
        ubigeo_code: '',
        address: '',
      },
      driver_doc_type: '1', // DNI
      driver_doc_number: '',
      driver_name: '',
      driver_license: '',
      observation: '',
      items: [],
    }
  });

  useEffect(() => {
    if (tripDetails && tripDetails.vessel && tripDetails.route) {
      setValue('trip_id', tripDetails.id);
      setValue('vessel_id', tripDetails.vessel.id);

      // Solo autocompletar remitente si los campos están vacíos para no sobreescribir ediciones del usuario
      if (tripDetails.company) {
        if (!getValues('sender.document_number')) {
          setValue('sender.document_number', tripDetails.company.ruc);
        }
        if (!getValues('sender.business_name')) {
          setValue('sender.business_name', tripDetails.company.business_name);
        }
        if (!getValues('sender.document_type_code')) {
          setValue('sender.document_type_code', '6'); // RUC
        }
      }

      // Autocompletar dirección de partida solo si está vacía
      if (tripDetails.route.origin_port) {
        const originAddress = getValues('origin_address') || {};
        if (!originAddress.address && !originAddress.ubigeo_code) {
          setValue('origin_address', {
            address: tripDetails.route.origin_port.address || 'Puerto de Origen',
            ubigeo_code: tripDetails.route.origin_port.ubigeo
          });
        } else {
          // Si alguno de los dos está vacío, rellenar solo el faltante
          if (!originAddress.address) {
            setValue('origin_address.address', tripDetails.route.origin_port.address || 'Puerto de Origen');
          }
          if (!originAddress.ubigeo_code) {
            setValue('origin_address.ubigeo_code', tripDetails.route.origin_port.ubigeo);
          }
        }
      }
    }
  }, [tripDetails, setValue, getValues]);

  const handleAutoGenerate = async () => {
    // Validar que el viaje tenga múltiples destinos/paradas
    if (!tripDetails?.stops || tripDetails.stops.length < 2) {
      toast.error("El viaje seleccionado no tiene suficientes destinos para generar guías automáticamente. Debe tener al menos un destino además del origen.");
      return;
    }

    const driverData = getValues();
    if (!driverData.driver_name || !driverData.driver_doc_number || !driverData.driver_license) {
      toast.error("Complete todos los datos del conductor antes de generar las guías.");
      return;
    }

    if (!selectedSeries) {
      toast.error("Seleccione una serie de guía de remisión.");
      return;
    }

    // Encontrar el ID de la serie seleccionada
    const selectedSeriesData = availableSeries.find(s => s.series_code === selectedSeries);
    if (!selectedSeriesData) {
      toast.error("La serie seleccionada no es válida.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        trip_id: selectedTrip.id,
        company_id: 1, // Siempre usar compañía ID 1
        document_series_id: selectedSeriesData.id,
        series: selectedSeries,
        transport_mode_code: '02', // Marítimo según el ejemplo
        captain_name: driverData.driver_name,
        captain_doc_type: driverData.driver_doc_type,
        captain_doc_number: driverData.driver_doc_number,
        captain_license: driverData.driver_license,
      };

      const response = await remissionGuidesService.autoGenerate(payload);

      toast.success(`Se generaron ${response.guides_generated.length} guías de remisión automáticamente para ${response.destinations_processed} destinos.`);
      
      // Guardar resultado y mostrar modal de previsualización
      setGenerationResult(response);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error al generar guías automáticamente:', error);
      // Mostrar mensaje específico del backend si está disponible
      const errorMessage = (error as any)?.detail || (error as any)?.response?.data?.detail || "Error al generar las guías de remisión. Intente nuevamente.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Información del viaje seleccionado */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 dark:border-green-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-dm-text-primary">
                  Viaje Seleccionado: {selectedTrip?.trip_name || tripDetails?.trip_name || `ID: ${selectedTrip.id}`}
                </h4>
                {(selectedTrip?.vessel_name || tripDetails?.vessel?.name) && (
                  <p className="text-sm text-dm-text-secondary">
                    <TruckIcon className="h-4 w-4 inline mr-1" />
                    Embarcación: {selectedTrip?.vessel_name || tripDetails?.vessel?.name}
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              type="button"
              onClick={onBack}
              className="flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Cambiar Viaje
            </Button>
          </div>
        </div>

        {/* Indicador de paradas del viaje */}
        {tripDetails?.stops && tripDetails.stops.length > 1 && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <MapPinIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-dm-text-primary">
                    Viaje Multi-Parada Detectado
                  </h4>
                  <p className="text-sm text-dm-text-secondary">
                    {tripDetails.stops.length} destinos encontrados. Se generarán guías automáticamente para cada destino.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render condicional basado en el modo de generación */}
        <div className="bg-dm-bg-primary rounded-xl shadow-sm border border-dm-border-primary overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full mx-auto mb-4">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-dm-text-primary mb-2">Generación Automática de Guías</h3>
              <p className="text-dm-text-secondary">
                Se generarán guías automáticamente para cada destino del viaje seleccionado.
                Solo necesitas proporcionar los datos del conductor.
              </p>
            </div>

            {/* Conductor - solo para auto generación */}
            <div className="border border-dm-border-primary rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                  <UserIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-dm-text-primary">Datos del Conductor</h3>
              </div>
              
              {/* Selector de Serie */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dm-text-secondary mb-2">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Serie de Guía de Remisión*
                </label>
                {isLoadingSeries ? (
                  <div className="flex items-center space-x-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-dm-text-muted">Cargando series...</span>
                  </div>
                ) : (
                  <select
                    value={selectedSeries}
                    onChange={(e) => setSelectedSeries(e.target.value)}
                    className="w-full p-3 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={availableSeries.length === 0}
                  >
                    <option value="">
                      {availableSeries.length === 0 ? 'No hay series disponibles' : 'Seleccionar serie...'}
                    </option>
                    {availableSeries.map((series) => (
                      <option key={series.id} value={series.series_code}>
                        {series.series_code}
                      </option>
                    ))}
                  </select>
                )}
                {availableSeries.length === 0 && !isLoadingSeries && (
                  <p className="text-sm text-dm-text-muted mt-1">
                    No se encontraron series activas para guías de remisión en esta sucursal.
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Nombre Completo*" 
                  {...control.register('driver_name')} 
                  error={errors.driver_name?.message} 
                />
                
                <Input 
                  label="Licencia de Conducir*" 
                  {...control.register('driver_license')} 
                  error={errors.driver_license?.message} 
                />
                
                <div>
                  <label className="block text-sm font-medium text-dm-text-secondary mb-2">Tipo Doc*</label>
                  <Controller
                    name="driver_doc_type"
                    control={control}
                    render={({ field }) => (
                      <select 
                        {...field}
                        className="w-full p-3 border border-dm-border-primary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {DOCUMENT_TYPES.map(docType => (
                          <option key={docType.code} value={docType.code}>
                            {docType.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.driver_doc_type && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.driver_doc_type.message}</p>
                  )}
                </div>
                
                <Input 
                  label="N° Documento*" 
                  {...control.register('driver_doc_number')} 
                  error={errors.driver_doc_number?.message} 
                />
              </div>
            </div>
          </div>

          {/* Botones de acción para auto-generación */}
          <div className="bg-dm-bg-secondary px-8 py-6 border-t border-dm-border-primary">
            <div className="flex items-center justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/remission-guides')}
                disabled={isSubmitting}
                className="px-6 py-2"
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleAutoGenerate}
                disabled={isLoadingTrip || isSubmitting || !tripDetails?.stops || tripDetails.stops.length < 2 || !selectedSeries || availableSeries.length === 0}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-dm-text-muted text-white font-medium rounded-lg flex items-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">Generando Guías...</span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Generar Guías Automáticamente
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de previsualización de PDFs */}
      {showPreviewModal && generationResult && (
        <RemissionGuidePreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setGenerationResult(null);
            navigate('/remission-guides');
          }}
          generationResult={generationResult}
        />
      )}

    </div>
  );
};
