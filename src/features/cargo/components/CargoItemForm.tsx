// src/features/cargo/components/CargoItemForm.tsx

import React, { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Search } from 'lucide-react';

import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Spinner } from '../../../components/common/Spinner';
import { useProductsServicesData } from '../../fluvial/hooks/useProductsServicesData';
import { useSunatData } from '../../fluvial/hooks/useSunatData';
import { CargoItemData } from '../types/cargo-ui.types';
import { DOCUMENT_TYPES, SunatDocType } from '../../fluvial/types/sunat.types';

interface CargoItemFormProps {
  onSubmit: (item: CargoItemData) => void;
  onClose: () => void;
  existingItem?: CargoItemData | null;
  defaultRecipient?: import('../types/cargo-ui.types').RecipientData;
}

type FormValues = Omit<CargoItemData, 'id'>;

const UNIT_OF_MEASURE_OPTIONS = [
  { code: 'ZZ', name: 'Unidad (para servicios)' },
  { code: 'KGM', name: 'Kilogramo' },
  { code: 'PAQ', name: 'Paquete' },
  { code: 'XBX', name: 'Caja' },
  { code: 'TNE', name: 'Tonelada' },
  { code: 'MTR', name: 'Metro' },
  { code: 'MTQ', name: 'Metro Cúbico' },
  { code: 'LTR', name: 'Litro' },
];

export const CargoItemForm: React.FC<CargoItemFormProps> = ({ onSubmit, onClose, existingItem, defaultRecipient }) => {
  const { data: allServices = [], isLoading: isLoadingServices } = useProductsServicesData({ is_active: true });
  const { queryDni, isQueryingDni, queryRuc, isQueryingRuc } = useSunatData();
  const cargoServicePrefillAppliedRef = useRef(false);

  const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
  product: existingItem?.product || undefined,
  quantity: existingItem?.quantity || 1,
  description: existingItem?.description || '',
  // Dejar el precio indefinido cuando no hay un ítem existente para forzar la entrada del usuario
  price: existingItem?.price ?? undefined,
      recipient: existingItem?.recipient || defaultRecipient || {
        isSameAsSender: true,
        name: '',
        docType: SunatDocType.DNI,
        docNumber: '',
        phone: '',
      },
      unitOfMeasure: existingItem?.unitOfMeasure || 'ZZ',
    }
  });

  const selectedProduct = watch('product');
  const isSameAsSender = watch('recipient.isSameAsSender');
  const recipientDocType = watch('recipient.docType');

  const isFormLocked = !selectedProduct; // true mientras no se seleccione un servicio

  const cargoServices = useMemo(() => {
    if (!allServices || allServices.length === 0) {
      return [];
    }

    const filtered = allServices.filter(service => {
      const category = service.service_category?.toUpperCase() || '';
      return category.includes('ENCOMIENDA') || category.includes('CARGA');
    });

    // Encomienda primero (servicio "uno" en la lista corta), luego carga; mismo criterio por id
    const rank = (service: (typeof filtered)[0]) => {
      const c = service.service_category?.toUpperCase() || '';
      if (c.includes('ENCOMIENDA')) return 0;
      if (c.includes('CARGA')) return 1;
      return 2;
    };

    return [...filtered].sort((a, b) => {
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, [allServices]);

  useEffect(() => {
    if (selectedProduct) {
      // No rellenar automáticamente el precio al seleccionar un servicio.
      // Sólo rellenamos la descripción cuando se crea un nuevo ítem.
      if (!existingItem) {
        setValue('description', selectedProduct.name);
      }
    }
  }, [selectedProduct, setValue, existingItem]);

  // Nuevo ítem: preseleccionar el primer servicio listado (encomienda antes que carga). Una sola vez por montaje.
  useEffect(() => {
    if (existingItem) {
      cargoServicePrefillAppliedRef.current = false;
      return;
    }
    if (cargoServices.length === 0) return;
    if (cargoServicePrefillAppliedRef.current) return;
    const first = cargoServices[0];
    setValue('product', first);
    setValue('description', first.name);
    cargoServicePrefillAppliedRef.current = true;
  }, [existingItem, cargoServices, setValue]);

  const handleFormSubmit = (data: FormValues) => {
    if (!data.product) {
      toast.error('Debe seleccionar un servicio.');
      return;
    }
    
    // Validación adicional para destinatario cuando no es el mismo remitente
    if (!data.recipient.isSameAsSender) {
      if (!data.recipient.name.trim()) {
        toast.error('El nombre del destinatario es obligatorio.');
        return;
      }
      if (!data.recipient.docNumber.trim()) {
        toast.error('El número de documento del destinatario es obligatorio.');
        return;
      }
    }

    onSubmit({
      ...data,
      id: existingItem?.id || crypto.randomUUID(),
    });
  };

  // Función para manejar la búsqueda del destinatario
  const handleRecipientSearch = async () => {
    const docType = getValues('recipient.docType');
    const docNumber = getValues('recipient.docNumber');
    
    if (!docNumber.trim()) {
      toast.warning('Ingrese un número de documento para buscar.');
      return;
    }

    try {
      if (docType === SunatDocType.DNI) {
        const data = await queryDni(docNumber);
        if (data) {
          setValue('recipient.name', data.nombreCompleto, { shouldValidate: true });
          // Solo actualizar phone si está disponible en la respuesta
          if (data.phone) {
            setValue('recipient.phone', data.phone, { shouldValidate: true });
          }
          toast.success('Datos encontrados correctamente.');
        }
      } else if (docType === SunatDocType.RUC) {
        const data = await queryRuc(docNumber);
        if (data) {
          setValue('recipient.name', data.razonSocial, { shouldValidate: true });
          // Solo actualizar phone si está disponible en la respuesta
          if (data.phone) {
            setValue('recipient.phone', data.phone, { shouldValidate: true });
          }
          toast.success('Datos encontrados correctamente.');
        }
      } else {
        toast.info('La búsqueda automática solo está disponible para DNI y RUC.');
      }
    } catch (error) {
      // El hook useSunatData ya muestra un toast de error, no necesitamos hacer nada más aquí.
      console.error("Error en la búsqueda del destinatario:", error);
    }
  };

  // CORRECCIÓN: Convertimos `sale_price` a número antes de usar `.toFixed()`
  const productOptions = useMemo(() => {
    // Mostrar solo el nombre del servicio en la lista (sin precio)
    return cargoServices.map(service => ({
      value: service,
      label: service.name,
    }));
  }, [cargoServices]);

  const isRecipientSearchable = recipientDocType === SunatDocType.DNI || recipientDocType === SunatDocType.RUC;
  const isQueryingRecipient = isQueryingDni || isQueryingRuc;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Sección de Servicio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Servicio de Encomienda/Carga *
          </label>
          <Controller
            name="product"
            control={control}
            rules={{ required: 'Debe seleccionar un servicio' }}
            render={({ field }) => (
              <Select
                {...field}
                options={productOptions}
                isLoading={isLoadingServices}
                placeholder="Busque y seleccione un servicio..."
                noOptionsMessage={() => 'No se encontraron servicios de carga/encomienda'}
                // CORRECCIÓN: Para mostrar el valor seleccionado correctamente
                value={field.value ? productOptions.find(opt => opt.value.id === field.value.id) : null}
                onChange={(option) => field.onChange(option?.value)}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            )}
          />
          {errors.product && (
            <p className="text-sm text-red-500 mt-1">{errors.product.message}</p>
          )}
          {isFormLocked && (
            <p className="text-sm text-gray-500 mt-2">Seleccione un servicio para activar el resto del formulario.</p>
          )}
        </div>

        {/* Cantidad y Precio */}
      <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Cantidad *"
              type="number"
        {...register('quantity', { 
                valueAsNumber: true, 
                min: { value: 1, message: 'La cantidad debe ser al menos 1' },
                required: 'La cantidad es obligatoria'
              })}
              disabled={isFormLocked}
              className={isFormLocked ? 'bg-gray-100' : ''}
              error={errors.quantity?.message}
              min="1"
              step="1"
            />
          </div>
          <div>
            <Input
              label="Precio Unitario (S/) *"
              type="number"
              step="0.01"
        {...register('price', { 
                valueAsNumber: true, 
                // Precio obligatorio y mayor que 0
                required: 'El precio es obligatorio',
                min: { value: 0.01, message: 'El precio debe ser mayor que 0' },
              })}
        error={errors.price?.message}
        disabled={isFormLocked}
              className={isFormLocked ? 'bg-gray-100' : ''}
              />
          </div>
        </div>

        {/* Unidad de Medida */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unidad de Medida *
          </label>
          <select
            {...register('unitOfMeasure', { required: 'La unidad de medida es obligatoria' })}
            className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isFormLocked ? 'bg-gray-100' : 'bg-white'}`}
            disabled={isFormLocked}
          >
            {UNIT_OF_MEASURE_OPTIONS.map(opt => (
              <option key={opt.code} value={opt.code} disabled={opt.code !== 'ZZ'}>
                {opt.name}{opt.code !== 'ZZ' ? ' - Desabilitado temporalmente' : ''}
              </option>
            ))}
          </select>
          {errors.unitOfMeasure && (
            <p className="text-sm text-red-500 mt-1">{errors.unitOfMeasure.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción del Contenido *
          </label>
          <textarea
            {...register('description', { required: 'La descripción es obligatoria' })}
            rows={4}
            className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y ${isFormLocked ? 'bg-gray-100' : 'bg-white'}`}
            placeholder="Ej: Repuestos de motor, ropa, electrodomésticos, etc."
            disabled={isFormLocked}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>
        
        {/* Si no se pasa defaultRecipient, mostrar sección de destinatario */}
        {!defaultRecipient && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-md text-gray-800 mb-3">Datos del Destinatario</h4>
                <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSameAsSender"
                  {...register('recipient.isSameAsSender')}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isFormLocked}
                />
                <label htmlFor="isSameAsSender" className="ml-2 block text-sm text-gray-900">
                  El destinatario es el mismo que el remitente
                </label>
              </div>
            </div>
            {/* Formulario de destinatario */}
            {!isSameAsSender && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo Doc. *
                    </label>
                    <select 
                      {...register('recipient.docType')} 
                      className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isFormLocked ? 'bg-gray-100' : 'bg-white'}`}
                      disabled={isFormLocked}
                    >
                      {DOCUMENT_TYPES.map(doc => (
                        <option key={doc.code} value={doc.code}>
                          {doc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° Documento *
                    </label>
                    <div className="flex">
          <Input
                        {...register('recipient.docNumber', {
                          required: !isSameAsSender ? 'El número de documento es obligatorio' : false
                        })}
            error={errors.recipient?.docNumber?.message}
            className={`rounded-r-none ${isFormLocked ? 'bg-gray-100' : ''}`}
            placeholder={recipientDocType === SunatDocType.DNI ? '12345678' : '20123456789'}
            disabled={isFormLocked}
                      />
                      <Button
                        type="button"
                        onClick={handleRecipientSearch}
            disabled={!isRecipientSearchable || isQueryingRecipient || isFormLocked}
                        className="rounded-l-none px-3 h-10 flex items-center justify-center"
                        title={isRecipientSearchable ? 'Buscar datos en SUNAT' : 'Búsqueda disponible solo para DNI y RUC'}
                      >
                        {isQueryingRecipient ? (
                          <Spinner size="sm" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Input 
                    label="Nombre Completo del Destinatario *" 
                    {...register('recipient.name', {
                      required: !isSameAsSender ? 'El nombre del destinatario es obligatorio' : false
                    })}
                    error={errors.recipient?.name?.message}
                    placeholder="Nombre completo o razón social"
                    disabled={isFormLocked}
                    className={isFormLocked ? 'bg-gray-100' : ''}
                  />
                </div>
                <div>
                  <Input 
                    label="Teléfono de Contacto" 
                    {...register('recipient.phone')}
                    placeholder="Número de teléfono (opcional)"
                    type="tel"
                    disabled={isFormLocked}
                    className={isFormLocked ? 'bg-gray-100' : ''}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className={`bg-blue-600 hover:bg-blue-700 ${isFormLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={isFormLocked}
            title={isFormLocked ? 'Seleccione un servicio primero' : ''}
          >
            {isFormLocked ? 'Seleccione un servicio' : (existingItem ? 'Actualizar Ítem' : 'Añadir Ítem')}
          </Button>
        </div>
      </form>
    </div>
  );
};