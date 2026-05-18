import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/utils/sileo-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import type { SubmitHandler } from 'react-hook-form';

// Iconos
import {
  TruckIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  ScaleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// Componentes y Hooks
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useTripDetails } from '../../fluvial/hooks/useTripDetails';
import { DOCUMENT_TYPES } from '../../fluvial/types/sunat.types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { remissionGuidesSenderService } from '../../../services/remissionGuidesSender.service';
import { remissionGuideRemitenteSchema, RemissionGuideRemitenteFormData } from '../schemas/remissionGuideSchema';
import { useDocumentSeries } from '../../../hooks/useDocumentSeries';
import { RemissionGuideRemitente } from '../../../types';
import { convertSenderGuideToAutoGenerate } from '../utils/guideConversion';
import { generateRemissionGuidePDF } from './pdf/RemissionGuidePDFGenerator';
import { RemissionGuideSenderPreviewModal } from './RemissionGuideSenderPreviewModal';

// Hook personalizado para series de guías de remisión del remitente
const useRemissionGuideSenderSeries = (branchId: number | null) => {
  const companyId = 1; // Asumiendo que siempre es la compañía 1 por ahora
  const { data: allSeries = [], isLoading, error } = useDocumentSeries(companyId);

  const remissionGuideSeries = allSeries.filter(
    s => s.branch_office_id === branchId && 
         s.document_type_code === '09' && 
         s.is_active
  );

  return {
    availableSeries: remissionGuideSeries,
    isLoading,
    error,
  };
};

// Opciones de unidades de medida SUNAT
const UNIT_MEASURE_OPTIONS = [
  { code: 'NIU', name: 'Unidad (para bienes)' },
  { code: 'KGM', name: 'Kilogramo' },
  { code: 'PAQ', name: 'Paquete' },
  { code: 'BX', name: 'Caja' },
  { code: 'TNE', name: 'Tonelada' },
  { code: 'MTR', name: 'Metro' },
  { code: 'MTQ', name: 'Metro Cúbico' },
  { code: 'LTR', name: 'Litro' },
  { code: 'ZZ', name: 'Unidad (para servicios)' },
];

interface FormStepContentSenderProps {
  selectedTrip?: AvailableTripByPort | null;
  onBack: () => void;
}

export const FormStepContentSender: React.FC<FormStepContentSenderProps> = ({
  selectedTrip,
  onBack,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdGuide, setCreatedGuide] = useState<RemissionGuideRemitente | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(selectedTrip?.id || 0);
  
  // Obtener branch_id de localStorage como en SaleForm
  const savedBranch = localStorage.getItem('selectedSalesBranch');
  const branchId = savedBranch ? JSON.parse(savedBranch).id : null;
  
  const { availableSeries, isLoading: isLoadingSeries } = useRemissionGuideSenderSeries(branchId);

  // Efecto para seleccionar automáticamente la primera serie disponible
  useEffect(() => {
    if (availableSeries.length > 0 && !selectedSeries) {
      setSelectedSeries(availableSeries[0].series_code);
    }
  }, [availableSeries, selectedSeries]);

  const { control, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm<RemissionGuideRemitenteFormData>({
    resolver: zodResolver(remissionGuideRemitenteSchema),
    defaultValues: {
      document_type_code: '09',
      series: 'R001',
      issue_date: new Date(),
      transfer_start_date: new Date(),
      transfer_reason_code: '01', // Venta
      transfer_reason_description: 'Venta de mercancías',
      gross_total_weight: 0,
      number_of_packages: 1,
      transport_mode_code: '01', // Transporte público
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
      vehicle_plate: '',
      observation: '',
      related_doc_type: '',
      related_doc_number: '',
      related_doc_ruc: '',
      related_doc_description: '',
      items: [],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Calcular peso total automáticamente
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.startsWith('items')) {
        const totalWeight = value.items?.reduce((sum, item) => {
          const weight = item?.weight || 0;
          return sum + weight;
        }, 0) || 0;
        setValue('gross_total_weight', totalWeight, { shouldDirty: false, shouldValidate: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  useEffect(() => {
    if (tripDetails && tripDetails.vessel && tripDetails.route && selectedTrip) {
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
  }, [tripDetails, setValue, getValues, selectedTrip]);

  const addItem = () => {
    append({
      description: '',
      quantity: 1,
      unit_measure: 'PAQ',
      unit_code: 'PAQ',
      weight: undefined,
      unit_weight: 0,
      product_code: '',
      internal_code: '',
    });
  };

  const onSubmit: SubmitHandler<RemissionGuideRemitenteFormData> = async (data) => {
    // Validar que haya al menos un paquete/item
    if (!data.items || data.items.length === 0) {
      toast.error("Debe agregar al menos un producto/paquete para crear la guía de remisión.");
      return;
    }

    if (!selectedSeries) {
      toast.error("Seleccione una serie de guía de remisión.");
      return;
    }

    // Para guía del remitente, siempre usar compañía ID 1
    const companyId = 1;

    setIsSubmitting(true);
    
    try {
      const payload = {
        company_id: companyId,
        document_type_code: data.document_type_code,
        series: selectedSeries,
        issue_date: format(data.issue_date, 'yyyy-MM-dd'),
        shipment_start_date: format(data.transfer_start_date, 'yyyy-MM-dd'),
        observation: data.observation || '',
        total_gross_weight: data.gross_total_weight,
        weight_unit_code: 'KGM', // Asumiendo KGM como unidad por defecto
        number_of_packages: data.number_of_packages,
        sender_doc_type: data.sender.document_type_code,
        sender_doc_number: data.sender.document_number,
        sender_name: data.sender.business_name,
        recipient_doc_type: data.receiver.document_type_code,
        recipient_doc_number: data.receiver.document_number,
        recipient_name: data.receiver.business_name,
        origin_ubigeo: data.origin_address.ubigeo_code,
        origin_address: data.origin_address.address,
        destination_ubigeo: data.destination_address.ubigeo_code,
        destination_address: data.destination_address.address,
        transfer_reason_code: data.transfer_reason_code,
        transporter_doc_type: data.driver_doc_type, // Usando driver como transporter
        transporter_doc_number: data.driver_doc_number,
        transporter_name: data.driver_name,
        transport_mode_code: data.transport_mode_code,
        vehicle_plate: data.vehicle_plate,
        driver_doc_type: data.driver_doc_type,
        driver_doc_number: data.driver_doc_number,
        driver_name: data.driver_name,
        driver_license: data.driver_license,
        related_doc_type: data.related_doc_type || undefined,
        related_doc_number: data.related_doc_number || undefined,
        related_doc_ruc: data.related_doc_ruc || undefined,
        related_doc_description: data.related_doc_description || undefined,
        items: data.items.map(item => ({
          quantity: item.quantity,
          unit_code: item.unit_measure, // Usando unit_measure como unit_code
          description: item.description,
          internal_code: item.internal_code || '',
        })),
      };
      
      console.log("Enviando a API:", payload);
      
      // Llamar al servicio real
      const createdGuideResponse = await remissionGuidesSenderService.create(payload);
      
      toast.success("Guía de Remisión del Remitente creada exitosamente.");
      
      // Guardar la guía creada y generar PDF automáticamente
      setCreatedGuide(createdGuideResponse);
      await handleGeneratePDFAfterCreation(createdGuideResponse);
      
    } catch (error) {
      console.error('Error al crear la guía:', error);
      toast.error("Error al crear la guía de remisión. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para generar PDF después de crear la guía
  const handleGeneratePDFAfterCreation = async (guide: RemissionGuideRemitente) => {
    setIsGeneratingPDF(true);
    let shouldShowModal = false;
    
    try {
      // Convertir la guía del remitente al formato del PDF Generator
      const convertedGuide = convertSenderGuideToAutoGenerate(guide);
      if (!convertedGuide) {
        toast.error('Error al procesar los datos de la guía para el PDF');
        return;
      }

      // Generar el PDF
      const { blob } = await generateRemissionGuidePDF(convertedGuide, 'remitente');
      shouldShowModal = true; // Marcar para mostrar modal al final
      
      // Subir el PDF al backend automáticamente
      try {
        const fileName = `${guide.series}-${guide.number.toString().padStart(8, '0')}`;
        const pdfFile = new File([blob], `guia-remision-remitente-${fileName}.pdf`, {
          type: 'application/pdf'
        });
        
        await remissionGuidesSenderService.uploadRemissionGuidePDF(guide.id, pdfFile, 'a4');
        toast.success('PDF generado y subido al sistema exitosamente');
      } catch (uploadError) {
        console.warn('Error al subir PDF automáticamente:', uploadError);
        toast.warning('Guía creada correctamente, pero el PDF no se pudo subir automáticamente');
      }
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('La guía se creó correctamente, pero hubo un error al generar el PDF');
      // Aún así mostrar el modal para que puedan intentar generar el PDF manualmente
      shouldShowModal = true;
    } finally {
      setIsGeneratingPDF(false);
      // Mostrar modal independientemente del resultado del upload
      if (shouldShowModal) {
        setShowPreviewModal(true);
      }
    }
  };

  // Función para manejar el cierre del modal y navegar a la lista
  const handleClosePreviewModal = () => {
    setShowPreviewModal(false);
    setCreatedGuide(null);
    navigate('/remission-guides');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Información del viaje seleccionado o mensaje alternativo */}
        {selectedTrip ? (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Viaje Seleccionado: {selectedTrip?.trip_name || tripDetails?.trip_name || `ID: ${selectedTrip.id}`}
                  </h4>
                  {(selectedTrip?.vessel_name || tripDetails?.vessel?.name) && (
                    <p className="text-sm text-gray-600">
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
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Guía de Remisión del Remitente
                  </h4>
                  <p className="text-sm text-gray-600">
                    Complete manualmente toda la información requerida
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección para agregar productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                  <PlusIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
                  <p className="text-sm text-gray-600">Agregue los productos que serán transportados</p>
                </div>
              </div>
              <Button 
                type="button" 
                onClick={addItem}
                className="flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Agregar Producto
              </Button>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay productos agregados. Haga clic en "Agregar Producto" para comenzar.</p>
              </div>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">Producto {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input 
                    label="Descripción*" 
                    {...control.register(`items.${index}.description`)} 
                    error={errors.items?.[index]?.description?.message} 
                  />
                  
                  <Input 
                    label="Cantidad*" 
                    type="number"
                    step="0.01"
                    {...control.register(`items.${index}.quantity`, { valueAsNumber: true })} 
                    error={errors.items?.[index]?.quantity?.message} 
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Medida*</label>
                    <Controller
                      name={`items.${index}.unit_measure`}
                      control={control}
                      render={({ field }) => (
                        <select 
                          {...field}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          {UNIT_MEASURE_OPTIONS.map(option => (
                            <option key={option.code} value={option.code}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.items?.[index]?.unit_measure && (
                      <p className="text-red-500 text-xs mt-1">{errors.items?.[index]?.unit_measure?.message}</p>
                    )}
                  </div>
                  
                  <Input
                    label="Peso (KGM)*"
                    type="number"
                    step="0.01"
                    {...control.register(`items.${index}.weight`, {
                      valueAsNumber: true,
                      setValueAs: (value) => value === '' ? undefined : parseFloat(value) || 0
                    })}
                    error={errors.items?.[index]?.weight?.message}
                  />
                  
                  <Input 
                    label="Código de Producto" 
                    {...control.register(`items.${index}.product_code`)} 
                    error={errors.items?.[index]?.product_code?.message} 
                  />
                  
                  <Input 
                    label="Código Interno" 
                    {...control.register(`items.${index}.internal_code`)} 
                    error={errors.items?.[index]?.internal_code?.message} 
                  />
                </div>
              </div>
            ))}

            {errors.items && typeof errors.items.message === 'string' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.items.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="space-y-8 p-8">
            {/* Datos Generales */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Datos Generales de la Guía</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Selector de Serie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                    Serie*
                  </label>
                  {isLoadingSeries ? (
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" />
                      <span className="text-sm text-gray-500">Cargando series...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedSeries}
                      onChange={(e) => setSelectedSeries(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    <p className="text-sm text-gray-500 mt-1">
                      No se encontraron series activas para guías del remitente en esta sucursal.
                    </p>
                  )}
                </div>
                
                <Controller 
                  name="issue_date" 
                  control={control} 
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CalendarIcon className="h-4 w-4 inline mr-1" />
                        Fecha Emisión*
                      </label>
                      <DatePicker 
                        selected={field.value} 
                        onChange={field.onChange} 
                        className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary focus:ring focus:ring-primary/20 transition bg-gray-50" 
                        locale={es} 
                        dateFormat="dd/MM/yyyy"
                        readOnly
                      />
                      {errors.issue_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.issue_date.message}</p>
                      )}
                    </div>
                  )} 
                />
                
                <Controller 
                  name="transfer_start_date" 
                  control={control} 
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CalendarIcon className="h-4 w-4 inline mr-1" />
                        Fecha Traslado*
                      </label>
                      <DatePicker 
                        selected={field.value} 
                        onChange={field.onChange} 
                        className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary focus:ring focus:ring-primary/20 transition" 
                        locale={es} 
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                      />
                      {errors.transfer_start_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.transfer_start_date.message}</p>
                      )}
                    </div>
                  )} 
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ScaleIcon className="h-4 w-4 inline mr-1" />
                    Peso Bruto (KGM)*
                  </label>
                  <Controller
                    name="gross_total_weight"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        readOnly
                        className="bg-gray-50"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Origen y Destinatario */}
            <div className="space-y-8">
              {/* Remitente */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Remitente</h3>
                </div>

                <div className="space-y-4">
                  <Input 
                    label="Razón Social / Nombre*" 
                    {...control.register('sender.business_name')} 
                    error={errors.sender?.business_name?.message} 
                  />
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Doc*</label>
                      <Controller
                        name="sender.document_type_code"
                        control={control}
                        render={({ field }) => (
                          <select 
                            {...field}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            {DOCUMENT_TYPES.map(docType => (
                              <option key={docType.code} value={docType.code}>
                                {docType.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {errors.sender?.document_type_code && (
                        <p className="text-red-500 text-xs mt-1">{errors.sender.document_type_code.message}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Input 
                        label="N° Documento*" 
                        {...control.register('sender.document_number')} 
                        error={errors.sender?.document_number?.message} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Origen */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                    <MapPinIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Dirección de Partida</h3>
                </div>

                <div className="space-y-4">
                  <Input 
                    label="Dirección de Partida*" 
                    {...control.register('origin_address.address')} 
                    error={errors.origin_address?.address?.message} 
                  />
                  
                  <Input 
                    label="Ubigeo Origen*" 
                    {...control.register('origin_address.ubigeo_code')} 
                    error={errors.origin_address?.ubigeo_code?.message}
                    placeholder="000000" 
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Destinatario */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                    <MapPinIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Destinatario</h3>
                </div>

                <div className="space-y-4">
                  <Input 
                    label="Razón Social / Nombre*" 
                    {...control.register('receiver.business_name')} 
                    error={errors.receiver?.business_name?.message} 
                  />
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Doc*</label>
                      <Controller
                        name="receiver.document_type_code"
                        control={control}
                        render={({ field }) => (
                          <select 
                            {...field}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            {DOCUMENT_TYPES.map(docType => (
                              <option key={docType.code} value={docType.code}>
                                {docType.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      {errors.receiver?.document_type_code && (
                        <p className="text-red-500 text-xs mt-1">{errors.receiver.document_type_code.message}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Input 
                        label="N° Documento*" 
                        {...control.register('receiver.document_number')} 
                        error={errors.receiver?.document_number?.message} 
                      />
                    </div>
                  </div>
                  
                  <Input 
                    label="Dirección de Llegada*" 
                    {...control.register('destination_address.address')} 
                    error={errors.destination_address?.address?.message} 
                  />
                  
                  <Input 
                    label="Ubigeo Destino*" 
                    {...control.register('destination_address.ubigeo_code')} 
                    error={errors.destination_address?.ubigeo_code?.message}
                    placeholder="000000" 
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Conductor */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
                  <UserIcon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Datos del Conductor</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
                <div className="md:col-span-2">
                  <Input 
                    label="Nombre Completo*" 
                    {...control.register('driver_name')} 
                    error={errors.driver_name?.message} 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Input 
                    label="Licencia de Conducir*" 
                    {...control.register('driver_license')} 
                    error={errors.driver_license?.message} 
                  />
                </div>
                
                <div className="md:col-span-1 flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Doc*</label>
                  <Controller
                    name="driver_doc_type"
                    control={control}
                    render={({ field }) => (
                      <select 
                        {...field}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {DOCUMENT_TYPES.map(docType => (
                          <option key={docType.code} value={docType.code}>
                            {docType.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <div className="min-h-[1.25rem] mt-1">
                    {errors.driver_doc_type && (
                      <p className="text-red-500 text-xs">{errors.driver_doc_type.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-1">
                  <Input 
                    label="N° Documento*" 
                    {...control.register('driver_doc_number')} 
                    error={errors.driver_doc_number?.message} 
                  />
                </div>
                
                <div className="md:col-span-6">
                  <Input 
                    label="Placa del Vehículo*" 
                    {...control.register('vehicle_plate')} 
                    error={errors.vehicle_plate?.message} 
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  <InformationCircleIcon className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Observaciones</h3>
                <span className="text-sm text-gray-500">(Opcional)</span>
              </div>
              
              <Controller
                name="observation"
                control={control}
                render={({ field }) => (
                  <textarea 
                    {...field}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={4}
                    placeholder="Ingrese observaciones adicionales para la guía de remisión..."
                  />
                )}
              />
            </div>

            {/* Comprobante Relacionado */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Comprobante Relacionado</h3>
                <span className="text-sm text-gray-500">(Opcional)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Tipo de Documento" 
                  {...control.register('related_doc_type')} 
                  error={errors.related_doc_type?.message}
                  placeholder="Ej: 01 (Factura)"
                />
                
                <Input 
                  label="Número de Documento" 
                  {...control.register('related_doc_number')} 
                  error={errors.related_doc_number?.message}
                  placeholder="Ej: F001-000001"
                />
                
                <Input 
                  label="RUC del Emisor" 
                  {...control.register('related_doc_ruc')} 
                  error={errors.related_doc_ruc?.message}
                  placeholder="RUC de 11 dígitos"
                />
                
                <Input 
                  label="Descripción" 
                  {...control.register('related_doc_description')} 
                  error={errors.related_doc_description?.message}
                  placeholder="Descripción del comprobante"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
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
                type="submit"
                disabled={fields.length === 0 || isLoadingTrip || isSubmitting || isGeneratingPDF || !selectedSeries || availableSeries.length === 0}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center transition-colors"
              >
                {isSubmitting || isGeneratingPDF ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">
                      {isSubmitting ? 'Generando...' : 'Creando PDF...'}
                    </span>
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Generar Guía de Remisión
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal de previsualización de PDF */}
      {showPreviewModal && createdGuide && (
        <RemissionGuideSenderPreviewModal
          isOpen={showPreviewModal}
          onClose={handleClosePreviewModal}
          guide={createdGuide}
        />
      )}
    </div>
  );
};