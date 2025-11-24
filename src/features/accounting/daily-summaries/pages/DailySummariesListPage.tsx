// src/features/accounting/daily-summaries/pages/DailySummariesListPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { useDailySummaries, useRefreshPendingSummaries } from '../hooks/useDailySummaries';

export const DailySummariesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    summary_date: '',
    sunat_status: '',
  });

  const companyId = 1; // TODO: Obtener de contexto
  const { data: summaries = [], isLoading } = useDailySummaries(companyId, filters);
  const refreshPending = useRefreshPendingSummaries();

  const getSunatStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'PENDING':
      case 'SENT':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSunatStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
    const statusClasses = {
      PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      SENT: 'bg-blue-50 border-blue-200 text-blue-800',
      ACCEPTED: 'bg-green-50 border-green-200 text-green-800',
      REJECTED: 'bg-red-50 border-red-200 text-red-800',
      ERROR: 'bg-gray-50 border-gray-200 text-gray-800',
    };

    const statusText = {
      PENDING: 'Pendiente',
      SENT: 'Enviado',
      ACCEPTED: 'Aceptado',
      REJECTED: 'Rechazado',
      ERROR: 'Error',
    };

    return (
      <span className={`${baseClasses} ${statusClasses[status as keyof typeof statusClasses] || statusClasses.ERROR}`}>
        {getSunatStatusIcon(status)}
        <span className="ml-1">{statusText[status as keyof typeof statusText] || 'Error'}</span>
      </span>
    );
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
        month: '2-digit',
        day: '2-digit',
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
    
    // Fallback: calcular desde items si existen (para compatibilidad)
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
    
    // Fallback: calcular desde items si existen (para compatibilidad)
    if (summary.items && Array.isArray(summary.items)) {
      return summary.items.length;
    }
    
    return 0;
  };

  const handleRefreshPending = () => {
    refreshPending.mutate(10);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resúmenes Diarios</h1>
            <p className="text-gray-600">Gestión de resúmenes diarios de boletas para SUNAT</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleRefreshPending}
              variant="outline"
              disabled={refreshPending.isPending}
              className="flex items-center justify-center"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshPending.isPending ? 'animate-spin' : ''}`} />
              Actualizar Estados
            </Button>
            <Button onClick={() => navigate('/accounting/summaries/new')} className="flex items-center justify-center w-full">
              <PlusIcon className="h-4 w-4 mr-2" />
              Crear Resumen
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Resumen
            </label>
            <Input
              type="date"
              value={filters.summary_date}
              onChange={(e) => handleFilterChange('summary_date', e.target.value)}
              placeholder="Seleccionar fecha"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado SUNAT
            </label>
            <select
              value={filters.sunat_status}
              onChange={(e) => handleFilterChange('sunat_status', e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="SENT">Enviado</option>
              <option value="ACCEPTED">Aceptado</option>
              <option value="REJECTED">Rechazado</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setFilters({ summary_date: '', sunat_status: '' })}
              className="w-full"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Resúmenes</p>
              <p className="text-2xl font-bold text-gray-900">{summaries.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aceptados</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaries.filter(s => s.sunat_status === 'ACCEPTED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaries.filter(s => ['PENDING', 'SENT'].includes(s.sunat_status)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rechazados</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaries.filter(s => s.sunat_status === 'REJECTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resúmenes Diarios</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando resúmenes...</span>
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay resúmenes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primer resumen diario.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate('/accounting/summaries/new')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Resumen
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identificador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Ventas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documentos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado SUNAT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaries.map((summary) => (
                  <tr key={summary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="font-medium">{formatDate(summary)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 text-blue-500 mr-2" />
                        <button
                          onClick={() => navigate(`/accounting/summaries/${summary.id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {summary.identifier}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-green-600">
                        {formatCurrency(getTotalSalesAmount(summary))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getTotalDocuments(summary)} documentos
                        </span>
                        {summary.total_invoices !== undefined && summary.total_invoices > 0 && (
                          <span className="text-xs text-gray-600">
                            📄 {summary.total_invoices} factura{summary.total_invoices !== 1 ? 's' : ''}
                          </span>
                        )}
                        {summary.total_receipts !== undefined && summary.total_receipts > 0 && (
                          <span className="text-xs text-gray-600">
                            🧾 {summary.total_receipts} boleta{summary.total_receipts !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSunatStatusBadge(summary.sunat_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.created_at ? formatDate({ issue_date: summary.created_at, summary_date: summary.created_at }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/accounting/summaries/${summary.id}`)}
                        >
                          Ver Detalle
                        </Button>
                        {summary.pdf_file_path && (
                          <a
                            href={summary.pdf_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Descargar PDF"
                          >
                            <Button size="sm" variant="outline">
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
