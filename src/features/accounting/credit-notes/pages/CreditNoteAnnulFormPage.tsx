// src/features/accounting/credit-notes/pages/CreditNoteAnnulFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../../../components/common/Button';
import { useCreateCreditNoteByAnnulment } from '../hooks/useCreditNotes';
import { CreditNoteAnnulData } from '../../types';
import { Invoice, User } from '../../../../types'; 
import { useAccountingDocumentSeriesForBranch } from '../../../../hooks/useAccountingDocumentSeries';
import { authService } from '../../../../services/auth.service'; 

// Catálogo 09 de SUNAT para motivos de Nota de Crédito (Solo anulación para esta página)
const CREDIT_NOTE_REASONS = [
  { code: '01', description: 'Anulación de la operación' },
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
  const { affectedInvoice, simplifiedAnnul } = (location.state as { affectedInvoice: Invoice; simplifiedAnnul?: boolean }) || {};

  const [selectedCreditNoteSeries, setSelectedCreditNoteSeries] = useState<string>("");

  const { mutate: createCreditNote, isPending } = useCreateCreditNoteByAnnulment();
  const queryClient = useQueryClient();

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
  
  // Modo simplificado: mostrar tarjeta con info y botón único para anular
  const handleSimplifiedAnnul = () => {
    if (!selectedCreditNoteSeries) {
      toast.error("No hay serie de nota de crédito seleccionada.");
      return;
    }

    const payload: CreditNoteAnnulData = {
      invoice_id: affectedInvoice.id,
      credit_note_series: selectedCreditNoteSeries,
      reason: 'Anulación simplificada',
    };

    createCreditNote(payload, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
        navigate('/accounting/credit-notes');
      }
    });
  };
  
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
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
        navigate('/accounting/credit-notes'); 
      }
    });
  };

  // Si estamos en modo simplificado renderizamos opción única
  if (simplifiedAnnul) {
    return (
      <div className="p-6 bg-gray-50">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Alerta informativa sobre series */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Requisito importante de SUNAT
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Según normativa SUNAT, <strong>la serie de la nota de crédito debe ser la misma que la serie del comprobante que afecta</strong>.
                  </p>
                  <p className="mt-1">
                    Ejemplo: Si el comprobante es <code className="bg-amber-100 px-1 py-0.5 rounded">B004-00000123</code>, 
                    la serie de la nota de crédito debe ser <code className="bg-amber-100 px-1 py-0.5 rounded">B004</code>.
                  </p>
                  <p className="mt-2 font-medium">
                    📝 Por favor, verifique que la serie seleccionada coincida con la del comprobante a afectar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Anular Comprobante</h1>
            <div className="mb-4">
            <div className="font-medium">{affectedInvoice.series}-{String(affectedInvoice.number).padStart(8, '0')}</div>
            <div className="text-sm text-gray-600">Cliente: {affectedInvoice.client.name}</div>
            <div className="text-sm text-gray-600">Documento: {affectedInvoice.client.doc_type} - {affectedInvoice.client.doc_number}</div>
            {(affectedInvoice.client.address_line || affectedInvoice.client.address) && (
              <div className="text-sm text-gray-600">Dirección: {affectedInvoice.client.address_line ?? affectedInvoice.client.address}</div>
            )}
            <div className="text-sm text-gray-600">Total: S/ {affectedInvoice.total_payable}</div>

            {/* Resumen breve de servicios / ítems */}
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Servicios incluidos</div>
              {affectedInvoice.items && affectedInvoice.items.length > 0 ? (
                <ul className="text-sm text-gray-600 space-y-1">
                  {affectedInvoice.items.slice(0, 5).map((it) => (
                    <li key={it.id} className="flex justify-between">
                      <span className="truncate">{it.item_description ?? it.product?.name ?? 'Ítem'} x{it.quantity}</span>
                      <span>S/ {it.total_line}</span>
                    </li>
                  ))}
                  {affectedInvoice.items.length > 5 && (
                    <li className="text-sm text-gray-500">+{affectedInvoice.items.length - 5} más</li>
                  )}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">Sin servicios listados</div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Serie NC a usar</label>
            {isLoadingSeries ? (
              <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">Cargando series...</div>
            ) : availableCreditNoteSeries.length > 0 ? (
              <select
                value={selectedCreditNoteSeries}
                onChange={(e) => handleCreditNoteSeriesChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
              >
                {availableCreditNoteSeries.map((series) => (
                  <option key={series.id} value={series.series_code}>{series.series_code}</option>
                ))}
              </select>
            ) : (
              <div className="w-full p-2 border border-red-300 rounded-md bg-red-50 text-red-600">No hay series disponibles</div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSimplifiedAnnul} isLoading={isPending} disabled={!selectedCreditNoteSeries}>
              Usar anulación simplificada
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Alerta informativa sobre series */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Requisito importante de SUNAT
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Según normativa SUNAT, <strong>la serie de la nota de crédito debe ser la misma que la serie del comprobante que afecta</strong>.
                </p>
                <p className="mt-1">
                  Ejemplo: Si el comprobante es <code className="bg-amber-100 px-1 py-0.5 rounded">B004-00000123</code>, 
                  la serie de la nota de crédito debe ser <code className="bg-amber-100 px-1 py-0.5 rounded">B004</code>.
                </p>
                <p className="mt-2 font-medium">
                  📝 Por favor, verifique que la serie seleccionada coincida con la del comprobante a afectar.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Anular Comprobante: {affectedInvoice.series}-{String(affectedInvoice.number).padStart(8, '0')}
          </h1>
          <div className="text-gray-600 mb-6">
          <div>Cliente: <span className="font-medium">{affectedInvoice.client.name}</span></div>
          <div>Documento: <span className="font-medium">{affectedInvoice.client.doc_type} - {affectedInvoice.client.doc_number}</span></div>
          {(affectedInvoice.client.address_line || affectedInvoice.client.address) && (
            <div>Dirección: <span className="font-medium">{affectedInvoice.client.address_line ?? affectedInvoice.client.address}</span></div>
          )}

          {/* Resumen breve de servicios */}
          <div className="mt-3">
            <div className="text-sm font-medium text-gray-700 mb-1">Servicios incluidos</div>
            {affectedInvoice.items && affectedInvoice.items.length > 0 ? (
              <ul className="text-sm text-gray-600 space-y-1">
                {affectedInvoice.items.slice(0, 5).map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span className="truncate">{it.item_description ?? it.product?.name ?? 'Ítem'} x{it.quantity}</span>
                    <span>S/ {it.total_line}</span>
                  </li>
                ))}
                {affectedInvoice.items.length > 5 && (
                  <li className="text-sm text-gray-500">+{affectedInvoice.items.length - 5} más</li>
                )}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">Sin servicios listados</div>
            )}
          </div>
        </div>

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
    </div>
  );
};
