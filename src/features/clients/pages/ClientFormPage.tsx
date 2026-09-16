// src/features/clients/pages/ClientFormPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  MapPinIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  HashtagIcon,
  HomeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { LocationSelector } from '../../../components/common/LocationSelector';
import { clientsService, CreateClientData } from '../../../services/clients.service';
import { DocType } from '../../../types';
import { useLocation } from '../../../hooks/useLocation';

const clientSchema = z.object({
  doc_type: z.enum(['1', '4', '6', '7', '0'], {
    errorMap: () => ({ message: 'Tipo de documento inválido' }),
  }),
  doc_number: z.string()
    .min(1, 'Número de documento es requerido')
    .max(20, 'Número de documento debe tener máximo 20 caracteres'),
  name: z.string()
    .min(1, 'Nombre es requerido')
    .max(255, 'Nombre debe tener máximo 255 caracteres'),

  // Campos de dirección actualizados
  address_line: z.string().max(255, 'Dirección muy larga').optional(),
  department: z.string().max(50, 'Departamento muy largo').optional(),
  province: z.string().max(50, 'Provincia muy larga').optional(),
  district: z.string().max(50, 'Distrito muy largo').optional(),
  country_code: z.string().max(5, 'Código de país muy largo').optional(),

  ubigeo: z.string()
    .length(6, 'Ubigeo debe tener 6 caracteres')
    .regex(/^\d{6}$/, 'Ubigeo debe ser numérico')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(50, 'Teléfono muy largo').optional(),
  is_active: z.boolean(),
});
type UpdateClientData = CreateClientData;

type ClientFormData = z.infer<typeof clientSchema>;

// Opciones de tipo de documento para el select
const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: '6', label: 'RUC' },
  { value: '1', label: 'DNI' },
  { value: '4', label: 'Carnet de Extranjería' },
  { value: '7', label: 'Pasaporte' },
  { value: '0', label: 'Otros' },
];

export const ClientFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id && id !== 'new';

  // Query para obtener datos del cliente (solo si estamos editando)
  const {
    data: client,
    isLoading: isLoadingClient,
    error: clientError
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsService.getById(Number(id)),
    enabled: isEditing,
    retry: 1,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      doc_type: '6',
      country_code: 'PE',
      is_active: true,
    },
  });

  // Hook personalizado para manejo de ubicación
  const { handleLocationChange } = useLocation({
    setValue,
    initialData: isEditing && client ? {
      country_code: client.country_code,
      department: client.department,
      province: client.province,
      district: client.district,
    } : undefined
  });

  // Mutación para crear cliente
  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientData) => clientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente creado correctamente');
      navigate('/clients');
    },
    onError: (error: any) => {
      console.error('Error creando cliente:', error);
      if (error.response?.status === 422) {
        const detail = error.response.data?.detail;
        if (Array.isArray(detail)) {
          const message = detail.map((err: any) => err.msg).join(', ');
          toast.error(message);
        } else {
          toast.error('Error de validación en los datos');
        }
      } else {
        toast.error(error.response?.data?.detail || 'Error al crear cliente');
      }
    }
  });

  // Mutación para actualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientData }) =>
      clientsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast.success('Cliente actualizado correctamente');
      navigate('/clients');
    },
    onError: (error: any) => {
      console.error('Error actualizando cliente:', error);
      if (error.response?.status === 422) {
        const detail = error.response.data?.detail;
        if (Array.isArray(detail)) {
          const message = detail.map((err: any) => err.msg).join(', ');
          toast.error(message);
        } else {
          toast.error('Error de validación en los datos');
        }
      } else if (error.response?.status === 404) {
        toast.error('Cliente no encontrado');
      } else {
        toast.error(error.response?.data?.detail || 'Error al actualizar cliente');
      }
    }
  });

  // Cargar datos para edición
  useEffect(() => {
    if (isEditing && client) {
      reset({
        doc_type: client.doc_type as DocType,
        doc_number: client.doc_number,
        name: client.name,
        address_line: client.address_line || '',
        department: client.department || '',
        province: client.province || '',
        district: client.district || '',
        country_code: client.country_code || 'PE',
        ubigeo: client.ubigeo || '',
        email: client.email || '',
        phone: client.phone || '',
        is_active: client.is_active,
      });
    }
  }, [isEditing, client, reset]);

  // Observar cambios en el tipo de documento
  const docType = watch('doc_type');
  const isActive = watch('is_active');

  // Validar número de documento según el tipo
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'doc_number' && value.doc_number) {
        const docNumber = value.doc_number;

        switch (docType) {
          case '1': // DNI
            if (docNumber.length > 8) {
              setValue('doc_number', docNumber.slice(0, 8).replace(/\D/g, ''));
            }
            break;
          case '6': // RUC
            if (docNumber.length > 11) {
              setValue('doc_number', docNumber.slice(0, 11).replace(/\D/g, ''));
            }
            break;
          case '4': // Carnet de Extranjería
          case '7': // Pasaporte
          case '0': // Otros
            if (docNumber.length > 20) {
              setValue('doc_number', docNumber.slice(0, 20));
            }
            break;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [docType, setValue, watch]);

  // Enviar formulario
  const onSubmit = (data: ClientFormData) => {
    const cleanData = {
      ...data,
      address_line: data.address_line || undefined,
      department: data.department || undefined,
      province: data.province || undefined,
      district: data.district || undefined,
      country_code: data.country_code || undefined,
      ubigeo: data.ubigeo || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
    };

    if (isEditing && id) {
      updateClientMutation.mutate({
        id: Number(id),
        data: cleanData
      });
    } else {
      createClientMutation.mutate(cleanData);
    }
  };

  // Clases reutilizables para inputs y selects
  const inputBaseClass =
    'mt-1 block w-full rounded-lg border bg-dm-bg-primary text-dm-text-primary ' +
    'placeholder:text-dm-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
    'transition-all duration-200 py-2.5 px-3.5 text-sm';

  const selectBaseClass =
    'mt-1 block w-full rounded-lg border bg-dm-bg-primary text-dm-text-primary ' +
    'focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
    'transition-all duration-200 py-2.5 px-3.5 text-sm appearance-none';

  const errorClass = 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
  const normalClass = 'border-dm-border-primary';

  // Sección de estado (error o loading)
  if (clientError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 rounded-lg hover:bg-dm-bg-hover transition-colors"
            title="Volver"
          >
            <ArrowLeftIcon className="w-5 h-5 text-dm-text-secondary" />
          </button>
          <h1 className="text-2xl font-bold text-dm-text-primary">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <XCircleIcon className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-red-800 dark:text-red-300">
                Error al cargar cliente
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                No se pudo cargar la información del cliente.
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => navigate('/clients')}>
                  Volver a la lista
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingClient) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 rounded-lg hover:bg-dm-bg-hover transition-colors"
            title="Volver"
          >
            <ArrowLeftIcon className="w-5 h-5 text-dm-text-secondary" />
          </button>
          <h1 className="text-2xl font-bold text-dm-text-primary">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
        </div>
        <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary shadow-sm p-12 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 rounded-lg hover:bg-dm-bg-hover transition-colors"
            title="Volver"
          >
            <ArrowLeftIcon className="w-5 h-5 text-dm-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dm-text-primary">
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h1>
            <p className="text-sm text-dm-text-muted mt-0.5">
              {isEditing
                ? 'Actualiza la información del cliente existente'
                : 'Completa los datos para registrar un nuevo cliente'}
            </p>
          </div>
        </div>

        {/* Toggle Activo */}
        <button
          type="button"
          onClick={() => setValue('is_active', !isActive)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-dm-bg-secondary text-dm-text-muted border border-dm-border-primary'
          }`}
        >
          {isActive ? (
            <>
              <CheckCircleIcon className="w-4 h-4" />
              Cliente Activo
            </>
          ) : (
            <>
              <XCircleIcon className="w-4 h-4" />
              Cliente Inactivo
            </>
          )}
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card: Información Básica */}
        <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-dm-border-primary bg-dm-bg-secondary/50">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/40">
                <UserCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-dm-text-primary">Información Básica</h2>
                <p className="text-xs text-dm-text-muted">Datos de identificación y contacto</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Documento */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <DocumentTextIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                    Tipo de Documento
                  </span>
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register('doc_type')}
                    className={`${selectBaseClass} ${errors.doc_type ? errorClass : normalClass}`}
                  >
                    {DOC_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-dm-text-muted">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.doc_type && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {errors.doc_type.message}
                  </p>
                )}
              </div>

              {/* Número de Documento */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <IdentificationIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                    Número de Documento
                  </span>
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  {...register('doc_number')}
                  className={`${inputBaseClass} ${errors.doc_number ? errorClass : normalClass}`}
                  placeholder={
                    docType === '1' ? 'Ingrese 8 dígitos' :
                    docType === '6' ? 'Ingrese 11 dígitos' :
                    'Ingrese número de documento'
                  }
                  maxLength={
                    docType === '1' ? 8 :
                    docType === '6' ? 11 :
                    20
                  }
                />
                {errors.doc_number && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {errors.doc_number.message}
                  </p>
                )}
              </div>

              {/* Nombre o Razón Social */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <BuildingOffice2Icon className="w-3.5 h-3.5 text-dm-text-muted" />
                    {docType === '6' ? 'Razón Social' : 'Nombre Completo'}
                  </span>
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`${inputBaseClass} ${errors.name ? errorClass : normalClass}`}
                  placeholder={
                    docType === '6' ? 'Ingrese razón social' : 'Ingrese nombre completo'
                  }
                />
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <EnvelopeIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                    Correo Electrónico
                  </span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className={`${inputBaseClass} ${errors.email ? errorClass : normalClass}`}
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                    Teléfono
                  </span>
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  className={`${inputBaseClass} ${errors.phone ? errorClass : normalClass}`}
                  placeholder="Ingrese teléfono"
                />
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card: Dirección */}
        <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-dm-border-primary bg-dm-bg-secondary/50">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/40">
                <MapPinIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-dm-text-primary">Información de Dirección</h2>
                <p className="text-xs text-dm-text-muted">Ubicación geográfica del cliente</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Selector de Ubicación Dinámico */}
            <LocationSelector
              countryCode={watch('country_code')}
              department={watch('department')}
              province={watch('province')}
              district={watch('district')}
              {...handleLocationChange}
              errors={{
                country_code: errors.country_code?.message,
                department: errors.department?.message,
                province: errors.province?.message,
                district: errors.district?.message,
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Ubigeo */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <HashtagIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                    Código UBIGEO
                  </span>
                  <span className="text-dm-text-muted ml-1 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  {...register('ubigeo')}
                  className={`${inputBaseClass} ${errors.ubigeo ? errorClass : normalClass}`}
                  placeholder="Código de 6 dígitos"
                  maxLength={6}
                />
                <p className="mt-1.5 text-xs text-dm-text-muted">
                  Código UBIGEO si se conoce específicamente
                </p>
                {errors.ubigeo && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {errors.ubigeo.message}
                  </p>
                )}
              </div>

              {/* Dirección Específica */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <HomeIcon className="w-3.5 h-3.5 text-dm-text-muted" />
                    Dirección Completa
                  </span>
                </label>
                <input
                  type="text"
                  {...register('address_line')}
                  className={`${inputBaseClass} ${errors.address_line ? errorClass : normalClass}`}
                  placeholder="Av/Jr/Calle, número, referencia, interior, etc."
                />
                <p className="mt-1.5 text-xs text-dm-text-muted">
                  Dirección específica: calle, número, interior, referencias
                </p>
                {errors.address_line && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {errors.address_line.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/clients')}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting || createClientMutation.isPending || updateClientMutation.isPending}
            className="w-full sm:w-auto"
          >
            {isEditing ? 'Actualizar Cliente' : 'Guardar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
};
