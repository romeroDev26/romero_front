// src/features/accounting/debit-notes/pages/DebitNotesListPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { SunatStatusBadge } from '../../components/SunatStatusBadge';
import { useDebitNotes, useRefreshDebitNotePendingStatuses } from '../hooks/useDebitNotes';
import { DebitNotesListParams } from '../../types';
import { DebitNote } from '../../../../types';

export const DebitNotesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DebitNotesListParams>({
    company_id: 1, // TODO: Obtener de contexto de usuario
    skip: 0,
    limit: 50,
  });

  const { data: debitNotes, isLoading, refetch } = useDebitNotes(filters);
  const { mutate: refreshStatuses, isPending: isRefreshing } = useRefreshDebitNotePendingStatuses();

  // Polling automático cada 2 minutos para documentos pendientes
  useEffect(() => {
    const interval = setInterval(() => {
      const hasPendingDocs = debitNotes?.some((note: DebitNote) => 
        note.sunat_status === 'PENDING' || note.sunat_status === 'SENT'
      );
      if (hasPendingDocs) {
        refetch();
      }
    }, 120000); // 2 minutos

    return () => clearInterval(interval);
  }, [debitNotes, refetch]);

  const handleFilterChange = (field: keyof DebitNotesListParams, value: any) => {
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
            <h1 className="text-3xl font-bold text-gray-900">Notas de Débito</h1>
            <p className="text-gray-600">Gestiona los cargos adicionales y notas de débito</p>
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
            <Link to="/accounting/debit-notes/new" className="w-full sm:w-auto">
              <Button className="flex items-center justify-center w-full">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Nota de Débito
              </Button>
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
              placeholder="FD01, BD01..."
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
            <p className="mt-2 text-gray-600">Cargando notas de débito...</p>
          </div>
        ) : debitNotes?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No se encontraron notas de débito</p>
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
                    Motivo
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
                {debitNotes?.map((debitNote: DebitNote) => (
                  <tr key={debitNote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
                      </div>
                      <div className="text-sm text-gray-500">ND</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{debitNote.client?.name}</div>
                      <div className="text-sm text-gray-500">{debitNote.client?.doc_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {debitNote.affected_document_series_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {debitNote.affected_document_type_code === '01' ? 'Factura' : 'Boleta'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {debitNote.reason}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tipo: {debitNote.debit_note_type_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(debitNote.total_payable)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SunatStatusBadge status={debitNote.sunat_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(debitNote.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/accounting/debit-notes/${debitNote.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalle"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Botón anular clicked - debitNote:', debitNote);
                            if (debitNote.sunat_status !== 'ACCEPTED') {
                              console.warn('Nota de débito no está ACCEPTED, status:', debitNote.sunat_status);
                              return;
                            }
                            navigate(`/accounting/debit-notes/annul`, { 
                              state: { 
                                debitNote: debitNote
                              } 
                            });
                          }}
                          className={`${
                            debitNote.sunat_status !== 'ACCEPTED'
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          title={
                            debitNote.sunat_status !== 'ACCEPTED'
                              ? 'Solo se pueden anular notas de débito ACEPTADAS'
                              : 'Anular nota de débito (genera nota de crédito)'
                          }
                          disabled={debitNote.sunat_status !== 'ACCEPTED'}
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                        {debitNote.pdf_file_path && (
                          <a
                            href={debitNote.pdf_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                            title="Descargar PDF"
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
      {debitNotes && debitNotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Información sobre Notas de Débito
              </h3>
              <div className="mt-2 text-sm text-amber-700">
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
