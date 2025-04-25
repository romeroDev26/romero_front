// src/features/remissionGuides/pages/RemissionGuideFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';

import { Spinner } from '../../../components/common/Spinner';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';

// Estos servicios tendrían que ser implementados
// import { clientsService } from '../../../services/clients.service';
// import { remissionGuidesService } from '../../../services/remissionGuides.service';

const remissionGuideItemSchema = z.object({
  quantity: z.number().positive('Cantidad debe ser mayor a 0'),
  unit_code: z.string().min(1, 'Unidad de medida es requerida'),
  description: z.string().min(3, 'Descripción es requerida'),
  internal_code: z.string().optional(),
});

const remissionGuideSchema = z.object({
  company_id: z.number(),
  document_type_code: z.string(),
  series: z.string().min(

1, 'Serie es requerida'),
  issue_date: z.date({
    required_error: 'Fecha de emisión es requerida',
  }),
  shipment_start_date: z.date({
    required_error: 'Fecha de inicio de traslado es requerida',
  }),
  
  // Remitente y Destinatario
  sender_client_id: z.number().optional(),
  sender_supplier_id: z.number().optional(),
  recipient_client_id: z.number({
    required_error: 'Destinatario es requerido',
  }),
  
  // Dirección de partida y llegada
  origin_ubigeo: z.string().length(6, 'Ubigeo de origen debe tener 6 dígitos'),
  origin_address: z.string().min(5, 'Dirección de origen es requerida'),
  destination_ubigeo: z.string().length(6, 'Ubigeo de destino debe tener 6 dígitos'),
  destination_address: z.string().min(5, 'Dirección de destino es requerida'),
  
  // Datos de transporte
  transport_mode_code: z.string().min(1, 'Modo de transporte es requerido'),
  vehicle_plate: z.string().min(6, 'Placa del vehículo es requerida'),
  
  // Datos del conductor
  driver_doc_type: z.string().min(1, 'Tipo de documento del conductor es requerido'),
  driver_doc_number: z.string().min(8, 'Número de documento del conductor es requerido'),
  driver_name: z.string().min(3, 'Nombre del conductor es requerido'),
  driver_license: z.string().min(9, 'Licencia del conductor es requerida'),
  
  // Items transportados
  items: z.array(remissionGuideItemSchema).min(1, 'Debe agregar al menos un ítem'),
  
  // Observaciones
  observation: z.string().optional(),
});

type RemissionGuideFormData = z.infer<typeof remissionGuideSchema>;

export const RemissionGuideFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';
  
  const [showPreview, setShowPreview] = useState(false);
  
  // En un proyecto real, estos datos vendrían de una API
  // const { data: clients, isLoading: isLoadingClients } = useQuery(['clients'], clientsService.getAll);
  // const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery(['suppliers'], suppliersService.getAll);
  // const { data: guide, isLoading: isLoadingGuide } = useQuery(
  //   ['remissionGuide', id],
  //   () => remissionGuidesService.getById(Number(id)),
  //   { enabled: isEditing }
  // );
  
  // Datos simulados para el ejemplo
  const clients = [
    { id: 1, name: 'Empresa ABC S.A.C.', doc_number: '20123456789', doc_type: '6', address: 'Av. Comercio 123, Lima' },
    { id: 2, name: 'Distribuidora XYZ E.I.R.L.', doc_number: '20987654321', doc_type: '6', address: 'Jr. Industria 456, Iquitos' },
    { id: 3, name: 'Almacenes del Norte S.A.C.', doc_number: '20456789012', doc_type: '6', address: 'Calle Mayor 234, Tarapoto' },
  ];
  
  const suppliers = [
    { id: 1, name: 'Transportes Romero S.A.C.', doc_number: '20123456789', doc_type: '6', address: 'Av. Principal 123, Iquitos' },
  ];
  
  const guide = isEditing ? {
    id: 1,
    company_id: 1,
    document_type_code: '31',
    series: 'T001',
    number: 123,
    issue_date: '2025-04-15',
    shipment_start_date: '2025-04-16',
    sender_client_id: null,
    sender_supplier_id: 1,
    recipient_client_id: 1,
    origin_ubigeo: '160101',
    origin_address: 'Av. Principal 123, Iquitos',
    destination_ubigeo: '220601',
    destination_address: 'Jr. Comercio 456, Tarapoto',
    transport_mode_code: '01',
    vehicle_plate: 'ABC-123',
    driver_doc_type: '1',
    driver_doc_number: '12345678',
    driver_name: 'Juan Pérez',
    driver_license: 'Q12345678',
    observation: 'Entrega en horario de oficina',
    sunat_status: 'ACCEPTED',
    items: [
      {
        id: 1,
        item_order: 1,
        quantity: 50,
        unit_code: 'NIU',
        description: 'Cajas de productos varios',
        internal_code: 'PROD001'
      },
      {
        id: 2,
        item_order: 2,
        quantity: 20,
        unit_code: 'KGM',
        description: 'Sacos de materiales',
        internal_code: 'MAT002'
      }
    ]
  } : null;
  
  const isLoadingClients = false;
  const isLoadingSuppliers = false;
  const isLoadingGuide = false;
  
  const {
      control,
      register,
      handleSubmit,
      setValue,
      watch,
      reset,
      formState: { errors, isSubmitting },
    } = useForm<RemissionGuideFormData>({
      resolver: zodResolver(remissionGuideSchema),
      defaultValues: {
        company_id: 1 as number,
        document_type_code: '31' as string,
      series: 'T001',
      issue_date: new Date(),
      shipment_start_date: new Date(new Date().setDate(new Date().getDate() + 1)),
      sender_supplier_id: 1, // Asumiendo que la empresa transportista es el remitente por defecto
      transport_mode_code: '01',
      items: [{
        quantity: 1,
        unit_code: 'NIU',
        description: '',
        internal_code: '',
      }],
    },
  });
  
  // Field array para manejar los items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });
  
  // Cargar datos para edición
  useEffect(() => {
    if (isEditing && guide) {
      reset({
        company_id: guide.company_id,
        document_type_code: guide.document_type_code,
        series: guide.series,
        issue_date: new Date(guide.issue_date),
        shipment_start_date: new Date(guide.shipment_start_date),
        sender_client_id: guide.sender_client_id || undefined,
        sender_supplier_id: guide.sender_supplier_id || undefined,
        recipient_client_id: guide.recipient_client_id,
        origin_ubigeo: guide.origin_ubigeo,
        origin_address: guide.origin_address,
        destination_ubigeo: guide.destination_ubigeo,
        destination_address: guide.destination_address,
        transport_mode_code: guide.transport_mode_code,
        vehicle_plate: guide.vehicle_plate,
        driver_doc_type: guide.driver_doc_type,
        driver_doc_number: guide.driver_doc_number,
        driver_name: guide.driver_name,
        driver_license: guide.driver_license,
        observation: guide.observation,
        items: guide.items.map(item => ({
          quantity: item.quantity,
          unit_code: item.unit_code,
          description: item.description,
          internal_code: item.internal_code,
        })),
      });
    }
  }, [isEditing, guide, reset]);
  
  // Actualizar dirección del remitente al cambiar
  const senderType = watch('sender_supplier_id') ? 'supplier' : 'client';
  const senderId = watch('sender_supplier_id') || watch('sender_client_id');
  
  useEffect(() => {
    if (senderId) {
      const sender = senderType === 'supplier' 
        ? suppliers.find(s => s.id === senderId)
        : clients.find(c => c.id === senderId);
      
      if (sender && sender.address) {
        // Aquí podrías asignar también el ubigeo si está disponible en tus datos
        setValue('origin_address', sender.address, { shouldDirty: true });
      }
    }
  }, [senderId]);
  
  // Actualizar dirección del destinatario al cambiar
  const recipientId = watch('recipient_client_id');
  
  useEffect(() => {
    if (recipientId) {
      const recipient = clients.find(c => c.id === recipientId);
      
      if (recipient && recipient.address) {
        // Aquí podrías asignar también el ubigeo si está disponible en tus datos
        setValue('destination_address', recipient.address, { shouldDirty: true });
      }
    }
  }, [recipientId]);
  
  // Agregar nuevo item
  const handleAddItem = () => {
    append({
      quantity: 1,
      unit_code: 'NIU',
      description: '',
      internal_code: '',
    });
  };
  
  // Cambiar el tipo de remitente
  const handleSenderTypeChange = (type: 'client' | 'supplier') => {
    if (type === 'supplier') {
      setValue('sender_client_id', undefined);
      setValue('sender_supplier_id', 1); // Valor por defecto
    } else {
      setValue('sender_supplier_id', undefined);
      setValue('sender_client_id', undefined);
    }
  };
  
  // Enviar formulario
  const onSubmit = (data: RemissionGuideFormData) => {
    // En un proyecto real, llamarías a una API
    // if (isEditing) {
    //   remissionGuidesService.update(Number(id), data);
    // } else {
    //   remissionGuidesService.create(data);
    // }
    
    console.log('Guardando guía de remisión:', data);
    navigate('/remission-guides');
  };
  
  // Mostrar loading si se están cargando datos
  if (isLoadingClients || isLoadingSuppliers || (isEditing && isLoadingGuide)) {
    return <Spinner />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Guía de Remisión' : 'Nueva Guía de Remisión'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sección de datos generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Serie-Número */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <div className="flex">
                <input
                  type="text"
                  {...register('series')}
                  className="w-20 rounded-l-md border-gray-300 shadow-sm p-2 border"
                  readOnly={isEditing}
                />
                <span className="px-3 inline-flex items-center border-t border-b border-gray-300 bg-gray-50 text-gray-500">
                  -
                </span>
                <input
                  type="text"
                  value={isEditing ? guide?.number.toString().padStart(8, '0') : 'NUEVO'}
                  className="rounded-r-md border-gray-300 shadow-sm p-2 border bg-gray-50"
                  readOnly
                />
              </div>
              {errors.series && (
                <p className="mt-1 text-sm text-red-600">{errors.series.message}</p>
              )}
            </div>
            
            {/* Fecha de Emisión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Emisión *
              </label>
              <Controller
                control={control}
                name="issue_date"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    dateFormat="dd/MM/yyyy"
                    locale={es}
                  />
                )}
              />
              {errors.issue_date && (
                <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>
              )}
            </div>
            
            {/* Fecha de Inicio de Traslado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Traslado *
              </label>
              <Controller
                control={control}
                name="shipment_start_date"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    dateFormat="dd/MM/yyyy"
                    locale={es}
                    minDate={new Date()}
                  />
                )}
              />
              {errors.shipment_start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.shipment_start_date.message}</p>
              )}
            </div>
          </div>
          
          {/* Sección de Remitente y Destinatario */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Datos del Remitente y Destinatario</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Remitente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Remitente
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      id="sender-supplier"
                      type="radio"
                      name="sender-type"
                      className="h-4 w-4 text-primary focus:ring-primary"
                      checked={!!watch('sender_supplier_id')}
                      onChange={() => handleSenderTypeChange('supplier')}
                    />
                    <label htmlFor="sender-supplier" className="ml-2 text-sm text-gray-700">
                      Empresa de Transporte
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="sender-client"
                      type="radio"
                      name="sender-type"
                      className="h-4 w-4 text-primary focus:ring-primary"
                      checked={!!watch('sender_client_id')}
                      onChange={() => handleSenderTypeChange('client')}
                    />
                    <label htmlFor="sender-client" className="ml-2 text-sm text-gray-700">
                      Cliente / Tercero
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Remitente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remitente *
                </label>
                {senderType === 'supplier' ? (
                  <select
                    {...register('sender_supplier_id', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  >
                    <option value="">Seleccione un remitente</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.doc_number}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    {...register('sender_client_id', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  >
                    <option value="">Seleccione un remitente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.doc_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Destinatario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destinatario *
                </label>
                <select
                  {...register('recipient_client_id', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                  <option value="">Seleccione un destinatario</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.doc_number}
                    </option>
                  ))}
                </select>
                {errors.recipient_client_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipient_client_id.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Dirección de Partida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección de Partida *
                </label>
                <input
                  type="text"
                  {...register('origin_address')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
                {errors.origin_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.origin_address.message}</p>
                )}
              </div>
              
              {/* Ubigeo de Partida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubigeo de Partida *
                </label>
                <input
                  type="text"
                  {...register('origin_ubigeo')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="Código de 6 dígitos"
                />
                {errors.origin_ubigeo && (
                  <p className="mt-1 text-sm text-red-600">{errors.origin_ubigeo.message}</p>
                )}
              </div>
              
              {/* Dirección de Llegada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección de Llegada *
                </label>
                <input
                  type="text"
                  {...register('destination_address')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
                {errors.destination_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.destination_address.message}</p>
                )}
              </div>
              
              {/* Ubigeo de Llegada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubigeo de Llegada *
                </label>
                <input
                  type="text"
                  {...register('destination_ubigeo')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="Código de 6 dígitos"
                />
                {errors.destination_ubigeo && (
                  <p className="mt-1 text-sm text-red-600">{errors.destination_ubigeo.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Sección de Transporte */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Datos del Transporte</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Modalidad de Transporte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modalidad de Transporte *
                </label>
                <select
                  {...register('transport_mode_code')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                  <option value="">Seleccione</option>
                  <option value="01">Transporte Público</option>
                  <option value="02">Transporte Privado</option>
                </select>
                {errors.transport_mode_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.transport_mode_code.message}</p>
                )}
              </div>
              
              {/* Placa del Vehículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa del Vehículo *
                </label>
                <input
                  type="text"
                  {...register('vehicle_plate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="ABC-123"
                />
                {errors.vehicle_plate && (
                  <p className="mt-1 text-sm text-red-600">{errors.vehicle_plate.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Datos del Conductor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Doc. Conductor *
                </label>
                <select
                  {...register('driver_doc_type')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                  <option value="">Seleccione</option>
                  <option value="1">DNI</option>
                  <option value="4">Carnet de Extranjería</option>
                  <option value="7">Pasaporte</option>
                </select>
                {errors.driver_doc_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.driver_doc_type.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nro. Doc. Conductor *
                </label>
                <input
                  type="text"
                  {...register('driver_doc_number')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
                {errors.driver_doc_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.driver_doc_number.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Conductor *
                </label>
                <input
                  type="text"
                  {...register('driver_name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
                {errors.driver_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.driver_name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Licencia del Conductor *
                </label>
                <input
                  type="text"
                  {...register('driver_license')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
                {errors.driver_license && (
                  <p className="mt-1 text-sm text-red-600">{errors.driver_license.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Sección de Bienes a Transportar */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bienes a Transportar</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unidad
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      {/* Cantidad */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-xs text-red-600">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </td>
                      
                      {/* Unidad de Medida */}
                      <td className="px-3 py-2">
                        <select
                          {...register(`items.${index}.unit_code`)}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        >
                          <option value="NIU">NIU - Unidad</option>
                          <option value="KGM">KGM - Kilogramo</option>
                          <option value="MTR">MTR - Metro</option>
                          <option value="LTR">LTR - Litro</option>
                          <option value="TNE">TNE - Tonelada</option>
                        </select>
                        {errors.items?.[index]?.unit_code && (
                          <p className="text-xs text-red-600">{errors.items[index]?.unit_code?.message}</p>
                        )}
                      </td>
                      
                      {/* Descripción */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          {...register(`items.${index}.description`)}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        />
                        {errors.items?.[index]?.description && (
                          <p className="text-xs text-red-600">{errors.items[index]?.description?.message}</p>
                        )}
                      </td>
                      
                      {/* Código Interno */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          {...register(`items.${index}.internal_code`)}
                          className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        />
                      </td>
                      
                      {/* Acciones */}
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddItem}
              >
                Agregar Ítem
              </Button>
            </div>
          </div>
          
          {/* Sección de Observaciones */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              {...register('observation')}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder="Observaciones adicionales para la guía de remisión"
            ></textarea>
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/remission-guides')}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPreview(true)}
            >
              Vista Previa
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
      
      {/* Modal de Vista Previa */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Vista Previa de Guía de Remisión"
        maxWidth="lg"
      >
        <div className="p-6">
          {/* Aquí iría el contenido de la vista previa */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">GUÍA DE REMISIÓN ELECTRÓNICA - TRANSPORTISTA</h2>
            <p className="text-lg">{watch('series')}-{isEditing ? guide?.number.toString().padStart(8, '0') : 'NUEVO'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="font-semibold">Fecha de Emisión:</p>
              <p>{watch('issue_date')?.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold">Fecha de Inicio de Traslado:</p>
              <p>{watch('shipment_start_date')?.toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Datos del Remitente:</p>
                {senderType === 'supplier' ? (
                  <p>{suppliers.find(s => s.id === watch('sender_supplier_id'))?.name}</p>
                ) : (
                  <p>{clients.find(c => c.id === watch('sender_client_id'))?.name}</p>
                )}
                <p className="font-semibold mt-2">Dirección de Partida:</p>
                <p>{watch('origin_address')}</p>
              </div>
              <div>
                <p className="font-semibold">Datos del Destinatario:</p>
                <p>{clients.find(c => c.id === watch('recipient_client_id'))?.name}</p>
                <p className="font-semibold mt-2">Dirección de Llegada:</p>
                <p>{watch('destination_address')}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Datos del Vehículo:</p>
                <p>Placa: {watch('vehicle_plate')}</p>
              </div>
              <div>
                <p className="font-semibold">Datos del Conductor:</p>
                <p>{watch('driver_name')}</p>
                <p>Licencia: {watch('driver_license')}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-6">
            <p className="font-semibold mb-2">Bienes Transportados:</p>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {watch('items').map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{item.unit_code}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2">{item.internal_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {watch('observation') && (
            <div className="mb-6">
              <p className="font-semibold">Observaciones:</p>
              <p>{watch('observation')}</p>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500 mt-6 border-t border-gray-200 pt-4">
            <p>Representación impresa de la Guía de Remisión Electrónica</p>
            <p>Transportes Romero S.A.C. - RUC 20123456789</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
