// src/features/accounting/credit-notes/pages/CreditNoteAnnulFormPage.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/utils/sileo-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { useCreateCreditNoteByAnnulment } from '../hooks/useCreditNotes';
import { CreditNoteAnnulData } from '../../types';
import { Invoice, User } from '../../../../types';
import { useAccountingDocumentSeriesForBranch } from '../../../../hooks/useAccountingDocumentSeries';
import { authService } from '../../../../services/auth.service';
import RequestCancellationModal from '../../components/RequestCancellationModal';

const CREDIT_NOTE_REASONS = [
  { code: '01', description: 'Anulación de la operación' },
];

const creditNoteSchema = z.object({
  credit_note_type_code: z.string().nonempty('Debe seleccionar un motivo.'),
  reason: z.string().min(10, 'El sustento debe tener al menos 10 caracteres.'),
});

type CreditNoteFormData = z.infer<typeof creditNoteSchema>;

export const CreditNoteAnnulFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { affectedInvoice, simplifiedAnnul, isDebitNote } = (location.state as {
    affectedInvoice: Invoice;
    simplifiedAnnul?: boolean;
    isDebitNote?: boolean;
  }) || {};

  const [selectedCreditNoteSeries, setSelectedCreditNoteSeries] = useState<string>('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { mutate: createCreditNote, isPending } = useCreateCreditNoteByAnnulment();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const data = await authService.getProfile();
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { availableCreditNoteSeries, isLoading: isLoadingSeries } =
    useAccountingDocumentSeriesForBranch(
      currentUser?.default_branch_office_id || null,
      currentUser?.company_id || 1
    );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreditNoteFormData>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: {
      credit_note_type_code: '01',
      reason: '',
    },
  });

  useEffect(() => {
    const cachedSeries = localStorage.getItem('lastUsedCreditNoteSeries');
    if (availableCreditNoteSeries.length > 0) {
      if (
        cachedSeries &&
        availableCreditNoteSeries.some((s) => s.series_code === cachedSeries)
      ) {
        setSelectedCreditNoteSeries(cachedSeries);
      } else {
        setSelectedCreditNoteSeries(availableCreditNoteSeries[0].series_code);
      }
    }
  }, [availableCreditNoteSeries]);

  const handleCreditNoteSeriesChange = (seriesCode: string) => {
    setSelectedCreditNoteSeries(seriesCode);
    localStorage.setItem('lastUsedCreditNoteSeries', seriesCode);
  };

  if (!affectedInvoice || !affectedInvoice.client) {
    React.useEffect(() => {
      toast.error(
        `No se ha especificado ${isDebitNote ? 'una nota de débito' : 'una factura'} válida para anular.`
      );
      navigate('/accounting/credit-notes/new');
    }, [navigate]);
    return null;
  }

  const handleSimplifiedAnnul = () => {
    if (!selectedCreditNoteSeries) {
      toast.error('No hay serie de nota de crédito seleccionada.');
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
      },
      onError: (error: any) => {
        if (error?.response?.status === 403) {
          const errorDetail = error?.response?.data?.detail || '';
          if (
            errorDetail.includes('Viaje ya salió') ||
            errorDetail.includes('Solicita aprobación')
          ) {
            setShowRequestModal(true);
          } else {
            toast.error(errorDetail || 'No tienes permisos para realizar esta acción');
          }
        }
      },
    });
  };

  const onSubmit: SubmitHandler<CreditNoteFormData> = (data) => {
    if (!selectedCreditNoteSeries) {
      toast.error('Debe seleccionar una serie para la nota de crédito');
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
      },
      onError: (error: any) => {
        if (error?.response?.status === 403) {
          const errorDetail = error?.response?.data?.detail || '';
          if (
            errorDetail.includes('Viaje ya salió') ||
            errorDetail.includes('Solicita aprobación')
          ) {
            setShowRequestModal(true);
          } else {
            toast.error(errorDetail || 'No tienes permisos para realizar esta acción');
          }
        }
      },
    });
  };

  // ── Componentes auxiliares de UI ──

  const Breadcrumb = () => (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-1.5 text-[13px] text-dm-text-muted hover:text-dm-text-primary transition-colors mb-6"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      <span>Volver</span>
    </button>
  );

  const SunatAlert = () => (
    <div className="rounded-[12px] border border-dm-border-primary bg-dm-bg-secondary p-5">
      <div className="flex items-start gap-3.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-dm-text-primary">
            Requisito importante de SUNAT
          </h3>
          <div className="mt-1.5 text-[13px] text-dm-text-secondary leading-relaxed space-y-1">
            <p>
              Según normativa SUNAT,{' '}
              <span className="font-semibold text-dm-text-primary">
                la serie de la nota de crédito debe ser la misma que la serie del comprobante que afecta
              </span>
              .
            </p>
            <p>
              Ejemplo: si el comprobante es{' '}
              <code className="text-[12px] font-medium text-dm-text-primary bg-dm-bg-primary px-1.5 py-0.5 rounded border border-dm-border-primary">
                B004-00000123
              </code>
              , la serie de la nota de crédito debe ser{' '}
              <code className="text-[12px] font-medium text-dm-text-primary bg-dm-bg-primary px-1.5 py-0.5 rounded border border-dm-border-primary">
                B004
              </code>
              .
            </p>
            <p className="text-[12px] text-dm-text-muted">
              Verifique que la serie seleccionada coincida con la del comprobante a afectar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const DocumentCard = () => {
    const client = affectedInvoice.client!;
    const items = affectedInvoice.items || [];
    const displayItems = items.slice(0, 5);
    const remaining = items.length - 5;

    return (
      <div className="rounded-[12px] border border-dm-border-primary bg-dm-bg-primary overflow-hidden">
        {/* Header del comprobante */}
        <div className="px-6 py-5 border-b border-dm-border-primary">
          <div className="flex items-center gap-2 mb-1">
            <DocumentTextIcon className="w-4 h-4 text-[#1F4690]" />
            <span className="text-[12px] font-semibold text-[#1F4690] uppercase tracking-wider">
              {isDebitNote ? 'Nota de Débito' : 'Comprobante'} a anular
            </span>
          </div>
          <h1 className="text-[22px] font-semibold text-dm-text-primary tracking-tight">
            {affectedInvoice.series}-{String(affectedInvoice.number).padStart(8, '0')}
          </h1>
        </div>

        {/* Datos del cliente */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-dm-bg-secondary flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-dm-text-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-dm-text-muted">Cliente</p>
              <p className="text-[14px] font-medium text-dm-text-primary truncate">
                {client.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-dm-bg-secondary flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="w-4 h-4 text-dm-text-muted" />
            </div>
            <div>
              <p className="text-[12px] text-dm-text-muted">Documento</p>
              <p className="text-[14px] font-medium text-dm-text-primary">
                {client.doc_type} - {client.doc_number}
              </p>
            </div>
          </div>

          {(client.address_line || client.address) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-dm-bg-secondary flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="w-4 h-4 text-dm-text-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-dm-text-muted">Dirección</p>
                <p className="text-[14px] font-medium text-dm-text-primary truncate">
                  {client.address_line ?? client.address}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-dm-bg-secondary flex items-center justify-center flex-shrink-0">
              <BanknotesIcon className="w-4 h-4 text-dm-text-muted" />
            </div>
            <div>
              <p className="text-[12px] text-dm-text-muted">Total</p>
              <p className="text-[14px] font-semibold text-dm-text-primary">
                S/ {affectedInvoice.total_payable}
              </p>
            </div>
          </div>
        </div>

        {/* Servicios */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-dm-border-primary bg-dm-bg-secondary/50">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardDocumentListIcon className="w-4 h-4 text-dm-text-muted" />
              <span className="text-[12px] font-semibold text-dm-text-secondary uppercase tracking-wider">
                Servicios incluidos
              </span>
            </div>
            <ul className="space-y-2">
              {displayItems.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-dm-text-secondary truncate pr-4">
                    {it.item_description ?? it.product?.name ?? 'Ítem'} x{it.quantity}
                  </span>
                  <span className="font-medium text-dm-text-primary whitespace-nowrap">
                    S/ {it.total_line}
                  </span>
                </li>
              ))}
              {remaining > 0 && (
                <li className="text-[12px] text-dm-text-muted pt-1">
                  +{remaining} servicios adicionales
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const SeriesSelector = () => (
    <div>
      <label className="block text-[13px] font-medium text-dm-text-primary mb-2">
        Serie de la Nota de Crédito
        <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
      </label>
      {isLoadingSeries ? (
        <div className="flex items-center gap-2 w-full px-4 py-3 rounded-[12px] border border-dm-border-primary bg-dm-bg-secondary text-[13px] text-dm-text-muted">
          <Spinner size="sm" color="text-dm-text-muted" />
          <span>Cargando series...</span>
        </div>
      ) : availableCreditNoteSeries.length > 0 ? (
        <div className="relative">
          <select
            value={selectedCreditNoteSeries}
            onChange={(e) => handleCreditNoteSeriesChange(e.target.value)}
            className="w-full appearance-none px-4 py-3 pr-10 text-[14px] text-dm-text-primary bg-dm-bg-primary border border-dm-border-primary rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-colors"
          >
            {availableCreditNoteSeries.map((series) => (
              <option key={series.id} value={series.series_code}>
                {series.series_code} - Nota de Crédito
              </option>
            ))}
          </select>
          <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dm-text-muted rotate-90 pointer-events-none" />
        </div>
      ) : (
        <div className="flex items-center gap-2 w-full px-4 py-3 rounded-[12px] border border-red-200 bg-red-50 dark:bg-red-950/30/50 text-[13px] text-red-700 dark:text-red-300">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span>No hay series de notas de crédito disponibles para esta sucursal</span>
        </div>
      )}
    </div>
  );

  const FormFooter = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-dm-border-primary">
      {children}
    </div>
  );

  // ── Vista simplificada ──
  if (simplifiedAnnul) {
    return (
      <div className="min-h-screen bg-dm-bg-secondary p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Columna izquierda: info del comprobante */}
            <div className="space-y-5">
              <SunatAlert />
              <DocumentCard />
            </div>

            {/* Columna derecha: acción de anulación */}
            <div className="rounded-[12px] border border-dm-border-primary bg-dm-bg-primary p-6 space-y-6">
              <div>
                <h2 className="text-[15px] font-semibold text-dm-text-primary mb-1">
                  Anulación simplificada
                </h2>
                <p className="text-[13px] text-dm-text-muted">
                  Selecciona la serie y confirma para generar la nota de crédito.
                </p>
              </div>

              <SeriesSelector />

              <FormFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="rounded-full px-5"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSimplifiedAnnul}
                  isLoading={isPending}
                  disabled={!selectedCreditNoteSeries}
                  className="rounded-full px-6"
                >
                  Confirmar anulación
                </Button>
              </FormFooter>
            </div>
          </div>
        </div>

        {showRequestModal && (
          <RequestCancellationModal
            invoiceId={affectedInvoice.id}
            invoiceSeries={affectedInvoice.series}
            invoiceNumber={affectedInvoice.number}
            onClose={() => setShowRequestModal(false)}
            onSuccess={() => navigate('/accounting/invoices')}
          />
        )}
      </div>
    );
  }

  // ── Vista completa con formulario ──
  return (
    <div className="min-h-screen bg-dm-bg-secondary p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Columna izquierda: info del comprobante */}
          <div className="space-y-5">
            <SunatAlert />
            <DocumentCard />
          </div>

          {/* Columna derecha: formulario */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-[12px] border border-dm-border-primary bg-dm-bg-primary p-6 space-y-6"
          >
            <div>
              <h2 className="text-[15px] font-semibold text-dm-text-primary mb-1">
                Generar Nota de Crédito
              </h2>
              <p className="text-[13px] text-dm-text-muted">
                Complete los datos para registrar la anulación ante SUNAT.
              </p>
            </div>

            <SeriesSelector />

            <div>
              <label className="block text-[13px] font-medium text-dm-text-primary mb-2">
                Motivo de la Nota de Crédito
                <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
              </label>
              <Controller
                name="credit_note_type_code"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      {...field}
                      className="w-full appearance-none px-4 py-3 pr-10 text-[14px] text-dm-text-primary bg-dm-bg-primary border border-dm-border-primary rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-colors"
                    >
                      {CREDIT_NOTE_REASONS.map((reason) => (
                        <option key={reason.code} value={reason.code}>
                          {reason.description}
                        </option>
                      ))}
                    </select>
                    <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dm-text-muted rotate-90 pointer-events-none" />
                  </div>
                )}
              />
              {errors.credit_note_type_code && (
                <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">
                  {errors.credit_note_type_code.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-dm-text-primary mb-2">
                Descripción / Sustento
                <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
              </label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    className="w-full px-4 py-3 text-[14px] text-dm-text-primary bg-dm-bg-primary border border-dm-border-primary rounded-[12px] placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-colors resize-none"
                    placeholder="Ej: El cliente desistió de la compra y solicitó la devolución del dinero."
                  />
                )}
              />
              {errors.reason && (
                <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">
                  {errors.reason.message}
                </p>
              )}
            </div>

            <FormFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="rounded-full px-5"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isPending}
                disabled={!selectedCreditNoteSeries || availableCreditNoteSeries.length === 0}
                className="rounded-full px-6"
              >
                Generar Nota de Crédito
              </Button>
            </FormFooter>
          </form>
        </div>
      </div>

      {showRequestModal && (
        <RequestCancellationModal
          invoiceId={affectedInvoice.id}
          invoiceSeries={affectedInvoice.series}
          invoiceNumber={affectedInvoice.number}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => navigate('/accounting/invoices')}
        />
      )}
    </div>
  );
};
