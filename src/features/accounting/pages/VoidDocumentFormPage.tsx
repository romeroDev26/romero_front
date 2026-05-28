// src/features/accounting/pages/VoidDocumentFormPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useCreateVoidDocument } from '../hooks/useVoidDocuments';

// Esquema de validación
const voidDocumentItemSchema = z.object({
  document_type_code: z.string().min(1, 'El tipo de documento es requerido'),
  series: z.string()
    .min(1, 'La serie es requerida')
    .regex(/^[A-Z0-9]{4}$/, 'La serie debe tener 4 caracteres alfanuméricos'),
  number: z.number()
    .min(1, 'El número debe ser mayor a 0')
    .max(99999999, 'El número no puede ser mayor a 99999999'),
  reason: z.string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(250, 'El motivo no puede exceder 250 caracteres'),
});

const voidDocumentSchema = z.object({
  generation_date: z.string()
    .min(1, 'La fecha es requerida')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return selectedDate <= today;
    }, 'No se pueden crear comunicaciones para fechas futuras'),
  items: z.array(voidDocumentItemSchema)
    .min(1, 'Debe incluir al menos un documento para anular')
    .max(50, 'No se pueden incluir más de 50 documentos por comunicación'),
});

type VoidDocumentFormData = z.infer<typeof voidDocumentSchema>;

// Motivos predefinidos comunes
const COMMON_REASONS = [
  'Error en datos del cliente',
  'Error en datos del documento',
  'Duplicado por error',
  'Cancelación de operación',
  'Error en montos',
  'Documento emitido incorrectamente',
  'Solicitud del cliente',
  'Error en productos o servicios',
];

export const VoidDocumentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const createVoidDocument = useCreateVoidDocument();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VoidDocumentFormData>({
    resolver: zodResolver(voidDocumentSchema),
    defaultValues: {
      generation_date: new Date().toISOString().split('T')[0],
      items: [
        {
          document_type_code: '01',
          series: '',
          number: 0,
          reason: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const onSubmit = async (data: VoidDocumentFormData) => {
    const companyId = 1; // TODO: Obtener de contexto
    
    try {
      await createVoidDocument.mutateAsync({
        company_id: companyId,
        generation_date: data.generation_date,
        items: data.items,
      });
      
      navigate('/accounting/voids');
    } catch (error) {
      // El error ya es manejado por el hook
      console.error('Error creating void document:', error);
    }
  };

  const addDocument = () => {
    append({
      document_type_code: '01',
      series: '',
      number: 0,
      reason: '',
    });
  };

  const removeDocument = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDocumentTypeText = (code: string) => {
    const types = {
      '01': 'Factura',
      '03': 'Boleta',
    };
    return types[code as keyof typeof types] || 'Documento';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/accounting/voids')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-dm-text-primary">Nueva Comunicación de Baja</h1>
            <p className="text-dm-text-secondary">
              Anular documentos previamente enviados y aceptados por SUNAT
            </p>
          </div>
        </div>
      </div>

      {/* Información importante */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg p-6">
        <div className="flex">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mt-1" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Consideraciones Importantes</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Solo se pueden anular documentos previamente ACEPTADOS</strong> por SUNAT</li>
                <li>Una vez aceptada la comunicación de baja, la anulación es <strong>irreversible</strong></li>
                <li>Cada documento debe tener un <strong>motivo específico y detallado</strong></li>
                <li>Los documentos anulados no podrán ser utilizados para fines comerciales o tributarios</li>
                <li>SUNAT puede rechazar la comunicación si los motivos no son válidos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-dm-bg-primary rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Fecha de Generación */}
          <div>
            <label className="block text-sm font-medium text-dm-text-secondary mb-2">
              Fecha de Generación *
            </label>
            <Input
              type="date"
              {...register('generation_date')}
              error={errors.generation_date?.message}
              max={new Date().toISOString().split('T')[0]}
            />
            {watch('generation_date') && (
              <p className="mt-1 text-sm text-dm-text-secondary">
                📅 {formatDateForDisplay(watch('generation_date'))}
              </p>
            )}
          </div>

          {/* Documentos a Anular */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-dm-text-primary">Documentos a Anular</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addDocument}
                disabled={fields.length >= 50}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar Documento
              </Button>
            </div>

            {errors.items && typeof errors.items.message === 'string' && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errors.items.message}</p>
            )}

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-dm-border-primary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-dm-text-primary">
                      Documento #{index + 1}
                      {watchedItems[index]?.series && watchedItems[index]?.number && (
                        <span className="ml-2 text-sm text-dm-text-secondary">
                          ({getDocumentTypeText(watchedItems[index]?.document_type_code || '01')} {watchedItems[index]?.series}-{String(watchedItems[index]?.number).padStart(8, '0')})
                        </span>
                      )}
                    </h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Tipo de Documento */}
                    <div>
                      <label className="block text-sm font-medium text-dm-text-secondary mb-2">
                        Tipo de Documento *
                      </label>
                      <select
                        {...register(`items.${index}.document_type_code`)}
                        className="block w-full rounded-lg border border-dm-border-primary px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="01">01 - Factura</option>
                        <option value="03">03 - Boleta</option>
                      </select>
                      {errors.items?.[index]?.document_type_code && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.items[index]?.document_type_code?.message}
                        </p>
                      )}
                    </div>

                    {/* Serie */}
                    <div>
                      <label className="block text-sm font-medium text-dm-text-secondary mb-2">
                        Serie *
                      </label>
                      <Input
                        {...register(`items.${index}.series`)}
                        placeholder="Ej: F001"
                        className="uppercase"
                        error={errors.items?.[index]?.series?.message}
                        maxLength={4}
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-sm font-medium text-dm-text-secondary mb-2">
                        Número *
                      </label>
                      <Input
                        type="number"
                        {...register(`items.${index}.number`, { valueAsNumber: true })}
                        placeholder="123456"
                        error={errors.items?.[index]?.number?.message}
                        min={1}
                        max={99999999}
                      />
                    </div>
                  </div>

                  {/* Motivo */}
                  <div>
                    <label className="block text-sm font-medium text-dm-text-secondary mb-2">
                      Motivo de Anulación *
                    </label>
                    
                    {/* Motivos predefinidos */}
                    <div className="mb-2">
                      <p className="text-xs text-dm-text-secondary mb-2">Motivos comunes (click para usar):</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_REASONS.map((reason, reasonIndex) => (
                          <button
                            key={reasonIndex}
                            type="button"
                            onClick={() => {
                              const currentItems = watch('items');
                              currentItems[index].reason = reason;
                              // Trigger form update
                              const event = new Event('input', { bubbles: true });
                              const textarea = document.querySelector(`textarea[name="items.${index}.reason"]`) as HTMLTextAreaElement;
                              if (textarea) {
                                textarea.value = reason;
                                textarea.dispatchEvent(event);
                              }
                            }}
                            className="px-2 py-1 text-xs bg-dm-bg-secondary hover:bg-dm-bg-hover rounded-full text-dm-text-secondary"
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      {...register(`items.${index}.reason`)}
                      rows={3}
                      placeholder="Describa detalladamente el motivo de la anulación..."
                      className="block w-full rounded-lg border border-dm-border-primary px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      maxLength={250}
                    />
                    {errors.items?.[index]?.reason && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.items[index]?.reason?.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-dm-text-muted">
                      {watchedItems[index]?.reason?.length || 0}/250 caracteres
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Resumen de la Comunicación</h4>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p><strong>Fecha:</strong> {formatDateForDisplay(watch('generation_date'))}</p>
              <p><strong>Documentos a anular:</strong> {fields.length}</p>
              <p><strong>Tipos de documento:</strong></p>
              <ul className="list-disc list-inside ml-4 mt-1">
                {Object.entries(
                  watchedItems.reduce((acc, item) => {
                    const type = getDocumentTypeText(item.document_type_code);
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <li key={type}>{count} {type}{count > 1 ? 's' : ''}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-dm-border-primary">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounting/voids')}
              disabled={createVoidDocument.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createVoidDocument.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {createVoidDocument.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Crear Comunicación de Baja
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
