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
  PlusIcon,
} from '@heroicons/react/24/outline';

// Componentes y Hooks
import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { ItemsForGuideModal } from './ItemsForGuideModal';
import { useTripDetails } from '../../fluvial/hooks/useTripDetails';
import { ItemForGuide } from '../../../services/invoices.service';
import { DOCUMENT_TYPES } from '../../fluvial/types/sunat.types';
import { AvailableTripByPort } from '../../../services/trips.service';
import { remissionGuideTransportistaSchema, RemissionGuideTransportistaFormData } from '../schemas/remissionGuideSchema';

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

  const { control, handleSubmit, setValue, getValues, formState: { errors } } = useForm<RemissionGuideTransportistaFormData>({
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
      transport_mode_code: '01',
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

  const { fields, replace } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (tripDetails && tripDetails.vessel && tripDetails.route) {
      setValue('trip_id', tripDetails.id);
      setValue('vessel_id', tripDetails.vessel.id);

      if (tripDetails.company) {
        // Autocompletar sólo si están vacíos para no sobreescribir la edición del usuario
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

      if (tripDetails.route.origin_port) {
        setValue('origin_address', {
          address: tripDetails.route.origin_port.address || 'Puerto de Origen',
          ubigeo_code: tripDetails.route.origin_port.ubigeo
        });
      }
    }
  }, [tripDetails, setValue]);

  const handleSelectItems = (selectedApiItems: ItemForGuide[]) => {
    const itemsForForm = selectedApiItems.map(item => ({
      description: item.item_description || 'Sin descripción',
      quantity: item.quantity,
      unit_measure: item.unit_code, // Usar unit_code como unit_measure por defecto
      unit_code: item.unit_code,
      weight: item.quantity * 1, // Peso estimado, debería calcularse mejor
      unit_weight: 1, // Peso unitario estimado
      product_code: item.product?.internal_code || '',
      internal_code: item.product?.internal_code || '',
      invoice_item_id: item.id,
    }));

    replace(itemsForForm);

    if (selectedApiItems.length === 1) {
      const recipient = selectedApiItems[0];
      setValue('receiver.document_type_code', recipient.recipient_doc_type ?? '1', { shouldValidate: true });
      setValue('receiver.document_number', recipient.recipient_doc_number ?? '', { shouldValidate: true });
      setValue('receiver.business_name', recipient.recipient_name ?? '', { shouldValidate: true });

      if (tripDetails?.route?.destination_port) {
        setValue('destination_address', {
          address: tripDetails.route.destination_port.address || 'Puerto de Destino',
          ubigeo_code: tripDetails.route.destination_port.ubigeo
        }, { shouldValidate: true });
      }

      toast.info("Datos del destinatario y destino autocompletados desde la encomienda.");
    } else if (selectedApiItems.length > 1) {
      toast.info(`${selectedApiItems.length} ítems cargados. Complete manualmente los datos del destinatario.`);
    }
  };

  const onSubmit: SubmitHandler<RemissionGuideTransportistaFormData> = async (data) => {
    if (!tripDetails?.company?.id) {
      toast.error("No se pudo obtener el ID de la compañía desde el viaje seleccionado. Intente de nuevo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        issue_date: format(data.issue_date, 'yyyy-MM-dd'),
        transfer_start_date: format(data.transfer_start_date, 'yyyy-MM-dd'),
        company_id: tripDetails.company.id,
        branch_office_id: 1, // TODO: Obtener de la sucursal seleccionada
        document_series_id: 1, // TODO: Obtener de la serie seleccionada
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
                        className="block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary focus:ring focus:ring-primary/20 transition"
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
                  <Input
                    type="number"
                    step="0.01"
                    {...control.register('gross_total_weight', { valueAsNumber: true })}
                    error={errors.gross_total_weight?.message}
                  />
                </div>
              </div>
            </div>

            {/* Origen y Destinatario (solo mostrar Destinatario y mantener origen alineado) */}
            <div className="space-y-8">
              {/* Origen (mantener campos necesarios, pero sin sección Remitente) */}
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