// src/features/accounting/credit-notes/pages/CreditNoteDetailPage.tsx

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useCreditNote, useCreditNoteSunatStatus } from '../hooks/useCreditNotes';

export const CreditNoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ticket80mm' | 'a4'>('ticket80mm');
  const [showPdfError, setShowPdfError] = useState(false);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  
  const creditNoteId = id ? parseInt(id, 10) : null;
  const { data: creditNote, isLoading } = useCreditNote(creditNoteId);
  const { data: sunatStatus, isLoading: isLoadingStatus } = useCreditNoteSunatStatus(creditNoteId);

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
        const pdfUrl = activeTab === 'ticket80mm' ? creditNote?.pdf_ticket_file_path : creditNote?.pdf_a4_file_path;
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
    const pdfUrl = activeTab === 'ticket80mm' ? creditNote?.pdf_ticket_file_path : creditNote?.pdf_a4_file_path;
    const fileName = activeTab === 'ticket80mm' 
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
      toast.error(`No hay PDF ${activeTab === 'ticket80mm' ? '80mm' : 'A4'} disponible para descargar`);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={() => navigate('/accounting/credit-notes')}
              className="mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Nota de Crédito {creditNote.series}-{String(creditNote.number).padStart(8, '0')}
              </h1>
                <p className="text-gray-600 mt-1">
                Emitida el {formatDate(creditNote.issue_date)} • Cliente: {creditNote.client?.name || (creditNote as any).client_name || 'N/A'}
              </p>
              <div className="flex items-center mt-2">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSunatStatusColor(resolvedSunatStatus)}`}>
                  {getSunatStatusIcon(resolvedSunatStatus)}
                  <span className="ml-2">
                    {resolvedSunatStatus === 'ACCEPTED' ? 'Aceptado por SUNAT' :
                     resolvedSunatStatus === 'REJECTED' ? 'Rechazado por SUNAT' :
                     resolvedSunatStatus === 'SENT' ? 'Enviado a SUNAT' :
                     resolvedSunatStatus === 'PENDING' ? 'Pendiente de envío' : 'Estado desconocido'}
                  </span>
                </div>
                <span className="ml-4 text-sm text-gray-500">
                  Total: {formatCurrency(creditNote.total_payable)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            {creditNote.pdf_a4_file_path && (
              <a
                href={creditNote.pdf_a4_file_path}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  PDF A4
                </Button>
              </a>
            )}
            {creditNote.pdf_ticket_file_path && (
              <a
                href={creditNote.pdf_ticket_file_path}
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
      {(creditNote.pdf_a4_file_path || creditNote.pdf_ticket_file_path) && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2 md:mb-0">
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Vista Previa de Nota de Crédito</h2>
                </div>
                <div className="text-sm text-gray-500">
                  Cliente: {creditNote.client?.name || (creditNote as any).client_name || 'N/A'}
                </div>
              </div>
            </div>

            {/* Tabs para seleccionar formato */}
            {creditNote.pdf_ticket_file_path && creditNote.pdf_a4_file_path && (
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
                src={(activeTab === 'ticket80mm' ? creditNote.pdf_ticket_file_path : creditNote.pdf_a4_file_path) || ''}
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
        {/* Información Principal (reordenado) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Empresa */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">RUC</p>
                <p className="text-gray-900">{creditNote.company?.ruc || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Razón Social</p>
                <p className="text-gray-900">{creditNote.company?.business_name || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Dirección</p>
                <p className="text-gray-900">{creditNote.company?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-gray-900">{creditNote.company?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{creditNote.company?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Información Técnica del Documento (movida) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Serie - Número</p>
                <p className="text-gray-900 font-mono">{creditNote.series}-{String(creditNote.number).padStart(8, '0')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Documento</p>
                <p className="text-gray-900">Nota de Crédito (07)</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Moneda</p>
                <p className="text-gray-900">
                  {creditNote.currency_code === 'PEN' ? 'Soles (PEN)' : creditNote.currency_code || 'PEN'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Versión UBL</p>
                <p className="text-gray-900">{creditNote.ubl_version || '2.1'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Emisión</p>
                <p className="text-gray-900">{formatDate(creditNote.issue_date)}</p>
              </div>
              {(creditNote as any).issue_time && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Hora de Emisión</p>
                  <p className="text-gray-900">{(creditNote as any).issue_time}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Creado por</p>
                <p className="text-gray-900 text-xs font-mono">{creditNote.created_by || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
                <p className="text-gray-900 text-xs">
                  {formatDateTime(creditNote.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                <p className="text-gray-900 text-xs">
                  {formatDateTime(creditNote.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Motivo de la Nota de Crédito (movido) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Motivo de la Nota de Crédito</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Código: {creditNote.credit_note_type_code || 'N/A'}
              </p>
              <p className="text-gray-900">{creditNote.reason || 'Sin motivo especificado'}</p>
            </div>
          </div>

          {/* Documento Afectado (movido) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documento Afectado</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Documento</p>
                <p className="text-gray-900">
                  {creditNote.affected_document_type_code === '01' ? 'Factura' :
                   creditNote.affected_document_type_code === '03' ? 'Boleta' : 'Otro'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Número de Documento</p>
                <p className="text-gray-900">{creditNote.affected_document_series_number || 'N/A'}</p>
              </div>
            </div>
            
            {/* Información detallada de la factura afectada */}
            {(creditNote as any).affected_invoice && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-800 mb-4">Detalles del Documento Afectado</h3>
                
                {/* Preview de PDFs de la factura afectada */}
                {((creditNote as any).affected_invoice.pdf_ticket_file_path || (creditNote as any).affected_invoice.pdf_a4_file_path) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Vista Previa del Documento</h4>
                      <div className="flex gap-2">
                        {(creditNote as any).affected_invoice.pdf_ticket_file_path && (
                          <button
                            onClick={() => setActiveTab('ticket80mm')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              activeTab === 'ticket80mm'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Ticket
                          </button>
                        )}
                        {(creditNote as any).affected_invoice.pdf_a4_file_path && (
                          <button
                            onClick={() => setActiveTab('a4')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              activeTab === 'a4'
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
                        src={(activeTab === 'ticket80mm' ? (creditNote as any).affected_invoice.pdf_ticket_file_path : (creditNote as any).affected_invoice.pdf_a4_file_path) || ''}
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
                    <p className="text-gray-900 text-sm">{formatDate((creditNote as any).affected_invoice.issue_date)}</p>
                  </div>
                  {(creditNote as any).affected_invoice.issue_time && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hora de Emisión</p>
                      <p className="text-gray-900 text-sm">{(creditNote as any).affected_invoice.issue_time}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estado SUNAT</p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (creditNote as any).affected_invoice.sunat_status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      (creditNote as any).affected_invoice.sunat_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {(creditNote as any).affected_invoice.sunat_status || 'N/A'}
                    </div>
                  </div>
                  {(creditNote as any).affected_invoice.business_status && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estado de Negocio</p>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        (creditNote as any).affected_invoice.business_status === 'PAID' ? 'bg-green-100 text-green-800' :
                        (creditNote as any).affected_invoice.business_status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        (creditNote as any).affected_invoice.business_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(creditNote as any).affected_invoice.business_status}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Operación</p>
                    <p className="text-gray-900 text-sm">{(creditNote as any).affected_invoice.operation_type_code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Método de Pago</p>
                    <p className="text-gray-900 text-sm">
                      {(creditNote as any).affected_invoice.payment_method_code === 'EFE' ? 'Efectivo' :
                       (creditNote as any).affected_invoice.payment_method_code === 'TRA' ? 'Transferencia' :
                       (creditNote as any).affected_invoice.payment_method_code || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Venta</p>
                    <p className="text-gray-900 text-sm">
                      {(creditNote as any).affected_invoice.is_credit_sale ? 'Crédito' : 'Contado'}
                    </p>
                  </div>
                  {(creditNote as any).affected_invoice.payment_terms_description && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Términos de Pago</p>
                      <p className="text-gray-900 text-sm">{(creditNote as any).affected_invoice.payment_terms_description}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Totales del Documento Afectado</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <p className="text-xs text-gray-600">Gravado: <span className="font-medium">{formatCurrency((creditNote as any).affected_invoice.total_taxable || '0')}</span></p>
                      <p className="text-xs text-gray-600">Exonerado: <span className="font-medium">{formatCurrency((creditNote as any).affected_invoice.total_exonerated || '0')}</span></p>
                      <p className="text-xs text-gray-600">IGV: <span className="font-medium">{formatCurrency((creditNote as any).affected_invoice.total_igv || '0')}</span></p>
                      <p className="text-xs text-gray-600">Total: <span className="font-semibold text-gray-900">{formatCurrency((creditNote as any).affected_invoice.total_payable || '0')}</span></p>
                    </div>
                  </div>
                  {(creditNote as any).affected_invoice.notes && (
                    <div className="md:col-span-3">
                      <p className="text-sm font-medium text-gray-500">Notas</p>
                      <p className="text-gray-900 text-sm">{(creditNote as any).affected_invoice.notes}</p>
                    </div>
                  )}
                  {(creditNote as any).affected_invoice.sunat_response_description && (
                    <div className="md:col-span-3">
                      <p className="text-sm font-medium text-gray-500">Respuesta SUNAT</p>
                      <p className="text-gray-900 text-xs">{(creditNote as any).affected_invoice.sunat_response_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Items (movidos) */}
          {creditNote.items && creditNote.items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Items</h2>
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

          {/* Información del Vendedor */}
          {(creditNote as any).seller && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Vendedor</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre del Vendedor</p>
                  <p className="text-gray-900">{(creditNote as any).seller.name || (creditNote as any).seller.full_name || 'N/A'}</p>
                </div>
                {(creditNote as any).seller.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{(creditNote as any).seller.email}</p>
                  </div>
                )}
                {(creditNote as any).seller.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p className="text-gray-900">{(creditNote as any).seller.phone}</p>
                  </div>
                )}
                {(creditNote as any).seller.code && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Código</p>
                    <p className="text-gray-900 font-mono text-sm">{(creditNote as any).seller.code}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información de la Sucursal */}
          {(creditNote as any).branch_office && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Sucursal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre de la Sucursal</p>
                  <p className="text-gray-900">{(creditNote as any).branch_office.name || 'N/A'}</p>
                </div>
                {(creditNote as any).branch_office.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Dirección</p>
                    <p className="text-gray-900">{(creditNote as any).branch_office.address}</p>
                  </div>
                )}
                {(creditNote as any).branch_office.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p className="text-gray-900">{(creditNote as any).branch_office.phone}</p>
                  </div>
                )}
                {(creditNote as any).branch_office.code && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Código</p>
                    <p className="text-gray-900 font-mono text-sm">{(creditNote as any).branch_office.code}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información del Cliente (movida al final) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre/Razón Social</p>
                <p className="text-gray-900">{creditNote.client?.name || (creditNote as any).client_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo Documento</p>
                <p className="text-gray-900">
                  {creditNote.client?.doc_type === '1' ? 'DNI' :
                   creditNote.client?.doc_type === '6' ? 'RUC' : 'Otro'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Número Documento</p>
                <p className="text-gray-900">{creditNote.client?.doc_number || (creditNote as any).client_document || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-gray-900">{creditNote.client?.phone || 'No especificado'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{creditNote.client?.email || 'No especificado'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Estado SUNAT */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado SUNAT</h2>
            
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

          {/* Totales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Totales</h2>
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
          {(creditNote.signed_xml_file_path || creditNote.cdr_file_path || creditNote.pdf_file_path || creditNote.pdf_a4_file_path || creditNote.pdf_ticket_file_path) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivos Electrónicos</h2>
              
              {/* Preview de PDFs con Tabs */}
              {(creditNote.pdf_a4_file_path || creditNote.pdf_ticket_file_path) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Vista Previa</h3>
                    <div className="flex gap-2">
                      {creditNote.pdf_ticket_file_path && (
                        <button
                          onClick={() => setActiveTab('ticket80mm')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTab === 'ticket80mm'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Ticket
                        </button>
                      )}
                      {creditNote.pdf_a4_file_path && (
                        <button
                          onClick={() => setActiveTab('a4')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            activeTab === 'a4'
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
                      src={(activeTab === 'ticket80mm' ? creditNote.pdf_ticket_file_path : creditNote.pdf_a4_file_path) || ''}
                      className="w-full"
                      style={{ height: '400px' }}
                      title="Vista previa del PDF lateral"
                    />
                  </div>
                </div>
              )}

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
  );
};
