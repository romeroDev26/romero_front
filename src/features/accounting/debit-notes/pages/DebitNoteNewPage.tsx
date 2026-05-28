// src/features/accounting/debit-notes/pages/DebitNoteNewPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../../components/common/Spinner';
import { useVoidableInvoices } from '../../credit-notes/hooks/useCreditNotes';
import { VoidableInvoice } from '../../types';

export const DebitNoteNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [companyId] = useState(1); // TODO: Obtener del contexto de usuario
  const [searchTerm, setSearchTerm] = useState('');
  
  // Verificar si se pasó un invoice_id específico
  const invoiceIdParam = searchParams.get('invoice_id');
  
  const { data: voidableInvoices, isLoading } = useVoidableInvoices(companyId);

  // Si se pasó un invoice_id específico, navegar directamente al formulario
  useEffect(() => {
    if (invoiceIdParam && voidableInvoices) {
      const selectedInvoice = voidableInvoices.find(inv => inv.id === parseInt(invoiceIdParam));
      if (selectedInvoice) {
        handleSelectInvoice(selectedInvoice);
      }
    }
  }, [invoiceIdParam, voidableInvoices]);

  const filteredInvoices = voidableInvoices?.filter((invoice) =>
    invoice.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.number.toString().includes(searchTerm) ||
    invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSelectInvoice = (invoice: VoidableInvoice) => {
    // Validar que tenemos los datos necesarios
    if (!invoice.client_id || invoice.client_id === 0) {
      alert('Error: La factura seleccionada no tiene un cliente válido asociado. No se puede crear una nota de débito.');
      return;
    }

    // Usar los datos que ya tenemos disponibles
    const affectedInvoice = {
      id: invoice.id,
      series: invoice.series,
      number: invoice.number,
      document_type_code: invoice.document_type_code,
      company_id: companyId,
      client: {
        id: invoice.client_id,
        name: invoice.client_name,
        doc_number: '', // Este campo puede estar vacío por ahora
      },
      client_id: invoice.client_id,
      client_name: invoice.client_name, // Agregar este campo para compatibilidad
      total_payable: parseFloat(invoice.total_payable),
      issue_date: invoice.issue_date,
    };

    // Usar sessionStorage como backup
    sessionStorage.setItem('debitNoteAffectedInvoice', JSON.stringify(affectedInvoice));
    
    navigate('/accounting/debit-notes/create', { 
      state: { affectedInvoice } 
    });
  };  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(parseFloat(amount));
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
            <CreditCardIcon className="h-6 w-6 text-[#1F4690]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-[32px] font-medium text-dm-text-primary tracking-[-0.64px] leading-[1.19]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Nueva Nota de Débito
            </h1>
            <p className="mt-1 text-[15px] text-dm-text-secondary leading-[1.33]">
              Selecciona la factura para agregar cargos adicionales
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/accounting/debit-notes')}
          className="rounded-full px-4 py-2.5 bg-dm-bg-primary border border-dm-border-primary text-[14px] font-medium text-dm-text-primary hover:bg-dm-bg-secondary"
        >
          <ArrowLeftIcon className="h-4 w-4 inline mr-2 -mt-0.5" />
          Volver
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4 lg:p-5">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-[12px] font-semibold text-dm-text-muted uppercase tracking-wider mb-1.5">
              Buscar factura
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-dm-text-muted" />
              </div>
              <input
                type="text"
                placeholder="Buscar por serie, número o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full px-3 py-2.5 bg-dm-bg-secondary border border-dm-border-primary rounded-[12px] text-[14px] text-dm-text-primary placeholder:text-dm-text-muted focus:outline-none focus:ring-2 focus:ring-[#1F4690]/20 focus:border-[#1F4690] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary overflow-hidden">
        <div className="px-4 py-4 lg:px-5 border-b border-dm-border-secondary">
          <h2 className="text-[15px] font-medium text-dm-text-primary">
            Facturas Disponibles para Agregar Cargos
          </h2>
          <p className="text-[13px] text-dm-text-secondary mt-1">
            Solo se muestran facturas que pueden recibir cargos adicionales
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="md" />
            <p className="text-[14px] text-dm-text-muted">Cargando facturas...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            {voidableInvoices?.length === 0 ? (
              <div>
                <CreditCardIcon className="h-12 w-12 text-dm-text-muted mx-auto mb-4" />
                <h3 className="text-[15px] font-medium text-dm-text-primary mb-2">
                  No hay facturas disponibles
                </h3>
                <p className="text-[14px] text-dm-text-secondary">
                  No se encontraron facturas disponibles para generar notas de débito.
                </p>
              </div>
            ) : (
              <div>
                <MagnifyingGlassIcon className="h-12 w-12 text-dm-text-muted mx-auto mb-4" />
                <h3 className="text-[15px] font-medium text-dm-text-primary mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-[14px] text-dm-text-secondary">
                  No hay facturas que coincidan con tu búsqueda.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-dm-border-secondary">
            {filteredInvoices.map((invoice) => {
              const isCancelled = invoice.business_status === 'CANCELLED';
              const isIncreased = invoice.business_status === 'INCREASED';
              const isDisabled = isCancelled || isIncreased;
              
              return (
                <div
                  key={invoice.id}
                  className={`p-4 ${
                    isDisabled 
                      ? 'bg-dm-bg-secondary opacity-60 cursor-not-allowed' 
                      : 'hover:bg-dm-bg-secondary/60 transition-colors cursor-pointer'
                  }`}
                  onClick={() => !isDisabled && handleSelectInvoice(invoice)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                        <div className="min-w-0">
                          <div className={`text-[14px] font-medium ${isDisabled ? 'text-dm-text-muted' : 'text-dm-text-primary'}`}>
                            {invoice.series}-{String(invoice.number).padStart(8, '0')}
                          </div>
                          <div className="text-[13px] text-dm-text-muted">
                            {invoice.document_type_code === '01' ? 'Factura' : 'Boleta'}
                            {isCancelled && (
                              <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-dm-bg-secondary text-[#cf1322]">
                                CANCELADO
                              </span>
                            )}
                            {isIncreased && (
                              <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-dm-bg-secondary text-[#f5a623]">
                                AUMENTADO
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[14px] font-medium ${isDisabled ? 'text-dm-text-muted' : 'text-dm-text-primary'}`}>
                            {invoice.client_name}
                          </div>
                          <div className="text-[13px] text-dm-text-muted">
                            Emitida el {formatDate(invoice.issue_date)}
                          </div>
                        </div>
                        <div className="text-left sm:text-right min-w-[100px]">
                          <div className={`text-[14px] font-medium ${isDisabled ? 'text-dm-text-muted' : 'text-dm-text-primary'}`}>
                            {formatCurrency(invoice.total_payable)}
                          </div>
                          <div className="text-[13px] text-dm-text-muted">Total</div>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <button 
                        className={`rounded-full px-5 py-2.5 text-[14px] font-medium ${isDisabled ? 'bg-dm-bg-secondary text-dm-text-muted cursor-not-allowed' : 'bg-[#1F4690] hover:bg-[#163672] text-white'}`}
                        disabled={isDisabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDisabled) handleSelectInvoice(invoice);
                        }}
                      >
                        {isDisabled ? 'No disponible' : 'Agregar Cargos'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-dm-bg-primary rounded-[12px] border border-dm-border-primary p-4">
        <div>
          <h3 className="text-[14px] font-medium text-dm-text-primary">
            Información sobre Notas de Débito
          </h3>
          <div className="mt-2 text-[13px] text-dm-text-secondary">
            <ul className="list-disc pl-5 space-y-1">
              <li>Las notas de débito se utilizan para aplicar cargos adicionales a una factura existente</li>
              <li>Las facturas marcadas como "CANCELADO" no pueden recibir cargos adicionales</li>
              <li>Las facturas marcadas como "AUMENTADO" ya tienen una nota de débito aplicada y no pueden recibir más cargos</li>
              <li>Puedes incluir intereses por mora, penalidades, recargos u otros conceptos no incluidos inicialmente</li>
              <li>El documento será enviado automáticamente a SUNAT para su procesamiento</li>
              <li>Podrás descargar el PDF una vez que SUNAT lo procese</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
