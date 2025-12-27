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

  const formatCurrency = (amount: number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(isNaN(num) ? 0 : num);
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
      // fallback: Si no hay PDF específico, intentar abrir el genérico
      if (debitNote?.pdf_file_path) window.open(debitNote.pdf_file_path, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando nota de débito...</p>
      </div>
    );
  }

  if (!debitNote) {
    return (
      <div className="p-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nota de Débito no encontrada</h2>
        <p className="text-gray-600 mb-4">La nota de débito solicitada no existe o no tienes permisos para verla.</p>
        <Button onClick={() => navigate('/accounting/debit-notes')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={() => navigate('/accounting/debit-notes')}
              className="mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Nota de Débito {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
              </h1>
              <p className="text-gray-600 mt-1">
                Emitida el {formatDate(debitNote.issue_date)} • Cliente: {debitNote.client?.name || 'N/A'}
              </p>
              <div className="flex items-center mt-2">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSunatStatusColor(sunatStatus?.sunat_status || debitNote.sunat_status)}`}>
                  {getSunatStatusIcon(sunatStatus?.sunat_status || debitNote.sunat_status)}
                  <span className="ml-2">
                    {sunatStatus?.sunat_status === 'ACCEPTED' ? 'Aceptado por SUNAT' :
                     sunatStatus?.sunat_status === 'REJECTED' ? 'Rechazado por SUNAT' :
                     sunatStatus?.sunat_status === 'SENT' ? 'Enviado a SUNAT' :
                     sunatStatus?.sunat_status === 'PENDING' ? 'Pendiente de envío' :
                     debitNote.sunat_status === 'ACCEPTED' ? 'Aceptado por SUNAT' :
                     debitNote.sunat_status === 'REJECTED' ? 'Rechazado por SUNAT' :
                     debitNote.sunat_status === 'SENT' ? 'Enviado a SUNAT' :
                     debitNote.sunat_status === 'PENDING' ? 'Pendiente de envío' : 'Estado desconocido'}
                  </span>
                </div>
                <span className="ml-4 text-sm text-gray-500">
                  Total: {formatCurrency(debitNote.total_payable)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            {debitNote.pdf_a4_file_path && (
              <a
                href={debitNote.pdf_a4_file_path}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  PDF A4
                </Button>
              </a>
            )}
            {debitNote.pdf_ticket_file_path && (
              <a
                href={debitNote.pdf_ticket_file_path}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2 md:mb-0">
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Vista Previa de Nota de Débito</h2>
                </div>
                <div className="text-sm text-gray-500">
                  Cliente: {debitNote.client?.name || 'N/A'}
                </div>
              </div>
            </div>

            {/* Tabs para seleccionar formato */}
            {debitNote.pdf_ticket_file_path && debitNote.pdf_a4_file_path && (
              <div className="px-6 pt-4">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => {
                      setActiveTab('ticket80mm');
                      setShowPdfError(false);
                    }}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'ticket80mm'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Ticket 80mm (Térmico)
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('a4');
                      setShowPdfError(false);
                    }}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'a4'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Formato A4
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contenedor del PDF */}
          <div className="relative bg-gray-100">
            {showPdfError ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mb-4" />
                <p className="text-gray-600 text-center mb-4">
                  No se pudo cargar el PDF. Puedes descargarlo directamente.
                </p>
                <Button onClick={handleDownload} variant="primary">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
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

          {/* Botones de acción */}
          <div className="border-t border-gray-200 px-6 py-4 bg-white">
            <div className="flex flex-wrap gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={showPdfError}
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="primary"
                onClick={handleDownload}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Empresa */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">RUC</p>
                <p className="text-gray-900">{debitNote.company?.ruc || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Razón Social</p>
                <p className="text-gray-900">{debitNote.company?.business_name || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Dirección</p>
                <p className="text-gray-900">{debitNote.company?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-gray-900">{debitNote.company?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{debitNote.company?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Información Técnica del Documento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Serie - Número</p>
                <p className="text-gray-900 font-mono">{debitNote.series}-{String(debitNote.number).padStart(8, '0')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Documento</p>
                <p className="text-gray-900">Nota de Débito (08)</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Moneda</p>
                <p className="text-gray-900">
                  {debitNote.currency_code === 'PEN' ? 'Soles (PEN)' : debitNote.currency_code || 'PEN'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Versión UBL</p>
                <p className="text-gray-900">{debitNote.ubl_version || '2.1'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Emisión</p>
                <p className="text-gray-900">{formatDate(debitNote.issue_date)}</p>
              </div>
              {(debitNote as any).issue_time && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Hora de Emisión</p>
                  <p className="text-gray-900">{(debitNote as any).issue_time}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Creado por</p>
                <p className="text-gray-900 text-xs font-mono">{debitNote.created_by || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
                <p className="text-gray-900 text-xs">
                  {formatDateTime(debitNote.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                <p className="text-gray-900 text-xs">
                  {formatDateTime(debitNote.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Motivo de la Nota de Débito */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Motivo de la Nota de Débito</h2>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm font-medium text-orange-600 mb-1">
                Código: {debitNote.debit_note_type_code} - {DEBIT_NOTE_REASONS_MAP[debitNote.debit_note_type_code] || 'Motivo no especificado'}
              </p>
              <p className="text-gray-900">{debitNote.reason || 'Sin motivo especificado'}</p>
            </div>
          </div>

          {/* Documento Afectado */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documento Afectado</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Documento</p>
                <p className="text-gray-900">
                  {debitNote.affected_document_type_code === '01' ? 'Factura' :
                   debitNote.affected_document_type_code === '03' ? 'Boleta' : 'Otro'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Número de Documento</p>
                <p className="text-gray-900">{debitNote.affected_document_series_number || 'N/A'}</p>
              </div>
            </div>

            {/* Información detallada de la factura/boleta afectada */}
            {(debitNote as any).affected_invoice && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-800 mb-4">Detalles del Documento Afectado</h3>
                
                {/* Preview de PDFs de la factura afectada */}
                {((debitNote as any).affected_invoice.pdf_ticket_file_path || (debitNote as any).affected_invoice.pdf_a4_file_path) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Vista Previa del Documento</h4>
                      <div className="flex gap-2">
                        {(debitNote as any).affected_invoice.pdf_ticket_file_path && (
                          <button
                            onClick={() => setAffectedActiveTab('ticket80mm')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              affectedActiveTab === 'ticket80mm'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Ticket
                          </button>
                        )}
                        {(debitNote as any).affected_invoice.pdf_a4_file_path && (
                          <button
                            onClick={() => setAffectedActiveTab('a4')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              affectedActiveTab === 'a4'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            A4
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <iframe
                        src={(affectedActiveTab === 'ticket80mm' ? (debitNote as any).affected_invoice.pdf_ticket_file_path : (debitNote as any).affected_invoice.pdf_a4_file_path) || ''}
                        className="w-full"
                        style={{ height: '500px' }}
                        title="Vista previa del documento afectado"
                      />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha de Emisión</p>
                    <p className="text-gray-900 text-sm">{formatDate((debitNote as any).affected_invoice.issue_date)}</p>
                  </div>
                  {(debitNote as any).affected_invoice.issue_time && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hora de Emisión</p>
                      <p className="text-gray-900 text-sm">{(debitNote as any).affected_invoice.issue_time}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estado SUNAT</p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (debitNote as any).affected_invoice.sunat_status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      (debitNote as any).affected_invoice.sunat_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(debitNote as any).affected_invoice.sunat_status || 'N/A'}
                    </div>
                  </div>
                  {(debitNote as any).affected_invoice.business_status && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estado de Negocio</p>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        (debitNote as any).affected_invoice.business_status === 'PAID' ? 'bg-green-100 text-green-800' :
                        (debitNote as any).affected_invoice.business_status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        (debitNote as any).affected_invoice.business_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(debitNote as any).affected_invoice.business_status}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Operación</p>
                    <p className="text-gray-900 text-sm">{(debitNote as any).affected_invoice.operation_type_code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Método de Pago</p>
                    <p className="text-gray-900 text-sm">
                      {(debitNote as any).affected_invoice.payment_method_code === 'EFE' ? 'Efectivo' :
                       (debitNote as any).affected_invoice.payment_method_code === 'TRA' ? 'Transferencia' :
                       (debitNote as any).affected_invoice.payment_method_code || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Venta</p>
                    <p className="text-gray-900 text-sm">
                      {(debitNote as any).affected_invoice.is_credit_sale ? 'Crédito' : 'Contado'}
                    </p>
                  </div>
                  {(debitNote as any).affected_invoice.payment_terms_description && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Términos de Pago</p>
                      <p className="text-gray-900 text-sm">{(debitNote as any).affected_invoice.payment_terms_description}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Totales del Documento Afectado</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <p className="text-xs text-gray-600">Gravado: <span className="font-medium">{formatCurrency((debitNote as any).affected_invoice.total_taxable || '0')}</span></p>
                      <p className="text-xs text-gray-600">Exonerado: <span className="font-medium">{formatCurrency((debitNote as any).affected_invoice.total_exonerated || '0')}</span></p>
                      <p className="text-xs text-gray-600">IGV: <span className="font-medium">{formatCurrency((debitNote as any).affected_invoice.total_igv || '0')}</span></p>
                      <p className="text-xs text-gray-600">Total: <span className="font-semibold text-gray-900">{formatCurrency((debitNote as any).affected_invoice.total_payable || '0')}</span></p>
                    </div>
                  </div>
                  {(debitNote as any).affected_invoice.notes && (
                    <div className="md:col-span-3">
                      <p className="text-sm font-medium text-gray-500">Notas</p>
                      <p className="text-gray-900 text-sm">{(debitNote as any).affected_invoice.notes}</p>
                    </div>
                  )}
                  {(debitNote as any).affected_invoice.sunat_response_description && (
                    <div className="md:col-span-3">
                      <p className="text-sm font-medium text-gray-500">Respuesta SUNAT</p>
                      <p className="text-gray-900 text-xs">{(debitNote as any).affected_invoice.sunat_response_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          {debitNote.items && debitNote.items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Cargos</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">P. Unit.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {debitNote.items.map((item: any, index: number) => (
                      <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.product?.name || item.product_name || item.item_description || 'Servicio sin nombre'}
                            </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(item.total_line)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Estado SUNAT */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado SUNAT</h2>
            
            {isLoadingStatus ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                <span className="ml-2 text-sm text-gray-600">Consultando estado...</span>
              </div>
            ) : (
              <div className={`border rounded-lg p-4 ${getSunatStatusColor(sunatStatus?.sunat_status || debitNote.sunat_status)}`}>
                <div className="flex items-center mb-3">
                  {getSunatStatusIcon(sunatStatus?.sunat_status || debitNote.sunat_status)}
                  <div className="ml-3">
                    <p className="font-medium">
                      {sunatStatus?.sunat_status === 'ACCEPTED' ? 'Aceptado' :
                       sunatStatus?.sunat_status === 'REJECTED' ? 'Rechazado' :
                       sunatStatus?.sunat_status === 'SENT' ? 'Enviado' :
                       sunatStatus?.sunat_status === 'PENDING' ? 'Pendiente' : 'Error'}
                    </p>
                    <p className="text-sm opacity-75">
                      {getStatusMessage(sunatStatus?.sunat_status || debitNote.sunat_status)}
                    </p>
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
                    <p className="text-xs">
                      <span className="font-medium">Ticket:</span> {sunatStatus.sunat_ticket}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Totales</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">{formatCurrency(debitNote.total_taxable)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-medium">Total (exonerado):</span>
                <span className="font-bold text-lg text-orange-600">{formatCurrency(debitNote.total_payable)}</span>
              </div>
            </div>
          </div>

          {/* Archivos Disponibles */}
          {(debitNote.pdf_file_path || debitNote.signed_xml_file_path || debitNote.cdr_file_path || sunatStatus?.xml_file_path || sunatStatus?.cdr_file_path) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivos</h2>
              <div className="space-y-2">
                {debitNote.pdf_file_path && (
                  <a
                    href={debitNote.pdf_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-red-600 mr-3" />
                    <span>Descargar PDF</span>
                  </a>
                )}
                {debitNote.signed_xml_file_path && (
                  <a
                    href={debitNote.signed_xml_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <span>XML Firmado</span>
                  </a>
                )}
                {(debitNote.cdr_file_path || sunatStatus?.cdr_file_path) && (
                  <a
                    href={debitNote.cdr_file_path || sunatStatus?.cdr_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-green-600 mr-3" />
                    <span>CDR (SUNAT)</span>
                  </a>
                )}
                {(sunatStatus?.xml_file_path && !debitNote.signed_xml_file_path) && (
                  <a
                    href={sunatStatus.xml_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 mr-3" />
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
