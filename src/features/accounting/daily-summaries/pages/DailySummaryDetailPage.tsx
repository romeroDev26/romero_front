// src/features/accounting/daily-summaries/pages/DailySummaryDetailPage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { useDailySummary, useDailySummarySunatStatus } from '../hooks/useDailySummaries';

export const DailySummaryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const summaryId = id ? parseInt(id, 10) : null;
  const { data: summary, isLoading } = useDailySummary(summaryId);
  const { data: sunatStatus, isLoading: isLoadingStatus } = useDailySummarySunatStatus(summaryId);

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
      PENDING: 'El resumen está pendiente de envío a SUNAT',
      SENT: 'El resumen ha sido enviado a SUNAT y está siendo procesado',
      ACCEPTED: 'El resumen ha sido aceptado por SUNAT',
      REJECTED: 'El resumen ha sido rechazado por SUNAT',
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

  const formatDate = (summary: any) => {
    const dateString = summary.issue_date || summary.summary_date;
    if (!dateString) return 'Fecha inválida';
    
    try {
      return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Fecha inválida';
    
    try {
      return new Date(dateString).toLocaleString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getTotalSalesAmount = (summary: any) => {
    // Priorizar el campo directo si existe
    if (summary.total_sales_amount !== undefined && summary.total_sales_amount !== null) {
      return summary.total_sales_amount;
    }
    
    // Fallback: calcular desde items si existen (para detalle)
    if (summary.items && Array.isArray(summary.items) && summary.items.length > 0) {
      return summary.items.reduce((total: number, item: any) => {
        // Usar total_payable según la estructura real del backend
        const amount = item.total_payable || item.total_amount || item.amount || 0;
        return total + (parseFloat(amount) || 0);
      }, 0);
    }
    
    return 0;
  };

  const getTotalDocuments = (summary: any) => {
    // Priorizar el campo directo si existe
    if (summary.total_documents !== undefined && summary.total_documents !== null) {
      return summary.total_documents;
    }
    
    // Fallback: calcular desde items si existen (para detalle)
    if (summary.items && Array.isArray(summary.items)) {
      return summary.items.length;
    }
    
    return 0;
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando resumen diario...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Resumen no encontrado</h2>
        <p className="text-gray-600 mb-4">El resumen diario solicitado no existe o no tienes permisos para verlo.</p>
        <Button onClick={() => navigate('/accounting/summaries')}>
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
            onClick={() => navigate('/accounting/summaries')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Resumen Diario {summary.identifier}
            </h1>
            <p className="text-gray-600">
              Fecha de resumen: {formatDate(summary)}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {summary.pdf_file_path && (
            <a
              href={summary.pdf_file_path}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Resumen */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Resumen</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Identificador</p>
                  <p className="text-lg font-bold text-gray-900">{summary.identifier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Resumen</p>
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-gray-900">{formatDate(summary)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Creado</p>
                  <p className="text-gray-900">{formatDateTime(summary.created_at)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Documentos</p>
                  <div className="flex items-center">
                    <DocumentDuplicateIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-lg font-bold text-blue-600">{getTotalDocuments(summary)} boletas</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Monto Total de Ventas</p>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(getTotalSalesAmount(summary))}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                  <p className="text-gray-900">{summary.updated_at ? formatDateTime(summary.updated_at) : 'No disponible'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Documentos Incluidos */}
          {summary.items && summary.items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Documentos Incluidos ({summary.items.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serie-Número
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.items.map((item: any, index: number) => (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.document_type_code === '01' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.document_type_code === '01' ? 'Factura' : 'Boleta'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.series_number}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-gray-900">{item.client_doc_number} - {item.client_name}</div>
                            <div className="text-gray-500">Tipo: {item.client_doc_type_text || item.client_doc_type}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(parseFloat(item.total_payable || '0'))}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === '1' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status === '1' ? 'Activo' : 'Inactivo'}
                          </span>
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
              <div className={`border rounded-lg p-4 ${getSunatStatusColor(sunatStatus?.sunat_status || summary.sunat_status)}`}>
                <div className="flex items-center mb-3">
                  {getSunatStatusIcon(sunatStatus?.sunat_status || summary.sunat_status)}
                  <div className="ml-3">
                    <p className="font-medium">
                      {sunatStatus?.sunat_status === 'ACCEPTED' ? 'Aceptado' :
                       sunatStatus?.sunat_status === 'REJECTED' ? 'Rechazado' :
                       sunatStatus?.sunat_status === 'SENT' ? 'Enviado' :
                       sunatStatus?.sunat_status === 'PENDING' ? 'Pendiente' : 'Error'}
                    </p>
                    <p className="text-sm opacity-75">
                      {getStatusMessage(sunatStatus?.sunat_status || summary.sunat_status)}
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

          {/* Resumen de Totales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Documentos Procesados</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-900 block">{getTotalDocuments(summary)} total</span>
                  {summary.total_invoices !== undefined && summary.total_invoices > 0 && (
                    <span className="text-xs text-blue-700">📄 {summary.total_invoices} factura{summary.total_invoices !== 1 ? 's' : ''}</span>
                  )}
                  {summary.total_receipts !== undefined && summary.total_receipts > 0 && (
                    <span className="text-xs text-blue-700 ml-2">🧾 {summary.total_receipts} boleta{summary.total_receipts !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">Ventas Totales</span>
                </div>
                <span className="font-bold text-green-900">{formatCurrency(getTotalSalesAmount(summary))}</span>
              </div>
            </div>
          </div>

          {/* Archivos Disponibles */}
          {(sunatStatus?.xml_file_path || sunatStatus?.cdr_file_path || summary.pdf_file_path) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivos</h2>
              <div className="space-y-2">
                {summary.pdf_file_path && (
                  <a
                    href={summary.pdf_file_path}
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
