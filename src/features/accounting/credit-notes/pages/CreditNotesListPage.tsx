// src/features/accounting/credit-notes/pages/CreditNotesListPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { SunatStatusBadge } from '../../components/SunatStatusBadge';
import { useCreditNotes, useRefreshPendingStatuses } from '../hooks/useCreditNotes';
import { CreditNotesListParams } from '../../types';
import { CreditNote } from '../../../../types';
import { useDebounce } from '../../../../hooks/useDebounce';

export const CreditNotesListPage: React.FC = () => {
  const [series, setSeries] = useState('');
  const [sunatStatus, setSunatStatus] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const debouncedSeries = useDebounce(series, 300);

  const [filters, setFilters] = useState<CreditNotesListParams>({
    company_id: 1, // TODO: Obtener de contexto de usuario
    skip: 0,
    limit: itemsPerPage,
  });

  const { data: creditNotes, isLoading, refetch } = useCreditNotes(filters);
  const { mutate: refreshStatuses, isPending: isRefreshing } = useRefreshPendingStatuses();

  // Actualizar filtros cuando cambian los campos o la paginación
  useEffect(() => {
    const newFilters: CreditNotesListParams = {
      company_id: 1,
      skip: currentPage * itemsPerPage,
      limit: itemsPerPage,
    };

    if (debouncedSeries) newFilters.series = debouncedSeries;
    if (sunatStatus) newFilters.sunat_status = sunatStatus as any;
    if (issueDate) newFilters.issue_date = issueDate;

    setFilters(newFilters);
  }, [currentPage, debouncedSeries, sunatStatus, issueDate, itemsPerPage]);

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

  // Manejadores de cambios en filtros (resetean la paginación)
  const handleSeriesChange = (value: string) => {
    setSeries(value);
    setCurrentPage(0);
  };

  const handleSunatStatusChange = (value: string) => {
    setSunatStatus(value);
    setCurrentPage(0);
  };

  const handleIssueDateChange = (value: string) => {
    setIssueDate(value);
    setCurrentPage(0);
  };

  // Función para navegar entre páginas
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Componente de paginación
  const PaginationControls = () => {
    const hasNextPage = creditNotes && creditNotes.length === itemsPerPage;
    const hasPrevPage = currentPage > 0;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Página {currentPage + 1} • Mostrando {creditNotes?.length || 0} registros
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevPage}
            className="flex items-center"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="flex items-center"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    // Si la fecha viene en formato YYYY-MM-DD (sin zona), crear Date en local
    const dateOnlyMatch = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    try {
      if (dateOnlyMatch) {
        const [, y, m, d] = dateOnlyMatch;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return date.toLocaleDateString('es-PE');
      }
      // Para ISO con zona, usar el constructor normal
      return new Date(dateString).toLocaleDateString('es-PE');
    } catch {
      return String(dateString);
    }
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
              value={series}
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => handleSeriesChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado SUNAT
            </label>
            <select
              value={sunatStatus}
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => handleSunatStatusChange(e.target.value)}
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
              value={issueDate}
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => handleIssueDateChange(e.target.value)}
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
                    Fecha de Emisión
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
                      <div className="text-sm text-gray-900">{creditNote.client?.name || (creditNote as any).client_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{creditNote.client?.doc_number || (creditNote as any).client_document || ''}</div>
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
                      {creditNote.issue_date ? formatDate(creditNote.issue_date) : formatDate((creditNote as any).created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/accounting/credit-notes/${creditNote.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalle"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        {creditNote.pdf_a4_file_path && (
                          <a
                            href={creditNote.pdf_a4_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-900"
                            title="Descargar PDF A4"
                          >
                            <DocumentArrowDownIcon className="h-5 w-5" />
                          </a>
                        )}
                        {creditNote.pdf_ticket_file_path && (
                          <a
                            href={creditNote.pdf_ticket_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                            title="Descargar Ticket 80mm"
                          >
                            <DocumentArrowDownIcon className="h-5 w-5" />
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

        {/* Controles de paginación */}
        {!isLoading && creditNotes && creditNotes.length > 0 && (
          <PaginationControls />
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
