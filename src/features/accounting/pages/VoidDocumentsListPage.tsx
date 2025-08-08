// src/features/accounting/pages/VoidDocumentsListPage.tsx

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
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useVoidDocuments, useRefreshPendingVoids } from '../hooks/useVoidDocuments';

export const VoidDocumentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    generation_date: '',
    sunat_status: '',
  });

  const companyId = 1; // TODO: Obtener de contexto
  const { data: voidDocuments = [], isLoading } = useVoidDocuments(companyId, filters);
  const refreshPending = useRefreshPendingVoids();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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

  const getDocumentTypeText = (code: string) => {
    const types = {
      '01': 'Factura',
      '03': 'Boleta',
    };
    return types[code as keyof typeof types] || `Tipo ${code}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunicaciones de Baja</h1>
          <p className="text-gray-600">Gestión de anulaciones de documentos ante SUNAT</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleRefreshPending}
            variant="outline"
            disabled={refreshPending.isPending}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshPending.isPending ? 'animate-spin' : ''}`} />
            Actualizar Estados
          </Button>
          <Button onClick={() => navigate('/accounting/voids/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Anulación
          </Button>
        </div>
      </div>

      {/* Información importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mt-1" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-amber-800">¿Qué son las Comunicaciones de Baja?</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p className="mb-2">
                Las comunicaciones de baja permiten <strong>anular documentos</strong> que ya han sido enviados y aceptados por SUNAT.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Solo se pueden anular facturas (01) y boletas (03) previamente aceptadas</li>
                <li>Cada comunicación puede incluir múltiples documentos para anular</li>
                <li>Una vez aceptada por SUNAT, la anulación es irreversible</li>
                <li>Se debe especificar un motivo claro para cada documento</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Generación
            </label>
            <Input
              type="date"
              value={filters.generation_date}
              onChange={(e) => handleFilterChange('generation_date', e.target.value)}
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
              onClick={() => setFilters({ generation_date: '', sunat_status: '' })}
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
              <p className="text-sm font-medium text-gray-600">Total Comunicaciones</p>
              <p className="text-2xl font-bold text-gray-900">{voidDocuments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aceptadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {voidDocuments.filter(v => v.sunat_status === 'ACCEPTED').length}
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
                {voidDocuments.filter(v => ['PENDING', 'SENT'].includes(v.sunat_status)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DocumentDuplicateIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Docs. Anulados</p>
              <p className="text-2xl font-bold text-gray-900">
                {voidDocuments.reduce((total, v) => total + v.total_items, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Comunicaciones de Baja</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando anulaciones...</span>
          </div>
        ) : voidDocuments.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay comunicaciones de baja</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primera comunicación de baja.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate('/accounting/voids/new')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Anulación
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
                {voidDocuments.map((voidDoc) => (
                  <tr key={voidDoc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="font-medium">{formatDate(voidDoc.generation_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 text-red-500 mr-2" />
                        <button
                          onClick={() => navigate(`/accounting/voids/${voidDoc.id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {voidDoc.identifier}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {voidDoc.total_items} documentos
                        </span>
                        {voidDoc.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            {getDocumentTypeText(item.document_type_code)} {item.series}-{String(item.number).padStart(8, '0')}
                          </div>
                        ))}
                        {voidDoc.total_items > 2 && (
                          <div className="text-xs text-gray-500">
                            +{voidDoc.total_items - 2} más...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSunatStatusBadge(voidDoc.sunat_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(voidDoc.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/accounting/voids/${voidDoc.id}`)}
                        >
                          Ver Detalle
                        </Button>
                        {voidDoc.pdf_file_path && (
                          <a
                            href={voidDoc.pdf_file_path}
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
