// src/features/accounting/debit-notes/pages/DebitNoteDetailPage.tsx

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { useDebitNote, useDebitNoteSunatStatus } from '../hooks/useDebitNotes';

// Mapeo de códigos de motivo
const DEBIT_NOTE_REASONS_MAP: Record<string, string> = {
  '01': 'Intereses por mora',
  '02': 'Aumento en el valor',
  '03': 'Penalidades/otros conceptos',
  '10': 'Ajustes de operaciones de exportación',
  '11': 'Ajustes afectos al IVAP',
};

export const DebitNoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ticket80mm' | 'a4'>('ticket80mm');
  const [showPdfError, setShowPdfError] = useState(false);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  const [affectedActiveTab, setAffectedActiveTab] = useState<'ticket80mm' | 'a4'>('ticket80mm');

  const debitNoteId = id ? parseInt(id, 10) : null;
  const { data: debitNote, isLoading } = useDebitNote(debitNoteId);
  const { data: sunatStatus, isLoading: isLoadingStatus } = useDebitNoteSunatStatus(debitNoteId);

  const getSunatStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-6 w-6 text-[#10c22b]" />;
      case 'REJECTED':
        return <XCircleIcon className="h-6 w-6 text-[#cf1322]" />;
      case 'PENDING':
      case 'SENT':
        return <ClockIcon className="h-6 w-6 text-[#f5a623]" />;
      default:
        return <XCircleIcon className="h-6 w-6 text-dm-text-muted" />;
    }
  };

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      PENDING: 'El documento está pendiente de envío a SUNAT',
      SENT: 'El documento ha sido enviado a SUNAT y está siendo procesado',
      ACCEPTED: 'El documento ha sido aceptado por SUNAT',
      REJECTED: 'El documento ha sido rechazado por SUNAT',
      ERROR: 'Ha ocurrido un error en el procesamiento',
    };
    return messages[status] || 'Estado desconocido';
  };

  const formatCurrency = (amount: number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(isNaN(num) ? 0 : num);
  };

  const formatDate = (dateString: string) => {
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

  const handlePrint = () => {
    if (pdfIframeRef.current) {
      try {
        const iframeWindow = pdfIframeRef.current.contentWindow;
        if (iframeWindow) {
          iframeWindow.print();
        } else {
          throw new Error('No se puede acceder al contenido del iframe');
        }
      } catch {
        const pdfUrl = activeTab === 'ticket80mm' ? debitNote?.pdf_ticket_file_path : (activeTab === 'a4' ? debitNote?.pdf_a4_file_path : debitNote?.pdf_file_path);
        const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.onload = () => {
            try {
              printWindow.print();
            } catch {
              // noop
            }
          };
        }
      }
    }
  };

  const handleDownload = () => {
    const pdfUrl = activeTab === 'ticket80mm' ? debitNote?.pdf_ticket_file_path : debitNote?.pdf_a4_file_path;
    const fileName = activeTab === 'ticket80mm'
      ? `nd-ticket-${debitNote?.series}-${String(debitNote?.number).padStart(8, '0')}.pdf`
      : `nd-a4-${debitNote?.series}-${String(debitNote?.number).padStart(8, '0')}.pdf`;

    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (debitNote?.pdf_file_path) window.open(debitNote.pdf_file_path, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Spinner size="md" />
        <p className="text-[14px] text-dm-text-muted">Cargando nota de débito...</p>
      </div>
    );
  }

  if (!debitNote) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <XCircleIcon className="h-12 w-12 text-[#cf1322]" />
        <h2 className="text-[18px] font-medium text-dm-text-primary">Nota de Débito no encontrada</h2>
        <p className="text-[14px] text-dm-text-secondary">La nota de débito solicitada no existe o no tienes permisos para verla.</p>
        <button
          onClick={() => navigate('/accounting/debit-notes')}
          className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const currentStatus = sunatStatus?.sunat_status || debitNote.sunat_status;

  const getSunatStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
      SENT: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300',
      ACCEPTED: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300',
      REJECTED: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
      ERROR: 'bg-dm-bg-secondary border-dm-border-primary text-dm-text-primary',
    };
    return colors[status as keyof typeof colors] || colors.ERROR;
  };

  return (
    <div className="min-h-screen bg-dm-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Cabecera */}
        <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/accounting/debit-notes')}
                className="shrink-0"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-dm-text-muted">Nota de débito electrónica</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-dm-text-primary tracking-tight">
                  {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
                </h1>
                <p className="text-sm text-dm-text-secondary mt-1 truncate" title={debitNote.client?.name || ''}>
                  {formatDate(debitNote.issue_date)} · {debitNote.client?.name || 'N/A'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getSunatStatusColor(currentStatus)}`}>
                    {getSunatStatusIcon(currentStatus)}
                    <span className="ml-1.5">
                      {currentStatus === 'ACCEPTED' ? 'Aceptada SUNAT' :
                       currentStatus === 'REJECTED' ? 'Rechazada' :
                       currentStatus === 'SENT' ? 'Enviada' :
                       currentStatus === 'PENDING' ? 'Pendiente' : 'Sin estado'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-dm-text-primary">
                    Total {formatCurrency(debitNote.total_payable)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {debitNote.pdf_a4_file_path && (
                <a href={debitNote.pdf_a4_file_path} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    PDF A4
                  </Button>
                </a>
              )}
              {debitNote.pdf_ticket_file_path && (
                <a href={debitNote.pdf_ticket_file_path} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    PDF Ticket
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Vista previa del PDF */}
        {(debitNote.pdf_a4_file_path || debitNote.pdf_ticket_file_path) && (
          <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm overflow-hidden">
            <div className="border-b border-dm-border-secondary px-5 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-dm-text-primary">Comprobante PDF</h2>
                  <p className="text-sm text-dm-text-muted mt-0.5">
                    Elige el formato para imprimir o descargar.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint} disabled={showPdfError} className="flex items-center">
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleDownload} className="flex items-center">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
              {debitNote.pdf_ticket_file_path && debitNote.pdf_a4_file_path && (
                <div className="mt-4 flex border-b border-dm-border-primary overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('ticket80mm'); setShowPdfError(false); }}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'ticket80mm'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 -mb-px'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    Ticket 80&nbsp;mm
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('a4'); setShowPdfError(false); }}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === 'a4'
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 -mb-px'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    Formato A4
                  </button>
                </div>
              )}
            </div>

            <div className="relative bg-dm-bg-secondary">
              {showPdfError ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <ExclamationTriangleIcon className="h-12 w-12 text-amber-500 dark:text-amber-400 mb-4" />
                  <p className="text-dm-text-secondary text-center text-sm mb-4">
                    No se pudo mostrar el PDF en el navegador. Descárgalo o intenta nuevamente.
                  </p>
                  <Button variant="primary" onClick={handleDownload}>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
              ) : (
                <iframe
                  ref={pdfIframeRef}
                  src={(activeTab === 'ticket80mm' ? debitNote.pdf_ticket_file_path : debitNote.pdf_a4_file_path) || ''}
                  className="w-full min-h-[350px] sm:min-h-[520px] h-[50vh] sm:h-[62vh] max-h-[760px]"
                  title="Vista previa del PDF de la nota de débito"
                  onError={() => setShowPdfError(true)}
                />
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Información General */}
            <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-dm-text-muted mb-3">Información General</h2>
              <div className="mt-4 pt-4 border-t border-dm-border-secondary grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-dm-text-muted block mb-0.5">Serie-número</span>
                  <span className="font-mono text-dm-text-primary">{debitNote.series}-{String(debitNote.number).padStart(8, '0')}</span>
                </div>
                <div>
                  <span className="text-dm-text-muted block mb-0.5">Tipo</span>
                  <span className="text-dm-text-primary">ND (08)</span>
                </div>
                <div>
                  <span className="text-dm-text-muted block mb-0.5">Emisión</span>
                  <span className="text-dm-text-primary">{formatDate(debitNote.issue_date)}</span>
                </div>
                <div>
                  <span className="text-dm-text-muted block mb-0.5">Moneda</span>
                  <span className="text-dm-text-primary">{debitNote.currency_code || 'PEN'}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-dm-border-secondary grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-dm-text-muted block mb-0.5">Documento Afectado</span>
                  <span className="text-dm-text-primary">
                    {debitNote.affected_document_type_code === '01' ? 'Factura' :
                     debitNote.affected_document_type_code === '03' ? 'Boleta' : 'Otro'}{' '}
                    {debitNote.affected_document_series_number || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-dm-text-muted block mb-0.5">Cliente</span>
                  <span className="text-dm-text-primary">{debitNote.client?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-dm-text-muted block mb-0.5">Doc. Cliente</span>
                  <span className="text-dm-text-primary">{debitNote.client?.doc_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-dm-text-muted mb-2">Motivo</h2>
              <p className="text-xs text-dm-text-muted">Código {debitNote.debit_note_type_code || '—'}</p>
              <p className="text-sm text-dm-text-primary mt-1 font-medium">
                {DEBIT_NOTE_REASONS_MAP[debitNote.debit_note_type_code] || 'Motivo no especificado'}
              </p>
              {debitNote.reason && (
                <p className="text-sm text-dm-text-secondary mt-1">{debitNote.reason}</p>
              )}
            </div>

            {/* Documento Afectado */}
            {(debitNote as any).affected_invoice && (
              ((debitNote as any).affected_invoice.pdf_ticket_file_path || (debitNote as any).affected_invoice.pdf_a4_file_path) && (
                <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-5 py-4 border-b border-dm-border-primary flex items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-dm-text-muted">Documento afectado</h2>
                    <div className="flex gap-2 overflow-x-auto">
                      {(debitNote as any).affected_invoice.pdf_ticket_file_path && (
                        <button
                          onClick={() => setAffectedActiveTab('ticket80mm')}
                          className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                            affectedActiveTab === 'ticket80mm'
                              ? 'bg-[#1F4690] text-white'
                              : 'bg-dm-bg-secondary text-dm-text-primary hover:bg-dm-bg-hover'
                          }`}
                        >
                          Ticket
                        </button>
                      )}
                      {(debitNote as any).affected_invoice.pdf_a4_file_path && (
                        <button
                          onClick={() => setAffectedActiveTab('a4')}
                          className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                            affectedActiveTab === 'a4'
                              ? 'bg-[#1F4690] text-white'
                              : 'bg-dm-bg-secondary text-dm-text-primary hover:bg-dm-bg-hover'
                          }`}
                        >
                          A4
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-dm-bg-secondary">
                    <iframe
                      src={(affectedActiveTab === 'ticket80mm' ? (debitNote as any).affected_invoice.pdf_ticket_file_path : (debitNote as any).affected_invoice.pdf_a4_file_path) || ''}
                      className="w-full min-h-[300px] sm:min-h-[400px] h-[40vh] sm:h-[50vh] max-h-[600px]"
                      title="Documento afectado"
                    />
                  </div>
                </div>
              )
            )}

            {/* Detalle de Cargos */}
            {debitNote.items && debitNote.items.length > 0 && (
              <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm overflow-hidden">
                <div className="p-5">
                  <h2 className="text-sm font-semibold text-dm-text-primary mb-3">Líneas de la nota</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-dm-border-primary">
                    <thead className="bg-dm-bg-secondary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">Cant.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">P. Unit.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dm-text-muted uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-dm-bg-primary divide-y divide-dm-border-primary">
                      {debitNote.items.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-dm-bg-hover">
                          <td className="px-4 py-4">
                            <div className="text-sm text-dm-text-primary">
                              {item.product?.name || item.product_name || item.item_description || 'Servicio sin nombre'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-dm-text-primary text-center">{item.quantity}</td>
                          <td className="px-4 py-4 text-sm text-dm-text-primary text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-4 text-sm font-medium text-dm-text-primary text-right">{formatCurrency(item.total_line)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {/* Estado SUNAT */}
            <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-dm-text-muted mb-3">Estado SUNAT</h2>
              {isLoadingStatus ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="md" />
                  <span className="ml-2 text-sm text-dm-text-secondary">Consultando estado...</span>
                </div>
              ) : (
                <div className={`border rounded-lg p-4 ${getSunatStatusColor(currentStatus)}`}>
                  <div className="flex items-center mb-3">
                    {getSunatStatusIcon(currentStatus)}
                    <div className="ml-3">
                      <p className="font-medium">
                        {currentStatus === 'ACCEPTED' ? 'Aceptado' :
                         currentStatus === 'REJECTED' ? 'Rechazado' :
                         currentStatus === 'SENT' ? 'Enviado' :
                         currentStatus === 'PENDING' ? 'Pendiente' : 'Error'}
                      </p>
                      <p className="text-sm opacity-75">{getStatusMessage(currentStatus)}</p>
                    </div>
                  </div>
                  {(sunatStatus?.sunat_response_description || debitNote.sunat_response_description) && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <p className="text-xs font-medium">Respuesta SUNAT:</p>
                      <p className="text-xs mt-1">{sunatStatus?.sunat_response_description ?? debitNote.sunat_response_description}</p>
                    </div>
                  )}
                  {sunatStatus?.sunat_ticket && (
                    <div className="mt-2">
                      <p className="text-xs"><span className="font-medium">Ticket:</span> {sunatStatus.sunat_ticket}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cliente */}
            <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-dm-text-muted mb-3">Cliente</h2>
              <p className="text-sm font-medium text-dm-text-primary">{debitNote.client?.name || 'N/A'}</p>
              <p className="text-xs text-dm-text-muted mt-1 tabular-nums">
                {debitNote.client?.doc_type === '1' ? 'DNI' : debitNote.client?.doc_type === '6' ? 'RUC' : 'Documento'}{' '}
                {debitNote.client?.doc_number || '—'}
              </p>
              {(debitNote.client?.phone || debitNote.client?.email) && (
                <p className="text-xs text-dm-text-secondary mt-2 break-words">
                  {[debitNote.client?.phone, debitNote.client?.email].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Totales */}
            <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-dm-text-muted mb-3">Totales</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-dm-text-secondary">Subtotal:</span>
                  <span className="text-sm font-medium">{formatCurrency(debitNote.total_taxable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-dm-text-secondary">Exonerado:</span>
                  <span className="text-sm font-medium">{formatCurrency(debitNote.total_exonerated)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-dm-border-primary">
                  <span className="font-semibold text-dm-text-primary">Total:</span>
                  <span className="font-bold text-xl text-dm-text-primary">{formatCurrency(debitNote.total_payable)}</span>
                </div>
                <p className="text-xs text-dm-text-muted text-right">Sin IGV (exonerado)</p>
              </div>
            </div>

            {/* Archivos */}
            {(debitNote.pdf_file_path || debitNote.signed_xml_file_path || debitNote.cdr_file_path || sunatStatus?.xml_file_path || sunatStatus?.cdr_file_path) && (
              <div className="bg-dm-bg-primary rounded-xl border border-dm-border-primary/80 shadow-sm p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-dm-text-muted mb-2">Archivos</h2>
                <p className="text-xs text-dm-text-muted mb-4">
                  Descargas disponibles.
                </p>
                <div className="space-y-2">
                  {debitNote.pdf_file_path && (
                    <a href={debitNote.pdf_file_path} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-dm-bg-hover border border-dm-border-primary transition-colors">
                      <DocumentArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                      <span className="text-sm font-medium text-dm-text-primary">PDF General</span>
                    </a>
                  )}
                  {debitNote.signed_xml_file_path && (
                    <a href={debitNote.signed_xml_file_path} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-dm-bg-hover border border-dm-border-primary transition-colors">
                      <DocumentArrowDownIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-dm-text-primary">XML Firmado</span>
                    </a>
                  )}
                  {(debitNote.cdr_file_path || sunatStatus?.cdr_file_path) && (
                    <a href={debitNote.cdr_file_path || sunatStatus?.cdr_file_path} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-dm-bg-hover border border-dm-border-primary transition-colors">
                      <DocumentArrowDownIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-sm font-medium text-dm-text-primary">CDR (SUNAT)</span>
                    </a>
                  )}
                  {(sunatStatus?.xml_file_path && !debitNote.signed_xml_file_path) && (
                    <a href={sunatStatus.xml_file_path} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg hover:bg-dm-bg-hover border border-dm-border-primary transition-colors">
                      <DocumentArrowDownIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-dm-text-primary">XML (desde SUNAT)</span>
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
