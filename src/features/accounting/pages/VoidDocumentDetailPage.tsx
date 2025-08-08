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
        <p className="mt-4 text-gray-600">Cargando comunicación de baja...</p>
      </div>
    );
  }

  if (!voidDocument) {
    return (
      <div className="p-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Comunicación no encontrada</h2>
        <p className="text-gray-600 mb-4">La comunicación de baja solicitada no existe o no tienes permisos para verla.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">
              Comunicación de Baja {voidDocument.identifier}
            </h1>
            <p className="text-gray-600">
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mt-1" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">✅ Documentos Anulados Exitosamente</h3>
              <p className="mt-2 text-sm text-green-700">
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Comunicación</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Identificador</p>
                  <p className="text-lg font-bold text-gray-900">{voidDocument.identifier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Generación</p>
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-gray-900">{formatDate(voidDocument.generation_date)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Creado</p>
                  <p className="text-gray-900">{formatDateTime(voidDocument.created_at)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Documentos</p>
                  <div className="flex items-center">
                    <DocumentDuplicateIcon className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-lg font-bold text-red-600">{voidDocument.total_items}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ticket SUNAT</p>
                  <p className="text-gray-900 font-mono text-sm">
                    {sunatStatus?.sunat_ticket || voidDocument.sunat_ticket || 'No disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                  <p className="text-gray-900">{formatDateTime(voidDocument.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos Anulados */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos a Anular</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {voidDocument.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getDocumentTypeText(item.document_type_code)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.series}-{String(item.number).padStart(8, '0')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={item.reason}>
                          {item.reason}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isAccepted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Anulado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Respuesta de SUNAT</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 text-sm">
                  {sunatStatus?.sunat_response_description || voidDocument.sunat_response_description}
                </p>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <DocumentDuplicateIcon className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">Documentos</span>
                </div>
                <span className="font-bold text-red-900">{voidDocument.total_items}</span>
              </div>

              {/* Distribución por tipo */}
              {Object.entries(
                voidDocument.items.reduce((acc, item) => {
                  const type = getDocumentTypeText(item.document_type_code);
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{type}s</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Archivos Disponibles */}
          {(sunatStatus?.xml_file_path || sunatStatus?.cdr_file_path || voidDocument.pdf_file_path) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivos</h2>
              <div className="space-y-2">
                {voidDocument.pdf_file_path && (
                  <a
                    href={voidDocument.pdf_file_path}
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
