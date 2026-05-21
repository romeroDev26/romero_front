// src/features/clients/pages/ClientFormPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/sileo-toast';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { LocationSelector } from '../../../components/common/LocationSelector'; // Assuming this is correct
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
type UpdateClientData = CreateClientData; // Assuming UpdateClientData is the same as CreateClientData for now

type ClientFormData = z.infer<typeof clientSchema>;

// Función helper para obtener el texto del tipo de documento
const getDocTypeDisplay = (type: DocType): string => {
  switch (type) {
    case '1': return 'DNI';
    case '4': return 'Carnet de Extranjería';
    case '6': return 'RUC';
    case '7': return 'Pasaporte';
    case '0': return 'Otros';
    default: return 'Desconocido';
  }
};

// Funciones helper para manejar los cambios de ubicación
const handleLocationChange = (setValue: any) => ({
  onCountryChange: (countryCode: string) => {
    setValue('country_code', countryCode);
  },
  onDepartmentChange: (department: string) => {
    setValue('department', department);
  },
  onProvinceChange: (province: string) => {
    setValue('province', province);
  },
  onDistrictChange: (district: string) => {
    setValue('district', district);
  },
});

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
      doc_type: '6', // Por defecto RUC para empresa de transporte
      country_code: 'PE', // Por defecto Perú
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
          const message = detail.map(err => err.msg).join(', ');
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
          const message = detail.map(err => err.msg).join(', ');
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
  
  // Observar cambios en el tipo de documento para ajustar validaciones dinámicamente
  const docType = watch('doc_type');
  
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
    // Limpiar campos vacíos
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
  
  // Manejo de errores
  if (clientError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dm-text-primary">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Error al cargar cliente
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>No se pudo cargar la información del cliente.</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/clients')}
                >
                  Volver a la lista
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Mostrar loading si se están cargando datos
  if (isLoadingClient) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dm-text-primary">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
        </div>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dm-text-primary">
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
      </div>
      
      <div className="bg-dm-bg-primary rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="border-b border-dm-border-primary pb-6">
            <h3 className="text-lg font-medium text-dm-text-primary mb-4">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Documento */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  Tipo de Documento *
                </label>
                <select
                  {...register('doc_type')}
                  className="mt-1 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                >
                  <option value="6">RUC</option>
                  <option value="1">DNI</option>
                  <option value="4">Carnet de Extranjería</option>
                  <option value="7">Pasaporte</option>
                  <option value="0">Otros</option>
                </select>
                {errors.doc_type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.doc_type.message}</p>
                )}
              </div>
              
              {/* Número de Documento */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  {...register('doc_number')}
                  className="mt-1 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.doc_number.message}</p>
                )}
              </div>
              
              {/* Nombre o Razón Social */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  {docType === '6' ? 'Razón Social' : 'Nombre Completo'} *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                  placeholder={
                    docType === '6' ? 'Ingrese razón social' : 'Ingrese nombre completo'
                  }
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="mt-1 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>
              
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  className="mt-1 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                  placeholder="Ingrese teléfono"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Información de Dirección */}
          <div className="border-b border-dm-border-primary pb-6">
            <h3 className="text-lg font-medium text-dm-text-primary mb-4">Información de Dirección</h3>
            
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
              {/* Ubigeo - mantener el campo manual para casos especiales */}
              <div>
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  Ubigeo (Opcional)
                </label>
                <input
                  type="text"
                  {...register('ubigeo')}
                  className="mt-1 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                  placeholder="Código de 6 dígitos"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-dm-text-muted">
                  Código UBIGEO si se conoce específicamente
                </p>
                {errors.ubigeo && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ubigeo.message}</p>
                )}
              </div>
              
              {/* Dirección Específica */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dm-text-secondary mb-1">
                  Dirección Completa
                </label>
                <input
                  type="text"
                  {...register('address_line')}
                  className="mt-1 block w-full rounded-md border-dm-border-primary shadow-sm p-2 border"
                  placeholder="Av/Jr/Calle, número, referencia, interior, etc."
                />
                <p className="mt-1 text-xs text-dm-text-muted">
                  Dirección específica: calle, número, interior, referencias
                </p>
                {errors.address_line && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address_line.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Estado */}
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="rounded border-dm-border-primary text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm text-dm-text-secondary">
                Cliente Activo
              </label>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/clients')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || createClientMutation.isPending || updateClientMutation.isPending}
            >
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};