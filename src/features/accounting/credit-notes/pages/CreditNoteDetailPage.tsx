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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
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
            <p className="text-gray-600">
              Emitida el {formatDate(creditNote.issue_date)}
            </p>
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
                  Cliente: {creditNote.client?.name}
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
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre/Razón Social</p>
                <p className="text-gray-900">{creditNote.client?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Documento</p>
                <p className="text-gray-900">{creditNote.client?.doc_number}</p>
              </div>
            </div>
          </div>

          {/* Documento Afectado */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documento Afectado</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Documento</p>
                <p className="text-gray-900">
                  {creditNote.affected_document_type_code === '01' ? 'Factura' : 'Boleta'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Número de Documento</p>
                <p className="text-gray-900">{creditNote.affected_document_series_number}</p>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Motivo de la Nota de Crédito</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Código: {creditNote.credit_note_type_code}
              </p>
              <p className="text-gray-900">{creditNote.reason}</p>
            </div>
          </div>

          {/* Items */}
          {creditNote.items && creditNote.items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Items</h2>
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
                    {creditNote.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.product?.name || 'Producto sin nombre'}
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
                <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">Consultando estado...</span>
              </div>
            ) : (
              <div className={`border rounded-lg p-4 ${getSunatStatusColor(sunatStatus?.sunat_status || creditNote.sunat_status)}`}>
                <div className="flex items-center mb-3">
                  {getSunatStatusIcon(sunatStatus?.sunat_status || creditNote.sunat_status)}
                  <div className="ml-3">
                    <p className="font-medium">
                      {sunatStatus?.sunat_status === 'ACCEPTED' ? 'Aceptado' :
                       sunatStatus?.sunat_status === 'REJECTED' ? 'Rechazado' :
                       sunatStatus?.sunat_status === 'SENT' ? 'Enviado' :
                       sunatStatus?.sunat_status === 'PENDING' ? 'Pendiente' : 'Error'}
                    </p>
                    <p className="text-sm opacity-75">
                      {getStatusMessage(sunatStatus?.sunat_status || creditNote.sunat_status)}
                    </p>
                  </div>
                </div>
                
                {sunatStatus?.sunat_response_description && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className="text-xs font-medium">Respuesta SUNAT:</p>
                    <p className="text-xs mt-1">{sunatStatus.sunat_response_description}</p>
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
                <span className="text-sm font-medium">{formatCurrency(creditNote.total_taxable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">IGV:</span>
                <span className="text-sm font-medium">{formatCurrency(creditNote.total_igv)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-lg">{formatCurrency(creditNote.total_payable)}</span>
              </div>
            </div>
          </div>

          {/* Archivos Disponibles */}
          {(sunatStatus?.xml_file_path || sunatStatus?.cdr_file_path || creditNote.pdf_file_path) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivos</h2>
              <div className="space-y-2">
                {creditNote.pdf_file_path && (
                  <a
                    href={creditNote.pdf_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-red-600 mr-3" />
                    <span>Descargar PDF</span>
                  </a>
                )}
                {sunatStatus?.xml_file_path && (
                  <a
                    href={sunatStatus.xml_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <span>Descargar XML</span>
                  </a>
                )}
                {sunatStatus?.cdr_file_path && (
                  <a
                    href={sunatStatus.cdr_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-green-600 mr-3" />
                    <span>Descargar CDR</span>
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
