// src/features/accounting/pages/CreditNoteFormPage.tsx

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';

import { Button } from '../../../components/common/Button';
import { useCreateCreditNote } from '../hooks/useCreditNotes';
import { CreditNoteCreateData } from '../types';
import { Invoice, InvoiceItem } from '../../../types'; 

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

export const CreditNoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Tipamos explícitamente el estado que esperamos recibir
  const { affectedInvoice } = (location.state as { affectedInvoice: Invoice }) || {};

  const { mutate: createCreditNote, isPending } = useCreateCreditNote();

  const { control, handleSubmit, formState: { errors } } = useForm<CreditNoteFormData>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: { credit_note_type_code: '01', reason: '' }
  });

  if (!affectedInvoice || !affectedInvoice.client) {
    React.useEffect(() => {
      toast.error("No se ha especificado una factura válida para anular.");
      navigate('/invoices'); // O a la lista de facturas
    }, [navigate]);
    return null;
  }
  
  const onSubmit: SubmitHandler<CreditNoteFormData> = (data) => {
    // La serie de la Nota de Crédito debería venir de una configuración,
    // pero esta es una buena simplificación por ahora.
    const creditNoteSeries = affectedInvoice.document_type_code === '01' ? 'FC01' : 'BC01';

    // Validación adicional para TypeScript
    if (!affectedInvoice.client) {
      toast.error("Error: La factura no tiene información del cliente.");
      return;
    }

    const payload: CreditNoteCreateData = {
      company_id: affectedInvoice.company_id,
      client_id: affectedInvoice.client.id,
      series: creditNoteSeries,
      affected_document_type_code: affectedInvoice.document_type_code,
      affected_document_series_number: `${affectedInvoice.series}-${affectedInvoice.number}`,
      credit_note_type_code: data.credit_note_type_code,
      reason: data.reason,
      // Mapeamos los ítems de la factura al formato que espera el payload de la NC
      items: affectedInvoice.items?.map((item: InvoiceItem) => ({
        product_id: item.product_id!,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_category_code: item.tax_category_code,
        unit_code: item.unit_code,
        price_type_code: item.price_type_code || '01',
        item_description: item.item_description || 'Item sin descripción',
      })) || []
    };
    
    createCreditNote(payload, {
      onSuccess: () => {
        // Redirigir a una página de listado de notas de crédito
        // que podrías crear en el futuro.
        navigate('/accounting/dashboard'); 
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
            <Button type="submit" isLoading={isPending}>Generar Nota de Crédito</Button>
          </div>
        </form>
      </div>
    </div>
  );
};