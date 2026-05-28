// src/features/accounting/debit-notes/pages/DebitNoteAnnulFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/utils/sileo-toast';
import { useQuery } from '@tanstack/react-query';
import { DocumentPlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { Button } from '../../../../components/common/Button';
import { useCreateDebitNote } from '../hooks/useDebitNotes';
import { DebitNoteCreateData } from '../../types';
import { Invoice, User } from '../../../../types'; 
import { useAccountingDocumentSeriesForBranch } from '../../../../hooks/useAccountingDocumentSeries';
import { authService } from '../../../../services/auth.service';

// Catálogo de motivos para Nota de Débito (Catálogo 10 SUNAT)
const DEBIT_NOTE_REASONS = [
  { code: '01', description: 'Intereses por mora' },
  { code: '02', description: 'Aumento en el valor' },
  { code: '03', description: 'Penalidades/otros conceptos' },
  { code: '10', description: 'Ajustes de operaciones de exportación' },
  { code: '11', description: 'Ajustes afectos al IVAP' },
];

const debitNoteSchema = z.object({
  debit_note_type_code: z.string().nonempty("Debe seleccionar un motivo."),
  reason: z.string().min(10, "El sustento debe tener al menos 10 caracteres."),
  additional_amount: z.number().min(0.01, "El monto adicional debe ser mayor a 0."),
});

type DebitNoteFormData = z.infer<typeof debitNoteSchema>;

export const DebitNoteAnnulFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Tipamos explícitamente el estado que esperamos recibir
  const { affectedInvoice } = (location.state as { affectedInvoice: Invoice }) || {};

  const [selectedDebitNoteSeries, setSelectedDebitNoteSeries] = useState<string>("");

  const { mutate: createDebitNote, isPending } = useCreateDebitNote();

  // Hook de usuario actual
  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const data = await authService.getProfile();
      console.log('DebitNoteAnnulFormPage - Current user data:', data);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1
  });

  // Hook para obtener series de notas de débito por branch office
  const {
    availableDebitNoteSeries,
    isLoading: isLoadingSeries,
  } = useAccountingDocumentSeriesForBranch(
    currentUser?.default_branch_office_id || null,
    currentUser?.company_id || 1 // Valor por defecto si no está definido
  );

  const { control, handleSubmit, formState: { errors } } = useForm<DebitNoteFormData>({
    resolver: zodResolver(debitNoteSchema),
    defaultValues: { 
      debit_note_type_code: '01', 
      reason: '',
      additional_amount: 0
    }
  });

  // Efecto para configurar la serie por defecto
  useEffect(() => {
    const cachedSeries = localStorage.getItem("lastUsedDebitNoteSeries");
    
    if (availableDebitNoteSeries.length > 0) {
      if (cachedSeries && availableDebitNoteSeries.some((s) => s.series_code === cachedSeries)) {
        setSelectedDebitNoteSeries(cachedSeries);
      } else {
        setSelectedDebitNoteSeries(availableDebitNoteSeries[0].series_code);
      }
    }
  }, [availableDebitNoteSeries]);

  // Handler para cambio de serie
  const handleDebitNoteSeriesChange = (seriesCode: string) => {
    setSelectedDebitNoteSeries(seriesCode);
    localStorage.setItem("lastUsedDebitNoteSeries", seriesCode);
  };

  if (!affectedInvoice || !affectedInvoice.client) {
    React.useEffect(() => {
      toast.error("No se ha especificado una factura válida para crear nota de débito.");
      navigate('/accounting/debit-notes/new'); // Redirigir a selección de factura
    }, [navigate]);
    return null;
  }
  
  const onSubmit: SubmitHandler<DebitNoteFormData> = (data) => {
    if (!selectedDebitNoteSeries) {
      toast.error("Debe seleccionar una serie para la nota de débito");
      return;
    }

    // Para nota de débito, necesitamos crear con estructura completa
    const payload: DebitNoteCreateData = {
      company_id: currentUser?.company_id || 1,
      client_id: affectedInvoice.client?.id || 0,
      document_type_code: '08', // Siempre 08 para notas de débito
      series: selectedDebitNoteSeries,
      issue_date: new Date().toISOString().split('T')[0], // Fecha actual
      issue_time: new Date().toTimeString().split(' ')[0], // Hora actual
      currency_code: "PEN",
      affected_document_type_code: affectedInvoice.document_type_code || "01",
      affected_document_series_number: `${affectedInvoice.series}-${String(affectedInvoice.number).padStart(8,'0')}`,
      debit_note_type_code: data.debit_note_type_code,
      reason: data.reason,
      items: [
        {
          product_id: 1, // ID de producto genérico - debería venir de configuración
          quantity: 1,
          unit_code: 'NIU', // Unidad común
          unit_price: data.additional_amount,
          price_with_tax: data.additional_amount,
          price_type_code: "01",
          tax_category_code: "20" // Siempre exonerado
        }
      ]
    };
    
    createDebitNote(payload, {
      onSuccess: () => {
        // Redirigir a una página de listado de notas de débito
        navigate('/accounting/debit-notes'); 
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
          <DocumentPlusIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
            Crear Nota de Débito
          </h1>
          <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
            {affectedInvoice.series}-{String(affectedInvoice.number).padStart(8, '0')} — {affectedInvoice.client.name}
          </p>
        </div>
      </div>

      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">Serie de la Nota de Débito*</label>
            {isLoadingSeries ? (
              <div className="block w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-muted">
                Cargando series...
              </div>
            ) : availableDebitNoteSeries.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedDebitNoteSeries}
                  onChange={(e) => handleDebitNoteSeriesChange(e.target.value)}
                  className="peer block w-full appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all pr-10"
                >
                  {availableDebitNoteSeries.map((series) => (
                    <option key={series.id} value={series.series_code}>
                      {series.series_code} - Nota de Débito
                    </option>
                  ))}
                </select>
                <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
              </div>
            ) : (
              <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4">
                <p className="text-[13px] text-[#cf1322]">No hay series de notas de débito disponibles para esta sucursal</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">Motivo de la Nota de Débito*</label>
            <Controller
              name="debit_note_type_code"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <select {...field} className="peer block w-full appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all pr-10">
                    {DEBIT_NOTE_REASONS.map(reason => (
                      <option key={reason.code} value={reason.code}>{reason.description}</option>
                    ))}
                  </select>
                  <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
                </div>
              )}
            />
            {errors.debit_note_type_code && <p className="mt-1 text-[13px] text-[#cf1322]">{errors.debit_note_type_code.message}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">Monto Adicional (S/)*</label>
            <Controller
              name="additional_amount"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="block w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
                  placeholder="0.00"
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              )}
            />
            {errors.additional_amount && <p className="mt-1 text-[13px] text-[#cf1322]">{errors.additional_amount.message}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">Descripción / Sustento*</label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  className="block w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all resize-none"
                  placeholder="Ej: Intereses por mora según contrato..."
                />
              )}
            />
            {errors.reason && <p className="mt-1 text-[13px] text-[#cf1322]">{errors.reason.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-dm-border-secondary">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary">Cancelar</Button>
            <Button 
              type="submit" 
              isLoading={isPending}
              disabled={!selectedDebitNoteSeries || availableDebitNoteSeries.length === 0}
              className="rounded-full px-5 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium"
            >
              Generar Nota de Débito
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
