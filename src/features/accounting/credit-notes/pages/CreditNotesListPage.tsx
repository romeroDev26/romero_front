// src/features/accounting/credit-notes/pages/CreditNotesListPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { SunatStatusBadge } from '../../components/SunatStatusBadge';
import { useCreditNotes, useRefreshPendingStatuses } from '../hooks/useCreditNotes';
import { CreditNotesListParams } from '../../types';
import { CreditNote } from '../../../../types';

export const CreditNotesListPage: React.FC = () => {
  const [filters, setFilters] = useState<CreditNotesListParams>({
    company_id: 1, // TODO: Obtener de contexto de usuario
    skip: 0,
    limit: 50,
  });

  const { data: creditNotes, isLoading, refetch } = useCreditNotes(filters);
  const { mutate: refreshStatuses, isPending: isRefreshing } = useRefreshPendingStatuses();

  // Polling automático cada 2 minutos para documentos pendientes
  useEffect(() => {
    const interval = setInterval(() => {
      const hasPendingDocs = creditNotes?.some(note => 
        note.sunat_status === 'PENDING' || note.sunat_status === 'SENT'
      );
      if (hasPendingDocs) {
        refetch();
      }
    }, 120000); // 2 minutos

    return () => clearInterval(interval);
  }, [creditNotes, refetch]);

  const handleFilterChange = (field: keyof CreditNotesListParams, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, skip: 0 }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notas de Crédito</h1>
            <p className="text-gray-600">Gestiona las anulaciones y notas de crédito</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => refreshStatuses(10)}
              isLoading={isRefreshing}
              className="flex items-center justify-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Actualizar Estados
            </Button>
            <Link to="/accounting/credit-notes/new" className="w-full sm:w-auto">
              <Button className="w-full justify-center">Nueva Nota de Crédito</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serie
            </label>
            <input
              type="text"
              placeholder="FC01, BC01..."
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => handleFilterChange('series', e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado SUNAT
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => handleFilterChange('sunat_status', e.target.value || undefined)}
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="SENT">Enviado</option>
              <option value="ACCEPTED">Aceptado</option>
              <option value="REJECTED">Rechazado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Emisión
            </label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => handleFilterChange('issue_date', e.target.value || undefined)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => refetch()}
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando notas de crédito...</p>
          </div>
        ) : creditNotes?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No se encontraron notas de crédito</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento Afectado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado SUNAT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditNotes?.map((creditNote: CreditNote) => (
                  <tr key={creditNote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {creditNote.series}-{String(creditNote.number).padStart(8, '0')}
                      </div>
                      <div className="text-sm text-gray-500">NC</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{creditNote.client?.name}</div>
                      <div className="text-sm text-gray-500">{creditNote.client?.doc_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {creditNote.affected_document_series_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {creditNote.affected_document_type_code === '01' ? 'Factura' : 'Boleta'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(creditNote.total_payable)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SunatStatusBadge status={creditNote.sunat_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(creditNote.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/accounting/credit-notes/${creditNote.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        {creditNote.pdf_file_path && (
                          <a
                            href={creditNote.pdf_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
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

      {/* Información adicional */}
      {creditNotes && creditNotes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Información sobre Estados SUNAT
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Pendiente:</strong> Documento creado, esperando envío a SUNAT</li>
                  <li><strong>Enviado:</strong> Documento enviado, esperando respuesta de SUNAT</li>
                  <li><strong>Aceptado:</strong> Documento válido y procesado correctamente</li>
                  <li><strong>Rechazado:</strong> Documento con errores, revisar observaciones</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
