// src/features/clients/pages/ClientFormPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { DocType, Client } from '../../../types';

// Este servicio tendría que ser implementado
// import { clientsService } from '../../../services/clients.service';

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
  address: z.string().max(255, 'Dirección muy larga').optional(),
  ubigeo: z.string()
    .length(6, 'Ubigeo debe tener 6 caracteres')
    .regex(/^\d{6}$/, 'Ubigeo debe ser numérico')
    .optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(50, 'Teléfono muy largo').optional(),
  is_active: z.boolean().default(true),
});

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

export const ClientFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: client, isLoading: isLoadingClient } = useQuery(
  //   ['client', id],
  //   () => clientsService.getById(Number(id)),
  //   { enabled: isEditing }
  // );
  
  // Datos simulados para el ejemplo
  const client = isEditing ? {
    id: 1,
    doc_type: '6' as DocType,
    doc_number: '20123456789',
    name: 'Empresa ABC S.A.C.',
    address: 'Av. Comercio 123, Lima',
    ubigeo: '150101',
    email: 'contacto@empresaabc.com',
    phone: '01-1234567',
    is_active: true,
    created_at: '2025-01-01T00:00:00-05:00',
    updated_at: '2025-01-01T00:00:00-05:00',
  } : null;
  
  const isLoadingClient = false;
  
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
      is_active: true,
    },
  });
  
  // Cargar datos para edición
  useEffect(() => {
    if (isEditing && client) {
      reset({
        doc_type: client.doc_type,
        doc_number: client.doc_number,
        name: client.name,
        address: client.address,
        ubigeo: client.ubigeo,
        email: client.email,
        phone: client.phone,
        is_active: client.is_active,
      });
    }
  }, [isEditing, client, reset]);
  
  // Observar cambios en el tipo de documento para ajustar validaciones dinámicamente
  const docType = watch('doc_type');
  
  // Validar número de documento según el tipo
  useEffect(() => {
    const docNumber = watch('doc_number');
    if (!docNumber) return;
    
    switch (docType) {
      case '1': // DNI
        if (docNumber.length !== 8) {
          setValue('doc_number', docNumber.slice(0, 8).replace(/\D/g, ''));
        }
        break;
      case '6': // RUC
        if (docNumber.length !== 11) {
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
  }, [docType, watch, setValue]);
  
  // Enviar formulario
  const onSubmit = (data: ClientFormData) => {
    // En un proyecto real, llamarías a una API
    // if (isEditing) {
    //   clientsService.update(Number(id), data);
    // } else {
    //   clientsService.create(data);
    // }
    
    console.log('Guardando cliente:', data);
    navigate('/clients');
  };
  
  // Mostrar loading si se están cargando datos
  if (isLoadingClient) {
    return <Spinner />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                {...register('doc_type')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              >
                <option value="6">RUC</option>
                <option value="1">DNI</option>
                <option value="4">Carnet de Extranjería</option>
                <option value="7">Pasaporte</option>
                <option value="0">Otros</option>
              </select>
              {errors.doc_type && (
                <p className="mt-1 text-sm text-red-600">{errors.doc_type.message}</p>
              )}
            </div>
            
            {/* Número de Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Documento *
              </label>
              <input
                type="text"
                {...register('doc_number')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
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
                <p className="mt-1 text-sm text-red-600">{errors.doc_number.message}</p>
              )}
            </div>
            
            {/* Nombre o Razón Social */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {docType === '6' ? 'Razón Social' : 'Nombre Completo'} *
              </label>
              <input
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder={
                  docType === '6' ? 'Ingrese razón social' : 'Ingrese nombre completo'
                }
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                {...register('address')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Ingrese dirección completa"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
            
            {/* Ubigeo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubigeo
              </label>
              <input
                type="text"
                {...register('ubigeo')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Código de 6 dígitos"
                maxLength={6}
              />
              {errors.ubigeo && (
                <p className="mt-1 text-sm text-red-600">{errors.ubigeo.message}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                {...register('phone')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Ingrese teléfono"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
            
            {/* Estado */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
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
              isLoading={isSubmitting}
            >
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
