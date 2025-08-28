// src/features/accounting/debit-notes/pages/DebitNoteAnnulFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

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
  const [igvEnabled, setIgvEnabled] = useState(true); // Estado para controlar IGV

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
          price_with_tax: igvEnabled ? data.additional_amount * 1.18 : data.additional_amount,
          price_type_code: "01",
          tax_category_code: igvEnabled ? "10" : "20" // 10=Gravado, 20=Exonerado
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
    <div className="p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Crear Nota de Débito para: {affectedInvoice.series}-{String(affectedInvoice.number).padStart(8, '0')}
        </h1>
        <p className="text-gray-600 mb-6">
          Cliente: {affectedInvoice.client.name}
          <span className="ml-4 text-sm text-blue-600">
            • IGV: {igvEnabled ? 'Activado (18%)' : 'Desactivado (exonerado)'}
          </span>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serie de la Nota de Débito*</label>
            {isLoadingSeries ? (
              <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
                Cargando series...
              </div>
            ) : availableDebitNoteSeries.length > 0 ? (
              <select
                value={selectedDebitNoteSeries}
                onChange={(e) => handleDebitNoteSeriesChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
              >
                {availableDebitNoteSeries.map((series) => (
                  <option key={series.id} value={series.series_code}>
                    {series.series_code} - Nota de Débito
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-2 border border-red-300 rounded-md bg-red-50 text-red-600">
                No hay series de notas de débito disponibles para esta sucursal
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la Nota de Débito*</label>
            <Controller
              name="debit_note_type_code"
              control={control}
              render={({ field }) => (
                <select {...field} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  {DEBIT_NOTE_REASONS.map(reason => (
                    <option key={reason.code} value={reason.code}>{reason.description}</option>
                  ))}
                </select>
              )}
            />
            {errors.debit_note_type_code && <p className="text-sm text-error mt-1">{errors.debit_note_type_code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Adicional (S/)*</label>
            <Controller
              name="additional_amount"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              )}
            />
            {errors.additional_amount && <p className="text-sm text-error mt-1">{errors.additional_amount.message}</p>}
          </div>

          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="igvEnabled"
                checked={igvEnabled}
                onChange={(e) => setIgvEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="igvEnabled" className="ml-2 block text-sm text-gray-900">
                Aplicar IGV (18%) - {igvEnabled ? 'Activado' : 'Desactivado'}
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {igvEnabled ? 'Se aplicará IGV 18% sobre el precio base' : 'Precio sin IGV (región amazónica exonerada)'}
            </p>
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
                  placeholder="Ej: Intereses por mora según contrato..."
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
              disabled={!selectedDebitNoteSeries || availableDebitNoteSeries.length === 0}
            >
              Generar Nota de Débito
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
