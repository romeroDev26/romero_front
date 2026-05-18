// src/features/accounting/debit-notes/pages/DebitNoteAnnulPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/utils/sileo-toast';
import { useQuery } from '@tanstack/react-query';

import { Button } from '../../../../components/common/Button';
import { useAnnulDebitNote } from '../hooks/useDebitNotes';
import { DebitNoteAnnulData } from '../../types';
import { DebitNote, User } from '../../../../types'; 
import { useAccountingDocumentSeriesForBranch } from '../../../../hooks/useAccountingDocumentSeries';
import { authService } from '../../../../services/auth.service';

const debitNoteAnnulSchema = z.object({
  reason: z.string().min(10, "El sustento debe tener al menos 10 caracteres."),
});

type DebitNoteAnnulFormData = z.infer<typeof debitNoteAnnulSchema>;

export const DebitNoteAnnulPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Obtenemos la nota de débito del state
  const { debitNote } = (location.state as { debitNote: DebitNote }) || {};

  // Debug: verificar qué estamos recibiendo
  console.log('DebitNoteAnnulPage - location.state:', location.state);
  console.log('DebitNoteAnnulPage - debitNote:', debitNote);

  const [selectedCreditNoteSeries, setSelectedCreditNoteSeries] = useState<string>("");

  const { mutate: annulDebitNote, isPending } = useAnnulDebitNote();

  // Hook de usuario actual
  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const data = await authService.getProfile();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1
  });

  // Hook para obtener series de notas de crédito por branch office
  const {
    availableCreditNoteSeries,
    isLoading: isLoadingSeries,
  } = useAccountingDocumentSeriesForBranch(
    currentUser?.default_branch_office_id || null,
    currentUser?.company_id || 1
  );

  const { control, handleSubmit, formState: { errors } } = useForm<DebitNoteAnnulFormData>({
    resolver: zodResolver(debitNoteAnnulSchema),
    defaultValues: { 
      reason: 'Anulación de nota de débito' 
    }
  });

  // Efecto para configurar la serie por defecto
  useEffect(() => {
    const cachedSeries = localStorage.getItem("lastUsedCreditNoteSeries");
    
    if (availableCreditNoteSeries.length > 0) {
      if (cachedSeries && availableCreditNoteSeries.some((s) => s.series_code === cachedSeries)) {
        setSelectedCreditNoteSeries(cachedSeries);
      } else {
        setSelectedCreditNoteSeries(availableCreditNoteSeries[0].series_code);
      }
    }
  }, [availableCreditNoteSeries]);

  // Handler para cambio de serie
  const handleCreditNoteSeriesChange = (seriesCode: string) => {
    setSelectedCreditNoteSeries(seriesCode);
    localStorage.setItem("lastUsedCreditNoteSeries", seriesCode);
  };

  if (!debitNote) {
    React.useEffect(() => {
      console.error('DebitNoteAnnulPage - No se recibió debitNote en location.state');
      toast.error("No se ha especificado una nota de débito válida para anular.");
      navigate('/accounting/debit-notes');
    }, [navigate]);
    return (
      <div className="p-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Redirigiendo al listado...</p>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit: SubmitHandler<DebitNoteAnnulFormData> = (data) => {
    if (!selectedCreditNoteSeries) {
      toast.error("Debe seleccionar una serie para la nota de crédito");
      return;
    }

    const payload: DebitNoteAnnulData = {
      debit_note_id: debitNote.id,
      credit_note_series: selectedCreditNoteSeries,
      reason: data.reason,
    };
    
    annulDebitNote(payload, {
      onSuccess: () => {
        navigate('/accounting/debit-notes');
      }
    });
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Alerta informativa sobre anulación */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Anulación mediante Nota de Crédito
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Según normativa SUNAT, <strong>una nota de débito se anula generando una nota de crédito</strong> que revierte el cargo adicional.
                </p>
                <p className="mt-2">
                  La serie de la nota de crédito debe coincidir con la serie de la nota de débito a anular.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Anular Nota de Débito
          </h1>
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="font-medium text-lg text-orange-900 mb-2">
              {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              {debitNote.client && (
                <>
                  <div>Cliente: <span className="font-medium">{debitNote.client.name}</span></div>
                  <div>Documento: <span className="font-medium">{debitNote.client.doc_number}</span></div>
                </>
              )}
              <div>Motivo original: <span className="font-medium">{debitNote.reason}</span></div>
              <div>Total: <span className="font-medium">S/ {debitNote.total_payable}</span></div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serie de la Nota de Crédito*
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Debe coincidir con la serie de la nota de débito: <strong>{debitNote.series}</strong>
              </p>
              {isLoadingSeries ? (
                <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
                  Cargando series...
                </div>
              ) : availableCreditNoteSeries.length > 0 ? (
                <select
                  value={selectedCreditNoteSeries}
                  onChange={(e) => handleCreditNoteSeriesChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  {availableCreditNoteSeries.map((series) => (
                    <option key={series.id} value={series.series_code}>
                      {series.series_code} - Nota de Crédito
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full p-2 border border-red-300 rounded-md bg-red-50 text-red-600">
                  No hay series de notas de crédito disponibles para esta sucursal
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de la Anulación*
              </label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Ej: Anulación de nota de débito por corrección en facturación..."
                  />
                )}
              />
              {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/accounting/debit-notes')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                isLoading={isPending}
                disabled={!selectedCreditNoteSeries || availableCreditNoteSeries.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                Generar Nota de Crédito de Anulación
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
