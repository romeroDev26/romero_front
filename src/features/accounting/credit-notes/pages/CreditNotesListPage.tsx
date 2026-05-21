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
  DocumentTextIcon,
  FunnelIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { DataTable, Column } from '../../../../components/common/DataTable';
import { Spinner } from '../../../../components/common/Spinner';
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
    company_id: 1,
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
      const hasPendingDocs = creditNotes?.some((note) =>
        note.sunat_status === 'PENDING' || note.sunat_status === 'SENT'
      );
      if (hasPendingDocs) {
        refetch();
      }
    }, 120000);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const dateOnlyMatch = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    try {
      if (dateOnlyMatch) {
        const [, y, m, d] = dateOnlyMatch;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return date.toLocaleDateString('es-PE');
      }
      return new Date(dateString).toLocaleDateString('es-PE');
    } catch {
      return String(dateString);
    }
  };

  const columns: Column<CreditNote>[] = [
    {
      key: 'document',
      header: 'Documento',
      accessor: (note) => (
        <div>
          <div className="text-[14px] font-medium text-dm-text-primary">
            {note.series}-{String(note.number).padStart(8, '0')}
          </div>
          <div className="text-[12px] text-dm-text-muted">Nota de Crédito</div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      accessor: (note) => (
        <div>
          <div className="text-[14px] font-medium text-dm-text-primary">
            {note.client?.name || (note as any).client_name || 'N/A'}
          </div>
          <div className="text-[12px] text-dm-text-muted">
            {note.client?.doc_number || (note as any).client_document || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'affected',
      header: 'Doc. Afectado',
      accessor: (note) => (
        <div>
          <div className="text-[14px] font-medium text-dm-text-primary">{note.affected_document_series_number}</div>
          <div className="text-[12px] text-dm-text-muted">
            {note.affected_document_type_code === '01' ? 'Factura' : 'Boleta'}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      accessor: (note) => (
        <span className="text-[14px] font-semibold text-dm-text-primary">
          {formatCurrency(note.total_payable)}
        </span>
      ),
    },
    {
      key: 'sunat_status',
      header: 'Estado SUNAT',
      accessor: (note) => <SunatStatusBadge status={note.sunat_status} />,
    },
    {
      key: 'issue_date',
      header: 'Fecha',
      accessor: (note) => (
        <span className="text-[13px] text-dm-text-secondary">
          {note.issue_date ? formatDate(note.issue_date) : formatDate((note as any).created_at)}
        </span>
      ),
    },
  ];

  const customActions = (note: CreditNote) => (
    <div className="flex items-center gap-1">
      <Link
        to={`/accounting/credit-notes/${note.id}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted hover:text-[#1F4690] hover:bg-[#1F4690]/10 transition-colors"
        title="Ver detalle"
      >
        <EyeIcon className="h-4 w-4" strokeWidth={1.5} />
      </Link>
      {note.pdf_a4_file_path && (
        <a
          href={note.pdf_a4_file_path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted hover:text-[#cf1322] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Descargar PDF A4"
        >
          <DocumentArrowDownIcon className="h-4 w-4" strokeWidth={1.5} />
        </a>
      )}
      {note.pdf_ticket_file_path && (
        <a
          href={note.pdf_ticket_file_path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted hover:text-[#237804] hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
          title="Descargar Ticket 80mm"
        >
          <DocumentTextIcon className="h-4 w-4" strokeWidth={1.5} />
        </a>
      )}
    </div>
  );

  // ── Paginación ──
  const hasNextPage = creditNotes && creditNotes.length === itemsPerPage;
  const hasPrevPage = currentPage > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
            <ClipboardDocumentListIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div>
            <h1
              className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Notas de Crédito
            </h1>
            <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
              Gestiona las anulaciones y notas de crédito
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => refreshStatuses(10)}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary rounded-[20px] text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            Actualizar Estados
          </button>
          <Link
            to="/accounting/credit-notes/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1F4690] hover:bg-[#163672] text-white text-[14px] font-medium rounded-[20px] transition-colors"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={1.5} />
            Nueva Nota de Crédito
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-4 h-4 text-dm-text-muted" strokeWidth={1.5} />
          <span className="text-[13px] font-semibold text-dm-text-primary">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Serie
            </label>
            <input
              type="text"
              placeholder="FC01, BC01..."
              value={series}
              className="w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
              onChange={(e) => handleSeriesChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Estado SUNAT
            </label>
            <select
              value={sunatStatus}
              className="w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all appearance-none"
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
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Fecha de Emisión
            </label>
            <input
              type="date"
              value={issueDate}
              className="w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
              onChange={(e) => handleIssueDateChange(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary rounded-[12px] text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary transition-colors"
            >
              <MagnifyingGlassIcon className="h-4 w-4" strokeWidth={1.5} />
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block">
          <DataTable<CreditNote>
            data={creditNotes || []}
            columns={columns}
            keyExtractor={(note) => note.id}
            isLoading={isLoading}
            emptyMessage="No se encontraron notas de crédito"
            showActions={true}
            customActions={customActions}
          />
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3">
              <Spinner size="md" />
              <p className="text-[14px] text-dm-text-muted">Cargando notas de crédito...</p>
            </div>
          ) : creditNotes?.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-dm-text-muted">
              No se encontraron notas de crédito
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {creditNotes?.map((note) => (
                <div
                  key={note.id}
                  className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <span className="text-[11px] font-semibold text-dm-text-muted uppercase tracking-wider">
                          {note.series}-{String(note.number).padStart(8, '0')}
                        </span>
                        <h3 className="text-[15px] font-medium text-dm-text-primary mt-0.5">
                          {note.client?.name || (note as any).client_name || 'N/A'}
                        </h3>
                        <p className="text-[13px] text-dm-text-muted mt-0.5">
                          {(note as any).client_document || note.client?.doc_number || ''}
                        </p>
                      </div>
                      <SunatStatusBadge status={note.sunat_status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <span className="text-[11px] text-dm-text-muted">Doc. Afectado</span>
                        <p className="text-[13px] font-medium text-dm-text-primary">
                          {note.affected_document_series_number}
                        </p>
                        <p className="text-[11px] text-dm-text-muted">
                          {note.affected_document_type_code === '01' ? 'Factura' : 'Boleta'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-dm-text-muted">Monto</span>
                        <p className="text-[18px] font-semibold text-dm-text-primary">
                          {formatCurrency(note.total_payable)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-dm-border-secondary bg-dm-bg-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-dm-text-muted">
                        {note.issue_date ? formatDate(note.issue_date) : formatDate((note as any).created_at)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/accounting/credit-notes/${note.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted hover:text-[#1F4690] hover:bg-[#1F4690]/10 transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                        {note.pdf_a4_file_path && (
                          <a
                            href={note.pdf_a4_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted hover:text-[#cf1322] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Descargar PDF A4"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" strokeWidth={1.5} />
                          </a>
                        )}
                        {note.pdf_ticket_file_path && (
                          <a
                            href={note.pdf_ticket_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted hover:text-[#237804] hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                            title="Descargar Ticket 80mm"
                          >
                            <DocumentTextIcon className="h-4 w-4" strokeWidth={1.5} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {!isLoading && creditNotes && creditNotes.length > 0 && (
          <div className="px-4 py-3 border-t border-dm-border-secondary flex items-center justify-between">
            <span className="text-[13px] text-dm-text-muted">
              Página {currentPage + 1} • Mostrando {creditNotes.length} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-dm-border-primary text-[13px] text-dm-text-secondary hover:bg-dm-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-dm-border-primary text-[13px] text-dm-text-secondary hover:bg-dm-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRightIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info SUNAT */}
      {creditNotes && creditNotes.length > 0 && (
        <div className="bg-[#1F4690]/5 border border-[#1F4690]/10 rounded-[12px] p-5">
          <h3 className="text-[13px] font-semibold text-[#1F4690] mb-2">
            Información sobre Estados SUNAT
          </h3>
          <ul className="space-y-1.5 text-[13px] text-dm-text-secondary">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[#1F4690] mt-1.5 shrink-0" />
              <span><strong className="text-dm-text-primary">Pendiente:</strong> Documento creado, esperando envío a SUNAT</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[#1F4690] mt-1.5 shrink-0" />
              <span><strong className="text-dm-text-primary">Enviado:</strong> Documento enviado, esperando respuesta de SUNAT</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[#1F4690] mt-1.5 shrink-0" />
              <span><strong className="text-dm-text-primary">Aceptado:</strong> Documento válido y procesado correctamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[#1F4690] mt-1.5 shrink-0" />
              <span><strong className="text-dm-text-primary">Rechazado:</strong> Documento con errores, revisar observaciones</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
