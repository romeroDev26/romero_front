import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
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
  ClipboardDocumentListIcon,
  IdentificationIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

// Componentes y Hooks
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { ItemsForGuideModal } from './ItemsForGuideModal';
import { useTripDetails } from '../../fluvial/hooks/useTripDetails';
import { ItemForGuide } from '../../../services/invoices.service';
import { DOCUMENT_TYPES, SunatDocType } from '../../fluvial/types/sunat.types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { remissionGuideSchema, RemissionGuideFormData } from '../schemas/remissionGuideSchema';

interface FormStepContentProps {
  selectedTrip: AvailableTripByPort;
  onBack: () => void;
}

export const FormStepContent: React.FC<FormStepContentProps> = ({
  selectedTrip,
  onBack,
}) => {
  const navigate = useNavigate();
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tripDetails, isLoading: isLoadingTrip } = useTripDetails(selectedTrip.id);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<RemissionGuideFormData>({
    resolver: zodResolver(remissionGuideSchema),
    defaultValues: {
      document_type_code: '31',
      series: 'T001',
      issue_date: new Date(),
      shipment_start_date: new Date(),
      weight_unit_code: 'KGM',
      total_gross_weight: 0,
      transport_mode_code: '01',
      items: [],
      sender_doc_type: SunatDocType.RUC,
      sender_doc_number: '',
      sender_name: '',
      recipient_doc_type: SunatDocType.DNI,
      recipient_doc_number: '',
      recipient_name: '',
      origin_ubigeo: '',
      origin_address: '',
      destination_ubigeo: '',
      destination_address: '',
      driver_doc_type: SunatDocType.DNI,
      driver_doc_number: '',
      driver_name: '',
      driver_license: '',
      observation: '',
    }
  });

  const { fields, replace } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (tripDetails && tripDetails.vessel && tripDetails.route) {
      setValue('trip_id', tripDetails.id);
      setValue('vessel_id', tripDetails.vessel.id);
      
      if (tripDetails.company) {
        setValue('sender_doc_number', tripDetails.company.ruc);
        setValue('sender_name', tripDetails.company.business_name);
        setValue('sender_doc_type', SunatDocType.RUC);
      }
      
      if (tripDetails.route.origin_port) {
        setValue('origin_address', tripDetails.route.origin_port.address || 'Puerto de Origen');
        setValue('origin_ubigeo', tripDetails.route.origin_port.ubigeo);
      }
    }
  }, [tripDetails, setValue]);

  const handleSelectItems = (selectedApiItems: ItemForGuide[]) => {
    const itemsForForm = selectedApiItems.map(item => ({
      quantity: item.quantity,
      unit_code: item.unit_code,
      description: item.item_description || 'Sin descripción',
      internal_code: item.product?.internal_code || '',
      invoice_item_id: item.id,
    }));
    
    replace(itemsForForm);

    if (selectedApiItems.length === 1) {
      const recipient = selectedApiItems[0];
      setValue('recipient_doc_type', recipient.recipient_doc_type ?? SunatDocType.DNI, { shouldValidate: true });
      setValue('recipient_doc_number', recipient.recipient_doc_number ?? '', { shouldValidate: true });
      setValue('recipient_name', recipient.recipient_name ?? '', { shouldValidate: true });
      
      if (tripDetails?.route?.destination_port) {
        setValue('destination_address', tripDetails.route.destination_port.address || 'Puerto de Destino', { shouldValidate: true });
        setValue('destination_ubigeo', tripDetails.route.destination_port.ubigeo, { shouldValidate: true });
      }
      
      toast.info("Datos del destinatario y destino autocompletados desde la encomienda.");
    } else if (selectedApiItems.length > 1) {
      toast.info(`${selectedApiItems.length} ítems cargados. Complete manualmente los datos del destinatario.`);
    }
  };
  
  const onSubmit: SubmitHandler<RemissionGuideFormData> = async (data) => {
    if (!tripDetails?.company?.id) {
      toast.error("No se pudo obtener el ID de la compañía desde el viaje seleccionado. Intente de nuevo.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        ...data,
        issue_date: format(data.issue_date, 'yyyy-MM-dd'),
        shipment_start_date: format(data.shipment_start_date, 'yyyy-MM-dd'),
        company_id: tripDetails.company.id,
      };
      
      console.log("Enviando a API:", payload);
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Guía de Remisión creada exitosamente.");
      navigate('/remission-guides');
    } catch (error) {
      console.error('Error al crear la guía:', error);
      toast.error("Error al crear la guía de remisión. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Información del viaje seleccionado */}
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

        {/* Botón para cargar ítems */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <ClipboardDocumentListIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargar Ítems</h3>
            <p className="text-gray-600 mb-6">Seleccione los ítems de las encomiendas que incluirá en esta guía</p>
            
            <Button 
              type="button" 
              onClick={() => setIsItemsModalOpen(true)}
              disabled={!selectedTrip.id}
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Cargar Ítems de Encomiendas
            </Button>
            
            {errors.items && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.items.message}</p>
              </div>
            )}
            
            {fields.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {fields.length} ítem(s) cargado(s) correctamente
                  </span>
                </div>
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
                <Input 
                  label="Serie*" 
                  {...control.register('series')} 
                  error={errors.series?.message} 
                />
                
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                        locale={es} 
                        dateFormat="dd/MM/yyyy" 
                      />
                      {errors.issue_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.issue_date.message}</p>
                      )}
                    </div>
                  )} 
                />
                
                <Controller 
                  name="shipment_start_date" 
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                        locale={es} 
                        dateFormat="dd/MM/yyyy" 
                      />
                      {errors.shipment_start_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.shipment_start_date.message}</p>
                      )}
                    </div>
                  )} 
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ScaleIcon className="h-4 w-4 inline mr-1" />
                    Peso Bruto (KGM)*
                  </label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...control.register('total_gross_weight', { valueAsNumber: true })} 
                    error={errors.total_gross_weight?.message} 
                  />
                </div>
              </div>
            </div>

            {/* Remitente y Destinatario */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Remitente */}
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                    <UserIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Remitente</h3>
                </div>
                
                <div className="space-y-4">
                  <Input 
                    label="Razón Social*" 
                    {...control.register('sender_name')} 
                    error={errors.sender_name?.message} 
                    readOnly 
                    className="bg-gray-50" 
                  />
                  
                  <Input 
                    label="RUC*" 
                    {...control.register('sender_doc_number')} 
                    error={errors.sender_doc_number?.message} 
                    readOnly 
                    className="bg-gray-50" 
                  />
                  
                  <Input 
                    label="Dirección de Partida*" 
                    {...control.register('origin_address')} 
                    error={errors.origin_address?.message} 
                  />
                  
                  <Input 
                    label="Ubigeo Origen*" 
                    {...control.register('origin_ubigeo')} 
                    error={errors.origin_ubigeo?.message}
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
                    {...control.register('recipient_name')} 
                    error={errors.recipient_name?.message} 
                  />
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Doc*</label>
                      <Controller
                        name="recipient_doc_type"
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
                      {errors.recipient_doc_type && (
                        <p className="text-red-500 text-xs mt-1">{errors.recipient_doc_type.message}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Input 
                        label="N° Documento*" 
                        {...control.register('recipient_doc_number')} 
                        error={errors.recipient_doc_number?.message} 
                      />
                    </div>
                  </div>
                  
                  <Input 
                    label="Dirección de Llegada*" 
                    {...control.register('destination_address')} 
                    error={errors.destination_address?.message} 
                  />
                  
                  <Input 
                    label="Ubigeo Destino*" 
                    {...control.register('destination_ubigeo')} 
                    error={errors.destination_ubigeo?.message}
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
                  <IdentificationIcon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Datos del Conductor</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Doc*</label>
                    <Controller
                      name="driver_doc_type"
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
                    {errors.driver_doc_type && (
                      <p className="text-red-500 text-xs mt-1">{errors.driver_doc_type.message}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input 
                      label="N° Documento*" 
                      {...control.register('driver_doc_number')} 
                      error={errors.driver_doc_number?.message} 
                    />
                  </div>
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
                disabled={fields.length === 0 || isLoadingTrip || isSubmitting}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">Generando...</span>
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

      {/* Modal de ítems */}
      {isItemsModalOpen && selectedTrip.id && (
        <ItemsForGuideModal
          isOpen={isItemsModalOpen}
          onClose={() => setIsItemsModalOpen(false)}
          tripId={selectedTrip.id}
          onSelectItems={handleSelectItems}
        />
      )}
    </div>
  );
};
