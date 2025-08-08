// src/features/accounting/pages/CreditNoteFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

import { Button } from '../../../components/common/Button';
import { useCreateCreditNoteByAnnulment } from '../hooks/useCreditNotes';
import { CreditNoteAnnulData } from '../types';
import { Invoice, User } from '../../../types'; 
import { useAccountingDocumentSeriesForBranch } from '../../../hooks/useAccountingDocumentSeries';
import { authService } from '../../../services/auth.service'; 

// Catálogo 09 de SUNAT para motivos de Nota de Crédito
const CREDIT_NOTE_REASONS = [
  { code: '01', description: 'Anulación de la operación' },
  { code: '02', description: 'Anulación por error en el RUC' },
  { code: '03', description: 'Corrección por error en la descripción' },
];

const creditNoteSchema = z.object({
  credit_note_type_code: z.string().nonempty("Debe seleccionar un motivo."),
  reason: z.string().min(10, "El sustento debe tener al menos 10 caracteres."),
});

type CreditNoteFormData = z.infer<typeof creditNoteSchema>;

export const CreditNoteAnnulFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Tipamos explícitamente el estado que esperamos recibir
  const { affectedInvoice } = (location.state as { affectedInvoice: Invoice }) || {};

  const [selectedCreditNoteSeries, setSelectedCreditNoteSeries] = useState<string>("");

  const { mutate: createCreditNote, isPending } = useCreateCreditNoteByAnnulment();

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
    currentUser?.company_id || 1 // Valor por defecto si no está definido
  );

  const { control, handleSubmit, formState: { errors } } = useForm<CreditNoteFormData>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: { 
      credit_note_type_code: '01', 
      reason: '' 
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

  if (!affectedInvoice || !affectedInvoice.client) {
    React.useEffect(() => {
      toast.error("No se ha especificado una factura válida para anular.");
      navigate('/accounting/credit-notes/new'); // Redirigir a selección de factura
    }, [navigate]);
    return null;
  }
  
  const onSubmit: SubmitHandler<CreditNoteFormData> = (data) => {
    if (!selectedCreditNoteSeries) {
      toast.error("Debe seleccionar una serie para la nota de crédito");
      return;
    }

    const payload: CreditNoteAnnulData = {
      invoice_id: affectedInvoice.id,
      credit_note_series: selectedCreditNoteSeries,
      reason: data.reason,
    };
    
    createCreditNote(payload, {
      onSuccess: () => {
        // Redirigir a una página de listado de notas de crédito
        navigate('/accounting/credit-notes'); 
      }
    });
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Anular Comprobante: {affectedInvoice.series}-{String(affectedInvoice.number).padStart(8, '0')}
        </h1>
        <p className="text-gray-600 mb-6">Cliente: {affectedInvoice.client.name}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serie de la Nota de Crédito*</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la Nota de Crédito*</label>
            <Controller
              name="credit_note_type_code"
              control={control}
              render={({ field }) => (
                <select {...field} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  {CREDIT_NOTE_REASONS.map(reason => (
                    <option key={reason.code} value={reason.code}>{reason.description}</option>
                  ))}
                </select>
              )}
            />
            {errors.credit_note_type_code && <p className="text-sm text-error mt-1">{errors.credit_note_type_code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Sustento*</label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Ej: El cliente desistió de la compra y solicitó la devolución del dinero."
                />
              )}
            />
            {errors.reason && <p className="text-sm text-error mt-1">{errors.reason.message}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button 
              type="submit" 
              isLoading={isPending}
              disabled={!selectedCreditNoteSeries || availableCreditNoteSeries.length === 0}
            >
              Generar Nota de Crédito
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};