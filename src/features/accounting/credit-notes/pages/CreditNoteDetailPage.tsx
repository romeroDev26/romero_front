// src/features/accounting/credit-notes/pages/CreditNoteDetailPage.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { toast } from 'react-toastify';
import {
  useCreditNote,
  useCreditNoteSunatStatus,
  useGenerateCreditNotePdf,
} from '../hooks/useCreditNotes';

type PdfFormatTab = 'ticket80mm' | 'a4';

export const CreditNoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ncPdfTab, setNcPdfTab] = useState<PdfFormatTab>('ticket80mm');
  const [affectedPdfTab, setAffectedPdfTab] = useState<PdfFormatTab>('ticket80mm');
  const [showPdfError, setShowPdfError] = useState(false);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  
  const creditNoteId = id ? parseInt(id, 10) : null;
  const { data: creditNote, isLoading, dataUpdatedAt } = useCreditNote(creditNoteId);
  const { data: sunatStatus, isLoading: isLoadingStatus } = useCreditNoteSunatStatus(creditNoteId);
  const { mutate: generateCreditNotePdf, isPending: isGeneratingPdf } = useGenerateCreditNotePdf();

  useEffect(() => {
    if (!creditNote) return;
    const t = Boolean(creditNote.pdf_ticket_file_path?.trim());
    const a4 = Boolean(creditNote.pdf_a4_file_path?.trim());
    if (t && !a4) setNcPdfTab('ticket80mm');
    else if (!t && a4) setNcPdfTab('a4');
  }, [creditNote?.pdf_ticket_file_path, creditNote?.pdf_a4_file_path]);

  useEffect(() => {
    if (!creditNote) return;
    const inv = (creditNote as any).affected_invoice;
    if (!inv) return;
    const t = Boolean(inv.pdf_ticket_file_path?.trim());
    const a4 = Boolean(inv.pdf_a4_file_path?.trim());
    if (t && !a4) setAffectedPdfTab('ticket80mm');
    else if (!t && a4) setAffectedPdfTab('a4');
  }, [
    (creditNote as any)?.affected_invoice?.pdf_ticket_file_path,
    (creditNote as any)?.affected_invoice?.pdf_a4_file_path,
  ]);

  const getSunatStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'REJECTED':
        return <XCircleIcon className="h-6 w-6 text-red-600" />;
      case 'PENDING':
      case 'SENT':
        return <ClockIcon className="h-6 w-6 text-yellow-600" />;
      default:
        return <XCircleIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const getSunatStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      SENT: 'bg-blue-50 border-blue-200 text-blue-800',
      ACCEPTED: 'bg-green-50 border-green-200 text-green-800',
      REJECTED: 'bg-red-50 border-red-200 text-red-800',
      ERROR: 'bg-gray-50 border-gray-200 text-gray-800',
    };
    return colors[status as keyof typeof colors] || colors.ERROR;
  };

  const getStatusMessage = (status: string) => {
    const messages = {
      PENDING: 'El documento está pendiente de envío a SUNAT',
      SENT: 'El documento ha sido enviado a SUNAT y está siendo procesado',
      ACCEPTED: 'El documento ha sido aceptado por SUNAT',
      REJECTED: 'El documento ha sido rechazado por SUNAT',
      ERROR: 'Ha ocurrido un error en el procesamiento',
    };
    return messages[status as keyof typeof messages] || 'Estado desconocido';
  };

  // Resolver estado SUNAT usando posibles formas de respuesta del backend
  const resolvedSunatStatus =
    (sunatStatus as any)?.sunat_status ??
    (sunatStatus as any)?.state?.data?.sunat_status ??
    creditNote?.sunat_status;

  const resolvedSunatResponseDescription =
    (sunatStatus as any)?.sunat_response_description ??
    (sunatStatus as any)?.state?.data?.sunat_response_description ??
    creditNote?.sunat_response_description;

  const resolvedSunatTicket =
    (sunatStatus as any)?.sunat_ticket ??
    (sunatStatus as any)?.state?.data?.sunat_ticket;

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    // Manejar fechas en formato YYYY-MM-DD sin zona horaria creando fecha en local
    const dateOnlyMatch = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const dateObj = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateString);

    return dateObj.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    // Si sólo viene YYYY-MM-DD, tratar como midnight local
    const dateOnlyMatch = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const dateObj = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateString);

    return dateObj.toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    if (pdfIframeRef.current) {
      try {
        const iframeWindow = pdfIframeRef.current.contentWindow;
        if (iframeWindow) {
          iframeWindow.print();
        } else {
          throw new Error('No se puede acceder al contenido del iframe');
        }
      } catch (error) {
        console.warn('Error al imprimir desde iframe:', error);
        const pdfUrl = ncPdfTab === 'ticket80mm' ? creditNote?.pdf_ticket_file_path : creditNote?.pdf_a4_file_path;
        const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.onload = () => {
            try {
              printWindow.print();
            } catch (fallbackError) {
              toast.info('Haz clic en "Imprimir" en la ventana que se abrió');
            }
          };
        } else {
          toast.error('El navegador bloqueó la ventana emergente');
        }
      }
    } else {
      toast.error('El visor PDF no está disponible');
    }
  };

  const handleDownload = () => {
    const pdfUrl = ncPdfTab === 'ticket80mm' ? creditNote?.pdf_ticket_file_path : creditNote?.pdf_a4_file_path;
    const fileName = ncPdfTab === 'ticket80mm' 
      ? `nc-ticket-${creditNote?.series}-${String(creditNote?.number).padStart(8, '0')}.pdf`
      : `nc-a4-${creditNote?.series}-${String(creditNote?.number).padStart(8, '0')}.pdf`;
    
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF descargado correctamente');
    } else {
      toast.error(`No hay PDF ${ncPdfTab === 'ticket80mm' ? '80mm' : 'A4'} disponible para descargar`);
    }
  };

  const handleGenerateOrRegenerateCurrentPdf = () => {
    if (creditNoteId == null) return;
    setShowPdfError(false);
    const size = ncPdfTab === 'ticket80mm' ? '80mm' : 'a4';
    generateCreditNotePdf({ id: creditNoteId, size });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando nota de crédito...</p>
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="p-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nota de Crédito no encontrada</h2>
        <p className="text-gray-600 mb-4">La nota de crédito solicitada no existe o no tienes permisos para verla.</p>
        <Button onClick={() => navigate('/accounting/credit-notes')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const hasNcTicket = Boolean(creditNote.pdf_ticket_file_path?.trim());
  const hasNcA4 = Boolean(creditNote.pdf_a4_file_path?.trim());
  const ncPdfSize: '80mm' | 'a4' = ncPdfTab === 'ticket80mm' ? '80mm' : 'a4';
  const hasPdfForCurrentNcTab = ncPdfTab === 'ticket80mm' ? hasNcTicket : hasNcA4;
  const pdfCacheBuster = `${creditNote.updated_at ? new Date(creditNote.updated_at).getTime() : 0}_${dataUpdatedAt}`;
  const ncPdfBase =
    ncPdfTab === 'ticket80mm' ? creditNote.pdf_ticket_file_path : creditNote.pdf_a4_file_path;
  const ncPdfSrc = ncPdfBase ? `${ncPdfBase}?v=${pdfCacheBuster}` : '';

  const clientName = creditNote.client?.name || (creditNote as any).client_name || '—';
  const clientDoc = creditNote.client?.doc_number || (creditNote as any).client_document;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/accounting/credit-notes')}
              className="shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Nota de crédito electrónica</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {creditNote.series}-{String(creditNote.number).padStart(8, '0')}
              </h1>
              <p className="text-sm text-slate-600 mt-1 truncate" title={clientName}>
                {formatDate(creditNote.issue_date)} · {clientName}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getSunatStatusColor(resolvedSunatStatus)}`}>
                  {getSunatStatusIcon(resolvedSunatStatus)}
                  <span className="ml-1.5">
                    {resolvedSunatStatus === 'ACCEPTED' ? 'Aceptada SUNAT' :
                     resolvedSunatStatus === 'REJECTED' ? 'Rechazada' :
                     resolvedSunatStatus === 'SENT' ? 'Enviada' :
                     resolvedSunatStatus === 'PENDING' ? 'Pendiente' : 'Sin estado'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  Total {formatCurrency(creditNote.total_payable)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprobante PDF: un formato por llamada al backend */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Comprobante PDF</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Elige el formato y genera o regenera únicamente ese PDF (una petición por tamaño).
              </p>
            </div>
          </div>
          <div className="mt-4 flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setNcPdfTab('ticket80mm');
                setShowPdfError(false);
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                ncPdfTab === 'ticket80mm'
                  ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Ticket 80&nbsp;mm
            </button>
            <button
              type="button"
              onClick={() => {
                setNcPdfTab('a4');
                setShowPdfError(false);
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                ncPdfTab === 'a4'
                  ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Formato A4
            </button>
          </div>
        </div>

        <div className="relative bg-slate-100">
          {!hasPdfForCurrentNcTab ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <DocumentArrowDownIcon className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-slate-600 text-center text-sm max-w-md mb-4">
                No hay PDF <strong>{ncPdfSize === '80mm' ? 'ticket 80 mm' : 'A4'}</strong> para esta nota. Genera únicamente este formato.
              </p>
              <Button
                variant="primary"
                onClick={handleGenerateOrRegenerateCurrentPdf}
                isLoading={isGeneratingPdf}
                disabled={creditNoteId == null}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Generar PDF {ncPdfSize === '80mm' ? '80 mm' : 'A4'}
              </Button>
            </div>
          ) : showPdfError ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-slate-600 text-center text-sm mb-4">
                No se pudo mostrar el PDF en el navegador. Descárgalo o regenera este formato.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={handleDownload} variant="primary">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button variant="outline" onClick={handleGenerateOrRegenerateCurrentPdf} isLoading={isGeneratingPdf}>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Regenerar {ncPdfSize === '80mm' ? '80 mm' : 'A4'}
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              ref={pdfIframeRef}
              src={ncPdfSrc}
              className="w-full min-h-[520px] h-[62vh] max-h-[760px]"
              title="Vista previa del PDF de la nota de crédito"
              onError={() => setShowPdfError(true)}
            />
          )}
        </div>

        {hasPdfForCurrentNcTab && (
          <div className="border-t border-slate-100 px-5 py-3 sm:px-6 bg-white flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateOrRegenerateCurrentPdf}
              isLoading={isGeneratingPdf}
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Regenerar {ncPdfSize === '80mm' ? '80 mm' : 'A4'}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={showPdfError}>
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownload}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Emisor</h2>
            <p className="text-sm text-slate-800">
              <span className="text-slate-500">RUC</span>{' '}
              <span className="font-medium tabular-nums">{creditNote.company?.ruc || '—'}</span>
              <span className="text-slate-300 mx-2">·</span>
              <span>{creditNote.company?.business_name || '—'}</span>
            </p>
            {(creditNote.company?.address || creditNote.company?.phone || creditNote.company?.email) && (
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {[creditNote.company?.address, creditNote.company?.phone, creditNote.company?.email].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Serie-número</span>
                <span className="font-mono text-slate-800">{creditNote.series}-{String(creditNote.number).padStart(8, '0')}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Tipo</span>
                <span className="text-slate-800">NC (07)</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Emisión</span>
                <span className="text-slate-800">{formatDate(creditNote.issue_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Moneda · UBL</span>
                <span className="text-slate-800">{creditNote.currency_code || 'PEN'} · {creditNote.ubl_version || '2.1'}</span>
              </div>
            </div>
            {(creditNote.created_by || creditNote.created_at) && (
              <p className="text-[11px] text-slate-400 mt-3">
                {creditNote.created_by && <>Registro: {creditNote.created_by} · </>}
                {formatDateTime(creditNote.created_at)}
                {creditNote.updated_at && creditNote.updated_at !== creditNote.created_at && (
                  <> · Act. {formatDateTime(creditNote.updated_at)}</>
                )}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Motivo (cat. 09)</h2>
            <p className="text-xs text-slate-500">Código {creditNote.credit_note_type_code || '—'}</p>
            <p className="text-sm text-slate-800 mt-1">{creditNote.reason || 'Sin motivo indicado'}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documento afectado</h2>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {creditNote.affected_document_type_code === '01' ? 'Factura' :
                   creditNote.affected_document_type_code === '03' ? 'Boleta' : 'Documento'}{' '}
                  <span className="font-mono text-slate-700">{creditNote.affected_document_series_number || '—'}</span>
                </p>
              </div>
              {(creditNote as any).affected_invoice?.id && (
                <Link
                  to={`/accounting/invoices/${(creditNote as any).affected_invoice.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 shrink-0"
                >
                  Abrir en contabilidad →
                </Link>
              )}
            </div>

            {(creditNote as any).affected_invoice && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                  <span>
                    Emisión{' '}
                    <span className="font-medium text-slate-800">
                      {formatDate((creditNote as any).affected_invoice.issue_date)}
                    </span>
                  </span>
                  <span>
                    Total doc.{' '}
                    <span className="font-semibold text-slate-900">
                      {formatCurrency((creditNote as any).affected_invoice.total_payable || '0')}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    SUNAT
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        (creditNote as any).affected_invoice.sunat_status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : (creditNote as any).affected_invoice.sunat_status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {(creditNote as any).affected_invoice.sunat_status || '—'}
                    </span>
                  </span>
                </div>

                {((creditNote as any).affected_invoice.pdf_ticket_file_path ||
                  (creditNote as any).affected_invoice.pdf_a4_file_path) && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-slate-500">Vista previa del documento original</span>
                      <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                        {(creditNote as any).affected_invoice.pdf_ticket_file_path && (
                          <button
                            type="button"
                            onClick={() => setAffectedPdfTab('ticket80mm')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                              affectedPdfTab === 'ticket80mm'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            80&nbsp;mm
                          </button>
                        )}
                        {(creditNote as any).affected_invoice.pdf_a4_file_path && (
                          <button
                            type="button"
                            onClick={() => setAffectedPdfTab('a4')}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                              affectedPdfTab === 'a4'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            A4
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                      <iframe
                        src={
                          (affectedPdfTab === 'ticket80mm'
                            ? (creditNote as any).affected_invoice.pdf_ticket_file_path
                            : (creditNote as any).affected_invoice.pdf_a4_file_path) || ''
                        }
                        className="w-full h-80 sm:h-96"
                        title="Documento afectado"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {creditNote.items && creditNote.items.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Líneas de la nota</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P. Unit.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IGV</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {creditNote.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            {item.product?.name || (item as any).item_description || 'Producto sin nombre'}
                          </div>
                          {(item as any).product_internal_code && (
                            <div className="text-xs text-gray-500">
                              Código: {(item as any).product_internal_code}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-center">
                          {item.quantity || '0'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-center">
                          {item.unit_code || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">
                          {formatCurrency(item.discount || '0')}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right">
                          {formatCurrency(item.igv_amount || '0')}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(item.total_line)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {((creditNote as any).seller || (creditNote as any).branch_office) && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Punto de venta</h2>
              <dl className="space-y-2 text-sm">
                {(creditNote as any).seller && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500 shrink-0">Vendedor</dt>
                    <dd className="text-slate-800 text-right">
                      {(creditNote as any).seller.name || (creditNote as any).seller.full_name || '—'}
                      {(creditNote as any).seller.code && (
                        <span className="text-slate-400 font-mono text-xs ml-1">({(creditNote as any).seller.code})</span>
                      )}
                    </dd>
                  </div>
                )}
                {(creditNote as any).branch_office && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500 shrink-0">Sucursal</dt>
                    <dd className="text-slate-800 text-right">{(creditNote as any).branch_office.name || '—'}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Estado SUNAT</h2>
            
            {isLoadingStatus ? (
              <div className="flex items-center justify-center py-4">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">Consultando estado...</span>
              </div>
            ) : (
              <div className={`border rounded-lg p-4 ${getSunatStatusColor(resolvedSunatStatus)}`}>
                <div className="flex items-center mb-3">
                  {getSunatStatusIcon(resolvedSunatStatus)}
                  <div className="ml-3">
                    <p className="font-medium">
                      {resolvedSunatStatus === 'ACCEPTED' ? 'Aceptado' :
                       resolvedSunatStatus === 'REJECTED' ? 'Rechazado' :
                       resolvedSunatStatus === 'SENT' ? 'Enviado' :
                       resolvedSunatStatus === 'PENDING' ? 'Pendiente' : 'Error'}
                    </p>
                    <p className="text-sm opacity-75">
                      {getStatusMessage(resolvedSunatStatus)}
                    </p>
                  </div>
                </div>

                {resolvedSunatResponseDescription && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className="text-xs font-medium">Respuesta SUNAT:</p>
                    <p className="text-xs mt-1">{resolvedSunatResponseDescription}</p>
                  </div>
                )}

                {resolvedSunatTicket && (
                  <div className="mt-2">
                    <p className="text-xs">
                      <span className="font-medium">Ticket:</span> {resolvedSunatTicket}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Cliente</h2>
            <p className="text-sm font-medium text-slate-900">{clientName}</p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {creditNote.client?.doc_type === '1'
                ? 'DNI'
                : creditNote.client?.doc_type === '6'
                  ? 'RUC'
                  : 'Documento'}{' '}
              {clientDoc || '—'}
            </p>
            {(creditNote.client?.phone || creditNote.client?.email) && (
              <p className="text-xs text-slate-600 mt-2 break-words">
                {[creditNote.client?.phone, creditNote.client?.email].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Totales</h2>
            <div className="space-y-2">
              {(parseFloat(String(creditNote.total_taxable ?? '0')) > 0) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gravado:</span>
                  <span className="text-sm font-medium">{formatCurrency(creditNote.total_taxable)}</span>
                </div>
              )}
              {(parseFloat(String(creditNote.total_exonerated ?? '0')) > 0) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Exonerado:</span>
                  <span className="text-sm font-medium">{formatCurrency(creditNote.total_exonerated)}</span>
                </div>
              )}
              {(parseFloat(String(creditNote.total_unaffected ?? '0')) > 0) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inafecto:</span>
                  <span className="text-sm font-medium">{formatCurrency(creditNote.total_unaffected)}</span>
                </div>
              )}
              {(parseFloat(String(creditNote.total_free ?? '0')) > 0) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gratuito:</span>
                  <span className="text-sm font-medium">{formatCurrency(creditNote.total_free)}</span>
                </div>
              )}
              {(parseFloat(String(creditNote.total_discount ?? '0')) > 0) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Descuento:</span>
                  <span className="text-sm font-medium text-red-600">-{formatCurrency(creditNote.total_discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">IGV (18%):</span>
                <span className="text-sm font-medium">{formatCurrency(creditNote.total_igv)}</span>
              </div>
              {(parseFloat(String(creditNote.total_isc ?? '0')) > 0) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ISC:</span>
                  <span className="text-sm font-medium">{formatCurrency(creditNote.total_isc)}</span>
                </div>
              )}
              {(parseFloat(String(creditNote.total_other_taxes ?? '0')) > 0) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Otros Impuestos:</span>
                  <span className="text-sm font-medium">{formatCurrency(creditNote.total_other_taxes)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total a Pagar:</span>
                <span className="font-bold text-xl text-gray-900">{formatCurrency(creditNote.total_payable)}</span>
              </div>
              {creditNote.total_in_words && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 italic">
                    Son: {creditNote.total_in_words}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Archivos Electrónicos con Preview */}
          {(creditNote.signed_xml_file_path ||
            creditNote.cdr_file_path ||
            creditNote.pdf_file_path ||
            creditNote.pdf_a4_file_path ||
            creditNote.pdf_ticket_file_path ||
            creditNote.qr_code_data ||
            (creditNote as any).affected_invoice?.qr_code_data) && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Archivos y QR</h2>
              <p className="text-xs text-slate-500 mb-4">
                Descargas; el PDF de la nota se gestiona en la sección superior.
              </p>

              {/* QR Code de la Factura Afectada */}
              {(creditNote as any).affected_invoice?.qr_code_data && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">QR del Documento Afectado</h3>
                  <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <img 
                        src={`data:image/png;base64,${(creditNote as any).affected_invoice.qr_code_data}`} 
                        alt="Código QR del documento afectado" 
                        className="w-40 h-40 mx-auto border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-2">QR de la factura/boleta afectada</p>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code de la Nota de Crédito */}
              {creditNote.qr_code_data && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">QR de la Nota de Crédito</h3>
                  <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <img 
                        src={`data:image/png;base64,${creditNote.qr_code_data}`} 
                        alt="Código QR de la nota de crédito" 
                        className="w-40 h-40 mx-auto border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-2">QR de la nota de crédito</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de descargas */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Descargar Archivos</h3>
                {creditNote.pdf_a4_file_path && (
                  <a
                    href={creditNote.pdf_a4_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">PDF A4</span>
                  </a>
                )}
                {creditNote.pdf_ticket_file_path && (
                  <a
                    href={creditNote.pdf_ticket_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">PDF Ticket</span>
                  </a>
                )}
                {creditNote.pdf_file_path && (
                  <a
                    href={creditNote.pdf_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">PDF General</span>
                  </a>
                )}
                {creditNote.signed_xml_file_path && (
                  <a
                    href={creditNote.signed_xml_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">XML Firmado</span>
                  </a>
                )}
                {creditNote.cdr_file_path && (
                  <a
                    href={creditNote.cdr_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">CDR (SUNAT)</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
