// src/features/cargo/components/CargoItemForm.tsx

import React, { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from '@/utils/sileo-toast';
import Select from 'react-select';
import { Search } from 'lucide-react';

import { Button } from '../../../components/common/Button';
import { Spinner } from '../../../components/common/Spinner';
import { ClientSearchAutocomplete } from '../../../components/common/ClientSearchAutocomplete';
import { useProductsServicesData } from '../../fluvial/hooks/useProductsServicesData';
import { useSunatData } from '../../fluvial/hooks/useSunatData';
import { Client } from '../../../types';
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

/* ── Tokens de diseño (DESIGN.md) ── */
const COLORS = {
  midnight: 'var(--text-primary)',
  canvas: 'var(--bg-primary)',
  slateMist: 'var(--bg-secondary)',
  cloudWhisper: 'var(--bg-secondary)',
  darkShale: 'var(--text-secondary)',
  silverAsh: 'var(--text-muted)',
  lightPearl: 'var(--border-primary)',
  sunset: '#ff682c',
};

const FONT = {
  inter: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  heading: "'Saira', 'Montserrat', ui-sans-serif, system-ui, sans-serif",
};

export const CargoItemForm: React.FC<CargoItemFormProps> = ({
  onSubmit,
  onClose,
  existingItem,
  defaultRecipient,
}) => {
  const { data: allServices = [], isLoading: isLoadingServices } = useProductsServicesData({ is_active: true });
  const { queryDni, isQueryingDni, queryRuc, isQueryingRuc } = useSunatData();
  const cargoServicePrefillAppliedRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      product: existingItem?.product || undefined,
      quantity: existingItem?.quantity || 1,
      description: existingItem?.description || '',
      price: existingItem?.price ?? undefined,
      recipient:
        existingItem?.recipient ||
        defaultRecipient || {
          isSameAsSender: true,
          name: '',
          docType: SunatDocType.DNI,
          docNumber: '',
          phone: '',
        },
      unitOfMeasure: existingItem?.unitOfMeasure || 'ZZ',
    },
  });

  const selectedProduct = watch('product');
  const isSameAsSender = watch('recipient.isSameAsSender');
  const recipientDocType = watch('recipient.docType');

  const isFormLocked = !selectedProduct;

  const cargoServices = useMemo(() => {
    if (!allServices || allServices.length === 0) return [];

    const filtered = allServices.filter((service) => {
      const category = service.service_category?.toUpperCase() || '';
      return service.internal_code !== 'REPROGRAMACION' && (category.includes('ENCOMIENDA') || category.includes('CARGA'));
    });

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
      if (!existingItem) {
        setValue('description', selectedProduct.name);
      }
    }
  }, [selectedProduct, setValue, existingItem]);

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

  const handleClientSelect = (client: Client) => {
    setValue('recipient.name', client.name, { shouldValidate: true });
    setValue('recipient.docType', client.doc_type, { shouldValidate: true });
    setValue('recipient.docNumber', client.doc_number, { shouldValidate: true });
    setValue('recipient.phone', client.phone || '', { shouldValidate: true });
    toast.success(`Destinatario seleccionado: ${client.name}`);
  };

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
          if (data.phone) {
            setValue('recipient.phone', data.phone, { shouldValidate: true });
          }
          toast.success('Datos encontrados correctamente.');
        }
      } else if (docType === SunatDocType.RUC) {
        const data = await queryRuc(docNumber);
        if (data) {
          setValue('recipient.name', data.razonSocial, { shouldValidate: true });
          if (data.phone) {
            setValue('recipient.phone', data.phone, { shouldValidate: true });
          }
          toast.success('Datos encontrados correctamente.');
        }
      } else {
        toast.info('La búsqueda automática solo está disponible para DNI y RUC.');
      }
    } catch (error) {
      console.error('Error en la búsqueda del destinatario:', error);
    }
  };

  const productOptions = useMemo(
    () =>
      cargoServices.map((service) => ({
        value: service,
        label: service.name,
      })),
    [cargoServices]
  );

  const isRecipientSearchable =
    recipientDocType === SunatDocType.DNI || recipientDocType === SunatDocType.RUC;
  const isQueryingRecipient = isQueryingDni || isQueryingRuc;

  /* ── Estilos react-select alineados con DESIGN.md ── */
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: 8,
      borderColor: state.isFocused ? COLORS.midnight : COLORS.lightPearl,
      boxShadow: state.isFocused ? `0 0 0 1px ${COLORS.midnight}` : 'none',
      backgroundColor: isFormLocked ? COLORS.cloudWhisper : COLORS.canvas,
      minHeight: 42,
      fontFamily: FONT.inter,
      fontSize: 15,
      color: COLORS.midnight,
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: COLORS.midnight,
      },
    }),
    placeholder: (base: any) => ({
      ...base,
      color: COLORS.silverAsh,
      fontFamily: FONT.inter,
      fontSize: 15,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: COLORS.midnight,
      fontFamily: FONT.inter,
      fontSize: 15,
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: 8,
      border: `1px solid ${COLORS.lightPearl}`,
      boxShadow: 'none',
      fontFamily: FONT.inter,
      fontSize: 15,
      zIndex: 20,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? COLORS.slateMist
        : state.isFocused
        ? COLORS.cloudWhisper
        : COLORS.canvas,
      color: COLORS.midnight,
      fontFamily: FONT.inter,
      fontSize: 15,
      cursor: 'pointer',
    }),
    noOptionsMessage: (base: any) => ({
      ...base,
      color: COLORS.silverAsh,
      fontFamily: FONT.inter,
      fontSize: 14,
    }),
    loadingMessage: (base: any) => ({
      ...base,
      color: COLORS.silverAsh,
      fontFamily: FONT.inter,
      fontSize: 14,
    }),
  };

  const inputClass = (hasError?: string, locked?: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-[15px] transition duration-200 outline-none ${FONT.inter} ` +
    (hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 '
      : `border-[${COLORS.lightPearl}] focus:border-primary focus:ring-1 focus:ring-primary/20 `) +
    (locked ? 'bg-dm-bg-secondary text-dm-text-muted cursor-not-allowed ' : 'bg-dm-bg-primary text-dm-text-primary ');

  const labelClass = `block text-sm font-medium mb-1.5 ${FONT.inter}`;

  const sectionClass = `rounded-lg border border-[${COLORS.lightPearl}] bg-dm-bg-primary p-5 space-y-5`;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Encabezado */}
        <div className="space-y-1">
          <h2
            className="font-medium tracking-tight"
            style={{
              fontFamily: FONT.heading,
              fontSize: 18,
              lineHeight: 1.25,
              color: COLORS.midnight,
            }}
          >
            {existingItem ? 'Editar ítem de encomienda' : 'Añadir ítem de encomienda'}
          </h2>
          <p
            style={{
              fontFamily: FONT.inter,
              fontSize: 15,
              lineHeight: 1.33,
              color: COLORS.silverAsh,
            }}
          >
            Complete los datos del servicio, cantidad, precio y destinatario.
          </p>
        </div>

        {/* Sección Servicio */}
        <div
          className="rounded-lg border bg-dm-bg-primary p-5 space-y-4"
          style={{ borderColor: COLORS.lightPearl }}
        >
          <div>
            <label
              className={labelClass}
              style={{ color: COLORS.midnight }}
            >
              Servicio de Encomienda/Carga <span style={{ color: COLORS.sunset }}>*</span>
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
                  isDisabled={false}
                  placeholder="Busque y seleccione un servicio…"
                  noOptionsMessage={() => 'No se encontraron servicios de carga/encomienda'}
                  value={
                    field.value
                      ? productOptions.find((opt) => opt.value.id === field.value.id)
                      : null
                  }
                  onChange={(option) => field.onChange(option?.value)}
                  styles={selectStyles}
                />
              )}
            />
            {errors.product && (
              <p
                className="mt-1.5 text-sm"
                style={{ color: '#d9534f', fontFamily: FONT.inter }}
              >
                {errors.product.message}
              </p>
            )}
            {isFormLocked && (
              <p
                className="mt-2 text-sm"
                style={{ color: COLORS.silverAsh, fontFamily: FONT.inter }}
              >
                Seleccione un servicio para activar el resto del formulario.
              </p>
            )}
          </div>

          {/* Cantidad y Precio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                className={labelClass}
                style={{ color: COLORS.midnight }}
              >
                Cantidad <span style={{ color: COLORS.sunset }}>*</span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                disabled={isFormLocked}
                {...register('quantity', {
                  valueAsNumber: true,
                  min: { value: 1, message: 'La cantidad debe ser al menos 1' },
                  required: 'La cantidad es obligatoria',
                })}
                className={inputClass(errors.quantity?.message, isFormLocked)}
                style={{
                  borderColor: errors.quantity ? '#fca5a5' : COLORS.lightPearl,
                }}
              />
              {errors.quantity && (
                <p
                  className="mt-1.5 text-sm"
                  style={{ color: '#d9534f', fontFamily: FONT.inter }}
                >
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <label
                className={labelClass}
                style={{ color: COLORS.midnight }}
              >
                Precio Unitario (S/) <span style={{ color: COLORS.sunset }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                disabled={isFormLocked}
                {...register('price', {
                  valueAsNumber: true,
                  required: 'El precio es obligatorio',
                  min: { value: 0.01, message: 'El precio debe ser mayor que 0' },
                })}
                className={inputClass(errors.price?.message, isFormLocked)}
                style={{
                  borderColor: errors.price ? '#fca5a5' : COLORS.lightPearl,
                }}
              />
              {errors.price && (
                <p
                  className="mt-1.5 text-sm"
                  style={{ color: '#d9534f', fontFamily: FONT.inter }}
                >
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>

          {/* Unidad de Medida */}
          <div>
            <label
              className={labelClass}
              style={{ color: COLORS.midnight }}
            >
              Unidad de Medida <span style={{ color: COLORS.sunset }}>*</span>
            </label>
            <select
              {...register('unitOfMeasure', {
                required: 'La unidad de medida es obligatoria',
              })}
              disabled={isFormLocked}
              className={inputClass(errors.unitOfMeasure?.message, isFormLocked)}
              style={{
                borderColor: errors.unitOfMeasure ? '#fca5a5' : COLORS.lightPearl,
              }}
            >
              {UNIT_OF_MEASURE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} disabled={opt.code !== 'ZZ'}>
                  {opt.name}
                  {opt.code !== 'ZZ' ? ' — Deshabilitado temporalmente' : ''}
                </option>
              ))}
            </select>
            {errors.unitOfMeasure && (
              <p
                className="mt-1.5 text-sm"
                style={{ color: '#d9534f', fontFamily: FONT.inter }}
              >
                {errors.unitOfMeasure.message}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label
              className={labelClass}
              style={{ color: COLORS.midnight }}
            >
              Descripción del Contenido <span style={{ color: COLORS.sunset }}>*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'La descripción es obligatoria',
              })}
              rows={4}
              disabled={isFormLocked}
              placeholder="Ej: Repuestos de motor, ropa, electrodomésticos, etc."
              className={`${inputClass(errors.description?.message, isFormLocked)} resize-y`}
              style={{
                borderColor: errors.description ? '#fca5a5' : COLORS.lightPearl,
              }}
            />
            {errors.description && (
              <p
                className="mt-1.5 text-sm"
                style={{ color: '#d9534f', fontFamily: FONT.inter }}
              >
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* Sección Destinatario */}
        {!defaultRecipient && (
          <div
            className="rounded-lg border bg-dm-bg-primary p-5 space-y-5"
            style={{ borderColor: COLORS.lightPearl }}
          >
            <div>
              <h3
                className="font-medium"
                style={{
                  fontFamily: FONT.heading,
                  fontSize: 16,
                  color: COLORS.midnight,
                  letterSpacing: '-0.01em',
                }}
              >
                Datos del Destinatario
              </h3>
              <p
                className="mt-1"
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 14,
                  color: COLORS.silverAsh,
                }}
              >
                Indique quién recibirá la encomienda en destino.
              </p>
            </div>

            <label
              className="flex items-center gap-3 cursor-pointer select-none"
              style={{ cursor: isFormLocked ? 'not-allowed' : 'pointer', opacity: isFormLocked ? 0.6 : 1 }}
            >
              <input
                type="checkbox"
                id="isSameAsSender"
                {...register('recipient.isSameAsSender')}
                disabled={isFormLocked}
                className="h-[18px] w-[18px] rounded border-2 cursor-pointer"
                style={{
                  accentColor: COLORS.midnight,
                  borderColor: COLORS.lightPearl,
                }}
              />
              <span
                className="text-[15px]"
                style={{ fontFamily: FONT.inter, color: COLORS.midnight }}
              >
                El destinatario es el mismo que el remitente
              </span>
            </label>

            {/* Formulario de destinatario */}
            {!isSameAsSender && (
              <div
                className="rounded-lg p-5 space-y-5"
                style={{
                  backgroundColor: COLORS.cloudWhisper,
                  border: `1px solid ${COLORS.lightPearl}`,
                }}
              >
                <ClientSearchAutocomplete
                  onSelect={handleClientSelect}
                  placeholder="Buscar destinatario por nombre..."
                  disabled={isFormLocked}
                  label="Búsqueda rápida de destinatario"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-1">
                    <label
                      className={labelClass}
                      style={{ color: COLORS.midnight }}
                    >
                      Tipo Doc. <span style={{ color: COLORS.sunset }}>*</span>
                    </label>
                    <select
                      {...register('recipient.docType')}
                      disabled={isFormLocked}
                      className={inputClass(undefined, isFormLocked)}
                      style={{ borderColor: COLORS.lightPearl }}
                    >
                      {DOCUMENT_TYPES.map((doc) => (
                        <option key={doc.code} value={doc.code}>
                          {doc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      className={labelClass}
                      style={{ color: COLORS.midnight }}
                    >
                      N° Documento <span style={{ color: COLORS.sunset }}>*</span>
                    </label>
                    <div className="flex">
                      <input
                        {...register('recipient.docNumber', {
                          required: !isSameAsSender
                            ? 'El número de documento es obligatorio'
                            : false,
                        })}
                        placeholder={
                          recipientDocType === SunatDocType.DNI
                            ? '12345678'
                            : '20123456789'
                        }
                        disabled={isFormLocked}
                        className={`${inputClass(errors.recipient?.docNumber?.message, isFormLocked)} rounded-r-none`}
                        style={{
                          borderColor: errors.recipient?.docNumber
                            ? '#fca5a5'
                            : COLORS.lightPearl,
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRecipientSearch}
                        disabled={!isRecipientSearchable || isQueryingRecipient || isFormLocked}
                        title={
                          isRecipientSearchable
                            ? 'Buscar datos en SUNAT'
                            : 'Búsqueda disponible solo para DNI y RUC'
                        }
                        className="inline-flex items-center justify-center px-3 rounded-r-lg border border-l-0 transition duration-200 shrink-0"
                        style={{
                          backgroundColor:
                            !isRecipientSearchable || isFormLocked
                              ? COLORS.cloudWhisper
                              : COLORS.midnight,
                          borderColor: COLORS.lightPearl,
                          color:
                            !isRecipientSearchable || isFormLocked
                              ? COLORS.silverAsh
                              : COLORS.canvas,
                          cursor:
                            !isRecipientSearchable || isFormLocked
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (isRecipientSearchable && !isFormLocked) {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              COLORS.darkShale;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isRecipientSearchable && !isFormLocked) {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                              COLORS.midnight;
                          }
                        }}
                      >
                        {isQueryingRecipient ? (
                          <Spinner size="sm" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.recipient?.docNumber && (
                      <p
                        className="mt-1.5 text-sm"
                        style={{ color: '#d9534f', fontFamily: FONT.inter }}
                      >
                        {errors.recipient.docNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    className={labelClass}
                    style={{ color: COLORS.midnight }}
                  >
                    Nombre Completo del Destinatario{' '}
                    <span style={{ color: COLORS.sunset }}>*</span>
                  </label>
                  <input
                    {...register('recipient.name', {
                      required: !isSameAsSender
                        ? 'El nombre del destinatario es obligatorio'
                        : false,
                    })}
                    placeholder="Nombre completo o razón social"
                    disabled={isFormLocked}
                    className={inputClass(errors.recipient?.name?.message, isFormLocked)}
                    style={{
                      borderColor: errors.recipient?.name
                        ? '#fca5a5'
                        : COLORS.lightPearl,
                    }}
                  />
                  {errors.recipient?.name && (
                    <p
                      className="mt-1.5 text-sm"
                      style={{ color: '#d9534f', fontFamily: FONT.inter }}
                    >
                      {errors.recipient.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={labelClass}
                    style={{ color: COLORS.midnight }}
                  >
                    Teléfono de Contacto
                  </label>
                  <input
                    {...register('recipient.phone')}
                    placeholder="Número de teléfono (opcional)"
                    type="tel"
                    disabled={isFormLocked}
                    className={inputClass(undefined, isFormLocked)}
                    style={{ borderColor: COLORS.lightPearl }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div
          className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2"
          style={{ borderTop: `1px solid ${COLORS.lightPearl}` }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto justify-center"
            style={{
              borderRadius: 20,
              fontFamily: FONT.inter,
              fontSize: 15,
              borderColor: COLORS.midnight,
              color: COLORS.midnight,
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isFormLocked}
            title={isFormLocked ? 'Seleccione un servicio primero' : ''}
            className="w-full sm:w-auto justify-center transition-all duration-200"
            style={{
              borderRadius: 20,
              fontFamily: FONT.inter,
              fontSize: 15,
              fontWeight: 500,
              backgroundColor: isFormLocked ? COLORS.lightPearl : COLORS.midnight,
              color: isFormLocked ? COLORS.silverAsh : COLORS.canvas,
              border: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isFormLocked) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.darkShale;
              }
            }}
            onMouseLeave={(e) => {
              if (!isFormLocked) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.midnight;
              }
            }}
          >
            {isFormLocked
              ? 'Seleccione un servicio'
              : existingItem
              ? 'Actualizar ítem'
              : 'Añadir ítem'}
          </Button>
        </div>
      </form>
    </div>
  );
};
