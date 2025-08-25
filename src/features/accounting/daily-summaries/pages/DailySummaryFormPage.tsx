// src/features/accounting/daily-summaries/pages/DailySummaryFormPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { useCreateDailySummary } from '../hooks/useDailySummaries';

// Esquema de validación
const dailySummarySchema = z.object({
  summary_date: z.string()
    .min(1, 'La fecha es requerida')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Final del día actual
      return selectedDate <= today;
    }, 'No se pueden crear resúmenes para fechas futuras'),
  currency_code: z.string().min(1, 'La moneda es requerida'),
});

type DailySummaryFormData = z.infer<typeof dailySummarySchema>;

export const DailySummaryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const createDailySummary = useCreateDailySummary();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DailySummaryFormData>({
    resolver: zodResolver(dailySummarySchema),
    defaultValues: {
      currency_code: 'PEN',
      summary_date: '', // Usuario debe seleccionar fecha
    },
  });

  const selectedDate = watch('summary_date');

  const onSubmit = async (data: DailySummaryFormData) => {
    const companyId = 1; // TODO: Obtener de contexto
    
    try {
      await createDailySummary.mutateAsync({
        company_id: companyId,
        summary_date: data.summary_date,
        currency_code: data.currency_code,
      });
      
      navigate('/accounting/summaries');
    } catch (error) {
      // El error ya es manejado por el hook
      console.error('Error creating daily summary:', error);
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

  const getDateHelperText = (dateString: string) => {
    if (!dateString) return '';
    
    const selectedDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      return 'Resumen del día actual (se incluirán todas las boletas hasta el momento)';
    } else if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Resumen de ayer (recomendado para procesamiento completo)';
    } else if (selectedDate < yesterday) {
      return 'Resumen de fecha pasada';
    }
    
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/accounting/summaries')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Resumen Diario</h1>
            <p className="text-gray-600">
              Generar resumen diario de boletas para envío a SUNAT
            </p>
          </div>
        </div>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <DocumentTextIcon className="h-6 w-6 text-blue-600 mt-1" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-800">¿Qué es un Resumen Diario?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                Los resúmenes diarios agrupan <strong>todas las boletas emitidas</strong> en una fecha específica 
                para su envío masivo a SUNAT.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Solo incluye documentos tipo <strong>Boleta (código 03)</strong></li>
                <li>Se recomienda generar resúmenes de días anteriores para datos completos</li>
                <li>SUNAT requiere el envío dentro de los plazos establecidos</li>
                <li>El sistema enviará automáticamente el resumen tras la creación</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha del Resumen */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha del Resumen *
              </label>
              <Input
                type="date"
                {...register('summary_date')}
                error={errors.summary_date?.message}
                className="text-lg"
                max={new Date().toISOString().split('T')[0]} // No fechas futuras
              />
              {selectedDate && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    📅 {formatDateForDisplay(selectedDate)}
                  </p>
                  {getDateHelperText(selectedDate) && (
                    <p className="text-sm text-gray-600">
                      {getDateHelperText(selectedDate)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                {...register('currency_code')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="PEN">Soles Peruanos (PEN)</option>
                <option value="USD">Dólares Americanos (USD)</option>
              </select>
            </div>
          </div>

          {/* Advertencias */}
          {selectedDate && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800">Consideraciones Importantes</h4>
                  <div className="mt-1 text-sm text-amber-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Este proceso incluirá <strong>todas las boletas</strong> emitidas el {formatDateForDisplay(selectedDate)}</li>
                      <li>Una vez enviado a SUNAT, el resumen no se puede modificar</li>
                      <li>El procesamiento puede tomar varios minutos</li>
                      <li>Recibirás notificaciones sobre el estado del procesamiento</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/accounting/summaries')}
              disabled={createDailySummary.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedDate || createDailySummary.isPending}
            >
              {createDailySummary.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando Resumen...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Crear Resumen Diario
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
