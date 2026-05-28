// src/features/accounting/debit-notes/pages/DebitNoteAnnulPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/utils/sileo-toast';
import { useQuery } from '@tanstack/react-query';
import { ReceiptRefundIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
      <div className="space-y-6">
        <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4">
          <p className="text-[13px] text-dm-text-secondary">Redirigiendo al listado...</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
          <ReceiptRefundIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
            Anular Nota de Débito
          </h1>
          <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
            Genera una nota de crédito para anular la nota de débito seleccionada
          </p>
        </div>
      </div>

      {/* Alerta informativa sobre anulación */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-[#1F4690]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-[15px] font-medium text-dm-text-primary">
              Anulación mediante Nota de Crédito
            </h3>
            <div className="mt-2 text-[13px] text-dm-text-secondary">
              <p>
                Según normativa SUNAT, <strong className="text-dm-text-primary">una nota de débito se anula generando una nota de crédito</strong> que revierte el cargo adicional.
              </p>
              <p className="mt-2">
                La serie de la nota de crédito debe coincidir con la serie de la nota de débito a anular.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card del documento seleccionado */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4">
        <div className="text-[15px] font-medium text-dm-text-primary mb-2">
          {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
        </div>
        <div className="text-[13px] text-dm-text-secondary space-y-1">
          {debitNote.client && (
            <>
              <div>Cliente: <span className="font-medium text-dm-text-primary">{debitNote.client.name}</span></div>
              <div>Documento: <span className="font-medium text-dm-text-primary">{debitNote.client.doc_number}</span></div>
            </>
          )}
          <div>Motivo original: <span className="font-medium text-dm-text-primary">{debitNote.reason}</span></div>
          <div>Total: <span className="font-medium text-dm-text-primary">S/ {debitNote.total_payable}</span></div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Serie de la Nota de Crédito*
            </label>
            <p className="text-[13px] text-dm-text-muted mb-2">
              Debe coincidir con la serie de la nota de débito: <strong className="text-dm-text-primary">{debitNote.series}</strong>
            </p>
            {isLoadingSeries ? (
              <div className="block w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-muted">
                Cargando series...
              </div>
            ) : availableCreditNoteSeries.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedCreditNoteSeries}
                  onChange={(e) => handleCreditNoteSeriesChange(e.target.value)}
                  className="peer block w-full appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all pr-10"
                >
                  {availableCreditNoteSeries.map((series) => (
                    <option key={series.id} value={series.series_code}>
                      {series.series_code} - Nota de Crédito
                    </option>
                  ))}
                </select>
                <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
              </div>
            ) : (
              <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4">
                <p className="text-[13px] text-[#cf1322]">No hay series de notas de crédito disponibles para esta sucursal</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Motivo de la Anulación*
            </label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  className="block w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all resize-none"
                  placeholder="Ej: Anulación de nota de débito por corrección en facturación..."
                />
              )}
            />
            {errors.reason && <p className="mt-1 text-[13px] text-[#cf1322]">{errors.reason.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-dm-border-secondary">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/accounting/debit-notes')}
              className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              isLoading={isPending}
              disabled={!selectedCreditNoteSeries || availableCreditNoteSeries.length === 0}
              className="rounded-full px-5 py-2.5 bg-[#cf1322] hover:bg-[#a8101c] text-white text-[14px] font-medium"
            >
              Generar Nota de Crédito de Anulación
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
