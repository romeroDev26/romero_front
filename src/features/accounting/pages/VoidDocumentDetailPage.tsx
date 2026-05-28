// src/features/accounting/pages/VoidDocumentDetailPage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { useVoidDocument, useVoidDocumentSunatStatus } from '../hooks/useVoidDocuments';

export const VoidDocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const voidId = id ? parseInt(id, 10) : null;
  const { data: voidDocument, isLoading } = useVoidDocument(voidId);
  const { data: sunatStatus, isLoading: isLoadingStatus } = useVoidDocumentSunatStatus(voidId);

  const getSunatStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />;
      case 'REJECTED':
        return <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case 'PENDING':
      case 'SENT':
        return <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <XCircleIcon className="h-6 w-6 text-dm-text-secondary" />;
    }
  };

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

  const getStatusMessage = (status: string) => {
    const messages = {
      PENDING: 'La comunicación de baja está pendiente de envío a SUNAT',
      SENT: 'La comunicación ha sido enviada a SUNAT y está siendo procesada',
      ACCEPTED: 'La comunicación ha sido aceptada. Los documentos han sido anulados',
      REJECTED: 'La comunicación ha sido rechazada por SUNAT',
      ERROR: 'Ha ocurrido un error en el procesamiento',
    };
    return messages[status as keyof typeof messages] || 'Estado desconocido';
  };

  const getDocumentTypeText = (code: string) => {
    const types = {
      '01': 'Factura',
      '03': 'Boleta',
    };
    return types[code as keyof typeof types] || `Tipo ${code}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-dm-text-secondary">Cargando comunicación de baja...</p>
      </div>
    );
  }

  if (!voidDocument) {
    return (
      <div className="p-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-dm-text-primary mb-2">Comunicación no encontrada</h2>
        <p className="text-dm-text-secondary mb-4">La comunicación de baja solicitada no existe o no tienes permisos para verla.</p>
        <Button onClick={() => navigate('/accounting/voids')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const isAccepted = (sunatStatus?.sunat_status || voidDocument.sunat_status) === 'ACCEPTED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/accounting/voids')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-dm-text-primary">
              Comunicación de Baja {voidDocument.identifier}
            </h1>
            <p className="text-dm-text-secondary">
              Fecha de generación: {formatDate(voidDocument.generation_date)}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {voidDocument.pdf_file_path && (
            <a
              href={voidDocument.pdf_file_path}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Estado de Anulación */}
      {isAccepted && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg p-6">
          <div className="flex">
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mt-1" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800 dark:text-green-300">Documentos Anulados Exitosamente</h3>
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                Los {voidDocument.total_items} documentos incluidos en esta comunicación han sido 
                <strong> oficialmente anulados</strong> por SUNAT y ya no tienen validez tributaria.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Comunicación */}
          <div className="bg-dm-bg-primary rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-dm-text-primary mb-4">Información de la Comunicación</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-dm-text-muted">Identificador</p>
                  <p className="text-lg font-bold text-dm-text-primary">{voidDocument.identifier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-dm-text-muted">Fecha de Generación</p>
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <p className="text-dm-text-primary">{formatDate(voidDocument.generation_date)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-dm-text-muted">Creado</p>
                  <p className="text-dm-text-primary">{formatDateTime(voidDocument.created_at)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-dm-text-muted">Total de Documentos</p>
                  <div className="flex items-center">
                    <DocumentDuplicateIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{voidDocument.total_items}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-dm-text-muted">Ticket SUNAT</p>
                  <p className="text-dm-text-primary font-mono text-sm">
                    {sunatStatus?.sunat_ticket || voidDocument.sunat_ticket || 'No disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-dm-text-muted">Última Actualización</p>
                  <p className="text-dm-text-primary">{formatDateTime(voidDocument.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos Anulados */}
          <div className="bg-dm-bg-primary rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-dm-text-primary mb-4">Documentos a Anular</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dm-border-primary">
                <thead className="bg-dm-bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-dm-text-muted uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-dm-text-muted uppercase">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-dm-text-muted uppercase">Documento</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-dm-text-muted uppercase">Motivo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-dm-text-muted uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-dm-bg-primary divide-y divide-dm-border-primary">
                  {voidDocument.items.map((item, index) => (
                    <tr key={index} className="hover:bg-dm-bg-hover">
                      <td className="px-4 py-3 text-sm text-dm-text-primary">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-dm-text-primary">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                          {getDocumentTypeText(item.document_type_code)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-dm-text-primary">
                        {item.series}-{String(item.number).padStart(8, '0')}
                      </td>
                      <td className="px-4 py-3 text-sm text-dm-text-secondary max-w-xs">
                        <div className="truncate" title={item.reason}>
                          {item.reason}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isAccepted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Anulado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información del Procesamiento */}
          {(sunatStatus?.sunat_response_description || voidDocument.sunat_response_description) && (
            <div className="bg-dm-bg-primary rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-dm-text-primary mb-4">Respuesta de SUNAT</h2>
              <div className="bg-dm-bg-secondary rounded-lg p-4">
                <p className="text-dm-text-primary text-sm">
                  {sunatStatus?.sunat_response_description || voidDocument.sunat_response_description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Estado SUNAT */}
          <div className="bg-dm-bg-primary rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-dm-text-primary mb-4">Estado SUNAT</h2>
            
            {isLoadingStatus ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dm-text-muted"></div>
                <span className="ml-2 text-sm text-dm-text-secondary">Consultando estado...</span>
              </div>
            ) : (
              <div className={`border rounded-lg p-4 ${getSunatStatusColor(sunatStatus?.sunat_status || voidDocument.sunat_status)}`}>
                <div className="flex items-center mb-3">
                  {getSunatStatusIcon(sunatStatus?.sunat_status || voidDocument.sunat_status)}
                  <div className="ml-3">
                    <p className="font-medium">
                      {sunatStatus?.sunat_status === 'ACCEPTED' ? 'Aceptado' :
                       sunatStatus?.sunat_status === 'REJECTED' ? 'Rechazado' :
                       sunatStatus?.sunat_status === 'SENT' ? 'Enviado' :
                       sunatStatus?.sunat_status === 'PENDING' ? 'Pendiente' : 'Error'}
                    </p>
                    <p className="text-sm opacity-75">
                      {getStatusMessage(sunatStatus?.sunat_status || voidDocument.sunat_status)}
                    </p>
                  </div>
                </div>
                
                {sunatStatus?.sunat_ticket && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className="text-xs font-medium">Ticket:</p>
                    <p className="text-xs mt-1 font-mono">{sunatStatus.sunat_ticket}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="bg-dm-bg-primary rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-dm-text-primary mb-4">Resumen</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <div className="flex items-center">
                  <DocumentDuplicateIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">Documentos</span>
                </div>
                <span className="font-bold text-red-900 dark:text-red-200">{voidDocument.total_items}</span>
              </div>

              {/* Distribución por tipo */}
              {Object.entries(
                voidDocument.items.reduce((acc, item) => {
                  const type = getDocumentTypeText(item.document_type_code);
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-dm-bg-secondary rounded">
                  <span className="text-sm text-dm-text-secondary">{type}s</span>
                  <span className="text-sm font-medium text-dm-text-primary">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Archivos Disponibles */}
          {(sunatStatus?.xml_file_path || sunatStatus?.cdr_file_path || voidDocument.pdf_file_path) && (
            <div className="bg-dm-bg-primary rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-dm-text-primary mb-4">Archivos</h2>
              <div className="space-y-2">
                {voidDocument.pdf_file_path && (
                  <a
                    href={voidDocument.pdf_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-dm-bg-hover text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                    <span>Descargar PDF</span>
                  </a>
                )}
                {sunatStatus?.xml_file_path && (
                  <a
                    href={sunatStatus.xml_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-dm-bg-hover text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <span>Descargar XML</span>
                  </a>
                )}
                {sunatStatus?.cdr_file_path && (
                  <a
                    href={sunatStatus.cdr_file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 rounded-lg hover:bg-dm-bg-hover text-sm"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
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
