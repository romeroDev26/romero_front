// src/features/accounting/debit-notes/pages/DebitNoteFormPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { Button } from '../../../../components/common/Button';
import { useCreateDebitNote } from '../hooks/useDebitNotes';
import { DebitNoteCreateData } from '../../types';

// Catálogo de motivos para Nota de Débito
const DEBIT_NOTE_REASONS = [
  { code: '01', description: 'Intereses por mora' },
  { code: '02', description: 'Aumento en el valor' },
  { code: '03', description: 'Penalidades/otros conceptos' },
  { code: '10', description: 'Ajustes de operaciones de exportación' },
  { code: '11', description: 'Ajustes afectos al IVAP' },
];

const debitNoteSchema = z.object({
  client_id: z.number().min(1, "Debe seleccionar un cliente."),
  debit_note_series: z.string().min(1, "La serie es requerida."),
  affected_document_type_code: z.string().min(1, "Tipo de documento afectado requerido."),
  affected_document_series: z.string().min(1, "Serie del documento afectado requerida."),
  affected_document_number: z.number().min(1, "Número del documento afectado requerido."),
  debit_note_type_code: z.string().min(1, "Debe seleccionar un motivo."),
  reason: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  items: z.array(z.object({
    product_service_id: z.number().min(1, "Debe seleccionar un producto/servicio."),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0."),
    unit_price: z.number().min(0.01, "El precio debe ser mayor a 0."),
    description: z.string().min(1, "La descripción es requerida."),
  })).min(1, "Debe agregar al menos un ítem."),
});

type DebitNoteFormData = z.infer<typeof debitNoteSchema>;

export const DebitNoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [companyId] = useState(1); // TODO: Obtener del contexto de usuario

  const { mutate: createDebitNote, isPending } = useCreateDebitNote();

  const { control, handleSubmit, formState: { errors } } = useForm<DebitNoteFormData>({
    resolver: zodResolver(debitNoteSchema),
    defaultValues: {
      client_id: 0,
      debit_note_series: 'FD01',
      affected_document_type_code: '01',
      affected_document_series: '',
      affected_document_number: 0,
      debit_note_type_code: '01',
      reason: '',
      items: [{
        product_service_id: 0,
        quantity: 1,
        unit_price: 0,
        description: '',
      }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const onSubmit: SubmitHandler<DebitNoteFormData> = (data) => {
    const payload: DebitNoteCreateData = {
      company_id: companyId,
      client_id: data.client_id,
      debit_note_series: data.debit_note_series,
      currency_code: 'PEN',
      affected_document_type_code: data.affected_document_type_code,
      affected_document_series: data.affected_document_series,
      affected_document_number: data.affected_document_number,
      debit_note_type_code: data.debit_note_type_code,
      reason: data.reason,
      items: data.items.map(item => ({
        product_service_id: item.product_service_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        description: item.description,
      })),
    };

    createDebitNote(payload, {
      onSuccess: () => {
        navigate('/accounting/debit-notes');
      }
    });
  };

  const addItem = () => {
    append({
      product_service_id: 0,
      quantity: 1,
      unit_price: 0,
      description: '',
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/accounting/debit-notes')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Nota de Débito</h1>
            <p className="text-gray-600">Crear una nota de débito por cargos adicionales</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos del Cliente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente*</label>
                  <Controller
                    name="client_id"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value={0}>Seleccionar cliente...</option>
                        {/* TODO: Cargar clientes del backend */}
                        <option value={1}>Cliente de Ejemplo</option>
                      </select>
                    )}
                  />
                  {errors.client_id && <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serie ND*</label>
                  <Controller
                    name="debit_note_series"
                    control={control}
                    render={({ field }) => (
                      <input {...field} className="w-full p-2 border border-gray-300 rounded-md" />
                    )}
                  />
                  {errors.debit_note_series && <p className="text-sm text-red-600 mt-1">{errors.debit_note_series.message}</p>}
                </div>
              </div>
            </div>

            {/* Documento Afectado */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documento Afectado</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
                  <Controller
                    name="affected_document_type_code"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="01">Factura</option>
                        <option value="03">Boleta</option>
                      </select>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serie*</label>
                  <Controller
                    name="affected_document_series"
                    control={control}
                    render={({ field }) => (
                      <input 
                        {...field} 
                        placeholder="F001"
                        className="w-full p-2 border border-gray-300 rounded-md" 
                      />
                    )}
                  />
                  {errors.affected_document_series && <p className="text-sm text-red-600 mt-1">{errors.affected_document_series.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número*</label>
                  <Controller
                    name="affected_document_number"
                    control={control}
                    render={({ field }) => (
                      <input 
                        {...field} 
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-md" 
                      />
                    )}
                  />
                  {errors.affected_document_number && <p className="text-sm text-red-600 mt-1">{errors.affected_document_number.message}</p>}
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Motivo de la Nota de Débito</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo*</label>
                  <Controller
                    name="debit_note_type_code"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                        {DEBIT_NOTE_REASONS.map(reason => (
                          <option key={reason.code} value={reason.code}>{reason.description}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.debit_note_type_code && <p className="text-sm text-red-600 mt-1">{errors.debit_note_type_code.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción*</label>
                  <Controller
                    name="reason"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Ej: Intereses por pago tardío del 2% mensual"
                      />
                    )}
                  />
                  {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Items del Cargo</h2>
                <Button type="button" variant="outline" onClick={addItem}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900">Item #{index + 1}</h3>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Servicio*</label>
                        <Controller
                          name={`items.${index}.product_service_id`}
                          control={control}
                          render={({ field }) => (
                            <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                              <option value={0}>Seleccionar...</option>
                              {/* TODO: Cargar productos/servicios */}
                              <option value={1}>Intereses por mora</option>
                              <option value={2}>Recargo administrativo</option>
                            </select>
                          )}
                        />
                        {errors.items?.[index]?.product_service_id && 
                          <p className="text-sm text-red-600 mt-1">{errors.items[index]?.product_service_id?.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción*</label>
                        <Controller
                          name={`items.${index}.description`}
                          control={control}
                          render={({ field }) => (
                            <input {...field} className="w-full p-2 border border-gray-300 rounded-md" />
                          )}
                        />
                        {errors.items?.[index]?.description && 
                          <p className="text-sm text-red-600 mt-1">{errors.items[index]?.description?.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad*</label>
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          render={({ field }) => (
                            <input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="w-full p-2 border border-gray-300 rounded-md" 
                            />
                          )}
                        />
                        {errors.items?.[index]?.quantity && 
                          <p className="text-sm text-red-600 mt-1">{errors.items[index]?.quantity?.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unit.*</label>
                        <Controller
                          name={`items.${index}.unit_price`}
                          control={control}
                          render={({ field }) => (
                            <input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="w-full p-2 border border-gray-300 rounded-md" 
                            />
                          )}
                        />
                        {errors.items?.[index]?.unit_price && 
                          <p className="text-sm text-red-600 mt-1">{errors.items[index]?.unit_price?.message}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.items && <p className="text-sm text-red-600 mt-2">{errors.items.message}</p>}
            </div>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Importante</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="font-medium text-amber-800 mb-1">Importante</p>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Las notas de débito aumentan el valor de la deuda</li>
                    <li>• Se enviarán automáticamente a SUNAT</li>
                    <li>• Verificar datos antes de crear</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/accounting/debit-notes')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isPending}>
            Crear Nota de Débito
          </Button>
        </div>
      </form>
    </div>
  );
};
