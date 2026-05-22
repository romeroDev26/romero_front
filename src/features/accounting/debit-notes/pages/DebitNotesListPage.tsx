// src/features/accounting/debit-notes/pages/DebitNotesListPage.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  PlusIcon,
  XCircleIcon,
  EyeIcon,
  ChevronRightIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../../../../components/common/Button';
import { Spinner } from '../../../../components/common/Spinner';
import { SunatStatusBadge } from '../../components/SunatStatusBadge';
import { useDebitNotes } from '../hooks/useDebitNotes';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#1F4690]/10">
            <ClipboardDocumentListIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Notas de Débito
            </h1>
            <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
              Gestiona los cargos adicionales y notas de débito
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link to="/accounting/debit-notes/new" className="w-full sm:w-auto">
            <Button className="rounded-full bg-[#1F4690] hover:bg-[#163672] flex items-center justify-center w-full flex-1 sm:flex-none">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Nota de Débito
            </Button>
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
              placeholder="FD01, BD01..."
              className="block w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
              onChange={(e) => handleFilterChange('series', e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Estado SUNAT
            </label>
            <div className="relative">
              <select
                className="peer block w-full appearance-none px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all pr-10"
                onChange={(e) => handleFilterChange('sunat_status', e.target.value || undefined)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="SENT">Enviado</option>
                <option value="ACCEPTED">Aceptado</option>
                <option value="REJECTED">Rechazado</option>
              </select>
              <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dm-text-muted rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Fecha de Emisión
            </label>
            <input
              type="date"
              className="block w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
              onChange={(e) => handleFilterChange('issue_date', e.target.value || undefined)}
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner size="md" />
              <p className="text-[14px] text-dm-text-muted">Cargando notas de débito...</p>
            </div>
          ) : debitNotes?.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[14px] text-dm-text-muted">No se encontraron notas de débito</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#f0f0f0]">
                <thead className="bg-dm-bg-secondary">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                      Documento Afectado
                    </th>
                    <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                      Estado SUNAT
                    </th>
                    <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-5 py-3.5 text-left text-[13px] font-medium text-dm-text-secondary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {debitNotes?.map((debitNote: DebitNote) => (
                    <tr key={debitNote.id} className="hover:bg-dm-bg-secondary/60 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-[14px] font-medium text-dm-text-primary">
                          {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
                        </div>
                        <div className="text-[13px] text-dm-text-muted">ND</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-[14px] text-dm-text-primary">{debitNote.client?.name}</div>
                        <div className="text-[13px] text-dm-text-muted">{debitNote.client?.doc_number}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-[14px] text-dm-text-primary">
                          {debitNote.affected_document_series_number}
                        </div>
                        <div className="text-[13px] text-dm-text-muted">
                          {debitNote.affected_document_type_code === '01' ? 'Factura' : 'Boleta'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[14px] text-dm-text-primary max-w-xs truncate">
                          {debitNote.reason}
                        </div>
                        <div className="text-[13px] text-dm-text-muted">
                          Tipo: {debitNote.debit_note_type_code}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-[14px] text-dm-text-primary">
                        {formatCurrency(debitNote.total_payable)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <SunatStatusBadge status={debitNote.sunat_status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-[13px] text-dm-text-muted">
                        {formatDate(debitNote.issue_date)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/accounting/debit-notes/${debitNote.id}`}
                            className="flex items-center justify-center h-9 w-9 rounded-full bg-dm-bg-secondary hover:bg-dm-bg-hover transition-colors"
                            title="Ver detalle"
                          >
                            <EyeIcon className="h-4 w-4 text-dm-text-secondary" strokeWidth={1.5} />
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
                            className={`flex items-center justify-center h-9 w-9 rounded-full transition-colors ${
                              debitNote.sunat_status !== 'ACCEPTED'
                                ? 'bg-dm-bg-secondary cursor-not-allowed'
                                : 'bg-dm-bg-secondary hover:bg-dm-bg-hover'
                            }`}
                            title={
                              debitNote.sunat_status !== 'ACCEPTED'
                                ? 'Solo se pueden anular notas de débito ACEPTADAS'
                                : 'Anular nota de débito (genera nota de crédito)'
                            }
                            disabled={debitNote.sunat_status !== 'ACCEPTED'}
                          >
                            <XCircleIcon className={`h-4 w-4 ${
                              debitNote.sunat_status !== 'ACCEPTED'
                                ? 'text-dm-text-muted'
                                : 'text-[#cf1322]'
                            }`} strokeWidth={1.5} />
                          </button>
                          {debitNote.pdf_file_path && (
                            <a
                              href={debitNote.pdf_file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center h-9 w-9 rounded-full bg-dm-bg-secondary hover:bg-dm-bg-hover transition-colors"
                              title="Descargar PDF"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4 text-dm-text-secondary" strokeWidth={1.5} />
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

        {/* Mobile cards */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3">
              <Spinner size="md" />
              <p className="text-[14px] text-dm-text-muted">Cargando notas de débito...</p>
            </div>
          ) : debitNotes?.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-dm-text-muted">
              No se encontraron notas de débito
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {debitNotes?.map((debitNote) => (
                <div
                  key={debitNote.id}
                  className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <span className="text-[11px] font-semibold text-dm-text-muted uppercase tracking-wider">
                          {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
                        </span>
                        <h3 className="text-[15px] font-medium text-dm-text-primary mt-0.5">
                          {debitNote.client?.name}
                        </h3>
                        <p className="text-[13px] text-dm-text-muted mt-0.5">
                          {debitNote.client?.doc_number}
                        </p>
                      </div>
                      <SunatStatusBadge status={debitNote.sunat_status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <span className="text-[11px] text-dm-text-muted">Doc. Afectado</span>
                        <p className="text-[13px] font-medium text-dm-text-primary">
                          {debitNote.affected_document_series_number}
                        </p>
                        <p className="text-[11px] text-dm-text-muted">
                          {debitNote.affected_document_type_code === '01' ? 'Factura' : 'Boleta'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-dm-text-muted">Monto</span>
                        <p className="text-[18px] font-semibold text-dm-text-primary">
                          {formatCurrency(debitNote.total_payable)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-[11px] text-dm-text-muted">Motivo</span>
                      <p className="text-[13px] font-medium text-dm-text-primary truncate">
                        {debitNote.reason}
                      </p>
                      <p className="text-[11px] text-dm-text-muted">
                        Tipo: {debitNote.debit_note_type_code}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-dm-border-secondary bg-dm-bg-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-dm-text-muted">
                        {formatDate(debitNote.issue_date)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/accounting/debit-notes/${debitNote.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted hover:text-[#1F4690] hover:bg-[#1F4690]/10 transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (debitNote.sunat_status !== 'ACCEPTED') {
                              return;
                            }
                            navigate(`/accounting/debit-notes/annul`, { 
                              state: { 
                                debitNote: debitNote
                              } 
                            });
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                            debitNote.sunat_status !== 'ACCEPTED'
                              ? 'bg-dm-bg-secondary text-dm-text-muted cursor-not-allowed'
                              : 'bg-dm-bg-secondary text-dm-text-muted hover:text-[#cf1322] hover:bg-red-50 dark:hover:bg-red-950/30'
                          }`}
                          title={
                            debitNote.sunat_status !== 'ACCEPTED'
                              ? 'Solo se pueden anular notas de débito ACEPTADAS'
                              : 'Anular nota de débito (genera nota de crédito)'
                          }
                          disabled={debitNote.sunat_status !== 'ACCEPTED'}
                        >
                          <XCircleIcon className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        {debitNote.pdf_file_path && (
                          <a
                            href={debitNote.pdf_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-dm-bg-secondary text-dm-text-muted hover:text-[#1F4690] hover:bg-[#1F4690]/10 transition-colors"
                            title="Descargar PDF"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" strokeWidth={1.5} />
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
      </div>

      {/* Información adicional */}
      {debitNotes && debitNotes.length > 0 && (
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
