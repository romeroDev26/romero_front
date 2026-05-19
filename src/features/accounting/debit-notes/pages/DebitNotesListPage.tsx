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
            <DocumentArrowDownIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-[32px] font-medium text-[#202020] tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Notas de Débito
            </h1>
            <p className="mt-1 text-[15px] text-[#4d4d4d] leading-[1.33]">
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
      <div className="bg-white rounded-[12px] border border-[#e8e8e8] p-4 lg:p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#828282] uppercase tracking-wider mb-1.5">
              Serie
            </label>
            <input
              type="text"
              placeholder="FD01, BD01..."
              className="block w-full px-3 py-2.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-[12px] text-[14px] text-[#202020] placeholder:text-[#c4c4c4] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
              onChange={(e) => handleFilterChange('series', e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#828282] uppercase tracking-wider mb-1.5">
              Estado SUNAT
            </label>
            <div className="relative">
              <select
                className="peer block w-full appearance-none px-3 py-2.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-[12px] text-[14px] text-[#202020] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all pr-10"
                onChange={(e) => handleFilterChange('sunat_status', e.target.value || undefined)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="SENT">Enviado</option>
                <option value="ACCEPTED">Aceptado</option>
                <option value="REJECTED">Rechazado</option>
              </select>
              <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#828282] rotate-90 pointer-events-none transition-transform duration-200 peer-focus:-rotate-90" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#828282] uppercase tracking-wider mb-1.5">
              Fecha de Emisión
            </label>
            <input
              type="date"
              className="block w-full px-3 py-2.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-[12px] text-[14px] text-[#202020] focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
              onChange={(e) => handleFilterChange('issue_date', e.target.value || undefined)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="rounded-full border-[#e8e8e8] text-[#202020] hover:bg-[#f5f5f5] flex items-center justify-center w-full sm:w-auto"
              onClick={() => refetch()}
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-[12px] border border-[#e8e8e8] overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="md" />
            <p className="text-[14px] text-[#828282]">Cargando notas de débito...</p>
          </div>
        ) : debitNotes?.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[14px] text-[#828282]">No se encontraron notas de débito</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f0f0f0]">
              <thead className="bg-[#fafafa]">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] uppercase tracking-wider">
                    Documento Afectado
                  </th>
                  <th className="px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] uppercase tracking-wider">
                    Estado SUNAT
                  </th>
                  <th className="px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-5 py-3.5 text-left text-[13px] font-medium text-[#4d4d4d] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {debitNotes?.map((debitNote: DebitNote) => (
                  <tr key={debitNote.id} className="hover:bg-[#fafafa]/60 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-[14px] font-medium text-[#202020]">
                        {debitNote.series}-{String(debitNote.number).padStart(8, '0')}
                      </div>
                      <div className="text-[13px] text-[#828282]">ND</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-[14px] text-[#202020]">{debitNote.client?.name}</div>
                      <div className="text-[13px] text-[#828282]">{debitNote.client?.doc_number}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-[14px] text-[#202020]">
                        {debitNote.affected_document_series_number}
                      </div>
                      <div className="text-[13px] text-[#828282]">
                        {debitNote.affected_document_type_code === '01' ? 'Factura' : 'Boleta'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[14px] text-[#202020] max-w-xs truncate">
                        {debitNote.reason}
                      </div>
                      <div className="text-[13px] text-[#828282]">
                        Tipo: {debitNote.debit_note_type_code}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[14px] text-[#202020]">
                      {formatCurrency(debitNote.total_payable)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <SunatStatusBadge status={debitNote.sunat_status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[13px] text-[#828282]">
                      {formatDate(debitNote.issue_date)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/accounting/debit-notes/${debitNote.id}`}
                          className="flex items-center justify-center h-9 w-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] transition-colors"
                          title="Ver detalle"
                        >
                          <EyeIcon className="h-4 w-4 text-[#4d4d4d]" />
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
                              ? 'bg-[#f5f5f5] cursor-not-allowed'
                              : 'bg-[#f5f5f5] hover:bg-[#e8e8e8]'
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
                              ? 'text-[#c4c4c4]'
                              : 'text-[#cf1322]'
                          }`} />
                        </button>
                        {debitNote.pdf_file_path && (
                          <a
                            href={debitNote.pdf_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-9 w-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] transition-colors"
                            title="Descargar PDF"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4 text-[#4d4d4d]" />
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
        <div className="bg-amber-50 border border-[#e8e8e8] rounded-[12px] p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-[15px] font-medium text-[#202020]">
                Información sobre Notas de Débito
              </h3>
              <div className="mt-2 text-[14px] text-[#4d4d4d]">
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
