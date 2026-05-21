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

  const getSunatStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: 'Pendiente',
      SENT: 'Enviado',
      ACCEPTED: 'Aceptado',
      REJECTED: 'Rechazado',
    };
    return texts[status] || 'Error';
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

  const formatDateTime = (dateString: string) => {
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
        const pdfUrl = activeTab === 'ticket80mm' ? debitNote?.pdf_ticket_file_path : (activeTab === 'a4' ? debitNote?.pdf_a4_file_path : debitNote?.pdf_file_path);
        const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.onload = () => {
            try {
              printWindow.print();
            } catch (fallbackError) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-6">
        <button
          onClick={() => navigate('/accounting/debit-notes')}
          className="mb-4 rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
              <DocumentArrowDownIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
                Nota de Débito {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
              </h1>
              <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
                Emitida el {formatDate(debitNote.issue_date)} • Cliente: {debitNote.client?.name || 'N/A'}
              </p>
              <div className="flex items-center mt-2 gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-dm-bg-secondary ${
                  currentStatus === 'ACCEPTED' ? 'text-[#10c22b]' :
                  currentStatus === 'REJECTED' ? 'text-[#cf1322]' :
                  currentStatus === 'PENDING' || currentStatus === 'SENT' ? 'text-[#f5a623]' :
                  'text-dm-text-muted'
                }`}>
                  {getSunatStatusIcon(currentStatus)}
                  {getSunatStatusText(currentStatus)}
                </span>
                <span className="text-[14px] text-dm-text-muted">
                  Total: {formatCurrency(debitNote.total_payable)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {debitNote.pdf_a4_file_path && (
              <a href={debitNote.pdf_a4_file_path} target="_blank" rel="noopener noreferrer">
                <button className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary flex items-center">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  PDF A4
                </button>
              </a>
            )}
            {debitNote.pdf_ticket_file_path && (
              <a href={debitNote.pdf_ticket_file_path} target="_blank" rel="noopener noreferrer">
                <button className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary flex items-center">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  PDF Ticket
                </button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Vista previa del PDF */}
      {(debitNote.pdf_a4_file_path || debitNote.pdf_ticket_file_path) && (
        <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden">
          <div className="border-b border-dm-border-primary">
            <div className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <DocumentArrowDownIcon className="h-5 w-5 text-[#1F4690]" />
                <h2 className="text-[18px] font-medium text-dm-text-primary">Vista Previa</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  disabled={showPdfError}
                  className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary flex items-center disabled:opacity-50"
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={handleDownload}
                  className="rounded-full px-5 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Descargar
                </button>
              </div>
            </div>

            {debitNote.pdf_ticket_file_path && debitNote.pdf_a4_file_path && (
              <div className="px-6">
                <div className="flex border-b border-dm-border-primary">
                  <button
                    onClick={() => { setActiveTab('ticket80mm'); setShowPdfError(false); }}
                    className={`px-6 py-3 text-[14px] font-medium transition-colors ${
                      activeTab === 'ticket80mm'
                        ? 'border-b-2 border-[#1F4690] text-[#1F4690]'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    Ticket 80mm
                  </button>
                  <button
                    onClick={() => { setActiveTab('a4'); setShowPdfError(false); }}
                    className={`px-6 py-3 text-[14px] font-medium transition-colors ${
                      activeTab === 'a4'
                        ? 'border-b-2 border-[#1F4690] text-[#1F4690]'
                        : 'text-dm-text-muted hover:text-dm-text-secondary'
                    }`}
                  >
                    Formato A4
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative bg-dm-bg-secondary">
            {showPdfError ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-[#f5a623] mb-4" />
                <p className="text-[14px] text-dm-text-secondary text-center mb-4">
                  No se pudo cargar el PDF. Puedes descargarlo directamente.
                </p>
                <button
                  onClick={handleDownload}
                  className="rounded-full px-5 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Descargar PDF
                </button>
              </div>
            ) : (
              <iframe
                ref={pdfIframeRef}
                src={(activeTab === 'ticket80mm' ? debitNote.pdf_ticket_file_path : debitNote.pdf_a4_file_path) || ''}
                className="w-full"
                style={{ height: '700px' }}
                title="Vista previa del PDF"
                onError={() => setShowPdfError(true)}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda — Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General — consolidada y limpia */}
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
            <h2 className="text-[18px] font-medium text-dm-text-primary mb-4">Información General</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">Serie - Número</p>
                <p className="text-[14px] text-dm-text-primary font-mono">{debitNote.series}-{String(debitNote.number).padStart(8, '0')}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">Fecha de Emisión</p>
                <p className="text-[14px] text-dm-text-primary">{formatDate(debitNote.issue_date)}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">Moneda</p>
                <p className="text-[14px] text-dm-text-primary">{debitNote.currency_code === 'PEN' ? 'Soles (PEN)' : debitNote.currency_code || 'PEN'}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">Documento Afectado</p>
                <p className="text-[14px] text-dm-text-primary">
                  {debitNote.affected_document_type_code === '01' ? 'Factura' :
                   debitNote.affected_document_type_code === '03' ? 'Boleta' : 'Otro'}{' '}
                  {debitNote.affected_document_series_number || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">Cliente</p>
                <p className="text-[14px] text-dm-text-primary">{debitNote.client?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">Doc. Cliente</p>
                <p className="text-[14px] text-dm-text-primary">{debitNote.client?.doc_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
            <h2 className="text-[18px] font-medium text-dm-text-primary mb-3">Motivo</h2>
            <p className="text-[14px] font-medium text-dm-text-primary mb-1">
              {DEBIT_NOTE_REASONS_MAP[debitNote.debit_note_type_code] || 'Motivo no especificado'}
            </p>
            <p className="text-[14px] text-dm-text-secondary">{debitNote.reason || 'Sin motivo especificado'}</p>
          </div>

          {/* Vista previa del Documento Afectado */}
          {(debitNote as any).affected_invoice && (
            ((debitNote as any).affected_invoice.pdf_ticket_file_path || (debitNote as any).affected_invoice.pdf_a4_file_path) && (
              <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden">
                <div className="px-4 lg:px-5 py-4 border-b border-dm-border-primary flex items-center justify-between">
                  <h2 className="text-[18px] font-medium text-dm-text-primary">Comprobante Afectado</h2>
                  <div className="flex gap-2">
                    {(debitNote as any).affected_invoice.pdf_ticket_file_path && (
                      <button
                        onClick={() => setAffectedActiveTab('ticket80mm')}
                        className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
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
                        className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
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
                    className="w-full"
                    style={{ height: '500px' }}
                    title="Vista previa del comprobante afectado"
                  />
                </div>
              </div>
            )
          )}

          {/* Detalle de Cargos */}
          {debitNote.items && debitNote.items.length > 0 && (
            <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden">
              <div className="p-4 lg:p-5">
                <h2 className="text-[18px] font-medium text-dm-text-primary">Detalle de Cargos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#f0f0f0]">
                  <thead className="bg-dm-bg-secondary">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">Descripción</th>
                      <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">Cant.</th>
                      <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">P. Unit.</th>
                      <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {debitNote.items.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-dm-bg-secondary/60 transition-colors">
                        <td className="px-5 py-4 text-[14px] text-dm-text-primary">
                          {item.product?.name || item.product_name || item.item_description || 'Servicio sin nombre'}
                        </td>
                        <td className="px-5 py-4 text-[14px] text-dm-text-primary">{item.quantity}</td>
                        <td className="px-5 py-4 text-[14px] text-dm-text-primary">{formatCurrency(item.unit_price)}</td>
                        <td className="px-5 py-4 text-[14px] font-medium text-dm-text-primary">{formatCurrency(item.total_line)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha — Panel lateral */}
        <div className="space-y-6">
          {/* Estado SUNAT */}
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
            <h2 className="text-[18px] font-medium text-dm-text-primary mb-4">Estado SUNAT</h2>
            {isLoadingStatus ? (
              <div className="flex flex-col items-center justify-center py-4 gap-3">
                <Spinner size="md" />
                <span className="text-[14px] text-dm-text-muted">Consultando estado...</span>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-3">
                  {getSunatStatusIcon(currentStatus)}
                  <div className="ml-3">
                    <p className="text-[14px] font-medium text-dm-text-primary">{getSunatStatusText(currentStatus)}</p>
                    <p className="text-[13px] text-dm-text-secondary">{getStatusMessage(currentStatus)}</p>
                  </div>
                </div>
                {(sunatStatus?.sunat_response_description || debitNote.sunat_response_description) && (
                  <div className="mt-3 pt-3 border-t border-dm-border-secondary">
                    <p className="text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1">Respuesta SUNAT</p>
                    <p className="text-[14px] text-dm-text-primary">{sunatStatus?.sunat_response_description ?? debitNote.sunat_response_description}</p>
                  </div>
                )}
                {sunatStatus?.sunat_ticket && (
                  <div className="mt-2">
                    <p className="text-[14px] text-dm-text-secondary">
                      <span className="font-medium text-dm-text-primary">Ticket:</span> {sunatStatus.sunat_ticket}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
            <h2 className="text-[18px] font-medium text-dm-text-primary mb-4">Totales</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[14px] text-dm-text-secondary">Subtotal:</span>
                <span className="text-[14px] font-medium text-dm-text-primary">{formatCurrency(debitNote.total_taxable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[14px] text-dm-text-secondary">Exonerado:</span>
                <span className="text-[14px] font-medium text-dm-text-primary">{formatCurrency(debitNote.total_exonerated)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-dm-border-secondary">
                <span className="text-[14px] font-medium text-dm-text-primary">Total:</span>
                <span className="text-[24px] font-bold text-[#1F4690]">{formatCurrency(debitNote.total_payable)}</span>
              </div>
              <p className="text-[12px] text-dm-text-muted text-right">Sin IGV (exonerado)</p>
            </div>
          </div>

          {/* Archivos Disponibles */}
          {(debitNote.pdf_file_path || debitNote.signed_xml_file_path || debitNote.cdr_file_path || sunatStatus?.xml_file_path || sunatStatus?.cdr_file_path) && (
            <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
              <h2 className="text-[18px] font-medium text-dm-text-primary mb-4">Archivos</h2>
              <div className="space-y-2">
                {debitNote.pdf_file_path && (
                  <a href={debitNote.pdf_file_path} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-[12px] hover:bg-dm-bg-secondary transition-colors text-[14px] text-dm-text-primary">
                    <DocumentArrowDownIcon className="h-5 w-5 text-[#1F4690] mr-3" />
                    <span>Descargar PDF</span>
                  </a>
                )}
                {debitNote.signed_xml_file_path && (
                  <a href={debitNote.signed_xml_file_path} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-[12px] hover:bg-dm-bg-secondary transition-colors text-[14px] text-dm-text-primary">
                    <DocumentArrowDownIcon className="h-5 w-5 text-[#1F4690] mr-3" />
                    <span>XML Firmado</span>
                  </a>
                )}
                {(debitNote.cdr_file_path || sunatStatus?.cdr_file_path) && (
                  <a href={debitNote.cdr_file_path || sunatStatus?.cdr_file_path} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-[12px] hover:bg-dm-bg-secondary transition-colors text-[14px] text-dm-text-primary">
                    <DocumentArrowDownIcon className="h-5 w-5 text-[#1F4690] mr-3" />
                    <span>CDR (SUNAT)</span>
                  </a>
                )}
                {(sunatStatus?.xml_file_path && !debitNote.signed_xml_file_path) && (
                  <a href={sunatStatus.xml_file_path} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-[12px] hover:bg-dm-bg-secondary transition-colors text-[14px] text-dm-text-primary">
                    <DocumentArrowDownIcon className="h-5 w-5 text-[#1F4690] mr-3" />
                    <span>XML (desde SUNAT)</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
